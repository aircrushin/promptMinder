import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationMethodReview } from '@/components/prompt/ConversationMethodReview';
import en from '@/messages/en.json';

jest.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: require('@/messages/en.json') }) }));

it('应该先审阅再继续，并仅保存编辑后勾选的内容', () => {
  const onApply = jest.fn();
  render(<ConversationMethodReview draft={{ language: 'en', mode: 'ai', method: {
    goal: 'Original goal', steps: 'Draft method', variables: '{{topic}}', corrections: 'Keep concise', example: 'Private example', notes: '',
  } }} onApply={onApply} onBack={jest.fn()} />);
  const proceed = screen.getByRole('button', { name: en.conversationMethod.continue });
  expect(proceed).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Method (required)'), { target: { value: 'Reviewed method' } });
  fireEvent.click(screen.getByRole('checkbox', { name: en.conversationMethod.reviewConfirm }));
  fireEvent.click(proceed);
  expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Reviewed method') }));
  expect(onApply.mock.calls[0][0].content).not.toContain('Private example');
  fireEvent.change(screen.getByLabelText('Goal (required)'), { target: { value: 'Changed goal' } });
  expect(proceed).toBeDisabled();
});
