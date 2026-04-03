/**
 * 通知系统
 * 使用 Browser Notification API 提醒新候选
 */

interface NotificationConfig {
  enabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily';
  sound: boolean;
  desktop: boolean;
}

interface NewCandidateAlert {
  id: string;
  name: string;
  description: string;
  confidence: number;
  level: 'L2' | 'L3';
  timestamp: string;
}

const CONFIG_KEY = 'memory-candidates-notification-config';

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  frequency: 'immediate',
  sound: true,
  desktop: true,
};

/**
 * 获取通知配置
 */
export function getNotificationConfig(): NotificationConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load notification config:', e);
  }
  
  return DEFAULT_CONFIG;
}

/**
 * 保存通知配置
 */
export function saveNotificationConfig(config: Partial<NotificationConfig>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const current = getNotificationConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save notification config:', e);
  }
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Failed to request notification permission:', e);
    return false;
  }
}

/**
 * 检查是否有通知权限
 */
export function hasNotificationPermission(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * 发送候选通知
 */
export async function notifyNewCandidate(candidate: NewCandidateAlert): Promise<void> {
  const config = getNotificationConfig();
  
  if (!config.enabled) return;
  if (!config.desktop) return;
  
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const title = `新的 ${candidate.level} 候选: ${candidate.name}`;
  const body = `${candidate.description}\n置信度: ${(candidate.confidence * 100).toFixed(1)}%`;
  
  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `candidate-${candidate.id}`,
      requireInteraction: true,
      data: {
        candidateId: candidate.id,
        level: candidate.level,
        url: '/review',
      },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/review';
      notification.close();
    };

    // 播放提示音（如果启用）
    if (config.sound) {
      playNotificationSound();
    }
  } catch (e) {
    console.error('Failed to show notification:', e);
  }
}

/**
 * 播放提示音
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // 使用简单的 beep 声音
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error('Failed to play notification sound:', e);
  }
}

/**
 * 批量通知（用于页面加载时检查新候选）
 */
export async function notifyMultipleCandidates(candidates: NewCandidateAlert[]): Promise<void> {
  if (candidates.length === 0) return;
  
  const config = getNotificationConfig();
  if (!config.enabled || !config.desktop) return;
  
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  if (candidates.length === 1) {
    await notifyNewCandidate(candidates[0]);
    return;
  }

  // 多个候选时发送汇总通知
  const title = `${candidates.length} 个新的记忆候选待确认`;
  const body = candidates
    .slice(0, 3)
    .map(c => `• ${c.name} (${c.level})`)
    .join('\n');
  
  try {
    const notification = new Notification(title, {
      body: candidates.length > 3 ? `${body}\n...还有 ${candidates.length - 3} 个` : body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'candidates-batch',
      data: { url: '/review' },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/review';
      notification.close();
    };
  } catch (e) {
    console.error('Failed to show batch notification:', e);
  }
}

/**
 * 监听新的候选（使用 BroadcastChannel 或轮询）
 */
export function startCandidateWatcher(
  onNewCandidates: (candidates: NewCandidateAlert[]) => void,
  intervalMs: number = 60000
): () => void {
  if (typeof window === 'undefined') return () => {};

  let lastCheck = Date.now();
  
  const checkNewCandidates = async () => {
    try {
      const response = await fetch('/api/candidates?since=' + lastCheck);
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        onNewCandidates(data.candidates);
        
        // 发送通知
        const config = getNotificationConfig();
        if (config.frequency === 'immediate') {
          await notifyMultipleCandidates(data.candidates);
        }
      }
      
      lastCheck = Date.now();
    } catch (e) {
      console.error('Failed to check new candidates:', e);
    }
  };

  // 初始检查
  checkNewCandidates();
  
  // 定时检查
  const interval = setInterval(checkNewCandidates, intervalMs);
  
  // 返回清理函数
  return () => clearInterval(interval);
}

/**
 * 显示浏览器 toast 提示（无需权限）
 */
export function showToast(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  duration: number = 3000
): void {
  if (typeof window === 'undefined') return;
  
  // 创建 toast 元素
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 animate-fade-in`;
  
  const colors = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-600 text-white',
  };
  
  toast.classList.add(...colors[type].split(' '));
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
