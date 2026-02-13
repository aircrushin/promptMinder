// @ts-nocheck
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showSizeChanger = false,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  total = 0,
  showQuickJumper = true,
  showTotal = true,
  className = "",
  t, // 国际化函数
}) {
  const [jumpPage, setJumpPage] = useState("");

  const handlePageJump = (e) => {
    if (e.key === "Enter") {
      const page = parseInt(jumpPage);
      if (page && page >= 1 && page <= totalPages) {
        onPageChange(page);
        setJumpPage("");
      }
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage > 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages);
    }
  };

  // 生成页码数组
  const getPageNumbers = () => {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= left && i <= right)) {
            range.push(i);
        }
    }

    let l = 0;
    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;
  
  const tp = t?.pagination || {};

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* 总数显示 */}
      {showTotal && (
        <div className="text-sm text-muted-foreground">
          {tp.total?.replace('{total}', total) || `共 ${total} 条数据`}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* 首页和上一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFirst}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 页码 */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* 下一页和末页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLast}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {/* 页面大小选择器 */}
        {showSizeChanger && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tp.itemsPerPage || "每页"}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
              className="h-8 px-2 text-sm border rounded border-input bg-background"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">{tp.items || "条"}</span>
          </div>
        )}

        {/* 快速跳转 */}
        {showQuickJumper && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tp.goTo || "跳至"}</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={handlePageJump}
              className="h-8 w-16 text-center text-sm"
              placeholder={currentPage.toString()}
            />
            <span className="text-sm text-muted-foreground">{tp.page || "页"}</span>
          </div>
        )}
      </div>
    </div>
  );
} 