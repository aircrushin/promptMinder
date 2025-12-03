'use client';

import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Loader2,
  TestTube,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getVariableType, getVariablePlaceholder, generateVariableExamples } from '@/lib/promptVariables';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function TestCaseList({ testCases, variables, onChange, runningCases }) {
  const { t } = useLanguage();
  const pg = t?.playground || {
    testCases: 'Test Cases',
    addCase: 'Add Case',
    variables: 'Variables',
    fillExamples: 'Fill Examples',
    noVariables: 'No variables detected. Add {{variableName}} to your prompt template.',
    testCaseNamePlaceholder: 'Test case name...',
    noTestCases: 'No test cases yet',
    addFirstTestCase: 'Add First Test Case',
  };
  const [expandedCases, setExpandedCases] = useState(() => {
    const firstId = testCases[0]?.id;
    return new Set(firstId ? [firstId] : []);
  });

  const toggleExpanded = (id) => {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addTestCase = useCallback((index = 0) => {
    const newCase = {
      id: crypto.randomUUID(),
      name: `Test Case ${index + 1}`,
      variables: {},
    };
    onChange([...testCases, newCase]);
    setExpandedCases((prev) => new Set([...prev, newCase.id]));
  }, [testCases, onChange]);

  const removeTestCase = useCallback(
    (id) => {
      if (testCases.length <= 1) return;
      onChange(testCases.filter((tc) => tc.id !== id));
      setExpandedCases((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [testCases, onChange]
  );

  const duplicateTestCase = useCallback(
    (testCase) => {
      const newCase = {
        ...testCase,
        id: crypto.randomUUID(),
        name: `${testCase.name} (copy)`,
      };
      const index = testCases.findIndex((tc) => tc.id === testCase.id);
      const newCases = [...testCases];
      newCases.splice(index + 1, 0, newCase);
      onChange(newCases);
      setExpandedCases((prev) => new Set([...prev, newCase.id]));
    },
    [testCases, onChange]
  );

  const updateTestCase = useCallback(
    (id, updates) => {
      onChange(
        testCases.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc))
      );
    },
    [testCases, onChange]
  );

  const updateVariable = useCallback(
    (testCaseId, variableName, value) => {
      onChange(
        testCases.map((tc) =>
          tc.id === testCaseId
            ? { ...tc, variables: { ...tc.variables, [variableName]: value } }
            : tc
        )
      );
    },
    [testCases, onChange]
  );

  const fillExamples = useCallback(
    (testCaseId) => {
      const examples = generateVariableExamples(variables);
      onChange(
        testCases.map((tc) =>
          tc.id === testCaseId ? { ...tc, variables: { ...tc.variables, ...examples } } : tc
        )
      );
    },
    [testCases, variables, onChange]
  );

  return (
    <Card className="border-0 shadow-lg shadow-slate-200/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TestTube className="h-5 w-5 text-emerald-500" />
            {pg.testCases}
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              {testCases.length}
            </span>
          </CardTitle>
          <Button onClick={() => addTestCase(testCases.length)} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {pg.addCase}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto">
        {testCases.map((testCase, index) => {
          const isRunning = runningCases.has(testCase.id);
          const isExpanded = expandedCases.has(testCase.id);

          return (
            <div
              key={testCase.id}
              className={cn(
                'border rounded-xl transition-all duration-200',
                isRunning
                  ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              )}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => toggleExpanded(testCase.id)}
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                </div>

                <Input
                  value={testCase.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateTestCase(testCase.id, { name: e.target.value });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 border-0 bg-transparent font-medium text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                  placeholder={pg.testCaseNamePlaceholder}
                />

                <div className="flex items-center gap-1">
                  {isRunning && (
                    <Loader2 className="h-4 w-4 text-indigo-500 animate-spin mr-2" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateTestCase(testCase);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTestCase(testCase.id);
                    }}
                    disabled={testCases.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Variables */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                  <div className="pt-4 space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">
                      {pg.userPrompt || 'User Prompt'}
                    </Label>
                    <Textarea
                      value={testCase.userPrompt || ''}
                      onChange={(e) =>
                        updateTestCase(testCase.id, { userPrompt: e.target.value })
                      }
                      placeholder={pg.userPromptPlaceholder || 'Enter user message...'}
                      className="min-h-[80px] text-sm resize-none"
                    />
                  </div>

                  {variables.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {pg.noVariables}
                    </p>
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          {pg.variables} ({variables.length})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => fillExamples(testCase.id)}
                        >
                          {pg.fillExamples}
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        {variables.map((variable) => {
                          const type = getVariableType(variable);
                          const placeholder = getVariablePlaceholder(variable);
                          const isTextarea = type === 'textarea';

                          return (
                            <div key={variable} className="space-y-1.5">
                              <Label
                                htmlFor={`${testCase.id}-${variable}`}
                                className="text-sm font-medium text-slate-700"
                              >
                                {variable}
                              </Label>
                              {isTextarea ? (
                                <Textarea
                                  id={`${testCase.id}-${variable}`}
                                  value={testCase.variables[variable] || ''}
                                  onChange={(e) =>
                                    updateVariable(testCase.id, variable, e.target.value)
                                  }
                                  placeholder={placeholder}
                                  className="min-h-[80px] text-sm resize-none"
                                />
                              ) : (
                                <Input
                                  id={`${testCase.id}-${variable}`}
                                  type={type}
                                  value={testCase.variables[variable] || ''}
                                  onChange={(e) =>
                                    updateVariable(testCase.id, variable, e.target.value)
                                  }
                                  placeholder={placeholder}
                                  className="text-sm"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {testCases.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{pg.noTestCases}</p>
            <Button onClick={() => addTestCase(0)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {pg.addFirstTestCase}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
