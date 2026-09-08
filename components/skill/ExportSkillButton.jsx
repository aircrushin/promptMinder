'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseSkillFrontmatter } from '@/lib/skills-sync';
import { apiClient } from '@/lib/api-client';

function ExportSkillForm({ prompt }) {
  const { t } = useLanguage();
  const copy = t.skillExport;
  const existing = parseSkillFrontmatter(prompt.content);
  const [name, setName] = useState(existing.name || prompt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 64).replace(/^-|-$/g, '') || 'my-skill');
  const [description, setDescription] = useState(existing.description || prompt.description || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hasMetadata = Boolean(existing.name || existing.description);

  const handleExport = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { createPromptSkillFiles, createSkillArchive, downloadSkillArchive } = await import('@/lib/skill-export');
      const files = prompt.skill_package ? [...prompt.skill_package.files] : createPromptSkillFiles({ name, description, content: prompt.content });
      const metadataFile = prompt.skill_package ? { path: '.promptminder-install.json', contents: JSON.stringify({ prompt_id: prompt.id, version: prompt.version, source: prompt.skill_package.source }, null, 2) } : undefined;
      downloadSkillArchive(createSkillArchive({ name, files, metadataFile }), name);
    } catch (error) {
      setError(error.message || copy.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleExport} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="export-skill-name">{copy.name}</Label>
        <Input id="export-skill-name" value={name} onChange={(event) => setName(event.target.value)}
          required maxLength={64} pattern="[a-z0-9]+(-[a-z0-9]+)*" readOnly={hasMetadata} />
        <p className="text-xs text-muted-foreground">{copy.nameHint}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="export-skill-description">{copy.description}</Label>
        <Textarea id="export-skill-description" value={description} onChange={(event) => setDescription(event.target.value)}
          required maxLength={1024} readOnly={hasMetadata} />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer">{copy.preview}</summary>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3">{prompt.content}</pre>
      </details>
      <p className="text-sm text-muted-foreground">{hasMetadata ? copy.existingHint : copy.installHint}</p>
      <p className="text-xs text-muted-foreground">{copy.localHint}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? copy.preparing : copy.download}</Button>
    </form>
  );
}

function ExportSkillButton({ prompt }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={!prompt?.content?.trim()}>
        {t.skillExport.trigger}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.skillExport.trigger}</DialogTitle>
            <DialogDescription>{t.skillExport.hint}</DialogDescription>
          </DialogHeader>
          <ExportSkillForm prompt={prompt} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CatalogSkillExportButton({ skill }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handleDownload = async () => {
    setBusy(true);
    setError('');
    try {
      const [archive, { downloadSkillArchive }] = await Promise.all([
        apiClient.request(`/api/skills/${encodeURIComponent(skill.id)}/export`, { responseType: 'arrayBuffer', teamId: null, cache: 'no-store' }),
        import('@/lib/skill-export'),
      ]);
      downloadSkillArchive(archive, parseSkillFrontmatter(skill.content).name);
    } catch (error) {
      setError(error.message || t.skillExport.error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full" onClick={handleDownload} disabled={busy}>
        {busy ? t.skillExport.preparing : t.skillExport.catalogDownload}
      </Button>
      <p className="text-xs text-muted-foreground">{t.skillExport.snapshotHint}</p>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export { ExportSkillButton, CatalogSkillExportButton };
