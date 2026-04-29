import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UrlReaderPage } from '@/components/reader/url-reader-page';

const mockToast = jest.fn();

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      readerPage: {
        badge: 'URL to Text',
        title: '网页转文字',
        description: '把网页转换成适合复制和保存的纯文本。',
        inputLabel: '网页地址',
        inputPlaceholder: '输入一个 URL',
        submit: '提取文本',
        submitting: '提取中...',
        resultTitle: '提取结果',
        resultDescription: '搜索、复制或导出本次提取结果。',
        searchPlaceholder: '搜索结果内容',
        outputPlaceholder: '提取结果会显示在这里',
        copy: '复制文本',
        copied: '已复制',
        download: '下载 Markdown',
        sourceLabel: '来源 URL',
        truncated: '内容过长，已截断',
        helperTitle: '使用说明',
        helperItems: [
          '输入任意公开网页地址',
          '服务端会通过与 llm-readify 相同的方式转成文本',
          '你可以继续搜索、复制或导出结果',
        ],
        searchResults: '{{count}} 条匹配',
        searchNoResults: '没有匹配内容',
      },
      common: {
        copy: '复制',
        copied: '已复制',
      },
    },
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('UrlReaderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('应该提交 URL 并展示提取结果', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        sourceUrl: 'https://example.com/post',
        jinaUrl: 'https://r.jina.ai/https://example.com/post',
        content: 'first line\nsecond line',
        truncated: false,
      }),
    });

    render(<UrlReaderPage />);

    fireEvent.change(screen.getByLabelText('网页地址'), {
      target: { value: 'https://example.com/post' },
    });
    fireEvent.click(screen.getByRole('button', { name: '提取文本' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('first line\nsecond line')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/reader', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('应该复制当前结果文本', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        sourceUrl: 'https://example.com/post',
        jinaUrl: 'https://r.jina.ai/https://example.com/post',
        content: 'copy me',
        truncated: false,
      }),
    });

    render(<UrlReaderPage />);

    fireEvent.change(screen.getByLabelText('网页地址'), {
      target: { value: 'https://example.com/post' },
    });
    fireEvent.click(screen.getByRole('button', { name: '提取文本' }));

    await screen.findByDisplayValue('copy me');

    fireEvent.click(screen.getByRole('button', { name: '复制文本' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy me');
    });
  });
});
