/**
 * CandidateList Component (Optimized)
 * 显示所有待确认的记忆候选
 * 
 * 优化：改进loading、空状态、错误处理
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CandidateCard from './candidate-card';
import Loading, { ListSkeleton } from '../ui/loading';
import EmptyState, { EmptyAllDone, EmptyFilter } from '../ui/empty-state';
import ErrorBoundary from '../error-boundary';
import { 
  getNotificationConfig, 
  saveNotificationConfig,
  requestNotificationPermission,
  hasNotificationPermission,
  startCandidateWatcher,
  showToast
} from '../lib/notifications';

export interface Candidate {
  id: string;
  name: string;
  description: string;
  confidence: number;
  source: string;
  occurrences: number;
  level: 'L2' | 'L3';
  type: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'deferred';
  details?: string;
  evidence?: string[];
}

interface CandidateFilter {
  level: 'all' | 'L2' | 'L3';
  status: 'all' | 'pending' | 'confirmed' | 'rejected' | 'deferred';
  minConfidence: number;
}

interface CandidateListProps {
  initialCandidates?: Candidate[];
}

export default function CandidateList({ initialCandidates = [] }: CandidateListProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CandidateFilter>({
    level: 'all',
    status: 'pending',
    minConfidence: 0,
  });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notifConfig, setNotifConfig] = useState(getNotificationConfig());
  const [hasPermission, setHasPermission] = useState(false);

  // 加载候选数据
  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/candidates');
      if (!response.ok) {
        throw new Error('Failed to load candidates');
      }
      
      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      showToast('加载候选失败', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和权限检查
  useEffect(() => {
    loadCandidates();
    setHasPermission(hasNotificationPermission());
  }, [loadCandidates]);

  // 监听新候选
  useEffect(() => {
    const cleanup = startCandidateWatcher((newCandidates) => {
      showToast(`发现 ${newCandidates.length} 个新候选`, 'info');
      loadCandidates();
    });

    return cleanup;
  }, [loadCandidates]);

  // 处理确认候选
  const handleConfirm = useCallback(async (candidate: Candidate, level: 'L2' | 'L3') => {
    try {
      const response = await fetch('/api/candidates/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          action: 'confirm',
          targetLevel: level,
        }),
      });

      if (!response.ok) {
        throw new Error('Confirm failed');
      }

      const result = await response.json();
      
      // 更新本地状态
      setCandidates(prev => 
        prev.map(c => 
          c.id === candidate.id 
            ? { ...c, status: 'confirmed' as const, confirmedAt: result.confirmedAt }
            : c
        )
      );
      
      showToast(`已确认: ${candidate.name} → ${level}`, 'success');
    } catch (err) {
      showToast('确认失败', 'error');
      console.error(err);
    }
  }, []);

  // 处理拒绝候选
  const handleReject = useCallback(async (candidate: Candidate, reason: string) => {
    try {
      const response = await fetch('/api/candidates/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          action: 'reject',
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Reject failed');
      }

      // 更新本地状态
      setCandidates(prev => 
        prev.map(c => 
          c.id === candidate.id 
            ? { ...c, status: 'rejected' as const, rejectionReason: reason }
            : c
        )
      );
      
      showToast(`已拒绝: ${candidate.name}`, 'warning');
    } catch (err) {
      showToast('拒绝失败', 'error');
      console.error(err);
    }
  }, []);

  // 处理推迟候选
  const handleDefer = useCallback(async (candidate: Candidate) => {
    try {
      const response = await fetch('/api/candidates/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          action: 'defer',
        }),
      });

      if (!response.ok) {
        throw new Error('Defer failed');
      }

      // 更新本地状态
      setCandidates(prev => 
        prev.map(c => 
          c.id === candidate.id 
            ? { ...c, status: 'deferred' as const }
            : c
        )
      );
      
      showToast(`已推迟: ${candidate.name}`, 'info');
    } catch (err) {
      showToast('推迟失败', 'error');
      console.error(err);
    }
  }, []);

  // 申请通知权限
  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      showToast('通知权限已开启', 'success');
    } else {
      showToast('通知权限被拒绝', 'warning');
    }
  }, []);

  // 保存通知设置
  const handleSaveNotificationSettings = useCallback(() => {
    saveNotificationConfig(notifConfig);
    setShowSettings(false);
    showToast('设置已保存', 'success');
  }, [notifConfig]);

  // 清除所有筛选
  const clearFilters = useCallback(() => {
    setFilter({
      level: 'all',
      status: 'pending',
      minConfidence: 0,
    });
  }, []);

  // 过滤候选
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (filter.level !== 'all' && c.level !== filter.level) return false;
      if (filter.status !== 'all' && c.status !== filter.status) return false;
      if (c.confidence < filter.minConfidence) return false;
      return true;
    });
  }, [candidates, filter]);

  // 统计
  const stats = useMemo(() => ({
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    confirmed: candidates.filter(c => c.status === 'confirmed').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    deferred: candidates.filter(c => c.status === 'deferred').length,
    l2: candidates.filter(c => c.level === 'L2').length,
    l3: candidates.filter(c => c.level === 'L3').length,
  }), [candidates]);

  // 计算筛选条件数量
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.level !== 'all') count++;
    if (filter.status !== 'pending') count++;
    if (filter.minConfidence > 0) count++;
    return count;
  }, [filter]);

  return (
    <ErrorBoundary>
      <div className="candidate-list space-y-4">
        {/* 头部工具栏 */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">记忆候选确认</h2>
              <p className="text-sm text-gray-500 mt-1">
                待确认: <span className="font-medium text-blue-600">{stats.pending}</span> |
                已确认: <span className="font-medium text-green-600">{stats.confirmed}</span> |
                已拒绝: <span className="font-medium text-red-600">{stats.rejected}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* 刷新按钮 */}
              <button
                onClick={loadCandidates}
                disabled={loading}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                {loading ? (
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
                    <span>刷新</span>
                  </>
                )}
              </button>

              {/* 通知设置按钮 */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${
                  hasPermission 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                <span>{hasPermission ? '🔔' : '🔕'}</span>
                <span className="hidden sm:inline">通知</span>
              </button>
            </div>
          </div>

          {/* 通知设置面板 */}
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">通知设置</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifConfig.enabled}
                    onChange={(e) => setNotifConfig({ ...notifConfig, enabled: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  启用通知
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifConfig.desktop}
                    onChange={(e) => setNotifConfig({ ...notifConfig, desktop: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  桌面通知
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifConfig.sound}
                    onChange={(e) => setNotifConfig({ ...notifConfig, sound: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  提示音
                </label>

                <div className="flex items-center gap-2 text-sm">
                  <span>频率:</span>
                  <select
                    value={notifConfig.frequency}
                    onChange={(e) => setNotifConfig({ ...notifConfig, frequency: e.target.value as any })}
                    className="px-2 py-1 border rounded text-sm bg-white"
                  >
                    <option value="immediate">即时</option>
                    <option value="hourly">每小时</option>
                    <option value="daily">每天</option>
                  </select>
                </div>

                {!hasPermission && (
                  <button
                    onClick={handleRequestPermission}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    申请通知权限
                  </button>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveNotificationSettings}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    保存设置
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 过滤器 */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={filter.level}
              onChange={(e) => setFilter({ ...filter, level: e.target.value as any })}
              className="px-3 py-1.5 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部层级</option>
              <option value="L2">L2 - 程序记忆</option>
              <option value="L3">L3 - 语义记忆</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
              className="px-3 py-1.5 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">待确认</option>
              <option value="all">全部状态</option>
              <option value="confirmed">已确认</option>
              <option value="rejected">已拒绝</option>
              <option value="deferred">已推迟</option>
            </select>

            <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 border rounded-md">
              <span className="text-gray-600">置信度:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filter.minConfidence}
                onChange={(e) => setFilter({ ...filter, minConfidence: parseFloat(e.target.value) })}
                className="w-24"
              />
              <span className="font-medium text-blue-600 min-w-[3rem]">
                {(filter.minConfidence * 100).toFixed(0)}%
              </span>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-red-800">加载失败</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={loadCandidates}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  重新加载
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 候选列表 */}
        <div className="space-y-3">
          {loading && candidates.length === 0 ? (
            // 首次加载骨架屏
            <ListSkeleton count={3} />
          ) : filteredCandidates.length === 0 ? (
            // 空状态
            activeFilterCount > 0 ? (
              <EmptyFilter
                filterCount={activeFilterCount}
                onClearFilters={clearFilters}
              />
            ) : filter.status === 'pending' && stats.pending === 0 ? (
              <EmptyAllDone
                title="太棒了！全部完成 🎉"
                description="当前没有待处理的记忆候选"
              />
            ) : (
              <EmptyState
                icon="📋"
                title="暂无候选"
                description="当前条件下没有符合条件的记忆候选"
                action={{
                  label: '清除筛选',
                  onClick: clearFilters,
                  variant: 'secondary'
                }}
              />
            )
          ) : (
            filteredCandidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onConfirm={handleConfirm}
                onReject={handleReject}
                onDefer={handleDefer}
                onViewDetails={setSelectedCandidate}
              />
            ))
          )}
        </div>

        {/* 详情弹窗 */}
        {selectedCandidate && (
          <CandidateDetailModal
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onDefer={handleDefer}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

// ==================== CandidateCard 组件 ====================

interface CandidateCardProps {
  candidate: Candidate;
  onConfirm: (candidate: Candidate, level: 'L2' | 'L3') => void;
  onReject: (candidate: Candidate, reason: string) => void;
  onDefer: (candidate: Candidate) => void;
  onViewDetails: (candidate: Candidate) => void;
}

function CandidateCard({ 
  candidate, 
  onConfirm, 
  onReject, 
  onDefer, 
  onViewDetails 
}: CandidateCardProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      deferred: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const labels = {
      pending: '待确认',
      confirmed: '已确认',
      rejected: '已拒绝',
      deferred: '已推迟',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    return level === 'L2' 
      ? <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 border border-blue-200">L2 程序</span>
      : <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800 border border-purple-200">L3 语义</span>;
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleRejectSubmit = () => {
    if (rejectReason.trim()) {
      onReject(candidate, rejectReason.trim());
      setShowRejectReason(false);
      setRejectReason('');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 transition-all hover:shadow-md ${
      candidate.status === 'pending' ? 'border-l-4 border-l-blue-500' : ''
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {getLevelBadge(candidate.level)}
            {getStatusBadge(candidate.status)}
            <span className={`text-sm font-medium ${getConfidenceColor(candidate.confidence)}`}>
              置信度: {(candidate.confidence * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">
              出现 {candidate.occurrences} 次
            </span>
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {candidate.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {candidate.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>来源: {candidate.source}</span>
            <span>类型: {candidate.type}</span>
            <span>创建: {new Date(candidate.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
          {candidate.status === 'pending' && (
            <>
              <button
                onClick={() => onConfirm(candidate, candidate.level)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">确认</span>
              </button>
              <button
                onClick={() => onDefer(candidate)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">推迟</span>
              </button>
              <button
                onClick={() => setShowRejectReason(true)}
                className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeJoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">拒绝</span>
              </button>
            </>
          )}
          <button
            onClick={() => onViewDetails(candidate)}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 font-medium transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-14 0 9 9 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">详情</span>
          </button>
        </div>
      </div>

      {/* 拒绝原因输入 */}
      {showRejectReason && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-red-700 mb-2">请输入拒绝原因:</p>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="例如: 不够成熟、暂时不需要..."
            className="w-full px-3 py-2 border rounded-md text-sm mb-2 focus:ring-2 focus:ring-red-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              确认拒绝
            </button>
            <button
              onClick={() => {
                setShowRejectReason(false);
                setRejectReason('');
              }}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CandidateDetailModal 组件 ====================

interface CandidateDetailModalProps {
  candidate: Candidate;
  onClose: () => void;
  onConfirm: (candidate: Candidate, level: 'L2' | 'L3') => void;
  onReject: (candidate: Candidate, reason: string) => void;
  onDefer: (candidate: Candidate) => void;
}

function CandidateDetailModal({ 
  candidate, 
  onClose, 
  onConfirm, 
  onReject, 
  onDefer 
}: CandidateDetailModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs rounded ${
              candidate.level === 'L2' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {candidate.level} 候选
            </span>
            <span className={`px-2 py-0.5 text-xs rounded ${
              candidate.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
              candidate.status === 'deferred' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {candidate.status === 'confirmed' ? '已确认' :
               candidate.status === 'rejected' ? '已拒绝' :
               candidate.status === 'deferred' ? '已推迟' : '待确认'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{candidate.name}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500 block text-xs mb-1">置信度</span>
              <span className="font-medium text-blue-600">
                {(candidate.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500 block text-xs mb-1">出现次数</span>
              <span className="font-medium">{candidate.occurrences}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500 block text-xs mb-1">来源</span>
              <span>{candidate.source}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-500 block text-xs mb-1">类型</span>
              <span>{candidate.type}</span>
            </div>
            <div className="col-span-2 bg-gray-50 p-2 rounded">
              <span className="text-gray-500 block text-xs mb-1">创建时间</span>
              <span>{new Date(candidate.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">描述</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {candidate.description}
            </p>
          </div>

          {candidate.details && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">详细信息</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {candidate.details}
              </p>
            </div>
          )}

          {candidate.evidence && candidate.evidence.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">证据</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {candidate.evidence.map((item, idx) => (
                  <li key={idx} className="bg-gray-50 p-2 rounded flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showRejectInput && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-red-700 mb-2">请输入拒绝原因:</p>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如: 不够成熟、暂时不需要..."
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex flex-wrap justify-end gap-2">
          {candidate.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  if (showRejectInput && rejectReason.trim()) {
                    onReject(candidate, rejectReason);
                    onClose();
                  } else if (showRejectInput) {
                    setShowRejectInput(false);
                  } else {
                    setShowRejectInput(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showRejectInput 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {showRejectInput ? '确认拒绝' : '拒绝'}
              </button>
              <button
                onClick={() => { onDefer(candidate); onClose(); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                推迟
              </button>
              <button
                onClick={() => { onConfirm(candidate, candidate.level); onClose(); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                确认并沉淀
              </button>
            </>
          )}
          {candidate.status !== 'pending' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
