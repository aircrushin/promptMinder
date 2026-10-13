'use client'; // 标记为客户端组件以使用 Hook
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext'; // 导入 Hook

export default function TermsOfService() {
  const { t } = useLanguage(); // 使用 Hook 获取翻译

  // 加载保护
  if (!t || !t.termsOfService) return null; 
  const ts = t.termsOfService; // 简化引用

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{ts.title}</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.acceptanceTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.acceptanceContent}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.serviceDescriptionTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.serviceDescriptionIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-foreground">
            {ts.serviceDescriptionItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.userResponsibilitiesTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.userResponsibilitiesIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-foreground">
            {ts.userResponsibilitiesItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.intellectualPropertyTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.intellectualPropertyIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-foreground">
            {ts.intellectualPropertyItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.serviceChangesTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.serviceChangesIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-foreground">
            {ts.serviceChangesItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.disclaimerTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.disclaimerIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-foreground">
            {ts.disclaimerItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.disputeResolutionTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.disputeResolutionIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-foreground">
            {ts.disputeResolutionItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.termsModificationTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.termsModificationContent}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.contactTitle}</h2>
          <p className="text-gray-700 dark:text-foreground">{ts.contactIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-foreground">
             {ts.contactItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <p className="text-gray-700 mt-8 dark:text-foreground">{ts.lastUpdated}</p>
        </section>
      </div>
    </div>
  );
} 