import { Suspense } from 'react';
import { getMemoryStats, getDreamStatus } from '@/lib/memory-api';
import { StatsCard } from '@/components/dashboard/stats-card';
import { SyncStatus } from '@/components/dashboard/sync-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const stats = getMemoryStats();
  const dreams = getDreamStatus();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Memory System 2.0</h1>
          <p className="text-gray-500">AI 记忆系统状态看板</p>
        </div>
        <div className="text-sm text-gray-400">
          最后更新: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* 记忆统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="L1 情境记忆" value={stats.l1Count} subtitle="近期对话摘要" />
        <StatsCard title="L2 行为模式" value={stats.l2Count} subtitle="习惯与偏好" />
        <StatsCard title="L3 认知框架" value={stats.l3Count} subtitle="思维模式" />
        <StatsCard title="L4 核心价值观" value={stats.l4Count} subtitle="身份认同" />
        <StatsCard title="每周复盘" value={stats.weeklyReviews} subtitle="历史记录" />
      </div>
      
      {/* 系统状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SyncStatus status={stats.syncStatus} lastSync={stats.lastSync} />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Dreams 状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">上次 Daily:</span>
              <span className="text-sm font-medium">{dreams.lastDaily}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">上次 Weekly:</span>
              <span className="text-sm font-medium">{dreams.lastWeekly}</span>
            </div>
            {dreams.pendingReviews.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-sm text-yellow-600">
                  ⚠️ {dreams.pendingReviews.length} 个待 review 项目
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <a 
              href="/review" 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              查看 Review
            </a>
            <button 
              onClick={() => fetch('/api/sync', { method: 'POST' })}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              立即同步
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
