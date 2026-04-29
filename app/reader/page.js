import { UrlReaderPage } from '@/components/reader/url-reader-page';

export const metadata = {
  title: 'URL To Text',
  description: '使用与 llm-readify 相同的方法把网页 URL 转为适合复制的纯文本。',
};

export default function ReaderPage() {
  return <UrlReaderPage />;
}
