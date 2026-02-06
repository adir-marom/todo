import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function ProgressBar({ completed, total, className }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;

  return (
    <div className={cn("space-y-1.5 sm:space-y-2", className)}>
      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
            <Circle className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span>{remaining} left</span>
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5 text-[#2D5A4A] dark:text-[#A8E6CF]">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            <span>{completed} done</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
            Completed this list
          </span>
          <span className="font-medium tabular-nums" aria-label={`${percentage}% complete`}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="h-1.5 sm:h-2 w-full bg-secondary rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Task progress: ${completed} of ${total} tasks completed`}
      >
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            percentage === 100 
              ? "bg-[#A8E6CF]" 
              : percentage >= 50 
                ? "bg-primary" 
                : "bg-primary/70"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Completion Message */}
      {percentage === 100 && total > 0 && (
        <p className="text-xs sm:text-sm text-[#2D5A4A] dark:text-[#A8E6CF] font-medium">
          All tasks completed!
        </p>
      )}
    </div>
  );
}
