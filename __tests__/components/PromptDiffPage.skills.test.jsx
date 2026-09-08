import { Suspense, act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PromptDiffPage from '@/app/prompts/[id]/diff/page';
import { apiClient } from '@/lib/api-client';
import zh from '@/messages/zh.json';

const versions = [
  { id: 'new-id', version: '1.0.0', created_at: '2026-09-05', content: 'body', has_skill_package: true },
  { id: 'old-id', version: '1.0.0', created_at: '2026-09-04', content: 'body', has_skill_package: true },
  { id: 'oldest-id', version: '0.0.1', created_at: '2026-09-03', content: 'body', has_skill_package: true },
];
jest.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: zh }) }));
jest.mock('@/hooks/use-prompt-detail', () => ({ usePromptDetail: () => ({ prompt: { title: 'Review' }, versions, isLoading: false }) }));
jest.mock('@/lib/api-client', () => ({ apiClient: { getPrompt: jest.fn() } }));
jest.mock('@/components/prompt/PromptDiffViewer', () => function Diff({ oldContent, newContent }) { return <pre>{oldContent} → {newContent}</pre>; });

it('相同版本标签应按 ID 比较不同文件快照，只加载选中的两个包', async () => {
  apiClient.getPrompt.mockImplementation(async (id) => ({ content: 'body', skill_package: { format: 1, files: [{ path: 'references/method.md', contents: id }] } }));
  const params = Promise.resolve({ id: 'new-id' });
  await act(async () => { render(<Suspense fallback="Loading"><PromptDiffPage params={params} /></Suspense>); });
  expect(await screen.findByText('references/method.md · 修改')).toBeInTheDocument();
  await waitFor(() => expect(apiClient.getPrompt).toHaveBeenCalledTimes(2));
  expect(apiClient.getPrompt.mock.calls.map(([id]) => id).sort()).toEqual(['new-id', 'old-id']);
  expect(screen.getByText('old-id → new-id')).toBeInTheDocument();
});
