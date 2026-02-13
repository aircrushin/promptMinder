'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * VirtualList component for efficiently rendering large lists
 * Only renders visible items to improve performance
 */
export function VirtualList({
  items = [],
  itemHeight = 100,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range based on scroll position
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      originalIndex: startIndex + index
    }));
  }, [items, visibleRange]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(e);
  }, [onScroll]);

  // Scroll to specific item
  const scrollToItem = useCallback((index) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    scrollToItem(0);
  }, [scrollToItem]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Total height container to maintain scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index, originalIndex }) => (
            <div
              key={originalIndex}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, originalIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * VirtualGrid component for efficiently rendering large grids
 * Supports variable item heights and dynamic content
 */
export function VirtualGrid({
  items = [],
  itemHeight = 100,
  itemsPerRow = 1,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  gap = 0,
  onScroll,
  ...props
}: {
  items?: any[];
  itemHeight?: number;
  itemsPerRow?: number;
  containerHeight?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  gap?: number;
  onScroll?: (scrollTop: number) => void;
  [key: string]: any;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate row height including gap
  const rowHeight = itemHeight + gap;

  // Calculate total rows
  const totalRows = Math.ceil(items.length / itemsPerRow);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );
    
    return { startRow, endRow };
  }, [scrollTop, rowHeight, containerHeight, totalRows, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startRow, endRow } = visibleRange;
    const visibleRows = [];
    
    for (let row = startRow; row <= endRow; row++) {
      const startIndex = row * itemsPerRow;
      const endIndex = Math.min(startIndex + itemsPerRow - 1, items.length - 1);
      
      if (startIndex < items.length) {
        const rowItems = [];
        for (let i = startIndex; i <= endIndex; i++) {
          rowItems.push({
            item: items[i],
            index: i,
            row,
            col: i - startIndex
          });
        }
        visibleRows.push({ row, items: rowItems });
      }
    }
    
    return visibleRows;
  }, [items, visibleRange, itemsPerRow]);

  // Calculate total height and offset
  const totalHeight = totalRows * rowHeight;
  const offsetY = visibleRange.startRow * rowHeight;

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(e);
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Total height container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ row, items: rowItems }) => (
            <div
              key={row}
              style={{
                height: itemHeight,
                marginBottom: gap,
                display: 'flex',
                gap: gap,
              }}
            >
              {rowItems.map(({ item, index }) => (
                <div
                  key={index}
                  style={{
                    flex: `1 1 ${100 / itemsPerRow}%`,
                    minWidth: 0,
                  }}
                >
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * VariableHeightVirtualList component for items with different heights
 * Uses estimated heights and measures actual heights for better performance
 */
export function VariableHeightVirtualList({
  items = [],
  estimatedItemHeight = 100,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState(new Map());
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map());

  // Calculate cumulative heights
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    let totalHeight = 0;
    
    for (let i = 0; i < items.length; i++) {
      const height = itemHeights.get(i) || estimatedItemHeight;
      totalHeight += height;
      heights.push(totalHeight);
    }
    
    return heights;
  }, [items.length, itemHeights, estimatedItemHeight]);

  // Find visible range using binary search
  const visibleRange = useMemo(() => {
    const findIndex = (targetOffset) => {
      let left = 0;
      let right = cumulativeHeights.length - 1;
      
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (cumulativeHeights[mid] < targetOffset) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      
      return Math.max(0, left - 1);
    };

    const startIndex = Math.max(0, findIndex(scrollTop) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      findIndex(scrollTop + containerHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, cumulativeHeights, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      originalIndex: startIndex + index
    }));
  }, [items, visibleRange]);

  // Measure item height with debouncing to prevent infinite loops
  const measureItem = useCallback((index, element) => {
    if (element) {
      const height = element.getBoundingClientRect().height;
      setItemHeights(prev => {
        const currentHeight = prev.get(index);
        // Only update if height has actually changed
        if (currentHeight !== height) {
          const newHeights = new Map(prev);
          newHeights.set(index, height);
          return newHeights;
        }
        return prev;
      });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(e);
  }, [onScroll]);

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0;
  const offsetY = cumulativeHeights[visibleRange.startIndex] || 0;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Total height container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, originalIndex }) => (
            <div
              key={originalIndex}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(originalIndex, el);
                  measureItem(originalIndex, el);
                }
              }}
            >
              {renderItem(item, originalIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualList;