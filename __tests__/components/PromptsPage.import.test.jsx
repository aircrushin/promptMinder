import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptsPage from '@/app/prompts/page';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({ apiClient: {
  getPrompts: jest.fn(), getTags: jest.fn(), getFavorites: jest.fn(), checkFavorites: jest.fn(),
  importConversationToPrompt: jest.fn(), createPrompt: jest.fn(),
} }));
jest.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: require('@/messages/en.json'), language: 'en' }) }));
jest.mock('@/contexts/team-context', () => ({ useTeam: () => ({ activeTeamId: null, isPersonal: true }) }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/lib/clipboard', () => ({ useClipboard: () => ({ copy: jest.fn() }) }));
jest.mock('next/dynamic', () => () => () => null);
jest.mock('@/components/prompt/PromptGrid', () => ({ PromptGrid: () => null, PromptGridSkeleton: () => null }));
jest.mock('@/components/prompt/VersionHistoryDialog', () => ({ VersionHistoryDialog: () => null }));
jest.mock('@/components/prompt/OptimizePromptDialog', () => ({ OptimizePromptDialog: () => null }));
jest.mock('@/components/prompt/NewPromptDialog', () => ({
  NewPromptDialog: ({ open, onSubmit }) => open ? <button onClick={onSubmit}>Save reviewed draft</button> : null,
}));
jest.mock('@/components/prompt/OnboardingDialog', () => ({
  OnboardingDialog: function MockOnboarding({ open, onImportConversation, onApplyDraft }) {
    const [draft, setDraft] = require('react').useState(null);
    if (!open) return null;
    return <>
      <button onClick={async () => setDraft(await onImportConversation({ source: 'claude', conversation: 'A private conversation that should never be published automatically.' }))}>Extract fixture</button>
      {draft && <button onClick={() => onApplyDraft(draft)}>Accept review</button>}
    </>;
  },
}));

const mockToast = jest.fn();

it('已有提示词时仍可提炼对话，且只在审阅后私有保存', async () => {
  apiClient.getPrompts.mockResolvedValue({ prompts: [], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } });
  apiClient.getTags.mockResolvedValue([]);
  apiClient.getFavorites.mockResolvedValue({ favorites: [], pagination: { total: 0 } });
  apiClient.checkFavorites.mockResolvedValue({ favorites: {} });
  apiClient.importConversationToPrompt.mockResolvedValue({ title: 'Reviewed method', description: 'Reusable', content: 'Only reviewed instructions', tags: 'Writing' });
  apiClient.createPrompt.mockResolvedValue({ prompt: { id: 'created' } });
  render(<PromptsPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Extract from Chat' }));
  fireEvent.click(screen.getByRole('button', { name: 'Extract fixture' }));
  await screen.findByRole('button', { name: 'Accept review' });
  expect(apiClient.createPrompt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Accept review' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save reviewed draft' }));
  await waitFor(() => expect(apiClient.createPrompt).toHaveBeenCalled());
  expect(apiClient.createPrompt.mock.calls[0][0]).toMatchObject({ content: 'Only reviewed instructions', is_public: false });
  expect(JSON.stringify(apiClient.createPrompt.mock.calls[0][0])).not.toContain('private conversation');
});
