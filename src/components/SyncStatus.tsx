import { motion } from 'framer-motion';
import { CloudOff, Loader2, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { breathingVariants } from '@/lib/motion';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncStatusProps {
  state: SyncState;
  lastSyncedAt?: Date | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  className?: string;
}

const SYNC_CONFIG: Record<SyncState, { 
  icon: typeof Check; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  synced: {
    icon: Check,
    label: 'Saved',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  syncing: {
    icon: Loader2,
    label: 'Saving...',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  offline: {
    icon: CloudOff,
    label: 'Offline',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  error: {
    icon: AlertCircle,
    label: 'Sync failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
};

export function SyncStatus({
  state,
  lastSyncedAt,
  errorMessage,
  onRetry,
  onRefresh,
  className,
}: SyncStatusProps) {
  const config = SYNC_CONFIG[state];
  const Icon = config.icon;

  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 10) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        config.bgColor,
        config.color,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon 
        className={cn(
          "h-3.5 w-3.5",
          state === 'syncing' && "animate-spin"
        )} 
      />
      <span>{config.label}</span>
      
      {state === 'synced' && lastSyncedAt && (
        <span className="opacity-70">
          {getRelativeTime(lastSyncedAt)}
        </span>
      )}
      
      {state === 'error' && (
        <div className="flex items-center gap-1.5 ml-1">
          {errorMessage && (
            <span className="max-w-[150px] truncate opacity-80" title={errorMessage}>
              {errorMessage}
            </span>
          )}
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
        </div>
      )}
      
      {state === 'offline' && onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/30"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Compact inline version for header
export function SyncStatusCompact({
  state,
  className,
}: Pick<SyncStatusProps, 'state' | 'className'>) {
  const config = SYNC_CONFIG[state];
  const Icon = config.icon;

  return (
    <motion.div
      variants={breathingVariants}
      animate={state === 'syncing' ? 'animate' : undefined}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full transition-all",
        config.bgColor,
        config.color,
        className
      )}
      role="status"
      aria-label={config.label}
      title={config.label}
    >
      <Icon 
        className={cn(
          "h-3.5 w-3.5",
          state === 'syncing' && "animate-spin"
        )} 
      />
    </motion.div>
  );
}
