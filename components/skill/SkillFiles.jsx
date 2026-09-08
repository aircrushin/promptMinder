'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import PromptDiffViewer from '@/components/prompt/PromptDiffViewer';
import skillPackage from '@/packages/promptminder-cli/lib/skill-package';

const { normalizeSkillPackage, MAX_BYTES, MAX_FILES, RECEIPT_PATH } = skillPackage;

function SkillFolderInput({ source, onChange }) {
  const { t } = useLanguage();
  const copy = t.workspaceSkills;
  const id = useId();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const readFolder = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    setError('');
    setBusy(true);
    try {
      const packageFiles = selected.filter((file) => file.webkitRelativePath.split('/').slice(1).join('/') !== RECEIPT_PATH);
      if (packageFiles.length > MAX_FILES || packageFiles.reduce((sum, file) => sum + file.size, 0) > MAX_BYTES) throw new Error(copy.limits);
      const files = [];
      let packageSource = source;
      for (const file of selected) {
        if (file.webkitRelativePath.split('/').slice(1).join('/') === RECEIPT_PATH) {
          if (file.size > MAX_BYTES) throw new Error(copy.limits);
          packageSource = JSON.parse(await file.text()).source || source;
          continue;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        let contents;
        let encoding = 'utf8';
        try { contents = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
        catch {
          contents = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
          encoding = 'base64';
        }
        files.push({ path: file.webkitRelativePath.split('/').slice(1).join('/'), contents, encoding, executable: encoding === 'utf8' && contents.startsWith('#!') });
      }
      onChange(normalizeSkillPackage({ format: 1, files, source: packageSource }));
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2">
    <label className="block text-sm font-medium" htmlFor={id}>{copy.folder}</label>
    <Input id={id} type="file" webkitdirectory="" multiple onChange={readFolder} disabled={busy} />
    <p className="text-xs text-muted-foreground">{copy.limits}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}

function SkillFiles({ value, onChange, hideMain = false }) {
  const { t } = useLanguage();
  const copy = t.workspaceSkills;
  if (!value) return null;
  return <div className="space-y-3">
    <h2 className="text-lg font-semibold">{copy.files} ({value.files.length})</h2>
    {value.source && <dl className="space-y-1 break-all text-xs text-muted-foreground">
      {['url', 'license', 'revision', 'scope'].map((key) => value.source[key] && <div key={key}><dt className="inline font-medium">{copy[key]}: </dt><dd className="inline">{value.source[key]}</dd></div>)}
    </dl>}
    {value.files.filter((file) => !hideMain || file.path !== 'SKILL.md').map((file) => <details key={file.path} className="rounded-md border p-3">
      <summary className="cursor-pointer break-all text-sm">{file.path}{file.executable ? ' · executable' : ''}</summary>
      {file.encoding === 'base64' ? <p className="mt-2 text-sm text-muted-foreground">{copy.binary}</p> : onChange
        ? <Textarea aria-label={file.path} className="mt-3 min-h-40 font-mono text-xs" value={file.contents}
          onChange={(event) => onChange({ ...value, files: value.files.map((item) => item.path === file.path ? { ...item, contents: event.target.value } : item) })} />
        : <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs">{file.contents}</pre>}
      {onChange && <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(file.executable)} onChange={(event) => onChange({ ...value, files: value.files.map((item) => item.path === file.path ? { ...item, executable: event.target.checked } : item) })} />{copy.executable}</label>}
      {onChange && file.path !== 'SKILL.md' && <Button type="button" className="mt-2" variant="outline" onClick={() => onChange({ ...value, files: value.files.filter((item) => item.path !== file.path) })}>{copy.remove}</Button>}
    </details>)}
  </div>;
}

function SkillFilesDiff({ before, after, selected, onSelect }) {
  const { t } = useLanguage();
  const copy = t.workspaceSkills;
  const previous = new Map((before?.files || []).map((file) => [file.path, file]));
  const next = new Map((after?.files || []).map((file) => [file.path, file]));
  const paths = [...new Set([...previous.keys(), ...next.keys()])].filter((path) => {
    const a = previous.get(path), b = next.get(path);
    return a?.contents !== b?.contents || a?.encoding !== b?.encoding || Boolean(a?.executable) !== Boolean(b?.executable);
  });
  if (!before && !after) return null;
  return <div className="space-y-3">
    <h2 className="text-lg font-semibold">{copy.fileDiff}</h2>
    {!paths.length && <p className="text-sm text-muted-foreground">{copy.noChanges}</p>}
    {JSON.stringify(before?.source) !== JSON.stringify(after?.source) && <details className="rounded border p-3 text-sm"><summary>{copy.sourceDiff}</summary><PromptDiffViewer oldContent={JSON.stringify(before?.source || {}, null, 2)} newContent={JSON.stringify(after?.source || {}, null, 2)} t={t} /></details>}
    {paths.map((path) => {
      const a = previous.get(path), b = next.get(path);
      return <div key={path} className="space-y-2 rounded border p-3">
        {onSelect && <label className="flex items-center gap-2 break-all text-sm"><input type="checkbox" checked={selected.includes(path)} onChange={(event) => onSelect(event.target.checked ? [...selected, path] : selected.filter((item) => item !== path))} />{copy.takeFile} {path}</label>}
        <details><summary className="cursor-pointer break-all text-sm">{path} · {!a ? copy.added : !b ? copy.deleted : copy.changed}</summary>
          {(a?.encoding === 'base64' || b?.encoding === 'base64') ? <p className="mt-2 text-sm">{copy.binaryChanged}</p>
            : <PromptDiffViewer oldContent={a?.contents || ''} newContent={b?.contents || ''} t={t} />}
          {Boolean(a?.executable) !== Boolean(b?.executable) && <p className="text-sm">{copy.executable}: {String(Boolean(a?.executable))} → {String(Boolean(b?.executable))}</p>}
        </details>
      </div>;
    })}
  </div>;
}

export { SkillFolderInput, SkillFiles, SkillFilesDiff };
