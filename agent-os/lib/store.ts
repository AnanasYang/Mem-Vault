/**
 * Agent OS Store
 * 统一状态管理 - 连接真实 ai-memory-system 数据
 * 
 * 替代原有的 mock 数据，直接读取文件系统
 * 更新: 添加溯源 (Trace) 功能支持
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ==================== 类型定义 ====================

export interface L0Message {
  ts: string;
  role: 'user' | 'assistant' | 'toolResult';
  content: string;
  sessionId: string;
}

export interface L0Stats {
  totalDays: number;
  todayMessages: number;
  todayUserMessages: number;
  todayAiMessages: number;
  lastUpdated: string | null;
}

export interface L1Memory {
  id: string;
  filename: string;
  path: string;
  created: string;
  level: 'L1';
  category: string;
  confidence: string;
  l2Candidates: number;
  content: string;
  frontmatter: Record<string, any>;
  memoryId?: string;
}

export interface L2Memory {
  id: string;
  filename: string;
  path: string;
  created: string;
  updated?: string;
  level: 'L2';
  category: string;
  confidence: string;
  content: string;
  frontmatter: Record<string, any>;
}

export interface L3Memory {
  id: string;
  filename: string;
  path: string;
  created: string;
  updated?: string;
  level: 'L3';
  category: string;
  confidence: string;
  content: string;
  frontmatter: Record<string, any>;
}

export interface L4Core {
  id: string;
  path: string;
  level: 'L4';
  content: string;
  frontmatter: Record<string, any>;
}

// 溯源相关类型
export interface TraceNode {
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

export interface TraceResult {
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

export interface MemoryLevelStatus {
  status: 'active' | 'empty' | 'error';
  count?: number;
  stats?: L0Stats;
  description: string;
  recent?: any[];
}

export interface MemoryOverview {
  timestamp: string;
  levels: {
    L0: MemoryLevelStatus;
    L1: MemoryLevelStatus;
    L2: MemoryLevelStatus;
    L3: MemoryLevelStatus;
    L4: MemoryLevelStatus;
  };
}

// ==================== Store 状态 ====================

interface AgentOSState {
  // 数据状态
  l0Messages: L0Message[];
  l0Dates: string[];
  l0Stats: L0Stats | null;
  l1Memories: L1Memory[];
  l2Memories: L2Memory[];
  l3Memories: L3Memory[];
  l4Core: L4Core | null;
  overview: MemoryOverview | null;
  
  // 溯源状态
  currentTrace: TraceResult | null;
  isTracing: boolean;
  
  // UI 状态
  selectedDate: string;
  selectedL1Id: string | null;
  selectedL2Id: string | null;
  selectedL3Id: string | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  
  // 自动刷新
  autoRefresh: boolean;
  refreshInterval: number;
}

interface AgentOSActions {
  // 数据获取
  fetchL0ByDate: (date?: string) => Promise<void>;
  fetchL0Dates: () => Promise<void>;
  fetchL0Stats: () => Promise<void>;
  fetchL1Memories: () => Promise<void>;
  fetchL2Memories: () => Promise<void>;
  fetchL3Memories: () => Promise<void>;
  fetchL4Core: () => Promise<void>;
  fetchOverview: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // 溯源功能
  traceMemory: (memoryId: string, targetLevel?: 'L0' | 'L1' | 'L2' | 'L3') => Promise<TraceResult | null>;
  clearTrace: () => void;
  
  // 选择操作
  selectDate: (date: string) => void;
  selectL1: (id: string | null) => void;
  selectL2: (id: string | null) => void;
  selectL3: (id: string | null) => void;
  
  // 设置
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (ms: number) => void;
  clearError: () => void;
}

// ==================== API 基础路径 ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// ==================== Store 创建 ====================

export const useAgentOSStore = create<
  AgentOSState & AgentOSActions
>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 初始状态
      l0Messages: [],
      l0Dates: [],
      l0Stats: null,
      l1Memories: [],
      l2Memories: [],
      l3Memories: [],
      l4Core: null,
      overview: null,
      
      // 溯源状态
      currentTrace: null,
      isTracing: false,
      
      selectedDate: new Date().toISOString().split('T')[0],
      selectedL1Id: null,
      selectedL2Id: null,
      selectedL3Id: null,
      isLoading: false,
      error: null,
      lastRefresh: null,
      
      autoRefresh: false,
      refreshInterval: 30000, // 30秒

      // ==================== L0 层操作 ====================
      
      fetchL0ByDate: async (date?: string) => {
        const targetDate = date || get().selectedDate;
        set(state => { state.isLoading = true; state.error = null; });
        
        try {
          const response = await fetch(`${API_BASE}/l0?date=${targetDate}`);
          if (!response.ok) throw new Error('Failed to fetch L0 data');
          const data = await response.json();
          
          set(state => {
            state.l0Messages = data;
            state.selectedDate = targetDate;
            state.isLoading = false;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      fetchL0Dates: async () => {
        try {
          const response = await fetch(`${API_BASE}/l0/dates`);
          if (!response.ok) throw new Error('Failed to fetch L0 dates');
          const data = await response.json();
          
          set(state => {
            state.l0Dates = data;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
          });
        }
      },

      fetchL0Stats: async () => {
        try {
          const response = await fetch(`${API_BASE}/l0/stats`);
          if (!response.ok) throw new Error('Failed to fetch L0 stats');
          const data = await response.json();
          
          set(state => {
            state.l0Stats = data;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
          });
        }
      },

      // ==================== L1 层操作 ====================
      
      fetchL1Memories: async () => {
        set(state => { state.isLoading = true; state.error = null; });
        
        try {
          const response = await fetch(`${API_BASE}/l1`);
          if (!response.ok) throw new Error('Failed to fetch L1 memories');
          const data = await response.json();
          
          set(state => {
            state.l1Memories = data;
            state.isLoading = false;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      // ==================== L2 层操作 ====================
      
      fetchL2Memories: async () => {
        set(state => { state.isLoading = true; state.error = null; });
        
        try {
          const response = await fetch(`${API_BASE}/l2`);
          if (!response.ok) throw new Error('Failed to fetch L2 memories');
          const data = await response.json();
          
          set(state => {
            state.l2Memories = data;
            state.isLoading = false;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      // ==================== L3 层操作 ====================
      
      fetchL3Memories: async () => {
        set(state => { state.isLoading = true; state.error = null; });
        
        try {
          const response = await fetch(`${API_BASE}/l3`);
          if (!response.ok) throw new Error('Failed to fetch L3 memories');
          const data = await response.json();
          
          set(state => {
            state.l3Memories = data;
            state.isLoading = false;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      // ==================== L4 层操作 ====================
      
      fetchL4Core: async () => {
        try {
          const response = await fetch(`${API_BASE}/l4`);
          if (!response.ok) throw new Error('Failed to fetch L4 core');
          const data = await response.json();
          
          set(state => {
            state.l4Core = data;
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
          });
        }
      },

      // ==================== 概览操作 ====================
      
      fetchOverview: async () => {
        set(state => { state.isLoading = true; state.error = null; });
        
        try {
          const response = await fetch(`${API_BASE}/overview`);
          if (!response.ok) throw new Error('Failed to fetch overview');
          const data = await response.json();
          
          set(state => {
            state.overview = data;
            state.isLoading = false;
            state.lastRefresh = new Date();
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      // ==================== 溯源功能 ====================
      
      traceMemory: async (memoryId: string, targetLevel: 'L0' | 'L1' | 'L2' | 'L3' = 'L0') => {
        set(state => { state.isTracing = true; state.error = null; });
        
        try {
          const response = await fetch(`${API_BASE}/trace?from=${encodeURIComponent(memoryId)}&to=${targetLevel}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Trace failed');
          }
          
          const data: TraceResult = await response.json();
          
          set(state => {
            state.currentTrace = data;
            state.isTracing = false;
          });
          
          return data;
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isTracing = false;
          });
          return null;
        }
      },
      
      clearTrace: () => {
        set(state => {
          state.currentTrace = null;
        });
      },

      // ==================== 批量刷新 ====================
      
      refreshAll: async () => {
        set(state => { state.isLoading = true; state.error = null; });
        
        try {
          await Promise.all([
            get().fetchL0Dates(),
            get().fetchL0ByDate(),
            get().fetchL0Stats(),
            get().fetchL1Memories(),
            get().fetchL2Memories(),
            get().fetchL3Memories(),
            get().fetchL4Core(),
            get().fetchOverview(),
          ]);
          
          set(state => {
            state.isLoading = false;
            state.lastRefresh = new Date();
          });
        } catch (err) {
          set(state => {
            state.error = err instanceof Error ? err.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      // ==================== 选择操作 ====================
      
      selectDate: (date: string) => {
        set(state => {
          state.selectedDate = date;
        });
        get().fetchL0ByDate(date);
      },

      selectL1: (id: string | null) => {
        set(state => {
          state.selectedL1Id = id;
        });
      },

      selectL2: (id: string | null) => {
        set(state => {
          state.selectedL2Id = id;
        });
      },

      selectL3: (id: string | null) => {
        set(state => {
          state.selectedL3Id = id;
        });
      },

      // ==================== 设置 ====================
      
      setAutoRefresh: (enabled: boolean) => {
        set(state => {
          state.autoRefresh = enabled;
        });
      },

      setRefreshInterval: (ms: number) => {
        set(state => {
          state.refreshInterval = ms;
        });
      },

      clearError: () => {
        set(state => {
          state.error = null;
        });
      },
    }))
  )
);

// ==================== 自动刷新 Hook ====================

import { useEffect } from 'react';

export function useAutoRefresh() {
  const { autoRefresh, refreshInterval, refreshAll } = useAgentOSStore();

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAll();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAll]);
}

// ==================== 选择器 ====================

export const selectL0Messages = (state: AgentOSState) => state.l0Messages;
export const selectL0Stats = (state: AgentOSState) => state.l0Stats;
export const selectL1Memories = (state: AgentOSState) => state.l1Memories;
export const selectL2Memories = (state: AgentOSState) => state.l2Memories;
export const selectL3Memories = (state: AgentOSState) => state.l3Memories;
export const selectOverview = (state: AgentOSState) => state.overview;
export const selectIsLoading = (state: AgentOSState) => state.isLoading;
export const selectCurrentTrace = (state: AgentOSState) => state.currentTrace;
export const selectIsTracing = (state: AgentOSState) => state.isTracing;
