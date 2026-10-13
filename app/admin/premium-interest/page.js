'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { getAdminHeaders } from '@/lib/admin-client';
import { getPremiumSkillMeta, PREMIUM_INTENT_LEVELS } from '@/lib/premium-skills-data';
import { buildInterestSummary, reportCsv } from '@/lib/premium-interest-report';

const skillName = (slug) => getPremiumSkillMeta(slug)?.name || slug;
const intentName = (value) => PREMIUM_INTENT_LEVELS.find((level) => level.value === value)?.label || value;
const formatDate = (value) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

function downloadCsv(name, rows) {
  const url = URL.createObjectURL(new Blob([reportCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function PremiumInterestPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      setData(await apiClient.request('/api/premium-interest', {
        headers: getAdminHeaders({ json: false }), teamId: null, cache: 'no-store',
      }));
    } catch (failure) {
      setError(failure.message);
      toast({ title: '加载意向报表失败', description: failure.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  const summary = buildInterestSummary(data?.summary || []);
  const total = summary.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6 sm:px-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Premium Collection 意向报表</h1>
          <p className="mt-2 text-sm text-muted-foreground">按邮箱与 Skill 去重统计；重复报名更新意向及来源，保留首次报名时间。</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>刷新报表</Button>
      </header>
      {loading ? <div role="status" className="space-y-3"><span className="sr-only">加载报表中</span><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div> : error ? (
        <p role="alert" className="text-sm text-destructive">{error}。请重试；若授权已过期，请退出并重新验证管理员身份。</p>
      ) : data && <>
        <section className="space-y-3" aria-labelledby="summary-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="summary-title" className="text-lg font-semibold">全量意向汇总 · {total} 条报名</h2>
            <Button variant="outline" onClick={() => downloadCsv('premium-interest-summary.csv', [
              ['Skill', ...PREMIUM_INTENT_LEVELS.map((level) => level.label), '合计'],
              ...summary.map((row) => [skillName(row.skillSlug), ...PREMIUM_INTENT_LEVELS.map(({ value }) => row.counts[value]), row.total]),
            ])}>导出汇总 CSV</Button>
          </div>
          <div className="overflow-x-auto rounded-lg border"><Table>
            <TableHeader><TableRow><TableHead>Skill</TableHead>{PREMIUM_INTENT_LEVELS.map((level) => <TableHead key={level.value}>{level.label}</TableHead>)}<TableHead>合计</TableHead></TableRow></TableHeader>
            <TableBody>{summary.map((row) => <TableRow key={row.skillSlug}><TableCell className="font-medium">{skillName(row.skillSlug)}</TableCell>{PREMIUM_INTENT_LEVELS.map(({ value }) => <TableCell className="tabular-nums" key={value}>{row.counts[value]}</TableCell>)}<TableCell className="tabular-nums">{row.total}</TableCell></TableRow>)}</TableBody>
          </Table></div>
        </section>
        <section className="space-y-3" aria-labelledby="latest-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="latest-title" className="text-lg font-semibold">近期报名</h2><p className="mt-1 text-sm text-muted-foreground">按首次报名时间倒序，最多 100 条；时间为北京时间。来源为报名者提交值。</p></div>
            <Button variant="outline" disabled={!data.latest.length} onClick={() => downloadCsv('premium-interest-latest-100.csv', [
              ['Skill', '邮箱', '意向等级', '来源', '首次报名时间', '更新时间'],
              ...data.latest.map((row) => [skillName(row.skillSlug), row.email, intentName(row.interestLevel), row.source, row.createdAt, row.updatedAt]),
            ])}>导出近期报名 CSV</Button>
          </div>
          <div className="overflow-x-auto rounded-lg border"><Table>
            <TableHeader><TableRow>{['Skill', '邮箱', '意向等级', '来源', '首次报名时间', '更新时间'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{data.latest.length ? data.latest.map((row) => <TableRow key={row.id}>
              <TableCell>{skillName(row.skillSlug)}</TableCell><TableCell className="break-all">{row.email}</TableCell><TableCell className="whitespace-nowrap">{intentName(row.interestLevel)}</TableCell><TableCell className="max-w-xs break-all">{row.source}</TableCell><TableCell className="whitespace-nowrap">{formatDate(row.createdAt)}</TableCell><TableCell className="whitespace-nowrap">{formatDate(row.updatedAt)}</TableCell>
            </TableRow>) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">尚无报名，候补提交后会显示在这里。</TableCell></TableRow>}</TableBody>
          </Table></div>
        </section>
      </>}
    </div>
  );
}
