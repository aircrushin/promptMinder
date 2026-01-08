/**
 * Robots.txt 配置
 * 针对传统搜索引擎和AI搜索引擎（GEO）优化
 */
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com';
  
  return {
    rules: [
      // 通用规则 - 允许所有爬虫
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/sign-in/',
          '/sign-up/',
          '/_next/',
          '/private/',
        ],
      },
      // Google 搜索引擎
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      // Bing 搜索引擎
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      // OpenAI GPTBot - 用于ChatGPT搜索和训练
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/public',
          '/share/',
          '/prompts/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/sign-in/',
          '/sign-up/',
        ],
      },
      // OpenAI ChatGPT-User - 用于ChatGPT实时浏览
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      // Anthropic Claude AI
      {
        userAgent: 'anthropic-ai',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      // Google AI (Bard/Gemini)
      {
        userAgent: 'Google-Extended',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      // Perplexity AI
      {
        userAgent: 'PerplexityBot',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      // Cohere AI
      {
        userAgent: 'cohere-ai',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      // Meta AI
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'meta-externalagent',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      // Common Crawl (用于许多AI训练)
      {
        userAgent: 'CCBot',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      // You.com AI
      {
        userAgent: 'YouBot',
        allow: [
          '/',
          '/public',
          '/share/',
        ],
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
    ],
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
