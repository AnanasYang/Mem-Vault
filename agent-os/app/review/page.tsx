/**
 * Review Page (Optimized)
 * L2/L3 记忆候选确认界面
 */

import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import ErrorBoundary from '../../components/error-boundary';
import { PageLoading } from '../../components/ui/loading';

export const metadata: Metadata = {
  title: '候选确认',
  description: '确认和沉淀记忆候选 - 审查 AI 从对话中提取的记忆候选',
};

// 动态导入候选列表以优化首屏加载
const CandidateList = dynamic(() => import('../../components/candidate-list'), {
  loading: () => <PageLoading text="加载候选列表..." />,
  ssr: false,
});

export default function ReviewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 页面头部 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">📋</span>
                <span>记忆候选确认</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                审查并确认 AI 从对话中提取的记忆候选，沉淀为长期记忆
              </p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <a 
                href="/" 
                className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回首页
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 说明卡片 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-14 0 9 9 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-blue-900 mb-2">使用说明</h2>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong className="text-blue-900">确认</strong>: 候选将被写入对应层级的记忆文件 (Memory/L2-procedural/ 或 Memory/L3-semantic/)</p>
                <p>• <strong className="text-blue-900">拒绝</strong>: 候选将被标记为拒绝状态，需要提供拒绝原因</p>
                <p>• <strong className="text-blue-900">推迟</strong>: 候选保持待确认状态，稍后再次审查</p>
                <p className="flex items-center gap-2">
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    置信度 ≥ 80% 建议优先确认
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    50%-80% 建议仔细评估
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    &lt; 50% 建议拒绝
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 候选列表 */}
        <ErrorBoundary>
          <Suspense fallback={<PageLoading text="加载候选数据..." />}>
            <CandidateList />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* 页面底部 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            Agent Memory OS - 5层记忆系统管理界面
          </p>
          <p className="text-xs text-gray-400 mt-1">
            L0 实时层 → L1 情景记忆 → L2 程序记忆 → L3 语义记忆 → L4 核心记忆
          </p>
        </div>
      </footer>
    </main>
  );
}
