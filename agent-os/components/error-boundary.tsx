/**
 * Error Boundary Component
 * React 错误边界 - 捕获子组件渲染错误
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode;
  /** 自定义错误 Fallback UI */
  fallback?: ReactNode;
  /** 错误回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 重置错误后回调 */
  onReset?: () => void;
  /** 是否自动重置 */
  autoReset?: boolean;
  /** 自动重置延迟(ms) */
  autoResetDelay?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 更新状态
    this.setState({ errorInfo });

    // 调用回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 开发环境打印错误
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // 可选：自动重置
    if (this.props.autoReset && this.props.autoResetDelay) {
      setTimeout(() => {
        this.handleReset();
      }, this.props.autoResetDelay);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 使用自定义 fallback
      if (fallback) {
        return fallback;
      }

      // 默认错误 UI
      return <DefaultErrorFallback error={error} errorInfo={errorInfo} onReset={this.handleReset} />;
    }

    return children;
  }
}

// 默认错误 Fallback UI
interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error, errorInfo, onReset }: DefaultErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
        {/* 头部 */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">组件渲染出错</h2>
              <p className="text-sm text-red-600">抱歉，此区域暂时无法正常显示</p>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="px-6 py-6">
          <p className="text-gray-600 mb-4">
            发生了意外错误。您可以尝试重新加载此区域，或刷新整个页面。
          </p>

          {/* 错误详情（可折叠） */}
          {error && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <span>{showDetails ? '▼' : '▶'}</span>
                {showDetails ? '隐藏错误详情' : '查看错误详情'}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                    <p className="text-xs font-medium text-gray-500 mb-1">错误信息:</p>
                    <p className="text-sm text-red-600 font-mono">{error.message}</p>
                  </div>

                  {error.stack && (
                    <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                      <p className="text-xs font-medium text-gray-500 mb-1">堆栈跟踪:</p>
                      <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                        {error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    </div>
                  )}

                  {errorInfo && (
                    <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                      <p className="text-xs font-medium text-gray-500 mb-1">组件堆栈:</p>
                      <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
          如果问题持续存在，请联系管理员或提交错误报告
        </div>
      </div>
    </div>
  );
}

// 组件级错误边界（简化版）
interface ComponentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
}

export function ComponentErrorBoundary({
  children,
  fallback,
  title = '加载失败',
  description = '此组件暂时无法显示',
}: ComponentErrorBoundaryProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (hasError) {
      setHasError(false);
    }
  }, [children]);

  if (hasError) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-center">
        <p className="text-red-700 font-medium">{title}</p>
        <p className="text-sm text-red-600 mt-1">{description}</p>
        <button
          onClick={() => setHasError(false)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      {children}
    </ErrorBoundary>
  );
}

// 数据加载错误边界
interface DataErrorBoundaryProps {
  children: ReactNode;
  error?: Error | null;
  onRetry?: () => void;
  loading?: boolean;
}

export function DataErrorBoundary({
  children,
  error,
  onRetry,
  loading,
}: DataErrorBoundaryProps) {
  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">数据加载失败</h3>
        <p className="text-sm text-gray-500 mb-4">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            重新加载
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
