'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { SkillFiles, SkillFilesDiff } from '@/components/skill/SkillFiles';
import { apiClient } from '@/lib/api-client';
import skillPackage from '@/packages/promptminder-cli/lib/skill-package';

function WorkspaceSkillPanel({ prompt }) {
  const { t } = useLanguage();
  const copy = t.workspaceSkills;
  const { activeTeamId } = useTeam();
  const router = useRouter();
  const [upstream, setUpstream] = useState(null);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!prompt.skill_package) return null;
  const compare = async () => {
    setBusy(true); setError('');
    try {
      const data = await apiClient.request(`/api/workspace-skills/${prompt.id}/upstream`, { teamId: activeTeamId, cache: 'no-store' });
      setUpstream(data.skill_package); setSelected([]);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  const merge = async () => {
    setBusy(true); setError('');
    try {
      const merged = skillPackage.mergeSkillFiles(prompt.skill_package, upstream, selected);
      const result = await apiClient.updatePrompt(prompt.id, { skill_package: merged }, { teamId: activeTeamId });
      router.push(result.mode === 'approval_required' ? `/prompts/reviews/${result.change_request.id}` : `/prompts/${result.prompt.id}`);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  return <section className="mt-6 space-y-4 rounded-xl border p-4 sm:p-6">
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline"><Link href={`/prompts/${prompt.id}/edit`}>{copy.edit}</Link></Button>
      {prompt.skill_package.source?.catalog_id && <Button variant="outline" disabled={busy} onClick={compare}>{copy.compare}</Button>}
    </div>
    <p className="text-sm text-muted-foreground">{copy.versionHint}</p>
    <code className="block overflow-auto rounded bg-muted p-3 text-xs">promptminder skill install {prompt.id}{activeTeamId ? ` --team ${activeTeamId}` : ''}</code>
    <SkillFiles value={prompt.skill_package} />
    {upstream && <div className="space-y-4 border-t pt-4">
      <p className="text-sm text-muted-foreground">{copy.mergeHint}</p>
      <SkillFilesDiff before={prompt.skill_package} after={upstream} selected={selected} onSelect={setSelected} />
      <Button disabled={busy || !selected.length} onClick={merge}>{copy.merge}</Button>
    </div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}

export { WorkspaceSkillPanel };
