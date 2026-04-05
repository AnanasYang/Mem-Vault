'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Bot, Search } from 'lucide-react';

interface L0Memory {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface L0MemoryListProps {
  compact?: boolean;
}

export function L0MemoryList({ compact = false }: L0MemoryListProps) {
  const [filter, setFilter] = useState<'all' | 'user' | 'assistant'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 模拟 L0 记忆数据
  const memories: L0Memory[] = [
    { 
      id: '1', 
      role: 'user', 
      content: '分析一下当前的 memory os 系统', 
      timestamp: '2026-04-03 14:30' 
    },
    { 
      id: '2', 
      role: 'assistant', 
      content: '系统评估完成。Memory System 2.0 运行正常，所有组件功能完整。', 
      timestamp: '2026-04-03 14:31' 
    },
    { 
      id: '3', 
      role: 'user', 
      content: '执行方案1修复所有问题', 
      timestamp: '2026-04-03 14:35' 
    },
    { 
      id: '4', 
      role: 'assistant', 
      content: '正在修复组件问题和推送代码...', 
      timestamp: '2026-04-03 14:36' 
    },
    { 
      id: '5', 
      role: 'user', 
      content: '这个信息太简单了，之前第一版memory os那么丰富', 
      timestamp: '2026-04-03 15:19' 
    },
  ];

  const filteredMemories = memories.filter(m => {
    if (filter !== 'all' && m.role !== filter) return false;
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* 筛选器 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {(['all', 'user', 'assistant'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === type 
                  ? 'bg-white dark:bg-slate-600 shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              {type === 'all' ? '全部' : type === 'user' ? '用户' : 'AI'}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 消息列表 */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredMemories.map((memory, index) => (
          <motion.div
            key={memory.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex gap-3 p-2 rounded-lg ${
              memory.role === 'user' 
                ? 'bg-blue-50 dark:bg-blue-900/20' 
                : 'bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              memory.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
            }`}>
              {memory.role === 'user' ? (
                <User className="w-3 h-3 text-white" />
              ) : (
                <Bot className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {memory.role === 'user' ? 'Bruce' : '小爪'}
                </span>
                <span className="text-xs text-gray-400">{memory.timestamp}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {memory.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="text-center text-sm text-gray-400 py-4">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          暂无匹配的记忆
        </div>
      )}
    </div>
  );
}
