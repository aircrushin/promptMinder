import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EvaluationWorkspace, EvaluationReport } from '@/components/evaluation/EvaluationWorkspace';
import { apiClient } from '@/lib/api-client';
import zh from '@/messages/zh.json';

jest.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: zh }) }));
jest.mock('@/lib/api-client', () => ({ apiClient: { request: jest.fn(), getPromptVersions: jest.fn(), getPrompts: jest.fn() } }));
const id = '11111111-1111-4111-8111-111111111111', nextId = '22222222-2222-4222-8222-222222222222';
const suite = { id, name: '套件', cases: [{ id: '1', name: '用例', input: '输入', variables: { productName: 'PM' }, criteria: '清晰', checks: [] }] };
const c = zh.evaluations;
beforeEach(() => {
  jest.clearAllMocks();
  apiClient.request.mockResolvedValue({ suites: [suite], reports: [] });
  apiClient.getPromptVersions.mockResolvedValue({ versions: [{ id: nextId, title: 'Prompt', version: 'same' }, { id, title: 'Prompt', version: 'same' }] });
});
it('应该使用具体版本 ID、保存的测试集和当前团队运行；修改测试集后必须重新保存', async () => {
  render(<EvaluationWorkspace teamId="team-a" promptId={id} />);
  await screen.findByLabelText(c.loadSuite);
  expect(screen.queryByRole('option', { name: 'Custom Provider' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(c.loadSuite), { target: { value: id } });
  expect(screen.getByLabelText(c.variables)).toHaveValue(JSON.stringify(suite.cases[0].variables, null, 2));
  expect(screen.getByLabelText(c.baseline)).toHaveValue(id);
  expect(screen.getByLabelText(c.candidate)).toHaveValue(nextId);
  expect(screen.getByRole('button', { name: c.run })).toBeEnabled();
  fireEvent.change(screen.getByLabelText(c.input), { target: { value: '新输入' } });
  expect(screen.getByRole('button', { name: c.run })).toBeDisabled();
  fireEvent.change(screen.getByLabelText(c.loadSuite), { target: { value: id } });
  apiClient.request.mockRejectedValueOnce(new Error('simulated failure'));
  fireEvent.click(screen.getByRole('button', { name: c.run }));
  await screen.findByRole('alert');
  expect(apiClient.request).toHaveBeenLastCalledWith('/api/evaluations', expect.objectContaining({ teamId: 'team-a', method: 'POST', body: expect.objectContaining({ action: 'run', suiteId: id, baselineId: id, candidateId: nextId }) }));
});
it('应该显示未知成本和未评分，保存偏好时携带报告修订号', async () => {
  const output = { requestStatus: 'succeeded', output: '回答', quality: { status: 'unscored', checks: [] }, cost: null };
  const report = { id, revision: 3, status: 'completed', createdAt: new Date().toISOString(), reviews: {}, data: { suite, settings: { provider: 'openai', model: 'unknown', maxTokens: 100 }, baseline: { title: 'Prompt', content: 'old' }, candidate: { title: 'Prompt', content: 'new' }, results: [{ caseId: '1', baseline: output, candidate: output }] } };
  const onChange = jest.fn(); apiClient.request.mockResolvedValueOnce({ report: { ...report, revision: 4 } });
  render(<EvaluationReport report={report} teamId="team-a" onChange={onChange} />);
  expect(screen.getAllByText(/规则检查: 未评分/)).toHaveLength(2);
  expect(screen.getAllByText(/估算成本: 未知/)).toHaveLength(2);
  fireEvent.change(screen.getByLabelText(c.preference), { target: { value: 'candidate' } });
  fireEvent.change(screen.getByLabelText(c.note), { target: { value: '准确' } });
  fireEvent.click(screen.getByRole('button', { name: c.saveReview }));
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(apiClient.request).toHaveBeenCalledWith('/api/evaluations', expect.objectContaining({ teamId: 'team-a', body: { reportId: id, revision: 3, caseId: '1', preference: 'candidate', note: '准确' } }));
});

it('保存一个用例后应保留其他用例的备注和偏好，并使用最新修订号继续保存', async () => {
  const output = { requestStatus: 'succeeded', output: '回答', quality: { status: 'passed', checks: [] } };
  const initial = { id, revision: 0, status: 'completed', createdAt: '2026-09-05', reviews: {}, data: {
    suite: { ...suite, cases: [suite.cases[0], { ...suite.cases[0], id: '2' }] }, settings: {}, baseline: {}, candidate: {},
    results: ['1', '2'].map(caseId => ({ caseId, baseline: output, candidate: output })),
  } };
  apiClient.request.mockImplementation(async (_, { body }) => ({ report: { ...initial, revision: body.revision + 1,
    reviews: { [body.caseId]: { preference: body.preference, note: body.note, userId: 'u', reviewedAt: '2026-09-05' } },
  } }));
  function Example() { const [report, setReport] = useState(initial); return <EvaluationReport report={report} teamId="team-a" onChange={setReport} />; }
  render(<Example />);
  fireEvent.change(screen.getAllByLabelText(c.note)[1], { target: { value: '第二条尚未保存' } });
  fireEvent.change(screen.getAllByLabelText(c.preference)[1], { target: { value: 'tie' } });
  fireEvent.change(screen.getAllByLabelText(c.preference)[0], { target: { value: 'candidate' } });
  fireEvent.click(screen.getAllByRole('button', { name: c.saveReview })[0]);
  await waitFor(() => expect(screen.getAllByRole('button', { name: c.saveReview })[1]).toBeEnabled());
  expect(screen.getAllByLabelText(c.note)[1]).toHaveValue('第二条尚未保存');
  expect(screen.getAllByLabelText(c.preference)[1]).toHaveValue('tie');
  fireEvent.click(screen.getAllByRole('button', { name: c.saveReview })[1]);
  await waitFor(() => expect(apiClient.request).toHaveBeenLastCalledWith('/api/evaluations', expect.objectContaining({
    body: expect.objectContaining({ caseId: '2', revision: 1, preference: 'tie', note: '第二条尚未保存' }),
  })));
});
