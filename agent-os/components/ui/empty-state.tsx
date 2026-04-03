/**
 * Empty State Component
 * 空状态组件 - 友好的空数据提示
 */

'use client';

import React from 'react';

export interface EmptyStateProps {
  /** 图标或emoji */
  icon?: React.ReactNode | string;
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  /** 次要操作 */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 紧凑模式（无边框背景） */
  compact?: boolean;
  /** 自定义样式 */
  className?: string;
}

const sizeMap = {
  sm: {
    wrapper: 'py-8',
    icon: 'text-3xl',
    iconContainer: 'w-12 h-12',
    title: 'text-base',
    description: 'text-xs',
  },
  md: {
    wrapper: 'py-12',
    icon: 'text-5xl',
    iconContainer: 'w-16 h-16',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    wrapper: 'py-16',
    icon: 'text-6xl',
    iconContainer: 'w-20 h-20',
    title: 'text-xl',
    description: 'text-base',
  },
};

const variantMap = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border-transparent',
  secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent',
};

export default function EmptyState({
  icon = '📭',
  title = '暂无数据',
  description,
  action,
  secondaryAction,
  size = 'md',
  compact = false,
  className = '',
}: EmptyStateProps) {
  const styles = sizeMap[size];

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <span className={styles.icon}>{icon}</span>;
    }
    return icon;
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${compact ? '' : 'bg-white rounded-lg shadow-sm border border-gray-100'}
        ${styles.wrapper}
        ${className}
      `}
      role="status"
      aria-label="空状态"
    >
      {/* 图标区域 */}
      <div
        className={`
          ${styles.iconContainer}
          rounded-full bg-gray-50 flex items-center justify-center mb-4
          transition-transform hover:scale-110 duration-300
        `}
      >
        {renderIcon()}
      </div>

      {/* 标题 */}
      <h3 className={`${styles.title} font-semibold text-gray-900 mb-2`}>
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className={`${styles.description} text-gray-500 max-w-md mb-6 px-4`}>
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                border ${variantMap[action.variant || 'primary']}
              `}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// 预置空状态场景

/** 搜索无结果 */
export function EmptySearch({
  keyword,
  onClear,
  className,
}: {
  keyword?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon="🔍"
      title={keyword ? `未找到 "${keyword}" 相关结果` : '未找到相关结果'}
      description="尝试使用其他关键词，或清除搜索条件"
      action={onClear ? { label: '清除搜索', onClick: onClear, variant: 'secondary' } : undefined}
      size="md"
      className={className}
    />
  );
}

/** 无权限 */
export function EmptyPermission({
  description = '您没有权限访问此内容',
  onRequestAccess,
  className,
}: {
  description?: string;
  onRequestAccess?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon="🚫"
      title="无访问权限"
      description={description}
      action={onRequestAccess ? { label: '申请权限', onClick: onRequestAccess } : undefined}
      size="md"
      className={className}
    />
  );
}

/** 网络错误 */
export function EmptyNetworkError({
  onRetry,
  className,
}: {
  onRetry: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon="📡"
      title="网络连接失败"
      description="请检查网络连接后重试"
      action={{ label: '重新加载', onClick: onRetry, variant: 'primary' }}
      size="md"
      className={className}
    />
  );
}

/** 数据加载失败 */
export function EmptyLoadError({
  error,
  onRetry,
  className,
}: {
  error?: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon="⚠️"
      title="数据加载失败"
      description={error || '加载数据时出现错误，请重试'}
      action={{ label: '重新加载', onClick: onRetry, variant: 'primary' }}
      size="md"
      className={className}
    />
  );
}

/** 新建引导 */
export function EmptyCreateGuide({
  title = '开始创建您的第一条数据',
  description = '点击下方的创建按钮，开始添加新内容',
  onCreate,
  className,
}: {
  title?: string;
  description?: string;
  onCreate: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon="✨"
      title={title}
      description={description}
      action={{ label: '立即创建', onClick: onCreate, variant: 'primary' }}
      size="lg"
      className={className}
    />
  );
}

/** 完成全部任务 */
export function EmptyAllDone({
  title = '太棒了！全部完成 🎉',
  description = '当前没有待处理的事项',
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <EmptyState
      icon="🎊"
      title={title}
      description={description}
      size="md"
      compact
      className={className}
    />
  );
}

/** 无筛选结果 */
export function EmptyFilter({
  filterCount,
  onClearFilters,
  className,
}: {
  filterCount: number;
  onClearFilters: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon="🎛️"
      title="没有符合条件的项目"
      description={`您当前使用了 ${filterCount} 个筛选条件，尝试调整或清除筛选`}
      action={{ label: '清除筛选', onClick: onClearFilters, variant: 'secondary' }}
      size="md"
      className={className}
    />
  );
}
