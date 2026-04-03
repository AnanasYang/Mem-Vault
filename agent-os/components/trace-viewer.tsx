'use client';

import React, { useState, useCallback } from 'react';

// ==================== 类型定义 ====================

interface TraceNode {
  level: string;
  memory_id: string;
  title?: string;
  timestamp?: string;
  sources?: {
    session_ids?: string[];
    message_count?: number;
    timestamp_range?: {
      start?: string;
      end?: string;
    };
  };
  relation: 'source' | 'derived' | 'reference';
  confidence?: string;
}

interface TraceResult {
  from: {
    memory_id: string;
    level: string;
    found: boolean;
    path?: string;
    frontmatter?: Record<string, any>;
  };
  to: {
    level: string;
  };
  trace_chain: TraceNode[];
  metadata: {
    timestamp: string;
    query_time_ms: number;
  };
}

// ==================== TraceButton 组件 ====================

interface TraceButtonProps {
  memoryId: string;
  targetLevel?: 'L0' | 'L1' | 'L2' | 'L3';
  onTrace?: (result: TraceResult) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TraceButton({ 
  memoryId, 
  targetLevel = 'L0', 
  onTrace, 
  className = '',
  size = 'md' 
}: TraceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleTrace = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trace?from=${encodeURIComponent(memoryId)}&to=${targetLevel}`);
      const result: TraceResult = await response.json();
      
      if (onTrace) {
        onTrace(result);
      }
    } catch (error) {
      console.error('Trace failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [memoryId, targetLevel, onTrace]);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <button
      onClick={handleTrace}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-1.5
        bg-indigo-50 hover:bg-indigo-100
        text-indigo-700 font-medium
        rounded-md border border-indigo-200
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
      title={`追溯至 ${targetLevel} 层`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>追溯中...</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span>溯源</span>
        </>
      )}
    </button>
  );
}

// ==================== TraceModal 组件 ====================

interface TraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  traceResult?: TraceResult | null;
}

export function TraceModal({ isOpen, onClose, traceResult }: TraceModalProps) {
  if (!isOpen || !traceResult) return null;

  const { from, to, trace_chain, metadata } = traceResult;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'L0': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'L1': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'L2': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'L3': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'L4': return 'bg-rose-50 text-rose-800 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'L0': return 'L0 实时层';
      case 'L1': return 'L1 情景层';
      case 'L2': return 'L2 程序层';
      case 'L3': return 'L3 语义层';
      case 'L4': return 'L4 核心层';
      default: return level;
    }
  };

  const getRelationIcon = (relation: string) => {
    switch (relation) {
      case 'source':
        return '●';
      case 'derived':
        return '▼';
      case 'reference':
        return '↳';
      default:
        return '•';
    }
  };

  const getRelationLabel = (relation: string) => {
    switch (relation) {
      case 'source':
        return '起点';
      case 'derived':
        return '派生';
      case 'reference':
        return '引用';
      default:
        return relation;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">记忆溯源</h3>
              <p className="text-sm text-gray-500">
                {getLevelName(from.level)} → {getLevelName(to.level)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {!from.found ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">未找到记忆</h4>
              <p className="text-gray-500">Memory ID: {from.memory_id}</p>
            </div>
          ) : (
            <>
              {/* 溯源链 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">溯源链条</h4>
                <div className="space-y-3">
                  {trace_chain.map((node, index) => (
                    <div key={`${node.memory_id}-${index}`} className="relative">
                      {/* 连接线 */}
                      {index < trace_chain.length - 1 && (
                        <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-200" />
                      )}
                      
                      <div className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
                        {/* 层级标签 */}
                        <div className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium border ${getLevelColor(node.level)}`}>
                          {node.level}
                        </div>
                        
                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {node.title || node.memory_id}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              node.relation === 'source' ? 'bg-indigo-50 text-indigo-600' :
                              node.relation === 'derived' ? 'bg-green-50 text-green-600' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {getRelationIcon(node.relation)} {getRelationLabel(node.relation)}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="font-mono">{node.memory_id}</div>
                            {node.timestamp && (
                              <div>
                                {new Date(node.timestamp).toLocaleString('zh-CN')}
                              </div>
                            )}
                            {node.confidence && (
                              <div className="capitalize">置信度: {node.confidence}</div>
                            )}
                          </div>
                          
                          {/* L0 源信息详情 */}
                          {node.level === 'L0' && node.sources && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs">
                              <div className="font-medium text-gray-700 mb-2">L0 源信息</div>
                              {node.sources.message_count !== undefined && (
                                <div className="text-gray-600">
                                  消息数: <span className="font-medium">{node.sources.message_count}</span>
                                </div>
                              )}
                              {node.sources.session_ids && node.sources.session_ids.length > 0 && (
                                <div className="text-gray-600 mt-1">
                                  会话数: <span className="font-medium">{node.sources.session_ids.length}</span>
                                </div>
                              )}
                              {node.sources.timestamp_range && (
                                <div className="text-gray-600 mt-1">
                                  时间范围:
                                  <div className="ml-2 text-gray-500">
                                    {node.sources.timestamp_range.start && (
                                      <div>开始: {new Date(node.sources.timestamp_range.start).toLocaleString('zh-CN')}</div>
                                    )}
                                    {node.sources.timestamp_range.end && (
                                      <div>结束: {new Date(node.sources.timestamp_range.end).toLocaleString('zh-CN')}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frontmatter 详情 */}
              {from.frontmatter && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">源记忆元数据</h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(from.frontmatter).map(([key, value]) => (
                          <tr key={key}>
                            <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">{key}</td>
                            <td className="py-2 text-gray-700">
                              {typeof value === 'object' ? (
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                String(value)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            查询耗时: {metadata.query_time_ms}ms
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TraceViewer 主组件 ====================

interface TraceViewerProps {
  memoryId: string;
  memoryLevel?: string;
  showButton?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
}

export default function TraceViewer({ 
  memoryId, 
  memoryLevel = 'L1',
  showButton = true,
  buttonSize = 'md'
}: TraceViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);

  const handleTrace = useCallback((result: TraceResult) => {
    setTraceResult(result);
    setIsModalOpen(true);
  }, []);

  // 根据当前层级确定默认追溯目标
  const getDefaultTargetLevel = () => {
    switch (memoryLevel) {
      case 'L1': return 'L0';
      case 'L2': return 'L1';
      case 'L3': return 'L2';
      default: return 'L0';
    }
  };

  return (
    <>
      {showButton && (
        <TraceButton
          memoryId={memoryId}
          targetLevel={getDefaultTargetLevel() as 'L0' | 'L1' | 'L2' | 'L3'}
          onTrace={handleTrace}
          size={buttonSize}
        />
      )}
      
      <TraceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        traceResult={traceResult}
      />
    </>
  );
}

// ==================== 导出 ====================

export { TraceButton, TraceModal };
export type { TraceResult, TraceNode };
