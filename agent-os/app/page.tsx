'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAgentOSStore } from '../lib/store';
import L0Viewer from '../components/l0-viewer';
import TraceViewer, { TraceButton, TraceModal } from '../components/trace-viewer';
import ErrorBoundary from '../components/error-boundary';
import Loading, { PageLoading, SectionLoading } from '../components/ui/loading';
import EmptyState from '../components/ui/empty-state';
import type { TraceResult } from '../lib/store';

// 懒加载其他组件以优化性能
import dynamic from 'next/dynamic';

const CandidateList = dynamic(() => import('../components/candidate-list'), {
  loading: () => <SectionLoading text="加载候选列表..." />,
  ssr: false,
});

export default function Home() {
  const { overview, isLoading, error, refreshAll, lastRefresh, l1Memories } = useAgentOSStore();
  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [currentTrace, setCurrentTrace] = useState<TraceResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshAll();
  }, [refreshAll]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'empty': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleTrace = (result: TraceResult) => {
    setCurrentTrace(result);
    setTraceModalOpen(true);
  };

  // 获取 memory_id（支持新旧格式）
  const getMemoryId = (item: any): string => {
    if (item.frontmatter?.memory_id) {
      return item.frontmatter.memory_id;
    }
    // 旧格式：从文件名推断
    const date = item.created || item.id.replace('-daily-dream', '');
    return `L1-${date}-001`;
  };

  // 页面加载状态
  if (!mounted) {
    return <PageLoading text="正在启动 Agent Memory OS..." />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">🧠</span>
                <span>Agent Memory OS</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">5层记忆系统管理界面 · 溯源系统已启用</p>
            </div>
            <div className="flex items-center gap-4">
              {lastRefresh && (
                <span className="text-sm text-gray-500 hidden sm:inline">
                  最后刷新: {lastRefresh.toLocaleTimeString('zh-CN')}
                </span>
              )}
              <button
                onClick={refreshAll}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>刷新中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>刷新全部</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-red-800">加载失败</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={refreshAll}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 系统状态概览 */}
        {overview && (
          <ErrorBoundary>
            <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(overview.levels).map(([level, data]) => (
                <div 
                  key={level} 
                  className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`} />
                    <h3 className="font-semibold text-gray-900">{level}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{data.description}</p>
                  {data.count !== undefined && (
                    <p className="text-2xl font-bold text-gray-900">{data.count}</p>
                  )}
                  {data.stats && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>今日: <span className="font-medium">{data.stats.todayMessages}</span> 条</p>
                      <p>历史: <span className="font-medium">{data.stats.totalDays}</span> 天</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ErrorBoundary>
        )}

        {/* 主内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* L0 实时层 - 占据2列 */}
          <div className="lg:col-span-2 space-y-4">
            <ErrorBoundary>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>📊</span> L0 实时层
                  </h2>
                  <p className="text-sm text-gray-600">原始对话数据实时捕获</p>
                </div>
              </div>
              <L0Viewer />
            </ErrorBoundary>
          </div>

          {/* 侧边栏 - 其他层级预览 */}
          <div className="space-y-6">
            {/* L1 情景记忆 */}
            <ErrorBoundary>
              <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>📝</span> L1 情景记忆
                  </h3>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">可溯源</span>
                </div>
                {l1Memories && l1Memories.length > 0 ? (
                  <ul className="space-y-3">
                    {l1Memories.slice(0, 5).map((item) => (
                      <li key={item.id} className="text-sm border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-gray-800 truncate flex-1">
                            {item.frontmatter?.memory_id || item.id}
                          </div>
                          <TraceButton
                            memoryId={getMemoryId(item)}
                            targetLevel="L0"
                            onTrace={handleTrace}
                            size="sm"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.created} · {item.l2Candidates} 个L2候选
                        </div>
                        {item.frontmatter?.sources && (
                          <div className="text-xs text-gray-400 mt-1">
                            L0 源: {item.frontmatter.sources.message_count || 0} 条消息
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : overview?.levels.L1.recent && overview.levels.L1.recent.length > 0 ? (
                  <ul className="space-y-2">
                    {overview.levels.L1.recent.map((item: any) => (
                      <li key={item.id} className="text-sm border-b pb-2 last:border-0">
                        <div className="font-medium text-gray-800 truncate">{item.id}</div>
                        <div className="text-xs text-gray-500">
                          {item.created} · {item.l2Candidates} 个L2候选
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon="📝"
                    title="暂无数据"
                    description="L1 情景记忆数据将在每日汇总后生成"
                    size="sm"
                    compact
                  />
                )}
              </div>
            </ErrorBoundary>

            {/* L2 程序记忆 */}
            <ErrorBoundary>
              <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚙️</span> L2 程序记忆
                </h3>
                {overview?.levels.L2.recent && overview.levels.L2.recent.length > 0 ? (
                  <ul className="space-y-2">
                    {overview.levels.L2.recent.map((item: any) => (
                      <li key={item.id} className="text-sm border-b pb-2 last:border-0">
                        <div className="font-medium text-gray-800 truncate">{item.id}</div>
                        <div className="text-xs text-gray-500">更新: {item.updated}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon="⚙️"
                    title="暂无数据"
                    description="从候选中确认后生成"
                    size="sm"
                    compact
                  />
                )}
              </div>
            </ErrorBoundary>

            {/* L3 语义记忆 */}
            <ErrorBoundary>
              <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🧩</span> L3 语义记忆
                </h3>
                {overview?.levels.L3.recent && overview.levels.L3.recent.length > 0 ? (
                  <ul className="space-y-2">
                    {overview.levels.L3.recent.map((item: any) => (
                      <li key={item.id} className="text-sm border-b pb-2 last:border-0">
                        <div className="font-medium text-gray-800 truncate">{item.id}</div>
                        <div className="text-xs text-gray-500">更新: {item.updated}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon="🧩"
                    title="暂无数据"
                    description="从候选中确认后生成"
                    size="sm"
                    compact
                  />
                )}
              </div>
            </ErrorBoundary>

            {/* 快速链接 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">快速操作</h3>
              <div className="space-y-2">
                <a 
                  href="/review" 
                  className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 p-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <span>📋</span>
                  <span>候选确认</span>
                  <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 溯源模态框 */}
      <TraceModal
        isOpen={traceModalOpen}
        onClose={() => setTraceModalOpen(false)}
        traceResult={currentTrace}
      />
    </main>
  );
}
