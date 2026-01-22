'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TestCaseList } from '@/components/playground/TestCaseList';
import { ResultComparison } from '@/components/playground/ResultComparison';
import { PlaygroundSettings } from '@/components/playground/PlaygroundSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { extractVariables, replaceVariables } from '@/lib/promptVariables';
import { Play, Loader2, Sparkles, RotateCcw, Download, Search, FileText, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LOCAL_STORAGE_KEY = 'playground_state';

const DEFAULT_SETTINGS = {
  provider: 'openai',
  useStoredKey: false,
  baseURL: '',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.7,
};

const createEmptyTestCase = () => ({
  id: crypto.randomUUID(),
  name: 'Test Case 1',
  variables: {},
  userPrompt: '',
});

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const pg = t?.playground || {};
  const header = t?.header || {};

  const formatMessage = useCallback((template, values = {}) => {
    if (!template) return '';
    return Object.entries(values).reduce(
      (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
      template
    );
  }, []);

  // Core state
  const [promptTemplate, setPromptTemplate] = useState('');
  const [testCases, setTestCases] = useState(() => [createEmptyTestCase()]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [runningCases, setRunningCases] = useState(new Set());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const [promptResults, setPromptResults] = useState([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [promptsError, setPromptsError] = useState('');
  const [selectedVersions, setSelectedVersions] = useState({});

  // Group prompts by title, keeping all versions for each unique title
  const groupedPrompts = promptResults.reduce((groups, prompt) => {
    const title = prompt.title || 'Untitled';
    if (!groups[title]) {
      groups[title] = [];
    }
    groups[title].push(prompt);
    return groups;
  }, {});

  // Sort versions within each group by version number (descending)
  Object.keys(groupedPrompts).forEach((title) => {
    groupedPrompts[title].sort((a, b) => {
      const versionA = parseInt((a.version || 'v1').replace('v', ''), 10) || 1;
      const versionB = parseInt((b.version || 'v1').replace('v', ''), 10) || 1;
      return versionB - versionA;
    });
  });

  // Get the currently selected prompt for each group
  const getSelectedPrompt = (title) => {
    const prompts = groupedPrompts[title];
    const selectedId = selectedVersions[title];
    return prompts.find((p) => p.id === selectedId) || prompts[0];
  };

  // Extract variables from prompt template
  const variables = extractVariables(promptTemplate);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.promptTemplate) setPromptTemplate(parsed.promptTemplate);
        if (parsed.testCases?.length) setTestCases(parsed.testCases);
        if (parsed.settings) setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }
    } catch (e) {
      console.error('Failed to load playground state:', e);
    }

    // Check for prompt from URL params
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      setPromptTemplate(decodeURIComponent(promptParam));
    }

    // Check for promptId from URL params - fetch and load the prompt
    const promptIdParam = searchParams.get('promptId');
    if (promptIdParam) {
      (async () => {
        try {
          const response = await fetch(`/api/prompts/${promptIdParam}`);
          if (response.ok) {
            const promptData = await response.json();
            if (promptData?.content) {
              setPromptTemplate(promptData.content);
              toast({
                title: pg.importSuccessTitle || 'Prompt imported',
                description: formatMessage(pg.importSuccessDescription, { title: promptData.title || '' }) ||
                  `"${promptData.title || 'Prompt'}" loaded into the template`,
              });
            }
          }
        } catch (error) {
          console.error('Failed to load prompt by id:', error);
        }
      })();
    }
  }, [searchParams, toast, pg, formatMessage]);

  // Save state to localStorage
  useEffect(() => {
    try {
      const state = {
        promptTemplate,
        testCases,
        settings: {
          provider: settings.provider,
          useStoredKey: settings.useStoredKey,
          baseURL: settings.baseURL,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          topP: settings.topP,
          // Don't persist API key for security
        },
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save playground state:', e);
    }
  }, [promptTemplate, testCases, settings]);

  const fetchPrompts = useCallback(
    async (search = '') => {
      setIsLoadingPrompts(true);
      setPromptsError('');
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (search.trim()) {
          params.set('search', search.trim());
        }
        const response = await fetch(`/api/prompts?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || pg.unableToLoadPrompts || 'Unable to load prompts');
        }
        const data = await response.json();
        setPromptResults(data?.prompts || []);
      } catch (error) {
        console.error('Failed to load prompts:', error);
        setPromptsError(error.message || pg.unableToLoadPrompts || 'Unable to load prompts');
      } finally {
        setIsLoadingPrompts(false);
      }
    },
    [pg]
  );

  useEffect(() => {
    if (!isImportOpen) return;
    const handler = setTimeout(() => {
      fetchPrompts(promptSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [isImportOpen, promptSearch, fetchPrompts]);

  const handleImportPrompt = useCallback(
    (prompt) => {
      if (!prompt?.content) {
        toast({
          title: pg.importFailedTitle || pg.error || 'Import failed',
          description: pg.importFailedDescription || 'Selected prompt has no content',
          variant: 'destructive',
        });
        return;
      }
      const promptTitle = prompt.title || pg.untitledPrompt || 'Untitled prompt';
      setPromptTemplate(prompt.content);
      setIsImportOpen(false);
      toast({
        title: pg.importSuccessTitle || 'Prompt imported',
        description:
          formatMessage(pg.importSuccessDescription, { title: promptTitle }) ||
          `"${promptTitle}" loaded into the template`,
      });
    },
    [formatMessage, pg, toast]
  );

  // Run a single test case
  const runTestCase = useCallback(
    async (testCase) => {
      const resolvedSystemPrompt = replaceVariables(promptTemplate, testCase.variables);
      const startTime = Date.now();
      let output = '';
      let usage = null;
      let finishReason = null;

      const updateStreamingResult = () => {
        setResults((prev) => ({
          ...prev,
          [testCase.id]: {
            id: testCase.id,
            status: 'streaming',
            output,
            usage,
            finishReason,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        }));
      };

      try {
        const response = await fetch('/api/playground/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: resolvedSystemPrompt,
            userPrompt: testCase.userPrompt || '',
            settings: {
              provider: settings.provider,
              useStoredKey: settings.useStoredKey,
              baseURL: settings.baseURL,
              apiKey: settings.apiKey,
              model: settings.model,
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
              topP: settings.topP,
            },
            stream: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream received');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            const line = event.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;

            let parsed;
            try {
              parsed = JSON.parse(payload);
            } catch {
              console.warn('Unable to parse stream chunk:', payload);
              continue;
            }

            if (parsed.type === 'delta' && parsed.content) {
              output += parsed.content;
              updateStreamingResult();
            } else if (parsed.type === 'final') {
              usage = parsed.usage;
              finishReason = parsed.finishReason;
              if (!output && parsed.output) {
                output = parsed.output;
              }
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'Request failed');
            }
          }
        }

        const duration = Date.now() - startTime;
        const result = {
          id: testCase.id,
          status: 'success',
          output,
          usage,
          duration,
          timestamp: new Date().toISOString(),
          finishReason,
        };
        setResults((prev) => ({ ...prev, [testCase.id]: result }));
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const result = {
          id: testCase.id,
          status: 'error',
          error: error.message || 'Network error',
          duration,
          timestamp: new Date().toISOString(),
        };
        setResults((prev) => ({ ...prev, [testCase.id]: result }));
        return result;
      }
    },
    [promptTemplate, settings]
  );

  // Run all test cases
  const runAllTestCases = useCallback(async () => {
    if (!promptTemplate.trim()) {
      toast({
        title: pg.error || 'Error',
        description: pg.errorPromptRequired || 'Please enter a prompt template',
        variant: 'destructive',
      });
      return;
    }

    if (!settings.useStoredKey && !settings.apiKey) {
      toast({
        title: pg.error || 'Error',
        description: pg.errorApiKeyRequired || 'Please provide an API key or enable a stored credential',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setRunningCases(new Set(testCases.map((tc) => tc.id)));

    // Clear previous results
    setResults({});

    // Run all test cases in parallel with throttling
    const CONCURRENCY = 3;
    const queue = [...testCases];
    const worker = async () => {
      while (queue.length > 0) {
        const testCase = queue.shift();
        await runTestCase(testCase);
        setRunningCases((prev) => {
          const next = new Set(prev);
          next.delete(testCase.id);
          return next;
        });
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker())
    );

    setRunningCases(new Set());
    setIsRunning(false);
    toast({
      title: pg.completed || 'Completed',
      description:
        formatMessage(pg.finishedRunning, { count: testCases.length }) ||
        `Finished running ${testCases.length} test case(s)`,
    });
  }, [formatMessage, pg, promptTemplate, runTestCase, settings, testCases, toast]);

  // Reset everything
  const handleReset = useCallback(() => {
    setPromptTemplate('');
    setTestCases([createEmptyTestCase()]);
    setResults({});
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast({
      title: pg.reset || 'Reset',
      description: pg.resetComplete || 'Playground has been reset',
    });
  }, [pg, toast]);

  const completedCount = Object.keys(results).length;
  const runAllLabel =
    formatMessage(pg.runAllWithCount, { count: testCases.length }) ||
    `Run All (${testCases.length})`;
  const runningLabel =
    formatMessage(pg.runningWithCount, { count: testCases.length }) ||
    `Running ${testCases.length}`;
  const configuredLabel =
    formatMessage(pg.configuredCount, { count: testCases.length }) ||
    `${testCases.length} configured`;
  const completedLabel =
    formatMessage(pg.completedCount, { count: completedCount }) ||
    `${completedCount} completed`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      <Toaster />

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col gap-4 border-b pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {header.playground || 'Playground'}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
                {pg.title || 'Prompt Experiment Console'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {pg.subtitle ||
                  'A workspace aligned with the prompt detail page so you can import templates, tweak variables, and visually compare results for multiple scenarios.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                {pg.resetWorkspace || 'Reset Workspace'}
              </Button>
              <Button
                onClick={runAllTestCases}
                disabled={isRunning || !promptTemplate.trim()}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {runningLabel}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {runAllLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-indigo-50/40">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  {pg.promptTemplate || 'Prompt Template'}
                </CardTitle>
                <CardDescription className="text-sm">
                  {pg.promptTemplateDescription ||
                    'Same editing experience as the prompt detail page with quick imports from your library.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {pg.templateSource || 'Template Source'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setIsImportOpen(true);
                      fetchPrompts(promptSearch);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    {pg.importFromPrompts || 'Import from Prompts'}
                  </Button>
                </div>
                <Textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder={
                    pg.promptTemplatePlaceholder ||
                    'Enter your prompt template here...\n\nExample:\nWrite a {{tone}} email to {{recipient}} about {{topic}}.'
                  }
                  className="min-h-[200px] font-mono text-sm resize-none"
                />
                {variables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-md"
                      >
                        {'{{'}{v}{'}}'}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4 border-b bg-gradient-to-br from-white to-slate-50">
                <CardTitle className="text-base">
                  {pg.modelApiSettings || 'Model & API Settings'}
                </CardTitle>
                <CardDescription>
                  {pg.modelApiSettingsDescription ||
                    'Mirror the testing controls from prompt details with reusable presets.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <PlaygroundSettings settings={settings} onSettingsChange={setSettings} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="border-none shadow-lg flex-1 flex flex-col">
              <CardHeader className="pb-4 border-b bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{pg.testCases || 'Test Cases'}</CardTitle>
                    <CardDescription>
                      {pg.testCasesDescription ||
                        'Configure variable sets similar to the variable panel on the prompt page.'}
                    </CardDescription>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {configuredLabel}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TestCaseList
                  testCases={testCases}
                  variables={variables}
                  onChange={setTestCases}
                  runningCases={runningCases}
                />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader className="pb-4 border-b bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {pg.resultComparisonTitle || 'Result Comparison'}
                    </CardTitle>
                    <CardDescription>
                      {pg.resultComparisonDescription ||
                        'Inspect resolved prompts, completions, timing, and usage for every test case.'}
                    </CardDescription>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground text-right">
                    {completedLabel}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ResultComparison
                  testCases={testCases}
                  results={results}
                  promptTemplate={promptTemplate}
                  runningCases={runningCases}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{pg.importDialogTitle || 'Import from Prompt Library'}</DialogTitle>
            <DialogDescription>
              {pg.importDialogDescription ||
                'Choose an existing prompt from your workspace and load its content into the playground.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder={pg.searchPlaceholder || 'Search prompts by title or description...'}
                value={promptSearch}
                onChange={(e) => setPromptSearch(e.target.value)}
                className="pl-9"
              />
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="border rounded-xl max-h-[420px] overflow-y-auto divide-y">
              {isLoadingPrompts ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {pg.loadingPrompts || 'Loading prompts...'}
                </div>
              ) : promptsError ? (
                <div className="py-10 text-center text-sm text-red-500">
                  {promptsError}
                </div>
              ) : Object.keys(groupedPrompts).length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {pg.noPromptsFound || 'No prompts found. Try adjusting your search.'}
                </div>
              ) : (
                Object.keys(groupedPrompts).map((title) => {
                  const prompts = groupedPrompts[title];
                  const selectedPrompt = getSelectedPrompt(title);
                  const hasMultipleVersions = prompts.length > 1;
                  
                  return (
                    <div
                      key={title}
                      className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium text-slate-900 line-clamp-1 flex-1">
                              {title || pg.untitledPrompt || 'Untitled prompt'}
                            </h4>
                            <div className="flex items-center gap-2">
                              {hasMultipleVersions ? (
                                <Select
                                  value={selectedPrompt.id}
                                  onValueChange={(value) => {
                                    setSelectedVersions((prev) => ({
                                      ...prev,
                                      [title]: value,
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="h-7 w-auto min-w-[70px] text-xs">
                                    <SelectValue>
                                      {selectedPrompt.version || 'v1'}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {prompts.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.version || 'v1'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {selectedPrompt.version || 'v1'}
                                </span>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleImportPrompt(selectedPrompt)}
                              >
                                {pg.importButton || 'Import'}
                              </Button>
                            </div>
                          </div>
                          {selectedPrompt.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {selectedPrompt.description}
                            </p>
                          )}
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                            {selectedPrompt.tags && (
                              <span className="inline-flex items-center gap-1">
                                {Array.isArray(selectedPrompt.tags)
                                  ? selectedPrompt.tags.join(', ')
                                  : selectedPrompt.tags}
                              </span>
                            )}
                            {selectedPrompt.tags && <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />}
                            <span>
                              {(() => {
                                const updatedDate = new Date(selectedPrompt.updated_at || selectedPrompt.created_at).toLocaleDateString();
                                return (
                                  formatMessage(pg.updatedAt, { date: updatedDate }) ||
                                  `Updated ${updatedDate}`
                                );
                              })()}
                            </span>
                            {hasMultipleVersions && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                                <span className="text-indigo-600">
                                  {prompts.length} {pg.versions || 'versions'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="justify-start">
            <p className="text-xs text-muted-foreground">
              {pg.importAccessNote || 'Only prompts you have access to in the console are shown here.'}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading playground...</span>
        </div>
      }
    >
      <PlaygroundContent />
    </Suspense>
  );
}
