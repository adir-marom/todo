import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buttonTapScale } from '@/lib/motion';

interface UndoToastProps {
  label: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number; // Auto-dismiss duration in ms
  className?: string;
}

export function UndoToast({ label, onUndo, onDismiss, duration = 5000, className }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  // Animate progress bar countdown
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        "fixed bottom-20 md:bottom-6 left-1/2 z-50",
        "flex flex-col rounded-lg shadow-lg overflow-hidden",
        "bg-foreground text-background",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-sm font-medium max-w-[200px] truncate">
          {label}
        </span>
        <motion.div whileTap={buttonTapScale}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1.5 text-background hover:bg-background/20 hover:text-background"
            onClick={onUndo}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </Button>
        </motion.div>
        <motion.div whileTap={buttonTapScale}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-background/70 hover:bg-background/20 hover:text-background"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-background/20">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}
