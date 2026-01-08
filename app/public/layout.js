const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com';

export const metadata = {
  title: "AI提示词合集 - 公开提示词库 | Prompt Minder",
  description: "浏览社区贡献的优质AI提示词合集。支持ChatGPT、Claude、GPT-4等模型。按角色与关键词搜索，一键复制使用。涵盖写作、编程、营销、教育等多个领域的专业提示词模板。",
  keywords: [
    "AI提示词",
    "ChatGPT提示词",
    "Claude提示词",
    "prompt合集",
    "提示词模板",
    "AI提示词库",
    "prompt engineering",
    "AI助手",
    "GPT-4提示词",
  ],
  alternates: { 
    canonical: `${BASE_URL}/public`,
    languages: {
      'zh-CN': `${BASE_URL}/public`,
      'en-US': `${BASE_URL}/public?lang=en`,
    },
  },
  robots: { 
    index: true, 
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "AI提示词合集 - 公开提示词库 | Prompt Minder",
    description: "浏览社区贡献的优质AI提示词合集。支持ChatGPT、Claude、GPT-4等模型。",
    url: `${BASE_URL}/public`,
    type: "website",
    siteName: "Prompt Minder",
    locale: "zh_CN",
    images: [
      {
        url: `${BASE_URL}/main-page.png`,
        width: 1200,
        height: 630,
        alt: "Prompt Minder AI提示词合集",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI提示词合集 - 公开提示词库",
    description: "浏览社区贡献的优质AI提示词合集。支持ChatGPT、Claude等模型。",
    images: [`${BASE_URL}/main-page.png`],
  },
  other: {
    // GEO优化：为AI搜索引擎提供额外上下文
    "ai-content-type": "prompt-collection",
    "content-category": "AI Tools",
  },
};

export default function PublicLayout({ children }) {
  return children;
}





