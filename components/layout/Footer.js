import Link from 'next/link';

export default function Footer({ t }) {
  const translations = t || {
    description: 'Make AI prompt management simpler and more efficient...',
    product: 'Product',
    roadmap: 'Roadmap',
    privacyPolicy: 'Privacy Policy',
    termsOfUse: 'Terms of Use',
    support: 'Support',
    feedback: 'Feedback',
    changelog: 'Changelog',
    friendlyLinks: 'Friendly Links',
    promptCoder: 'PromptCoder - Code Prompts',
    promptGuide: 'PromptGuide - Prompt Guide',
    aiShort: 'AIshort - Excellent Prompt Collection',
    promptate: 'Promptate - Prompt Generator',
    copyright: '© {year} PromptMinder. All rights reserved'
  };
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* 品牌区域 */}
          <div className="space-y-8 xl:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 [-webkit-background-clip:text] [background-clip:text] text-transparent">
                PromptMinder
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-6">
              {translations.description}
            </p>
            <div className="flex space-x-6">
              <Link
                href="https://github.com/aircrushin/promptMinder"
                target="_blank"
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
               >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link
                href="mailto:ultrav0229@gmail.com"
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
               >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* 导航链接区域 */}
          <div className="mt-12 grid grid-cols-2 gap-20 xl:mt-0 xl:col-span-2 justify-self-end">
            <div className="md:grid md:grid-cols-2 md:gap-12 ">
              <div className="text-left">
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                  {translations.product}
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      href="https://flo.host/zLaaewm/"
                      target="_blank"
                      className="text-sm text-gray-500 hover:text-gray-900"
                     >
                      {translations.roadmap}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="text-sm text-gray-500 hover:text-gray-900"
                     >
                      {translations.privacyPolicy}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-sm text-gray-500 hover:text-gray-900"
                     >
                      {translations.termsOfUse}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0 text-left">
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                  {translations.support}
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      href="https://prompt-minder.canny.io/feature-requests"
                      target="_blank"
                      className="text-sm text-gray-500 hover:text-gray-900"
                     >
                      {translations.feedback}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://prompt-minder.canny.io/changelog"
                      target="_blank"
                      className="text-sm text-gray-500 hover:text-gray-900"
                     >
                      {translations.changelog}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                {translations.friendlyLinks}
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link
                    href="https://code.lucids.top/"
                    target="_blank"
                    className="text-sm text-gray-500 hover:text-gray-900"
                   >
                    {translations.promptCoder}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.promptingguide.ai/zh"
                    target="_blank"
                    className="text-sm text-gray-500 hover:text-gray-900"
                   >
                    {translations.promptGuide}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.aishort.top/"
                    target="_blank"
                    className="text-sm text-gray-500 hover:text-gray-900"
                   >
                    {translations.aiShort}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://prompt.lucids.top/"
                    target="_blank"
                    className="text-sm text-gray-500 hover:text-gray-900"
                   >
                    {translations.promptate}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-4 pt-8 border-gray-200">
          <p className="text-sm text-gray-400 text-center">
            {translations.copyright.replace('{year}', currentYear.toString())}
          </p>
        </div>
      </div>
    </footer>
  );
} 