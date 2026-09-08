'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EVALUATION_PROVIDERS } from '@/lib/prompt-evaluation';
import { apiClient } from '@/lib/api-client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import providers from '@/components/playground/providerOptions.json';

const control = 'w-full min-w-0 rounded-md border bg-background p-2 text-sm';
const newCase = () => ({ name: '', input: '', variablesText: '{}', criteria: '', checks: [] });

function EvaluationReport({ report, teamId, onChange }) {
  const { t } = useLanguage(), c = t.evaluations;
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const review = async (event, caseId) => {
    event.preventDefault(); setBusy(true); setError('');
    const fields = new FormData(event.currentTarget);
    try {
      const result = await apiClient.request('/api/evaluations', { method: 'PATCH', teamId,
        body: { reportId: report.id, revision: report.revision, caseId, preference: fields.get('preference'), note: fields.get('note') } });
      onChange(result.report);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  const exportReport = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `evaluation-${report.id}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="min-w-0 space-y-4 break-words rounded-xl border p-4" aria-label={c.report}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{c.report} · {c[report.status]}</h2><Button variant="outline" onClick={exportReport}>{c.export}</Button></div>
    <p className="break-all text-xs text-muted-foreground">{report.id} · {new Date(report.createdAt).toLocaleString()}</p>
    <p className="text-sm">{report.data.suite.name} · {report.data.settings.provider} / {report.data.settings.model} · {c.maxTokens}: {report.data.settings.maxTokens} · {c.temperature}: {report.data.settings.temperature ?? c.default}</p>
    <p className="text-sm text-muted-foreground">{c.boundary}</p>
    {report.status === 'running' && <p role="status">{c.interrupted}</p>}
    {report.changeRequestId && <Link className="block underline" href={`/prompts/reviews/${report.changeRequestId}`}>{c.approval}</Link>}
    <div className="grid gap-4 md:grid-cols-2">{['baseline', 'candidate'].map((side) => <details key={side} className="min-w-0 rounded border p-3"><summary className="cursor-pointer">{c[side]}: {report.data[side].title} · {report.data[side].version}</summary><p className="my-2 break-all text-xs">{report.data[side].id}<br />SHA-256: {report.data[side].hash}</p><pre className="whitespace-pre-wrap break-words text-sm">{report.data[side].content}</pre></details>)}</div>
    {report.data.suite.cases.map((item) => {
      const result = report.data.results.find((result) => result.caseId === item.id);
      const saved = report.reviews[item.id];
      const reviewable = report.status !== 'running' && result && ['baseline', 'candidate'].every((side) => result[side].requestStatus === 'succeeded' && ['passed', 'failed', 'unscored'].includes(result[side].quality.status));
      return <article className="space-y-3 border-t pt-4" key={item.id}>
        <h3 className="font-semibold">{item.name}</h3><p className="whitespace-pre-wrap break-words text-sm">{item.input}</p>
        <details><summary className="cursor-pointer text-sm">{c.variables}</summary><pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(item.variables, null, 2)}</pre></details>
        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{c.criteria}: {item.criteria || c.none}</p>
        <div className="grid gap-4 md:grid-cols-2">{['baseline', 'candidate'].map((side) => {
          const output = result?.[side];
          return <div key={side} className="min-w-0 space-y-2 rounded-lg bg-muted/40 p-3"><h4 className="font-medium">{c[side]}</h4>
            {output ? <><p className="text-sm">{c.request}: {c[output.requestStatus]} · {c.quality}: {c[output.quality.status]}</p>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm">{output.output || (output.error ? c.providerError : c.empty)}</pre>
              {output.quality.checks.map((check, index) => <p key={index} className="break-words text-xs">{check.passed ? '✓' : '✕'} {c[check.type]} {check.value}</p>)}
              <p className="break-words text-xs text-muted-foreground">{output.model || c.unknown} · {output.duration != null ? `${output.duration} ms` : c.unknown} · {c.tokens}: {output.usage?.totalTokens ?? c.unknown} · {c.cost}: {output.cost ? `$${output.cost.usd.toFixed(6)}` : c.unknown}</p>
              {output.cost && <a className="text-xs underline" href={output.cost.source} target="_blank" rel="noreferrer">{c.priceSource} · {output.cost.verifiedAt}</a>}
            </> : <p>{c.notRun}</p>}
          </div>;
        })}</div>
        {reviewable && <form key={`${report.id}:${item.id}`} onSubmit={(event) => review(event, item.id)} className="space-y-2">
          <label className="block text-sm">{c.preference}<select required name="preference" defaultValue={saved?.preference || ''} className={control}><option value="">{c.choose}</option>{['baseline', 'candidate', 'tie', 'neither'].map((value) => <option key={value} value={value}>{c[value]}</option>)}</select></label>
          <label className="block text-sm">{c.note}<Textarea name="note" maxLength={2000} defaultValue={saved?.note || ''} /></label>
          <Button type="submit" variant="outline" disabled={busy}>{c.saveReview}</Button>
          {saved && <p className="break-words text-xs text-muted-foreground">{c.reviewedBy}: {saved.userId} · {new Date(saved.reviewedAt).toLocaleString()}</p>}
        </form>}
      </article>;
    })}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
}

function EvaluationLinks({ reports, copy }) {
  return <ul className="space-y-2">{reports.map((report) => <li key={report.id}><Link className="break-words text-sm underline" href={`/prompts/evaluations?reportId=${report.id}`}>{new Date(report.createdAt).toLocaleString()} · {copy[report.status]} · {report.id.slice(0, 8)}</Link></li>)}{!reports.length && <li className="text-sm text-muted-foreground">{copy.noReports}</li>}</ul>;
}

function ApprovalEvaluations({ changeRequestId, teamId }) {
  const { t } = useLanguage(), c = t.evaluations;
  const [reports, setReports] = useState([]), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiClient.request(`/api/evaluations?changeRequestId=${changeRequestId}`, { teamId, cache: 'no-store' })
      .then((data) => { if (active) setReports(data.reports); }).catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [changeRequestId, teamId]);
  return <section className="space-y-3 rounded-xl border p-4"><h2 className="font-semibold">{c.title}</h2><p className="text-sm text-muted-foreground">{c.boundary}</p>
    <Button variant="outline" asChild><Link href={`/prompts/evaluations?changeRequestId=${changeRequestId}`}>{c.newRun}</Link></Button>
    <EvaluationLinks reports={reports} copy={c} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}

function EvaluationWorkspace({ teamId, promptId = '', changeRequestId = '', reportId = '' }) {
  const { t } = useLanguage(), c = t.evaluations;
  const [suites, setSuites] = useState([]), [reports, setReports] = useState([]), [prompts, setPrompts] = useState([]), [versions, setVersions] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(promptId), [baselineId, setBaselineId] = useState(''), [candidateId, setCandidateId] = useState('');
  const [suiteId, setSuiteId] = useState(''), [name, setName] = useState(''), [cases, setCases] = useState([newCase()]);
  const [settings, setSettings] = useState({ provider: 'openai', model: 'gpt-4.1-mini', maxTokens: 1024 });
  const [report, setReport] = useState(null), [proposal, setProposal] = useState(null), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (reportId) { const data = await apiClient.request(`/api/evaluations?reportId=${reportId}`, { teamId, cache: 'no-store' }); if (active) setReport(data.report); return; }
        const [data, promptData, detail] = await Promise.all([
          apiClient.request(`/api/evaluations${changeRequestId ? `?changeRequestId=${changeRequestId}` : ''}`, { teamId, cache: 'no-store' }),
          changeRequestId || promptId ? Promise.resolve({ prompts: [] }) : apiClient.getPrompts({ limit: 100 }, { teamId }),
          changeRequestId ? apiClient.getChangeRequest(changeRequestId, { teamId }) : Promise.resolve(null),
        ]);
        if (active) { setSuites(data.suites); setReports(data.reports); setPrompts(promptData.prompts); setProposal(detail?.request || null); }
      } catch (error) { if (active) setError(error.message); }
      finally { if (active) setLoading(false); }
    };
    load(); return () => { active = false; };
  }, [teamId, promptId, changeRequestId, reportId]);
  useEffect(() => {
    let active = true;
    if (!selectedPrompt || changeRequestId) return;
    setVersions([]); setBaselineId(''); setCandidateId('');
    apiClient.getPromptVersions(selectedPrompt, { teamId }).then((data) => {
      if (active) { setVersions(data.versions); setBaselineId(data.versions[1]?.id || ''); setCandidateId(data.versions[0]?.id || ''); }
    }).catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [teamId, selectedPrompt, changeRequestId]);
  const updateCase = (index, patch) => { setSuiteId(''); setCases(cases.map((item, i) => i === index ? { ...item, ...patch } : item)); };
  const loadSuite = (id) => {
    setSuiteId(id); const suite = suites.find((suite) => suite.id === id);
    setName(suite?.name || ''); setCases(suite ? suite.cases.map((item) => ({ ...item, variablesText: JSON.stringify(item.variables, null, 2) })) : [newCase()]);
  };
  const saveSuite = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = await apiClient.request('/api/evaluations', { teamId, method: 'POST', body: { action: 'save_suite', name, cases: cases.map(({ variablesText, ...item }) => ({ ...item, variables: JSON.parse(variablesText) })) } });
      setSuiteId(data.suite.id); setSuites([data.suite, ...suites]);
    } catch (error) { setError(error instanceof SyntaxError ? c.invalidVariables : error.message); }
    finally { setBusy(false); }
  };
  const run = async () => {
    setBusy(true); setError('');
    try {
      const data = await apiClient.request('/api/evaluations', { teamId, method: 'POST', body: { action: 'run', suiteId, baselineId, candidateId, changeRequestId: changeRequestId || undefined, settings } });
      setReport(data.report); setReports([data.report, ...reports]);
    } catch (error) { setError(`${error.message} ${c.retryHint}`); }
    finally { setBusy(false); }
  };
  return <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
    <Button asChild variant="ghost"><Link href="/prompts">{c.back}</Link></Button><h1 className="text-2xl font-semibold">{c.title}</h1>
    <p className="text-sm text-muted-foreground">{c.boundary}</p>
    {loading && <p role="status">{c.loading}</p>}
    {!loading && !reportId && <>
      <form onSubmit={saveSuite} className="space-y-4 rounded-xl border p-4"><fieldset disabled={busy} className="min-w-0 space-y-4">
        <legend className="font-semibold">{c.dataset}</legend>
        <label className="block text-sm">{c.loadSuite}<select className={control} value={suiteId} onChange={(event) => loadSuite(event.target.value)}><option value="">{c.newSuite}</option>{suites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name} · {suite.id.slice(0, 8)}</option>)}</select></label>
        <label className="block text-sm">{c.name}<Input required maxLength={200} value={name} onChange={(event) => { setName(event.target.value); setSuiteId(''); }} /></label>
        {cases.map((item, index) => <div key={index} className="space-y-3 border-t pt-4">
          <label className="block text-sm">{c.caseName} {index + 1}<Input required maxLength={200} value={item.name} onChange={(event) => updateCase(index, { name: event.target.value })} /></label>
          <label className="block text-sm">{c.input}<Textarea required maxLength={16000} value={item.input} onChange={(event) => updateCase(index, { input: event.target.value })} /></label>
          <label className="block text-sm">{c.variables}<Textarea value={item.variablesText} onChange={(event) => updateCase(index, { variablesText: event.target.value })} placeholder={'{"topic": "example"}'} /></label>
          <label className="block text-sm">{c.criteria}<Textarea maxLength={4000} value={item.criteria} onChange={(event) => updateCase(index, { criteria: event.target.value })} /></label>
          {item.checks.map((check, checkIndex) => <div key={checkIndex} className="flex flex-wrap gap-2">
            <select aria-label={c.rule} className={`${control} flex-1`} value={check.type} onChange={(event) => updateCase(index, { checks: item.checks.map((value, i) => i === checkIndex ? { type: event.target.value, value: event.target.value === 'max_chars' ? 500 : '' } : value) })}>{['contains', 'not_contains', 'equals', 'json', 'max_chars'].map((type) => <option key={type} value={type}>{c[type]}</option>)}</select>
            {check.type !== 'json' && <Input aria-label={c.ruleValue} className="min-w-0 flex-1" required type={check.type === 'max_chars' ? 'number' : 'text'} min={1} max={100000} maxLength={4000} value={check.value} onChange={(event) => updateCase(index, { checks: item.checks.map((value, i) => i === checkIndex ? { ...check, value: check.type === 'max_chars' ? Number(event.target.value) : event.target.value } : value) })} />}
            <Button variant="ghost" type="button" onClick={() => updateCase(index, { checks: item.checks.filter((_, i) => i !== checkIndex) })}>{c.remove}</Button>
          </div>)}
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={item.checks.length >= 10} onClick={() => updateCase(index, { checks: [...item.checks, { type: 'contains', value: '' }] })}>{c.addRule}</Button><Button type="button" variant="ghost" disabled={cases.length === 1} onClick={() => { setSuiteId(''); setCases(cases.filter((_, i) => i !== index)); }}>{c.removeCase}</Button></div>
        </div>)}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={cases.length >= 5} onClick={() => { setSuiteId(''); setCases([...cases, newCase()]); }}>{c.addCase}</Button><Button type="submit" disabled={!!suiteId}>{suiteId ? c.saved : c.saveSuite}</Button></div>
      </fieldset></form>
      <fieldset disabled={busy} className="min-w-0 space-y-4 rounded-xl border p-4"><legend className="font-semibold">{c.compare}</legend>
        {changeRequestId ? <p className="break-words text-sm">{c.proposal}: {proposal?.proposed_title} · {proposal?.proposed_version} ({changeRequestId})</p> : <>
          {!promptId && <label className="block text-sm">{c.prompt}<select className={control} value={selectedPrompt} onChange={(event) => setSelectedPrompt(event.target.value)}><option value="">{c.choose}</option>{prompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.title} · {prompt.version}</option>)}</select></label>}
          <div className="grid gap-3 sm:grid-cols-2">{[['baseline', baselineId, setBaselineId], ['candidate', candidateId, setCandidateId]].map(([side, id, setter]) => <label key={side} className="block text-sm">{c[side]}<select className={control} value={id} onChange={(event) => setter(event.target.value)}><option value="">{c.choose}</option>{versions.map((version) => <option key={version.id} value={version.id}>{version.title} · {version.version} · {version.id.slice(0, 8)}</option>)}</select></label>)}</div>
        </>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">{c.provider}<select className={control} value={settings.provider} onChange={(event) => setSettings({ ...settings, provider: event.target.value, model: '' })}>{providers.filter((provider) => EVALUATION_PROVIDERS.includes(provider.value)).map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}</select></label><label className="block text-sm">{c.model}<Input maxLength={150} value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} /></label>
          <label className="block text-sm">{c.maxTokens}<Input type="number" min={1} max={2048} value={settings.maxTokens} onChange={(event) => setSettings({ ...settings, maxTokens: Number(event.target.value) })} /></label>
          <label className="block text-sm">{c.temperature}<Input type="number" min={0} max={1} step="0.1" placeholder={c.default} value={settings.temperature ?? ''} onChange={(event) => setSettings({ ...settings, temperature: event.target.value === '' ? undefined : Number(event.target.value) })} /></label></div>
        <p className="text-sm text-muted-foreground">{c.paid} <Link className="underline" href="/playground">{c.keys}</Link></p>
        <Button onClick={run} disabled={!suiteId || !settings.model.trim() || (changeRequestId ? !proposal?.base_prompt_id : !baselineId || !candidateId || baselineId === candidateId)}>{busy ? c.running : c.run}</Button>
      </fieldset>
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {report && <EvaluationReport key={report.id} report={report} teamId={teamId} onChange={setReport} />}
    {!reportId && <section className="space-y-3"><h2 className="font-semibold">{c.history}</h2><EvaluationLinks reports={reports} copy={c} /><p className="text-xs text-muted-foreground">{c.limit}</p></section>}
  </div>;
}

export { EvaluationWorkspace, EvaluationReport, ApprovalEvaluations };
