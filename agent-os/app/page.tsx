'use client';

import { motion } from 'framer-motion';
import { MemoryGalaxy } from '@/components/memory-galaxy';
import { IntentOrbit } from '@/components/intent-orbit';
import { L0MemoryList } from '@/components/l0-memory-list';
import { 
  Brain, 
  Target, 
  Activity, 
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// 模拟数据
const memoryStats = {
  l1Count: 5,
  l2Count: 4,
  l3Count: 2,
  l4Count: 1,
  weeklyReviews: 5
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Memory System 2.0
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              五层记忆架构 - L0-L4 完整流转
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>系统运行正常</span>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <StatCard 
            title="L1 情境记忆" 
            value={memoryStats.l1Count} 
            subtitle="近期对话摘要" 
            color="text-blue-500"
          />
          <StatCard 
            title="L2 行为模式" 
            value={memoryStats.l2Count} 
            subtitle="习惯与偏好" 
            color="text-amber-500"
          />
          <StatCard 
            title="L3 认知框架" 
            value={memoryStats.l3Count} 
            subtitle="思维模式" 
            color="text-purple-500"
          />
          <StatCard 
            title="L4 核心价值观" 
            value={memoryStats.l4Count} 
            subtitle="身份认同" 
            color="text-red-500"
          />
          <StatCard 
            title="每周复盘" 
            value={memoryStats.weeklyReviews} 
            subtitle="历史记录" 
            color="text-green-500"
          />
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memory Galaxy Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 border rounded-lg overflow-hidden shadow-sm"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <h2 className="font-semibold">记忆星系</h2>
              </div>
              <Link 
                href="/memory" 
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-80 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <MemoryGalaxy compact />
            </div>
          </motion.div>

          {/* Intent Orbit Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 border rounded-lg overflow-hidden shadow-sm"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold">意图轨道</h2>
              </div>
              <Link 
                href="/intent" 
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4 h-80">
              <IntentOrbit compact />
            </div>
          </motion.div>

          {/* L0 Memory List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 border rounded-lg overflow-hidden shadow-sm"
          >
            <div className="p-4 border-b flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold">工作记忆 (L0)</h2>
            </div>
            <div className="p-4 max-h-80 overflow-auto">
              <L0MemoryList compact />
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 border rounded-lg overflow-hidden shadow-sm"
          >
            <div className="p-4 border-b flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <h2 className="font-semibold">系统状态</h2>
            </div>
            <div className="p-4 space-y-4">
              <StatusItem 
                label="Daily Dream" 
                status="正常运行" 
                time="今天 23:00"
                color="green"
              />
              <StatusItem 
                label="Weekly Dream" 
                status="正常运行" 
                time="周日 22:00"
                color="green"
              />
              <StatusItem 
                label="GitHub 同步" 
                status="已连接" 
                time="刚刚"
                color="blue"
              />
              <StatusItem 
                label="自动归档" 
                status="正常运行" 
                time="每天 00:00"
                color="green"
              />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border rounded-lg p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">系统健康良好</h3>
              <p className="text-sm text-gray-500">
                所有组件正常运行，记忆流转机制完整。建议定期进行 Weekly Review。
              </p>
              <div className="flex gap-3 mt-3">
                <Link 
                  href="/insights" 
                  className="text-sm text-blue-500 hover:underline"
                >
                  查看洞察 →
                </Link>
                <Link 
                  href="/search" 
                  className="text-sm text-blue-500 hover:underline"
                >
                  搜索记忆 →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// 统计卡片组件
function StatCard({ title, value, subtitle, color }: {
  title: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

// 状态项组件
function StatusItem({ label, status, time, color }: {
  label: string;
  status: string;
  time: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
}) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${colorClasses[color]}`} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{status}</div>
        <div className="text-xs text-gray-400">{time}</div>
      </div>
    </div>
  );
}
