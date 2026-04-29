'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Check, Copy, Loader2, Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const FALLBACK_TRANSLATIONS = {
  badge: 'URL to Text',
  title: '网页转文字',
  description: '把网页转换成适合复制、检索和继续加工的纯文本。',
  inputLabel: '网页地址',
  inputPlaceholder: '输入一个公开网页 URL',
  submit: '提取文本',
  submitting: '提取中...',
  resultTitle: '提取结果',
  resultDescription: '服务端会通过与 llm-readify 相同的方式抓取并转换。',
  searchPlaceholder: '搜索提取结果',
  outputPlaceholder: '提取后的文本会显示在这里',
  copy: '复制文本',
  copied: '已复制',
  download: '下载 Markdown',
  sourceLabel: '来源 URL',
  truncated: '内容过长，已截断',
  helperTitle: '使用说明',
  helperItems: [
    '输入任意公开网页地址',
    '服务端会通过与 llm-readify 相同的方式转成纯文本',
    '你可以继续搜索、复制或导出结果',
  ],
  searchResults: '{{count}} 条匹配',
  searchNoResults: '没有匹配内容',
  errors: {
    URL_REQUIRED: '请输入 URL',
    INVALID_URL_FORMAT: 'URL 格式不正确',
    UNSUPPORTED_PROTOCOL: '只支持 http 和 https 链接',
    CREDENTIALS_NOT_ALLOWED: '不支持包含用户名或密码的链接',
    BLOCKED_HOST: '出于安全原因，该地址不被允许',
    UPSTREAM_FETCH_FAILED: '目标页面暂时无法读取，请稍后重试',
    CONTENT_TOO_LARGE: '目标页面内容过大，无法返回',
    FETCH_TIMEOUT: '抓取超时，请稍后重试',
    INVALID_BODY: '请求参数无效',
    READER_REQUEST_FAILED: '读取失败，请稍后重试',
    INTERNAL_ERROR: '读取失败，请稍后重试',
  },
};

function formatMessage(template, values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replace(`{{${key}}}`, String(value));
  }, template);
}

function buildDownloadName(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    return `${url.hostname}-${Date.now()}.md`;
  } catch {
    return `reader-export-${Date.now()}.md`;
  }
}

function resolveErrorMessage(code, fallbackMessage, translations) {
  if (code && translations.errors?.[code]) {
    return translations.errors[code];
  }

  return fallbackMessage || translations.errors?.INTERNAL_ERROR || '读取失败';
}

function UrlReaderPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const translations = t?.readerPage || FALLBACK_TRANSLATIONS;

  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(null);

  const outputRef = useRef(null);

  const canSubmit = useMemo(() => urlInput.trim().length > 0 && !isLoading, [isLoading, urlInput]);

  const searchResults = useMemo(() => {
    if (!result?.content || !searchQuery.trim()) {
      return null;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return result.content
      .split('\n')
      .map((line, index) => ({
        line,
        lineNumber: index + 1,
      }))
      .filter(({ line }) => line.toLowerCase().includes(normalizedQuery));
  }, [result?.content, searchQuery]);

  const handleSubmit = useCallback(async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setError('');
    setCopied(false);
    setSearchQuery('');
    setResult(null);

    try {
      const response = await fetch('/api/reader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlInput.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(resolveErrorMessage(data?.code, data?.error, translations));
      }

      setResult(data);
      queueMicrotask(() => outputRef.current?.focus());
    } catch (requestError) {
      setError(requestError.message || translations.errors?.INTERNAL_ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [translations, urlInput]);

  const handleCopy = useCallback(async () => {
    if (!result?.content) return;

    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      toast({
        description: translations.copied,
      });
    } catch {
      outputRef.current?.select();
      document.execCommand('copy');
      setCopied(true);
      toast({
        description: translations.copied,
      });
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result?.content, toast, translations.copied]);

  const handleDownload = useCallback(() => {
    if (!result?.content) return;

    const blob = new Blob([result.content], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = buildDownloadName(result.sourceUrl);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [result?.content, result?.sourceUrl]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <section className="space-y-4 pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1.5 text-sm font-medium text-sky-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>{translations.badge}</span>
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {translations.title}
              </h1>
              <p className="text-base leading-7 text-slate-600 sm:text-lg">
                {translations.description}
              </p>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_320px]">
            <Card className="border-slate-200/80 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle>{translations.resultTitle}</CardTitle>
                <CardDescription>{translations.resultDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="reader-url-input"
                    className="text-sm font-medium text-slate-700"
                  >
                    {translations.inputLabel}
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="reader-url-input"
                      type="url"
                      value={urlInput}
                      onChange={(event) => setUrlInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && canSubmit) {
                          handleSubmit();
                        }
                      }}
                      placeholder={translations.inputPlaceholder}
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="h-11 rounded-xl px-5"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {translations.submitting}
                        </>
                      ) : (
                        translations.submit
                      )}
                    </Button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">{translations.resultTitle}</p>
                    <p className="text-sm text-slate-500">{translations.resultDescription}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={translations.searchPlaceholder}
                      className="h-9 w-full min-w-0 rounded-lg border-slate-200 bg-white sm:w-52"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownload}
                      disabled={!result?.content}
                      className="rounded-lg"
                    >
                      {translations.download}
                    </Button>
                    <Button
                      type="button"
                      variant={copied ? 'secondary' : 'outline'}
                      onClick={handleCopy}
                      disabled={!result?.content}
                      aria-label={translations.copy}
                      className="rounded-lg"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? translations.copied : translations.copy}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  {isLoading ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/85 backdrop-blur-sm">
                      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {translations.submitting}
                      </div>
                    </div>
                  ) : null}

                  {searchResults ? (
                    <div className="h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 text-sm text-slate-100">
                      <div className="mb-3 text-xs text-slate-400">
                        {formatMessage(translations.searchResults, {
                          count: searchResults.length,
                        })}
                      </div>
                      {searchResults.length > 0 ? (
                        <div className="space-y-2">
                          {searchResults.map((match) => (
                            <div
                              key={`${match.lineNumber}-${match.line}`}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                            >
                              <div className="mb-1 text-xs text-sky-300/80">
                                Line {match.lineNumber}
                              </div>
                              <div className="font-mono text-[13px] leading-6 text-slate-100">
                                {match.line || '\u00A0'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[320px] items-center justify-center text-slate-400">
                          {translations.searchNoResults}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      ref={outputRef}
                      readOnly
                      value={result?.content || ''}
                      placeholder={translations.outputPlaceholder}
                      className="h-[420px] resize-none rounded-2xl border-slate-200 bg-slate-950 px-4 py-4 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-500"
                    />
                  )}
                </div>

                {result?.sourceUrl ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{translations.sourceLabel}</span>
                    <span className="max-w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700">
                      {result.sourceUrl}
                    </span>
                    {result.truncated ? (
                      <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                        {translations.truncated}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/80 shadow-lg shadow-slate-200/40">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">{translations.helperTitle}</CardTitle>
                <CardDescription>
                  PromptMinder 站内版会把这个能力作为独立工具页提供。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {translations.helperItems.map((item, index) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-slate-600">{item}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export { UrlReaderPage };
