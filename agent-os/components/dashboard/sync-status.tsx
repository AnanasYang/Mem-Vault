'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncStatusProps {
  status: 'synced' | 'pending' | 'error';
  lastSync: string;
}

export function SyncStatus({ status, lastSync }: SyncStatusProps) {
  const config = {
    synced: { icon: CheckCircle, color: 'text-green-500', text: '已同步' },
    pending: { icon: RefreshCw, color: 'text-yellow-500', text: '待同步' },
    error: { icon: AlertCircle, color: 'text-red-500', text: '同步错误' }
  }[status];
  
  const Icon = config.icon;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">同步状态</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className="font-medium">{config.text}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">最后同步: {lastSync}</p>
      </CardContent>
    </Card>
  );
}
