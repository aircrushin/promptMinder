/**
 * Sitemap 配置
 * 针对搜索引擎和AI搜索引擎（GEO）优化
 * 
 * 优先级说明：
 * - 1.0: 最重要的页面（首页）
 * - 0.9: 核心功能页面（公开提示词库）
 * - 0.8: 重要功能页面（工具页面）
 * - 0.7: 动态内容页面（分享的提示词）
 * - 0.6: 次要页面（法律页面）
 * - 0.5: 认证页面
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com';

export default async function sitemap() {
  const now = new Date().toISOString();

  // 静态路由配置 - 带优先级和更新频率
  const staticRoutes = [
    // 核心页面 - 高优先级
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/public`,
      lastModified: now,
      changeFrequency: 'hourly', // 内容经常更新
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/prompts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/playground`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // 功能页面
    {
      url: `${BASE_URL}/tags`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/teams`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // 法律页面
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // 认证页面 - 较低优先级
    {
      url: `${BASE_URL}/sign-in`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/sign-up`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 动态路由 - 公开提示词
  const dynamicRoutes = [];
  
  try {
    // 获取公开提示词列表
    const res = await fetch(`${BASE_URL}/api/prompts/public?pageSize=500`, { 
      next: { revalidate: 3600 }, // 1小时缓存
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      const prompts = data?.prompts || [];
      
      for (const prompt of prompts) {
        if (prompt?.id) {
          // 根据提示词的热度/新鲜度计算优先级
          const updatedDate = new Date(prompt.updated_at || prompt.created_at);
          const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // 新内容优先级更高
          let priority = 0.7;
          if (daysSinceUpdate < 7) {
            priority = 0.8;
          } else if (daysSinceUpdate < 30) {
            priority = 0.7;
          } else {
            priority = 0.6;
          }

          dynamicRoutes.push({
            url: `${BASE_URL}/share/${prompt.id}`,
            lastModified: prompt.updated_at || prompt.created_at || now,
            changeFrequency: 'weekly',
            priority,
          });
        }
      }
    }
  } catch (error) {
    // 静默处理错误，避免破坏sitemap生成
    console.error('Error fetching prompts for sitemap:', error.message);
  }

  // 按优先级排序（高优先级在前）
  const allRoutes = [...staticRoutes, ...dynamicRoutes].sort((a, b) => {
    return (b.priority || 0.5) - (a.priority || 0.5);
  });

  return allRoutes;
}

/**
 * Sitemap 配置
 * 支持多语言sitemap索引
 */
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1小时重新验证