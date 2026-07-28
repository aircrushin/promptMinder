import { desc } from 'drizzle-orm';
import { publicPrompts } from '@/drizzle/schema/index.js';
import { db } from '@/lib/db.js';

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.prompt-minder.com';

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
      url: `${BASE_URL}/skills`,
      lastModified: now,
      changeFrequency: 'daily',
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
    const prompts = await db
      .select({
        id: publicPrompts.id,
        createdAt: publicPrompts.createdAt,
        updatedAt: publicPrompts.updatedAt,
      })
      .from(publicPrompts)
      .orderBy(desc(publicPrompts.updatedAt))
      .limit(500);

    for (const prompt of prompts) {
      const updatedDate = prompt.updatedAt || prompt.createdAt;
      const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));

      dynamicRoutes.push({
        url: `${BASE_URL}/share/${prompt.id}`,
        lastModified: updatedDate,
        changeFrequency: 'weekly',
        priority: daysSinceUpdate < 7 ? 0.8 : daysSinceUpdate < 30 ? 0.7 : 0.6,
      });
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
export const revalidate = 3600; // 1小时重新验证
