/**
 * Loading Component
 * 全局加载组件 - 支持多种尺寸和样式
 */

'use client';

import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: { spinner: 'w-4 h-4', dots: 'w-1.5 h-1.5', text: 'text-xs' },
  md: { spinner: 'w-8 h-8', dots: 'w-2 h-2', text: 'text-sm' },
  lg: { spinner: 'w-12 h-12', dots: 'w-2.5 h-2.5', text: 'text-base' },
  xl: { spinner: 'w-16 h-16', dots: 'w-3 h-3', text: 'text-lg' },
};

// Spinner 变体
function Spinner({ size }: { size: keyof typeof sizeMap }) {
  return (
    <div
      className={`${sizeMap[size].spinner} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`}
      role="status"
      aria-label="加载中"
    />
  );
}

// Dots 变体
function Dots({ size }: { size: keyof typeof sizeMap }) {
  return (
    <div className="flex items-center gap-1" role="status" aria-label="加载中">
      <span className={`${sizeMap[size].dots} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
      <span className={`${sizeMap[size].dots} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
      <span className={`${sizeMap[size].dots} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Pulse 变体
function Pulse({ size }: { size: keyof typeof sizeMap }) {
  return (
    <div
      className={`${sizeMap[size].spinner} rounded-full bg-blue-600 animate-pulse`}
      role="status"
      aria-label="加载中"
    />
  );
}

// Skeleton 骨架屏变体
interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} role="status" aria-label="加载中">
      {lines > 1 && <div className="h-4 bg-gray-200 rounded w-3/4" />}
      {lines > 2 && (
        <>
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </>
      )}
      {lines > 3 && <div className="h-4 bg-gray-200 rounded w-4/5" />}
    </div>
  );
}

// Card 骨架屏
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 animate-pulse ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

// 列表骨架屏
export function ListSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// 主组件
export default function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  className = '',
  fullScreen = false,
}: LoadingProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {variant === 'spinner' && <Spinner size={size} />}
      {variant === 'dots' && <Dots size={size} />}
      {variant === 'pulse' && <Pulse size={size} />}
      {variant === 'skeleton' && <Skeleton lines={3} />}
      {text && (
        <span className={`${sizeMap[size].text} text-gray-600 font-medium`}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// 页面级加载
export function PageLoading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loading size="lg" variant="spinner" text={text} />
    </div>
  );
}

// 区域级加载
export function SectionLoading({ text }: { text?: string }) {
  return (
    <div className="py-12 flex items-center justify-center">
      <Loading size="md" variant="dots" text={text} />
    </div>
  );
}

// 按钮内加载
export function ButtonLoading({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loading size="sm" variant="spinner" />
      {text}
    </span>
  );
}
