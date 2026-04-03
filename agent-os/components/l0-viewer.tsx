/**
 * L0 Viewer Component (Optimized)
 * L0层实时对话阅读界面
 * 
 * 优化特性：
 * - 虚拟滚动：优化大数据量渲染性能
 * - 搜索高亮：关键词高亮显示
 * - 改进的loading和空状态
 * - 移动端适配
 */

'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useAgentOSStore, useAutoRefresh, L0Message } from '../../lib/store';
import Loading, { Skeleton, ListSkeleton } from '../ui/loading';
import EmptyState, { EmptySearch, EmptyAllDone } from '../ui/empty-state';
import { SimpleVirtualList } from '../virtual-list';

interface L0ViewerProps {
  initialDate?: string;
}

// 高亮搜索关键词
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark 
            key={i} 
            className="bg-yellow-200 text-yellow-900 px-0.5 rounded font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// 消息项组件（用于虚拟滚动）
interface MessageItemProps {
  msg: L0Message;
  searchTerm: string;
  getRoleStyle: (role: string) => string;
  formatTime: (ts: string) => string;
}

function MessageItem({ msg, searchTerm, getRoleStyle, formatTime }: MessageItemProps) {
  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <span className={`text-xs px-2 py-1 rounded border flex-shrink-0 ${getRoleStyle(msg.role)}`}>
          {msg.role === 'user' ? '用户' : 
           msg.role === 'assistant' ? 'AI' : '工具'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-1">
            {formatTime(msg.ts)}
          </div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            <HighlightText text={msg.content} keyword={searchTerm} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function L0Viewer({ initialDate }: L0ViewerProps) {
  const [filter, setFilter] = useState<'all' | 'user' | 'assistant'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    l0Messages,
    l0Dates,
    l0Stats,
    selectedDate,
    isLoading,
    autoRefresh,
    selectDate,
    setAutoRefresh,
    refreshAll,
  } = useAgentOSStore();

  // 启用自动刷新
  useAutoRefresh();

  // 过滤和搜索消息
  const filteredMessages = useMemo(() => {
    let messages = l0Messages;
    
    // 角色过滤
    if (filter !== 'all') {
      messages = messages.filter(m => m.role === filter);
    }
    
    // 内容搜索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      messages = messages.filter(m => 
        m.content.toLowerCase().includes(term)
      );
    }
    
    return messages;
  }, [l0Messages, filter, searchTerm]);

  // 按会话分组
  const groupedBySession = useMemo(() => {
    const groups: Record<string, L0Message[]> = {};
    filteredMessages.forEach(msg => {
      if (!groups[msg.sessionId]) {
        groups[msg.sessionId] = [];
      }
      groups[msg.sessionId].push(msg);
    });
    return groups;
  }, [filteredMessages]);

  // 切换会话展开
  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);

  // 格式化时间
  const formatTime = useCallback((ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  // 格式化日期
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  }, []);

  // 角色标签样式
  const getRoleStyle = useCallback((role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assistant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'toolResult':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // 渲染虚拟列表项
  const renderMessageItem = useCallback((msg: L0Message, index: number) => (
    <MessageItem
      key={`${msg.ts}-${index}`}
      msg={msg}
      searchTerm={searchTerm}
      getRoleStyle={getRoleStyle}
      formatTime={formatTime}
    />
  ), [searchTerm, getRoleStyle, formatTime]);

  // 渲染会话头部
  const renderSessionHeader = (sessionId: string, messages: L0Message[]) => {
    const isExpanded = expandedSessions.has(sessionId) || Object.keys(groupedBySession).length === 1;
    
    return (
      <button
        onClick={() => toggleSession(sessionId)}
        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400 flex-shrink-0">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="text-sm font-medium text-gray-700 truncate">
            会话 {sessionId.slice(0, 8)}...
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            ({messages.length} 条)
          </span>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatTime(messages[0]?.ts)}
        </span>
      </button>
    );
  };

  // 展开所有会话
  const expandAll = useCallback(() => {
    setExpandedSessions(new Set(Object.keys(groupedBySession)));
  }, [groupedBySession]);

  // 折叠所有会话
  const collapseAll = useCallback(() => {
    setExpandedSessions(new Set());
  }, []);

  // 计算消息总数
  const totalMessages = useMemo(() => 
    Object.values(groupedBySession).reduce((sum, msgs) => sum + msgs.length, 0),
    [groupedBySession]
  );

  return (
    <div className="l0-viewer bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      {/* 头部工具栏 */}
      <div className="p-4 border-b bg-gray-50">
        {/* 第一行：主要操作 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 日期选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 hidden sm:inline">日期:</label>
            <select
              value={selectedDate}
              onChange={(e) => selectDate(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
              disabled={isLoading}
            >
              {l0Dates.map(date => (
                <option key={date} value={date}>
                  {formatDate(date)} ({date})
                </option>
              ))}
            </select>
          </div>

          {/* 角色过滤 */}
          <div className="flex items-center gap-1 bg-white rounded-md border p-0.5">
            {(['all', 'user', 'assistant'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                disabled={isLoading}
              >
                {f === 'all' ? '全部' : f === 'user' ? '用户' : 'AI'}
              </button>
            ))}
          </div>

          {/* 搜索 */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索消息内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-1.5 border rounded-md text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="清除搜索"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-2">
            {/* 自动刷新开关 */}
            <label className="flex items-center gap-1.5 text-sm cursor-pointer bg-white px-3 py-1.5 rounded-md border hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="hidden sm:inline">自动刷新</span>
              <span className="sm:hidden">自动</span>
            </label>
            
            {/* 刷新按钮 */}
            <button
              onClick={refreshAll}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="hidden sm:inline">刷新中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">刷新</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 第二行：统计和展开/折叠 */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {l0Stats && (
              <>
                <span className="bg-white px-2 py-1 rounded border text-xs">
                  <strong className="text-gray-900">{l0Stats.totalDays}</strong> 天历史
                </span>
                <span className="bg-white px-2 py-1 rounded border text-xs">
                  <strong className="text-gray-900">{l0Stats.todayMessages}</strong> 今日消息
                </span>
                <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100 text-xs">
                  <strong className="text-blue-600">{l0Stats.todayUserMessages}</strong> 用户
                </span>
                <span className="bg-green-50 px-2 py-1 rounded border border-green-100 text-xs">
                  <strong className="text-green-600">{l0Stats.todayAiMessages}</strong> AI
                </span>
              </>
            )}
            {searchTerm && (
              <span className="bg-yellow-50 px-2 py-1 rounded border border-yellow-200 text-xs text-yellow-700">
                搜索: <strong>{filteredMessages.length}</strong> / {l0Messages.length} 条
              </span>
            )}
          </div>
          
          {/* 展开/折叠按钮 */}
          {!isLoading && Object.keys(groupedBySession).length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={expandAll}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                展开全部
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={collapseAll}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                折叠全部
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 min-h-[400px] max-h-[600px]">
        {isLoading ? (
          // 加载状态
          <div className="p-4 space-y-3">
            <ListSkeleton count={5} />
          </div>
        ) : filteredMessages.length === 0 ? (
          // 空状态
          searchTerm ? (
            <EmptySearch 
              keyword={searchTerm} 
              onClear={clearSearch}
              className="m-4"
            />
          ) : (
            <EmptyState
              icon="💬"
              title="暂无消息"
              description={
                filter !== 'all' 
                  ? `当前筛选条件下没有${filter === 'user' ? '用户' : 'AI'}消息`
                  : '选择其他日期或稍后再试'
              }
              action={filter !== 'all' ? {
                label: '显示全部',
                onClick: () => setFilter('all'),
                variant: 'secondary'
              } : undefined}
              size="md"
              className="m-4"
            />
          )
        ) : (
          // 消息列表（使用虚拟滚动优化）
          <div className="divide-y">
            {/* 当消息数超过50条时使用虚拟滚动 */}
            {totalMessages > 50 ? (
              <SimpleVirtualList
                items={filteredMessages}
                renderItem={(msg, index) => renderMessageItem(msg, index)}
                itemHeight={80} // 预估每项高度
                height={550}
                keyExtractor={(msg, index) => `${msg.ts}-${index}`}
              />
            ) : (
              // 少量消息直接渲染
              filteredMessages.map((msg, index) => renderMessageItem(msg, index))
            )}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span>L0 实时层 - 原始对话数据</span>
          {totalMessages > 0 && (
            <span className="text-gray-400">共 {totalMessages} 条消息</span>
          )}
        </div>
        <span>
          最后更新: {l0Stats?.lastUpdated ? formatTime(l0Stats.lastUpdated) : '从未'}
          {autoRefresh && <span className="ml-2 text-green-600">● 自动刷新中</span>}
        </span>
      </div>
    </div>
  );
}