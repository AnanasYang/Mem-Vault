'use client';

import React from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* 头部 - 错误图标 */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-8 text-center">
              <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                应用发生错误
              </h1>
              <p className="text-red-100">
                抱歉，应用遇到了无法恢复的问题
              </p>
            </div>

            {/* 内容区 */}
            <div className="px-8 py-8">
              {/* 错误信息摘要 */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">
                      错误信息
                    </p>
                    <p className="text-sm text-red-700 font-mono break-all">
                      {error.message || '未知错误'}
                    </p>
                    {error.digest && (
                      <p className="text-xs text-red-600 mt-2">
                        错误 ID: {error.digest}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={reset}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重试
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  刷新页面
                </button>
              </div>

              {/* 错误详情（可折叠） */}
              <div className="border-t pt-6">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {showDetails ? '隐藏技术详情' : '查看技术详情'}
                </button>

                {showDetails && (
                  <div className="mt-4 space-y-4">
                    {error.stack && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          堆栈跟踪
                        </p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        环境信息
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 space-y-1 font-mono">
                        <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
                        <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                        <p>Time: {new Date().toISOString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 帮助链接 */}
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-500 mb-3">
                  如果问题持续存在，请尝试以下操作：
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    返回首页
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.history.back();
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    返回上一页
                  </button>
                </div>
              </div>
            </div>

            {/* 底部 */}
            <div className="bg-gray-50 px-8 py-4 border-t text-center">
              <p className="text-xs text-gray-400">
                Agent Memory OS - 5层记忆系统管理界面
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}