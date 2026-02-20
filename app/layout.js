import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema,
  generateSchemaGraph,
} from "@/lib/geo-utils";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prompt-minder.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Prompt Minder - 专业的AI提示词管理平台 | AI Prompt Management",
    template: "%s | Prompt Minder",
  },
  description:
    "Prompt Minder是为AI从业者打造的专业提示词管理工具。支持版本控制、团队协作、智能分类、多模型测试等功能。免费开始使用，管理您的ChatGPT、Claude、GPT-4提示词库。",
  keywords: [
    "AI提示词",
    "Prompt工程",
    "GPT",
    "Claude",
    "AI助手",
    "提示词管理",
    "ChatGPT提示词",
    "prompt engineering",
    "AI prompt manager",
    "提示词模板",
    "prompt template",
    "AI工具",
    "提示词优化",
    "团队协作",
    "版本控制",
  ],
  authors: [{ name: "Prompt Minder Team" }],
  creator: "Prompt Minder",
  publisher: "Prompt Minder",
  category: "Technology",
  classification: "AI Tools / Productivity",
  // Do not set a global canonical to avoid incorrect canonical on nested routes
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Prompt Minder - 专业的AI提示词管理平台",
    description:
      "为AI从业者打造的提示词管理工具，支持版本控制、团队协作、智能分类等功能。免费开始使用。",
    siteName: "Prompt Minder",
    locale: "zh_CN",
    alternateLocale: "en_US",
    images: [
      {
        url: "/main-page.png",
        width: 1200,
        height: 630,
        alt: "Prompt Minder - AI提示词管理平台界面预览",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Minder - 专业的AI提示词管理平台",
    description:
      "为AI从业者打造的提示词管理工具，支持版本控制、团队协作、智能分类等功能",
    images: ["/main-page.png"],
    creator: "@promptminder",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  alternates: {
    languages: {
      "zh-CN": siteUrl,
      "en-US": `${siteUrl}?lang=en`,
    },
  },
  other: {
    // GEO优化：为AI搜索引擎提供额外上下文
    "ai-content-declaration": "human-created",
    "content-type": "software-tool",
  },
};

// 生成增强的结构化数据图谱
const structuredData = generateSchemaGraph([
  generateOrganizationSchema(),
  generateWebSiteSchema(),
  generateSoftwareApplicationSchema(),
  // 添加主页WebPage结构化数据
  {
    "@type": "WebPage",
    "@id": `${siteUrl}/#webpage`,
    name: "Prompt Minder - 专业的AI提示词管理平台",
    description: "为AI从业者打造的提示词管理工具，支持版本控制、团队协作、智能分类等功能",
    url: siteUrl,
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    about: {
      "@id": `${siteUrl}/#software`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${siteUrl}/main-page.png`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "首页",
          item: siteUrl,
        },
      ],
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".hero-description", ".feature-title"],
    },
    inLanguage: "zh-CN",
  },
]);

export const viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* 结构化数据 - 针对搜索引擎和AI引擎优化 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* 预连接优化 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS预取 - 针对常用AI服务 */}
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        {/* PWA */}
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
