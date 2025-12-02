'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart3,
  Clock,
  Coins,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { replaceVariables } from '@/lib/promptVariables';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/contexts/LanguageContext';

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function ResultCard({ testCase, result, promptTemplate, isRunning, pg }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const isStreaming = isRunning && !!result?.output;
  const showLoader = isRunning && !result?.output;
  const streamingLabel = pg.streaming || 'streaming';

  const resolvedPrompt = useMemo(
    () => replaceVariables(promptTemplate, testCase.variables),
    [promptTemplate, testCase.variables]
  );

  const handleCopy = async () => {
    if (!result?.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const getStatusIcon = () => {
    if (isRunning) {
      return <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />;
    }
    if (!result) {
      return <div className="h-4 w-4 rounded-full bg-slate-200" />;
    }
    if (result.status === 'success') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = () => {
    if (isRunning) return 'border-indigo-200 bg-indigo-50/50';
    if (!result) return 'border-slate-200 bg-white';
    if (result.status === 'success') return 'border-emerald-200 bg-emerald-50/30';
    return 'border-red-200 bg-red-50/30';
  };

  return (
    <div className={cn('rounded-xl border transition-all duration-200', getStatusColor())}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {getStatusIcon()}
        <span className="font-medium text-slate-900 flex-1">{testCase.name}</span>

        {result && result.status === 'success' && (
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(result.duration)}
                </TooltipTrigger>
                <TooltipContent>{pg.responseTime || 'Response time'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {result.usage?.totalTokens && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" />
                    {result.usage.totalTokens}
                  </TooltipTrigger>
                  <TooltipContent>
                    {(pg.totalTokensTooltip || 'Total tokens ({promptTokens} prompt + {completionTokens} completion)')
                      .replace('{promptTokens}', result.usage.promptTokens)
                      .replace('{completionTokens}', result.usage.completionTokens)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          {result?.output && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 text-slate-400" />
              )}
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {/* Resolved Prompt Preview */}
          <div className="pt-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {pg.resolvedPrompt || 'Resolved Prompt'}
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
              {resolvedPrompt || pg.noPromptTemplate || 'No prompt template'}
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              {pg.output || 'Output'} {isStreaming ? <span className="ml-2 text-[11px] text-indigo-500">({streamingLabel})</span> : null}
            </div>
            {showLoader ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                <span className="ml-2 text-sm text-slate-500">{`${pg.running || 'Running'}...`}</span>
              </div>
            ) : result?.status === 'error' ? (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-700">{pg.error || 'Error'}</div>
                    <div className="text-sm text-red-600 mt-1">{result.error}</div>
                  </div>
                </div>
              </div>
            ) : result?.output ? (
              <ScrollArea className="max-h-[300px]">
                <div className="p-4 bg-white rounded-lg border border-slate-200 prose prose-sm max-w-none">
                  <ReactMarkdown>{result.output}</ReactMarkdown>
                </div>
              </ScrollArea>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                {pg.clickToRun || 'Click "Run All Tests" to see results'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultComparison({ testCases, results, promptTemplate, runningCases }) {
  const { t } = useLanguage();
  const pg = t?.playground || {
    results: 'Results',
    resolvedPrompt: 'Resolved Prompt',
    noPromptTemplate: 'No prompt template',
    output: 'Output',
    streaming: 'streaming',
    running: 'Running',
    error: 'Error',
    passed: 'passed',
    failed: 'failed',
    avgTime: 'Avg',
    tokens: 'tokens',
    clickToRun: 'Click "Run All Tests" to see results',
    addTestCases: 'Add test cases to see comparison results',
    runTestsToCompare: 'Run tests to see comparison results',
    responseTime: 'Response time',
    totalTokensTooltip: 'Total tokens ({promptTokens} prompt + {completionTokens} completion)',
  };

  const hasResults = Object.keys(results).length > 0;
  const hasRunningCases = runningCases.size > 0;

  // Calculate summary statistics
  const stats = useMemo(() => {
    const resultList = Object.values(results);
    if (resultList.length === 0) return null;

    const successful = resultList.filter((r) => r.status === 'success');
    const failed = resultList.filter((r) => r.status === 'error');

    const avgDuration =
      successful.length > 0
        ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
        : 0;

    const totalTokens = successful.reduce(
      (sum, r) => sum + (r.usage?.totalTokens || 0),
      0
    );

    return {
      total: resultList.length,
      successful: successful.length,
      failed: failed.length,
      avgDuration,
      totalTokens,
    };
  }, [results]);

  return (
    <Card className="border-0 shadow-lg shadow-slate-200/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            {pg.results}
            {hasResults && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                {Object.keys(results).length} / {testCases.length}
              </span>
            )}
          </CardTitle>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-slate-600">{stats.successful} {pg.passed || 'passed'}</span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-slate-600">{stats.failed} {pg.failed || 'failed'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">
                {(pg.avgTime || 'Avg')}: {formatDuration(Math.round(stats.avgDuration))}
              </span>
            </div>
            {stats.totalTokens > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">{stats.totalTokens} {pg.tokens || 'tokens'}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {testCases.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{pg.addTestCases}</p>
          </div>
        ) : !hasResults && !hasRunningCases ? (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{pg.runTestsToCompare}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {testCases.map((testCase) => (
              <ResultCard
                key={testCase.id}
                testCase={testCase}
                result={results[testCase.id]}
                promptTemplate={promptTemplate}
                isRunning={runningCases.has(testCase.id)}
                pg={pg}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
