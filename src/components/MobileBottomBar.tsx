import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buttonTapScale } from '@/lib/motion';

interface MobileBottomBarProps {
  onAdd: (name: string) => void;
}

export function MobileBottomBar({ onAdd }: MobileBottomBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      setIsExpanded(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setValue('');
  };

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle escape key to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleCollapse();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div className="md:hidden">
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={handleCollapse}
          />
        )}
      </AnimatePresence>

      {/* Expanded input form at bottom */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          >
            <form onSubmit={handleSubmit} className="p-3">
              <div className="flex items-center gap-2">
                <motion.div whileTap={buttonTapScale}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                    onClick={handleCollapse}
                    aria-label="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </motion.div>
                <Input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="What needs to be done?"
                  className="h-11 text-base flex-1"
                  aria-label="Task name"
                />
                <motion.div whileTap={buttonTapScale}>
                  <Button
                    type="submit"
                    size="default"
                    className="h-11 px-5 flex-shrink-0"
                    disabled={!value.trim()}
                  >
                    Add
                  </Button>
                </motion.div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button — always visible, bottom-right */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-4 z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleExpand}
              className={cn(
                "h-14 w-14 rounded-full shadow-lg flex items-center justify-center",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 active:bg-primary/80",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              aria-label="Add new task"
            >
              <Plus className="h-6 w-6" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
