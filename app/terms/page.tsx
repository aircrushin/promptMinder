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
          <p className="text-gray-700">{ts.acceptanceContent}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.serviceDescriptionTitle}</h2>
          <p className="text-gray-700">{ts.serviceDescriptionIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {ts.serviceDescriptionItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.userResponsibilitiesTitle}</h2>
          <p className="text-gray-700">{ts.userResponsibilitiesIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {ts.userResponsibilitiesItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.intellectualPropertyTitle}</h2>
          <p className="text-gray-700">{ts.intellectualPropertyIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {ts.intellectualPropertyItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.serviceChangesTitle}</h2>
          <p className="text-gray-700">{ts.serviceChangesIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {ts.serviceChangesItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.disclaimerTitle}</h2>
          <p className="text-gray-700">{ts.disclaimerIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {ts.disclaimerItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.disputeResolutionTitle}</h2>
          <p className="text-gray-700">{ts.disputeResolutionIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {ts.disputeResolutionItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.termsModificationTitle}</h2>
          <p className="text-gray-700">{ts.termsModificationContent}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{ts.contactTitle}</h2>
          <p className="text-gray-700">{ts.contactIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
             {ts.contactItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <p className="text-gray-700 mt-8">{ts.lastUpdated}</p>
        </section>
      </div>
    </div>
  );
} 