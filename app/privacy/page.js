'use client'; // 标记为客户端组件以使用 Hook
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext'; // 导入 Hook

export default function PrivacyPolicy() {
  const { t } = useLanguage(); // 使用 Hook 获取翻译

  // 加载保护
  if (!t || !t.privacyPolicy) return null; 
  const tp = t.privacyPolicy; // 简化引用

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{tp.title}</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.introductionTitle}</h2>
          <p className="text-gray-700">{tp.introductionContent}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.collectionTitle}</h2>
          <p className="text-gray-700">{tp.collectionIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {tp.collectionItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.usageTitle}</h2>
          <p className="text-gray-700">{tp.usageIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {tp.usageItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.sharingTitle}</h2>
          <p className="text-gray-700">{tp.sharingIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {tp.sharingItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.securityTitle}</h2>
          <p className="text-gray-700">{tp.securityIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {tp.securityItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.cookiesTitle}</h2>
          <p className="text-gray-700">{tp.cookiesIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {tp.cookiesItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.rightsTitle}</h2>
          <p className="text-gray-700">{tp.rightsIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {tp.rightsItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.updatesTitle}</h2>
          <p className="text-gray-700">{tp.updatesContent}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">{tp.contactTitle}</h2>
          <p className="text-gray-700">{tp.contactIntro}</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            {tp.contactItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>

        <section>
          <p className="text-gray-700 mt-8">{tp.lastUpdated}</p>
        </section>
      </div>
    </div>
  );
} 