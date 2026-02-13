// @ts-nocheck
/**
 * GEO (Generative Engine Optimization) 工具库
 * 用于生成针对AI搜索引擎优化的结构化数据
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com';

/**
 * 生成组织结构化数据
 */
export function generateOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "Prompt Minder",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.svg`,
      width: 512,
      height: 512,
    },
    description: "专业的AI提示词管理平台，支持版本控制、团队协作、智能分类等功能",
    foundingDate: "2024",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: "ultrav0229@gmail.com",
      contactType: "customer service",
    },
  };
}

/**
 * 生成网站结构化数据
 */
export function generateWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "Prompt Minder",
    url: BASE_URL,
    description: "专业的AI提示词管理平台",
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/public?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
    inLanguage: ["zh-CN", "en"],
  };
}

/**
 * 生成软件应用结构化数据
 */
export function generateSoftwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/#software`,
    name: "Prompt Minder",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    description: "为AI从业者打造的提示词管理工具，支持版本控制、团队协作、智能分类等功能",
    featureList: [
      "智能分类管理 - 通过标签、项目等多种方式组织提示词",
      "版本控制 - 记录每次修改历史，随时回溯查看或还原",
      "团队协作 - 支持多人协作，细粒度的权限控制",
      "AI模型支持 - 支持任何兼容OpenAI接口的模型",
      "数据安全 - 企业级数据加密，可选择私有部署",
      "提示词优化 - 一键生成高质量提示词",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "2300",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

/**
 * 生成FAQ页面结构化数据
 * @param {Array} faqs - FAQ项目数组 [{question, answer}]
 * @param {string} language - 语言代码
 */
export function generateFAQPageSchema(faqs, language = 'zh') {
  return {
    "@type": "FAQPage",
    "@id": `${BASE_URL}/#faq`,
    mainEntity: faqs.map((faq, index) => ({
      "@type": "Question",
      "@id": `${BASE_URL}/#faq-${index}`,
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
    inLanguage: language === 'zh' ? 'zh-CN' : 'en',
  };
}

/**
 * 生成面包屑结构化数据
 * @param {Array} items - 面包屑项目数组 [{name, url}]
 */
export function generateBreadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${BASE_URL}/#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? `${BASE_URL}${item.url}` : undefined,
    })),
  };
}

/**
 * 生成提示词/创意作品结构化数据
 * @param {Object} prompt - 提示词对象
 */
export function generatePromptSchema(prompt) {
  const promptUrl = `${BASE_URL}/share/${prompt.id}`;
  
  return {
    "@type": "CreativeWork",
    "@id": promptUrl,
    name: prompt.title,
    description: prompt.description || `AI提示词：${prompt.title}`,
    text: prompt.content,
    dateCreated: prompt.created_at,
    dateModified: prompt.updated_at || prompt.created_at,
    author: {
      "@type": "Person",
      name: "Prompt Minder User",
    },
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    url: promptUrl,
    keywords: Array.isArray(prompt.tags) ? prompt.tags.join(", ") : prompt.tags,
    inLanguage: detectLanguage(prompt.content),
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    learningResourceType: "AI Prompt",
    educationalUse: ["instruction", "reference"],
  };
}

/**
 * 生成提示词集合/列表结构化数据
 * @param {Array} prompts - 提示词数组
 * @param {Object} options - 配置选项
 */
export function generatePromptListSchema(prompts, options = {}) {
  const {
    name = "AI提示词合集",
    description = "精选的AI提示词集合",
    url = "/public",
  } = options;

  return {
    "@type": "ItemList",
    "@id": `${BASE_URL}${url}#list`,
    name,
    description,
    numberOfItems: prompts.length,
    itemListElement: prompts.slice(0, 50).map((prompt, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: prompt.title || prompt.role,
      description: prompt.description || prompt.content?.substring(0, 160),
      url: prompt.id ? `${BASE_URL}/share/${prompt.id}` : undefined,
    })),
  };
}

/**
 * 生成HowTo结构化数据（用于教程类内容）
 * @param {Object} options - HowTo配置
 */
export function generateHowToSchema(options) {
  const {
    name,
    description,
    steps,
    totalTime = "PT10M",
  } = options;

  return {
    "@type": "HowTo",
    name,
    description,
    totalTime,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.url,
    })),
  };
}

/**
 * 生成WebPage结构化数据
 * @param {Object} options - 页面配置
 */
export function generateWebPageSchema(options) {
  const {
    name,
    description,
    url,
    type = "WebPage",
    datePublished,
    dateModified,
  } = options;

  return {
    "@type": type,
    "@id": `${BASE_URL}${url}`,
    name,
    description,
    url: `${BASE_URL}${url}`,
    isPartOf: {
      "@id": `${BASE_URL}/#website`,
    },
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    datePublished,
    dateModified: dateModified || datePublished,
    inLanguage: ["zh-CN", "en"],
  };
}

/**
 * 生成完整的结构化数据图谱
 * @param {Array} schemas - Schema数组
 */
export function generateSchemaGraph(schemas) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  };
}

/**
 * 检测文本语言（简单实现）
 * @param {string} text - 要检测的文本
 */
function detectLanguage(text) {
  if (!text) return 'zh-CN';
  // 检测中文字符比例
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const ratio = chineseChars.length / text.length;
  return ratio > 0.1 ? 'zh-CN' : 'en';
}

/**
 * 生成GEO优化的meta描述
 * 针对AI搜索引擎优化，确保关键信息在前面
 * @param {string} content - 原始内容
 * @param {Object} options - 配置选项
 */
export function generateGEODescription(content, options = {}) {
  const {
    maxLength = 160,
    prefix = "",
    suffix = "",
    keywords = [],
  } = options;

  let description = prefix ? `${prefix} ` : "";
  
  if (!content) {
    return description.trim();
  }
  
  // 清理内容
  const cleanContent = content
    .replace(/\s+/g, ' ')
    .replace(/[#*_`]/g, '')
    .trim();
  
  // 截取内容
  const availableLength = maxLength - description.length - (suffix ? suffix.length + 1 : 0);
  description += cleanContent.substring(0, availableLength);
  
  // 添加后缀
  if (suffix) {
    description += ` ${suffix}`;
  }
  
  return description;
}

/**
 * 生成针对GEO的关键词数组
 * @param {Object} prompt - 提示词对象
 */
export function generateGEOKeywords(prompt) {
  const baseKeywords = [
    "AI提示词",
    "Prompt",
    "ChatGPT",
    "Claude",
    "AI助手",
    "提示词模板",
    "prompt engineering",
  ];
  
  const tags = Array.isArray(prompt.tags) 
    ? prompt.tags 
    : (prompt.tags ? prompt.tags.split(',') : []);
  
  return [...new Set([...tags, ...baseKeywords])];
}

/**
 * 生成AI引擎友好的内容摘要
 * @param {string} content - 原始内容
 */
export function generateAISummary(content) {
  if (!content) return "";
  
  // 提取核心信息点（用于AI搜索引擎的快速理解）
  const sections = content.split(/\n{2,}/).filter(Boolean);
  const summary = sections.slice(0, 3).map(s => s.trim()).join(' ');
  
  return summary.length > 300 ? summary.substring(0, 300) + '...' : summary;
}

export default {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema,
  generateFAQPageSchema,
  generateBreadcrumbSchema,
  generatePromptSchema,
  generatePromptListSchema,
  generateHowToSchema,
  generateWebPageSchema,
  generateSchemaGraph,
  generateGEODescription,
  generateGEOKeywords,
  generateAISummary,
};
