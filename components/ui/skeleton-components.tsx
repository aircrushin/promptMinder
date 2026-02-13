import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { UI_CONFIG } from "@/lib/constants";

// 通用的 Prompt 卡片骨架屏
export function PromptCardSkeleton() {
  return (
    <Card className="group relative p-5 hover:shadow-md transition-all bg-card border border-border/40">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[240px]" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </Card>
  );
}

// 新建 Prompt 卡片骨架屏
export function NewPromptCardSkeleton() {
  return (
    <Card className="group relative border p-5 border-dashed h-[180px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
    </Card>
  );
}

// Prompt 列表骨架屏
export function PromptListSkeleton({ count = UI_CONFIG.SKELETON_COUNT, showNewCard = true }) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {showNewCard && <NewPromptCardSkeleton />}
      {Array.from({ length: count }, (_, index) => (
        <PromptCardSkeleton key={index} />
      ))}
    </div>
  );
}

// 表格行骨架屏
export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }, (_, index) => (
        <td key={index} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// 表格骨架屏
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="border rounded-lg">
      <table className="w-full">
        <thead className="border-b bg-muted/50">
          <tr>
            {Array.from({ length: columns }, (_, index) => (
              <th key={index} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 页面标题骨架屏
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

// 搜索栏骨架屏
export function SearchBarSkeleton() {
  return (
    <div className="flex gap-4 items-center">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
  );
}

// 侧边栏骨架屏
export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

// 统计卡片骨架屏
export function StatsCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </Card>
  );
}

// 通用页面加载骨架屏
export function PageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <PromptListSkeleton />
    </div>
  );
} 