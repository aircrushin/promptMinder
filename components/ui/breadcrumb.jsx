"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { generateBreadcrumbSchema } from "@/lib/geo-utils";
import { cn } from "@/lib/utils";

/**
 * 面包屑导航组件
 * 支持GEO优化的结构化数据
 * 
 * @param {Object} props
 * @param {Array} props.items - 面包屑项目数组 [{name, url, current?}]
 * @param {boolean} props.showHome - 是否显示首页图标
 * @param {string} props.className - 自定义类名
 * @param {boolean} props.includeSchema - 是否包含结构化数据
 */
export function Breadcrumb({ 
  items = [], 
  showHome = true, 
  className,
  includeSchema = true,
}) {
  // 确保首页始终在最前面
  const breadcrumbItems = showHome 
    ? [{ name: "首页", url: "/" }, ...items]
    : items;

  // 生成结构化数据
  const schemaData = includeSchema ? {
    "@context": "https://schema.org",
    ...generateBreadcrumbSchema(breadcrumbItems),
  } : null;

  return (
    <nav 
      aria-label="面包屑导航" 
      className={cn("flex items-center text-sm", className)}
    >
      {/* GEO优化：面包屑结构化数据 */}
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      
      <ol 
        className="flex items-center space-x-1 md:space-x-2"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isFirst = index === 0;
          
          return (
            <li 
              key={item.url || index}
              className="flex items-center"
              itemScope
              itemProp="itemListElement"
              itemType="https://schema.org/ListItem"
            >
              {/* 分隔符 */}
              {index > 0 && (
                <ChevronRight 
                  className="h-4 w-4 text-muted-foreground/50 mx-1" 
                  aria-hidden="true"
                />
              )}
              
              {/* 链接或当前页面 */}
              {isLast || !item.url ? (
                <span 
                  className={cn(
                    "font-medium",
                    isLast 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                  )}
                  itemProp="name"
                  aria-current={isLast ? "page" : undefined}
                >
                  {isFirst && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{item.name}</span>
                    </span>
                  ) : (
                    item.name
                  )}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    "text-muted-foreground hover:text-primary",
                    "flex items-center gap-1"
                  )}
                  itemProp="item"
                >
                  {isFirst && showHome ? (
                    <>
                      <Home className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only" itemProp="name">{item.name}</span>
                    </>
                  ) : (
                    <span itemProp="name">{item.name}</span>
                  )}
                </Link>
              )}
              
              {/* Schema.org position */}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * 简化的面包屑组件 - 仅用于SEO/GEO
 * 不渲染可见UI，只输出结构化数据
 */
export function BreadcrumbSchema({ items = [] }) {
  const schemaData = {
    "@context": "https://schema.org",
    ...generateBreadcrumbSchema(items),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

export default Breadcrumb;
