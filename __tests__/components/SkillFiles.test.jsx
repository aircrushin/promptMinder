import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { SkillFiles, SkillFilesDiff } from '@/components/skill/SkillFiles';
import zh from '@/messages/zh.json';

jest.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: zh }) }));
jest.mock('@/components/prompt/PromptDiffViewer', () => function Diff({ oldContent, newContent }) { return <pre>{oldContent} → {newContent}</pre>; });
const before = { format: 1, files: [{ path: 'SKILL.md', contents: 'body' }, { path: 'references/check.md', contents: 'local' }] };
const after = { ...before, files: [{ path: 'SKILL.md', contents: 'body' }, { path: 'references/check.md', contents: 'upstream' }] };

it('附件修改应留在草稿中，上游差异默认不选择且选择状态可切换', () => {
  function Example() {
    const [value, setValue] = useState(before);
    const [selected, setSelected] = useState([]);
    return <><SkillFiles value={value} onChange={setValue} /><SkillFilesDiff before={value} after={after} selected={selected} onSelect={setSelected} /></>;
  }
  render(<Example />);
  fireEvent.change(screen.getByLabelText('references/check.md'), { target: { value: 'my revised method' } });
  expect(screen.getByLabelText('references/check.md')).toHaveValue('my revised method');
  const checkbox = screen.getByLabelText(/采用上游文件/);
  expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
  expect(screen.getByLabelText('references/check.md')).toHaveValue('my revised method');
});
