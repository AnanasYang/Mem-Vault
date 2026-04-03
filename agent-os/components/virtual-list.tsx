/**
 * Virtual List Component
 * 虚拟滚动列表 - 优化大数据量渲染性能
 * 
 * 特性:
 * - 只渲染可视区域内的项目
 * - 支持固定高度和动态高度
 * - 支持平滑滚动
 * - 支持滚动到指定位置
 * - 支持无限滚动加载
 */

'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  ReactNode,
} from 'react';

// ==================== 类型定义 ====================

export interface VirtualListItem {
  id: string;
  [key: string]: any;
}

export interface VirtualListProps<T extends VirtualListItem> {
  /** 数据列表 */
  items: T[];
  /** 渲染单个项目的函数 */
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  /** 项目高度（固定高度时必需） */
  itemHeight: number | ((item: T, index: number) => number);
  /** 容器高度 */
  height?: number | string;
  /** 缓冲区大小（上下各多渲染的项目数） */
  overscan?: number;
  /** 是否使用动态高度 */
  dynamicHeight?: boolean;
  /** 滚动到指定索引 */
  scrollToIndex?: number;
  /** 滚动回调 */
  onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down') => void;
  /** 滚动到底部回调（用于无限加载） */
  onScrollToBottom?: () => void;
  /** 距离底部多少像素触发 onScrollToBottom */
  scrollToBottomThreshold?: number;
  /** 是否还有更多数据 */
  hasMore?: boolean;
  /** 加载更多时的提示 */
  loadingMore?: boolean;
  /** 空状态 */
  emptyComponent?: ReactNode;
  /** 头部组件 */
  headerComponent?: ReactNode;
  /** 底部组件 */
  footerComponent?: ReactNode;
  /** 自定义样式 */
  className?: string;
  /** 列表项样式 */
  itemClassName?: string;
  /** 唯一标识字段 */
  keyExtractor?: (item: T, index: number) => string;
}

export interface VirtualListRef {
  /** 滚动到指定索引 */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  /** 滚动到顶部 */
  scrollToTop: (behavior?: ScrollBehavior) => void;
  /** 滚动到底部 */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** 获取当前滚动位置 */
  getScrollTop: () => number;
  /** 重新计算高度 */
  remeasure: () => void;
}

// ==================== 工具函数 ====================

function getItemHeight<T>(
  item: T,
  index: number,
  itemHeight: number | ((item: T, index: number) => number)
): number {
  if (typeof itemHeight === 'function') {
    return itemHeight(item, index);
  }
  return itemHeight;
}

// ==================== 主组件 ====================

function VirtualListInner<T extends VirtualListItem>(
  {
    items,
    renderItem,
    itemHeight,
    height = 600,
    overscan = 5,
    dynamicHeight = false,
    scrollToIndex,
    onScroll,
    onScrollToBottom,
    scrollToBottomThreshold = 100,
    hasMore = false,
    loadingMore = false,
    emptyComponent,
    headerComponent,
    footerComponent,
    className = '',
    itemClassName = '',
    keyExtractor,
  }: VirtualListProps<T>,
  ref: React.Ref<VirtualListRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollDirectionRef = useRef<'up' | 'down'>('down');
  const lastScrollTopRef = useRef(0);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (dynamicHeight) {
      let total = 0;
      items.forEach((item, index) => {
        const id = keyExtractor ? keyExtractor(item, index) : item.id;
        const measured = measuredHeights.get(id);
        total += measured || getItemHeight(item, index, itemHeight);
      });
      return total;
    }
    return items.length * (itemHeight as number);
  }, [items, itemHeight, dynamicHeight, measuredHeights, keyExtractor]);

  // 获取项目高度
  const getHeight = useCallback(
    (item: T, index: number): number => {
      if (dynamicHeight) {
        const id = keyExtractor ? keyExtractor(item, index) : item.id;
        return measuredHeights.get(id) || getItemHeight(item, index, itemHeight);
      }
      return itemHeight as number;
    },
    [dynamicHeight, measuredHeights, itemHeight, keyExtractor]
  );

  // 计算可见项目范围
  const { visibleRange, offsetY } = useMemo(() => {
    if (items.length === 0) {
      return { visibleRange: { start: 0, end: 0 }, offsetY: 0 };
    }

    let offset = 0;
    let startIndex = 0;
    let endIndex = 0;

    // 找到起始索引
    for (let i = 0; i < items.length; i++) {
      const h = getHeight(items[i], i);
      if (offset + h > scrollTop) {
        startIndex = i;
        break;
      }
      offset += h;
    }

    // 找到结束索引
    offset = 0;
    for (let i = 0; i < items.length; i++) {
      const h = getHeight(items[i], i);
      if (offset >= scrollTop + containerHeight) {
        endIndex = i;
        break;
      }
      offset += h;
      endIndex = i + 1;
    }

    // 添加缓冲区
    const bufferedStart = Math.max(0, startIndex - overscan);
    const bufferedEnd = Math.min(items.length, endIndex + overscan);

    // 计算偏移量
    let offsetY = 0;
    for (let i = 0; i < bufferedStart; i++) {
      offsetY += getHeight(items[i], i);
    }

    return {
      visibleRange: { start: bufferedStart, end: bufferedEnd },
      offsetY,
    };
  }, [items, scrollTop, containerHeight, overscan, getHeight]);

  // 测量动态高度
  const measureItem = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      if (!dynamicHeight || !element) return;

      const item = items[index];
      const id = keyExtractor ? keyExtractor(item, index) : item.id;

      if (itemRefs.current.has(id)) return;

      const height = element.getBoundingClientRect().height;
      const estimated = getItemHeight(item, index, itemHeight);

      if (Math.abs(height - estimated) > 1) {
        setMeasuredHeights((prev) => {
          const next = new Map(prev);
          next.set(id, height);
          return next;
        });
      }

      itemRefs.current.set(id, element);
    },
    [dynamicHeight, items, itemHeight, keyExtractor]
  );

  // 重新测量所有高度
  const remeasure = useCallback(() => {
    setMeasuredHeights(new Map());
    itemRefs.current.clear();
  }, []);

  // 滚动处理
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      const direction = newScrollTop > lastScrollTopRef.current ? 'down' : 'up';
      scrollDirectionRef.current = direction;
      lastScrollTopRef.current = newScrollTop;

      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop, direction);

      // 检查是否滚动到底部
      if (onScrollToBottom && hasMore && !loadingMore) {
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        const scrollBottom = scrollHeight - newScrollTop - clientHeight;

        if (scrollBottom <= scrollToBottomThreshold) {
          onScrollToBottom();
        }
      }
    },
    [onScroll, onScrollToBottom, hasMore, loadingMore, scrollToBottomThreshold]
  );

  // 滚动到指定位置
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      let offset = 0;
      for (let i = 0; i < index && i < items.length; i++) {
        offset += getHeight(items[i], i);
      }
      containerRef.current?.scrollTo({ top: offset, behavior });
    },
    [items, getHeight]
  );

  const scrollToTop = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      containerRef.current?.scrollTo({ top: 0, behavior });
    },
    []
  );

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      containerRef.current?.scrollTo({ top: totalHeight, behavior });
    },
    [totalHeight]
  );

  const getScrollTop = useCallback(() => scrollTop, [scrollTop]);

  // 暴露方法
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex,
      scrollToTop,
      scrollToBottom,
      getScrollTop,
      remeasure,
    }),
    [scrollToIndex, scrollToTop, scrollToBottom, getScrollTop, remeasure]
  );

  // 监听容器高度变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // 响应 scrollToIndex prop 变化
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollToIndex >= 0) {
      scrollToIndex(scrollToIndex);
    }
  }, [scrollToIndex]);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, idx) => {
      const index = visibleRange.start + idx;
      const id = keyExtractor ? keyExtractor(item, index) : item.id;
      const style: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${offsetY}px)`,
      };

      // 更新 offsetY 为下一个项目
      offsetY += getHeight(item, index);

      return (
        <div
          key={id}
          ref={(el) => measureItem(index, el)}
          className={itemClassName}
          style={style}
          data-index={index}
        >
          {renderItem(item, index, style)}
        </div>
      );
    });
  }, [
    items,
    visibleRange,
    renderItem,
    getHeight,
    keyExtractor,
    measureItem,
    itemClassName,
    offsetY,
  ]);

  // 空状态
  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto relative ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      {headerComponent}

      {/* 内容容器 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>

      {footerComponent}

      {/* 加载更多指示器 */}
      {loadingMore && (
        <div className="py-4 flex items-center justify-center text-gray-500">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
          加载更多...
        </div>
      )}

      {/* 没有更多数据 */}
      {!hasMore && items.length > 0 && (
        <div className="py-4 text-center text-sm text-gray-400">
          没有更多数据了
        </div>
      )}
    </div>
  );
}

const VirtualList = forwardRef(VirtualListInner) as <T extends VirtualListItem>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListRef> }
) => React.ReactElement;

export default VirtualList;

// ==================== 简化版虚拟列表（固定高度） ====================

interface SimpleVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  height?: number | string;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function SimpleVirtualList<T extends { id?: string }>({
  items,
  renderItem,
  itemHeight,
  height = 600,
  className = '',
  keyExtractor,
}: SimpleVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const totalHeight = items.length * itemHeight;

  // 计算可见范围
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 6;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex).map((item, idx) => {
    const index = startIndex + idx;
    const id = keyExtractor ? keyExtractor(item, index) : item.id || index;
    return (
      <div
        key={id}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${index * itemHeight}px)`,
          height: itemHeight,
        }}
      >
        {renderItem(item, index)}
      </div>
    );
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => setContainerHeight(container.clientHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}

// ==================== Window Virtual List (使用 window 作为滚动容器) ====================

interface WindowVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerClassName?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function WindowVirtualList<T extends { id?: string }>({
  items,
  renderItem,
  itemHeight,
  containerClassName = '',
  keyExtractor,
}: WindowVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerTop, setContainerTop] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
      if (containerRef.current) {
        setContainerTop(containerRef.current.offsetTop);
      }
    };

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      if (containerRef.current) {
        setContainerTop(containerRef.current.offsetTop);
      }
    };

    handleScroll();
    handleResize();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const relativeScrollTop = Math.max(0, scrollTop - containerTop);
  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(relativeScrollTop / itemHeight) - 3);
  const visibleCount = Math.ceil(windowHeight / itemHeight) + 6;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex).map((item, idx) => {
    const index = startIndex + idx;
    const id = keyExtractor ? keyExtractor(item, index) : item.id || index;
    return (
      <div
        key={id}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${index * itemHeight}px)`,
          height: itemHeight,
        }}
      >
        {renderItem(item, index)}
      </div>
    );
  });

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={{ height: totalHeight, position: 'relative' }}
    >
      {visibleItems}
    </div>
  );
}
