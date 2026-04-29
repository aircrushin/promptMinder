import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { VersionHistoryDialog } from '@/components/prompt/VersionHistoryDialog';

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

describe('VersionHistoryDialog', () => {
  const versions = [
    {
      id: 'prompt-3',
      title: '内容运营助手',
      version: '1.3.0',
      created_at: '2025-08-31T08:20:58.000Z',
    },
    {
      id: 'prompt-2',
      title: '内容运营助手',
      version: '1.2.0',
      created_at: '2025-08-31T07:57:09.000Z',
    },
  ];

  it('应该展示版本说明、最新版本标识和创建新版本操作', () => {
    const handleCreateNewVersion = jest.fn();

    render(
      <VersionHistoryDialog
        open={true}
        onOpenChange={jest.fn()}
        versions={versions}
        title="版本历史"
        createNewVersionLabel="创建新版本"
        onCreateNewVersion={handleCreateNewVersion}
      />
    );

    expect(screen.getByRole('heading', { name: '版本历史' })).toBeInTheDocument();
    expect(screen.getByText('内容运营助手')).toBeInTheDocument();
    expect(screen.getByText('共 2 个版本，选择一个版本查看详情或基于最新版本继续编辑。')).toBeInTheDocument();
    expect(screen.getByText('最新版本')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /创建新版本/ }));
    expect(handleCreateNewVersion).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('link', { name: /v1\.3\.0/ })).toHaveAttribute('href', '/prompts/prompt-3');
    expect(screen.getAllByTestId('chevronright-icon')).toHaveLength(2);
    expect(screen.queryByTestId('chevrondown-icon')).not.toBeInTheDocument();
  });
});
