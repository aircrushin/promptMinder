'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkillFiles, SkillFolderInput } from '@/components/skill/SkillFiles';

function WorkspaceSkills({ teamId }) {
  const { t } = useLanguage();
  const copy = t.workspaceSkills;
  const router = useRouter();
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [value, setValue] = useState(null);
  const [source, setSource] = useState({});
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    apiClient.request('/api/workspace-skills', { teamId, cache: 'no-store' })
      .then((data) => { if (!cancelled) setSkills(data.skills); })
      .catch((error) => { if (!cancelled) setError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [teamId]);
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await apiClient.request('/api/workspace-skills', { method: 'POST', teamId, body: { title, skill_package: { ...value, source } } });
      router.push(result.mode === 'approval_required' ? `/prompts/reviews/${result.change_request.id}` : `/prompts/${result.prompt.id}`);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  return <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
    <Button asChild variant="ghost"><Link href="/prompts">{copy.back}</Link></Button>
    <h1 className="text-2xl font-semibold">{copy.title}</h1>
    <p className="text-sm text-muted-foreground">{copy.intro}</p>
    <form onSubmit={save} className="space-y-4 rounded-xl border p-4">
      <SkillFolderInput source={source} onChange={(value) => { setValue(value); setSource(value.source || {}); }} />
      {value && <>
        <label className="block space-y-2 text-sm">{copy.name}<Input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder={copy.optionalName} /></label>
        {['url', 'license', 'revision'].map((key) => <label key={key} className="block space-y-2 text-sm">{copy[key]}<Input type={key === 'url' ? 'url' : 'text'} value={source[key] || ''} maxLength={2048} onChange={(event) => setSource({ ...source, [key]: event.target.value })} /></label>)}
        <SkillFiles value={value} onChange={setValue} />
        <Button disabled={busy} type="submit">{copy.save}</Button>
      </>}
    </form>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Input aria-label={copy.search} placeholder={copy.search} value={search} onChange={(event) => setSearch(event.target.value)} />
    {loading ? <p role="status">{copy.loading}</p> : <ul className="divide-y rounded-xl border">
      {skills.filter((skill) => skill.title.toLowerCase().includes(search.toLowerCase())).map((skill) => <li key={skill.id} className="p-4"><Link className="font-medium underline underline-offset-4" href={`/prompts/${skill.id}`}>{skill.title} · {skill.version}</Link><p className="mt-1 text-sm text-muted-foreground">{skill.description}</p></li>)}
      {!skills.length && <li className="p-4 text-sm text-muted-foreground">{copy.empty}</li>}
    </ul>}
    <p className="text-xs text-muted-foreground">{copy.listLimit}</p>
  </div>;
}

export default function WorkspaceSkillsPage() {
  const { activeTeamId } = useTeam();
  return <WorkspaceSkills key={activeTeamId || 'personal'} teamId={activeTeamId} />;
}
