import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 flex flex-col items-center sm:flex-row sm:justify-between sm:items-start">
          <div className="text-sm text-gray-500 mb-6 sm:mb-0">
            © {new Date().getFullYear()} PromptMinder. All rights reserved
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div className="flex flex-col items-center sm:items-start gap-y-2">
              <h3 className="text-sm font-semibold text-gray-800">支持</h3>
              <Link href="https://prompt-minder.canny.io/feature-requests" target="_blank" className="text-sm text-center sm:text-left text-gray-500 hover:text-gray-900">
                Feedback
              </Link>
              <Link href="https://prompt-minder.canny.io/changelog" target="_blank" className="text-sm text-center sm:text-left text-gray-500 hover:text-gray-900">
                Changelog
              </Link>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-y-2">
              <h3 className="text-sm font-semibold text-gray-800">友情链接</h3>
              <Link href="https://code.promptate.xyz/" target="_blank" className="text-sm text-center sm:text-left text-gray-500 hover:text-gray-900">
                PromptCoder - 代码提示词
              </Link>
              <Link href="https://www.promptingguide.ai/zh" target="_blank" className="text-sm text-center sm:text-left text-gray-500 hover:text-gray-900">
                PromptGuide - 提示词指南
              </Link>
              <Link href="https://www.aishort.top/" target="_blank" className="text-sm text-center sm:text-left text-gray-500 hover:text-gray-900">
                AIshort - 优秀 Prompt 集合
              </Link>
              <Link href="https://www.promptate.xyz/" target="_blank" className="text-sm text-center sm:text-left text-gray-500 hover:text-gray-900">
                Promptate - Prompt生成器
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 