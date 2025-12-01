'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Play, Loader2, Sparkles, RotateCcw, Download, Search, FileText } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'playground_state';

const DEFAULT_SETTINGS = {
  baseURL: '',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.7,
};

const DEFAULT_TEST_CASE = {
  id: crypto.randomUUID(),
  name: 'Test Case 1',
  variables: {},
};

export default function PlaygroundPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Core state
  const [promptTemplate, setPromptTemplate] = useState('');
  const [testCases, setTestCases] = useState([DEFAULT_TEST_CASE]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [runningCases, setRunningCases] = useState(new Set());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const [promptResults, setPromptResults] = useState([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [promptsError, setPromptsError] = useState('');

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
  }, [searchParams]);

  // Save state to localStorage
  useEffect(() => {
    try {
      const state = {
        promptTemplate,
        testCases,
        settings: {
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
          throw new Error(errorData?.error || 'Unable to load prompts');
        }
        const data = await response.json();
        setPromptResults(data?.prompts || []);
      } catch (error) {
        console.error('Failed to load prompts:', error);
        setPromptsError(error.message || 'Unable to load prompts');
      } finally {
        setIsLoadingPrompts(false);
      }
    },
    []
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
          title: 'Import failed',
          description: 'Selected prompt has no content',
          variant: 'destructive',
        });
        return;
      }
      setPromptTemplate(prompt.content);
      setIsImportOpen(false);
      toast({
        title: 'Prompt imported',
        description: `"${prompt.title}" loaded into the template`,
      });
    },
    [toast]
  );

  // Run a single test case
  const runTestCase = useCallback(
    async (testCase) => {
      const resolvedPrompt = replaceVariables(promptTemplate, testCase.variables);

      const startTime = Date.now();
      try {
        const response = await fetch('/api/playground/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: resolvedPrompt,
            settings: {
              baseURL: settings.baseURL,
              apiKey: settings.apiKey,
              model: settings.model,
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
              topP: settings.topP,
            },
          }),
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
          const error = await response.json();
          return {
            id: testCase.id,
            status: 'error',
            error: error.error || 'Request failed',
            duration,
            timestamp: new Date().toISOString(),
          };
        }

        const data = await response.json();
        return {
          id: testCase.id,
          status: 'success',
          output: data.output,
          usage: data.usage,
          duration,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          id: testCase.id,
          status: 'error',
          error: error.message || 'Network error',
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      }
    },
    [promptTemplate, settings]
  );

  // Run all test cases
  const runAllTestCases = useCallback(async () => {
    if (!promptTemplate.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt template',
        variant: 'destructive',
      });
      return;
    }

    if (!settings.apiKey && !settings.baseURL) {
      toast({
        title: 'Error',
        description: 'Please configure API settings',
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
    const running = [];

    while (queue.length > 0 || running.length > 0) {
      // Start new tasks up to concurrency limit
      while (running.length < CONCURRENCY && queue.length > 0) {
        const testCase = queue.shift();
        const promise = runTestCase(testCase).then((result) => {
          setResults((prev) => ({ ...prev, [testCase.id]: result }));
          setRunningCases((prev) => {
            const next = new Set(prev);
            next.delete(testCase.id);
            return next;
          });
          return result;
        });
        running.push(promise);
      }

      // Wait for at least one to complete
      if (running.length > 0) {
        await Promise.race(running);
        // Remove completed promises
        for (let i = running.length - 1; i >= 0; i--) {
          const status = await Promise.race([
            running[i].then(() => 'done'),
            Promise.resolve('pending'),
          ]);
          if (status === 'done') {
            running.splice(i, 1);
          }
        }
      }
    }

    setIsRunning(false);
    toast({
      title: 'Completed',
      description: `Finished running ${testCases.length} test case(s)`,
    });
  }, [promptTemplate, testCases, settings, runTestCase, toast]);

  // Reset everything
  const handleReset = useCallback(() => {
    setPromptTemplate('');
    setTestCases([{ ...DEFAULT_TEST_CASE, id: crypto.randomUUID() }]);
    setResults({});
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast({
      title: 'Reset',
      description: 'Playground has been reset',
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      <Toaster />

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col gap-4 border-b pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Playground
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
                Prompt Experiment Console
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                A workspace aligned with the prompt detail page so you can import templates, tweak variables,
                and visually compare results for multiple scenarios.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Reset Workspace
              </Button>
              <Button
                onClick={runAllTestCases}
                disabled={isRunning || !promptTemplate.trim()}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running {testCases.length}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All ({testCases.length})
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
                  Prompt Template
                </CardTitle>
                <CardDescription className="text-sm">
                  Same editing experience as the prompt detail page with quick imports from your library.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Template Source
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
                    Import from Prompts
                  </Button>
                </div>
                <Textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder="Enter your prompt template here...

Example:
Write a {{tone}} email to {{recipient}} about {{topic}}."
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
                <CardTitle className="text-base">Model & API Settings</CardTitle>
                <CardDescription>
                  Mirror the testing controls from prompt details with reusable presets.
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
                    <CardTitle className="text-base">Test Cases</CardTitle>
                    <CardDescription>
                      Configure variable sets similar to the variable panel on the prompt page.
                    </CardDescription>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {testCases.length} configured
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
                    <CardTitle className="text-base">Result Comparison</CardTitle>
                    <CardDescription>
                      Inspect resolved prompts, completions, timing, and usage for every test case.
                    </CardDescription>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground text-right">
                    {Object.keys(results).length} completed
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
            <DialogTitle>Import from Prompt Library</DialogTitle>
            <DialogDescription>
              Choose an existing prompt from your workspace and load its content into the playground.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search prompts by title or description..."
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
                  Loading prompts...
                </div>
              ) : promptsError ? (
                <div className="py-10 text-center text-sm text-red-500">
                  {promptsError}
                </div>
              ) : promptResults.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No prompts found. Try adjusting your search.
                </div>
              ) : (
                promptResults.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => handleImportPrompt(prompt)}
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900 line-clamp-1">
                            {prompt.title || 'Untitled prompt'}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {prompt.version || 'v1'}
                          </span>
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {prompt.description}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                          {prompt.tags && (
                            <span className="inline-flex items-center gap-1">
                              {Array.isArray(prompt.tags)
                                ? prompt.tags.join(', ')
                                : prompt.tags}
                            </span>
                          )}
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                          <span>
                            Updated {new Date(prompt.updated_at || prompt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="justify-start">
            <p className="text-xs text-muted-foreground">
              Only prompts you have access to in the console are shown here.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


