import { db } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index'
import { toSnakeCase } from '@/lib/case-utils'
import SharePromptDetailClient from './SharePromptDetailClient';
import { notFound } from 'next/navigation';
import {
  generatePromptSchema,
  generateBreadcrumbSchema,
  generateSchemaGraph,
  generateGEODescription,
  generateGEOKeywords,
} from '@/lib/geo-utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com';

async function getPrompt(id) {
  const rows = await db.select().from(prompts)
    .where(and(eq(prompts.id, id), eq(prompts.isPublic, true)))
    .limit(1)

  if (!rows[0]) {
    return null;
  }

  const prompt = toSnakeCase(rows[0])

  // Fetch versions
  const versionRows = await db
    .select({ id: prompts.id, version: prompts.version, createdAt: prompts.createdAt })
    .from(prompts)
    .where(and(eq(prompts.title, rows[0].title), eq(prompts.isPublic, true)))
    .orderBy(desc(prompts.createdAt))

  prompt.versions = versionRows.map(toSnakeCase)

  // Normalize tags to array
  if (prompt.tags && typeof prompt.tags === 'string') {
    prompt.tags = prompt.tags.split(',');
  } else if (!Array.isArray(prompt.tags)) {
    prompt.tags = [];
  }

  return prompt;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const prompt = await getPrompt(id);

  if (!prompt) {
    return {
      title: 'Prompt Not Found | Prompt Minder',
      description: '抱歉，该提示词不存在或已被删除。',
      robots: { index: false, follow: true },
    };
  }

  const title = `${prompt.title} - AI提示词 | Prompt Minder`;
  const url = `${BASE_URL}/share/${id}`;

  // 使用GEO优化的描述生成
  const description = generateGEODescription(
    prompt.description || prompt.content,
    {
      prefix: `【AI提示词】${prompt.title}。`,
      maxLength: 160,
    }
  );

  // 生成GEO优化的关键词
  const keywords = generateGEOKeywords(prompt);

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'Prompt Minder User' }],
    creator: 'Prompt Minder',
    publisher: 'Prompt Minder',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: prompt.created_at,
      modifiedTime: prompt.updated_at || prompt.created_at,
      authors: ['Prompt Minder User'],
      tags: prompt.tags,
      section: 'AI Prompts',
      siteName: 'Prompt Minder',
      locale: 'zh_CN',
      images: [
        {
          url: `${BASE_URL}/main-page.png`,
          width: 1200,
          height: 630,
          alt: `${prompt.title} - AI提示词`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/main-page.png`],
    },
    other: {
      // GEO优化：为AI搜索引擎提供额外上下文
      'article:section': 'AI Prompts',
      'article:tag': prompt.tags?.join(',') || '',
      'ai-content-type': 'prompt-template',
    },
  };
}

export default async function SharePromptPage({ params }) {
  const { id } = await params;
  const prompt = await getPrompt(id);

  if (!prompt) {
    notFound();
  }

  const promptUrl = `${BASE_URL}/share/${id}`;

  // 生成增强的结构化数据 (GEO优化)
  const structuredData = generateSchemaGraph([
    // 提示词作品结构化数据
    generatePromptSchema(prompt),
    // 面包屑导航
    generateBreadcrumbSchema([
      { name: '首页', url: '/' },
      { name: '提示词合集', url: '/public' },
      { name: prompt.title, url: `/share/${id}` },
    ]),
    // WebPage结构化数据
    {
      "@type": "WebPage",
      "@id": `${promptUrl}#webpage`,
      name: prompt.title,
      description: prompt.description || `AI提示词：${prompt.title}`,
      url: promptUrl,
      isPartOf: {
        "@id": `${BASE_URL}/#website`,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${BASE_URL}/main-page.png`,
      },
      datePublished: prompt.created_at,
      dateModified: prompt.updated_at || prompt.created_at,
      inLanguage: "zh-CN",
      potentialAction: [
        {
          "@type": "ReadAction",
          target: [promptUrl],
        },
        {
          "@type": "ShareAction",
          target: [promptUrl],
        },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".prompt-content", ".prompt-description"],
      },
    },
    // HowTo结构化数据 - 说明如何使用此提示词
    {
      "@type": "HowTo",
      "@id": `${promptUrl}#howto`,
      name: `如何使用"${prompt.title}"提示词`,
      description: `学习如何在ChatGPT、Claude等AI工具中使用此提示词`,
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "复制提示词",
          text: "点击复制按钮将提示词内容复制到剪贴板",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "打开AI工具",
          text: "打开ChatGPT、Claude或其他支持的AI助手",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "粘贴并发送",
          text: "将提示词粘贴到对话框中，根据需要修改变量后发送",
        },
      ],
      tool: [
        {
          "@type": "HowToTool",
          name: "ChatGPT",
        },
        {
          "@type": "HowToTool",
          name: "Claude",
        },
        {
          "@type": "HowToTool",
          name: "其他OpenAI兼容的AI工具",
        },
      ],
    },
  ]);

  return (
    <>
      {/* GEO优化的结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SharePromptDetailClient initialPrompt={prompt} id={id} />
    </>
  );
}
