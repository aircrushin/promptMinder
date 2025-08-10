import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prompt-minder.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Prompt Minder - 专业的AI提示词管理平台",
    template: "%s | Prompt Minder",
  },
  description:
    "为AI从业者打造的提示词管理工具，支持版本控制、团队协作、智能分类等功能",
  keywords: [
    "AI提示词",
    "Prompt工程",
    "GPT",
    "Claude",
    "AI助手",
    "提示词管理",
  ],
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
      "为AI从业者打造的提示词管理工具，支持版本控制、团队协作、智能分类等功能",
    siteName: "Prompt Minder",
    images: [
      {
        url: "/main-page.png",
        width: 1200,
        height: 630,
        alt: "Prompt Minder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Minder - 专业的AI提示词管理平台",
    description:
      "为AI从业者打造的提示词管理工具，支持版本控制、团队协作、智能分类等功能",
    images: ["/main-page.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Prompt Minder",
      url: siteUrl,
      logo: `${siteUrl}/logo2.png`,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      name: "Prompt Minder",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
