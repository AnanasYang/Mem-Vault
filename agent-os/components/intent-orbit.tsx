'use client';

import { motion } from 'framer-motion';
import { Target, Clock, CheckCircle2 } from 'lucide-react';

interface IntentOrbitProps {
  compact?: boolean;
}

export function IntentOrbit({ compact = false }: IntentOrbitProps) {
  const intents = [
    { id: 1, title: 'Complete VLM project documentation', progress: 0.75, deadline: '2026-04-15', priority: 'high' },
    { id: 2, title: 'Build personal AI assistant infrastructure', progress: 0.60, deadline: '2026-08-31', priority: 'high' },
    { id: 3, title: 'Streamline data pipeline automation', progress: 0.55, deadline: '2026-06-30', priority: 'medium' },
    { id: 4, title: 'Complete MoE architecture deep-dive', progress: 0.30, deadline: '2026-07-15', priority: 'medium' },
  ];

  return (
    <div className="space-y-4">
      {intents.map((intent, index) => (
        <motion.div
          key={intent.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">{intent.title}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {intent.deadline}
                </span>
                <span className={`px-2 py-0.5 rounded ${
                  intent.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {intent.priority}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{(intent.progress * 100).toFixed(0)}%</div>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${intent.progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {!compact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-500 mt-4"
        >
          <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-500" />
          4 个活跃目标，总体进度 55%
        </motion.div>
      )}
    </div>
  );
}
