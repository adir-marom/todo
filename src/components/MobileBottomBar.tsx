import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { slideUpVariants, buttonTapScale } from '@/lib/motion';

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
    <motion.div
      variants={slideUpVariants}
      initial="initial"
      animate="animate"
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
    >
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleCollapse}
          />
        )}
      </AnimatePresence>
      
      {/* Bottom bar */}
      <div className={cn(
        "relative bg-background border-t shadow-lg",
        isExpanded ? "pb-safe" : "pb-safe"
      )}>
        <AnimatePresence mode="wait">
          {isExpanded ? (
            // Expanded input form
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="p-3"
            >
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
                    className="h-11 px-4 flex-shrink-0"
                    disabled={!value.trim()}
                  >
                    Add
                  </Button>
                </motion.div>
              </div>
            </motion.form>
          ) : (
            // Collapsed FAB-style button
            <motion.div
              key="fab"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center p-3"
            >
              <motion.div
                whileTap={buttonTapScale}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  onClick={handleExpand}
                  size="lg"
                  className="h-12 px-6 rounded-full shadow-md gap-2"
                  aria-label="Add new task"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Task</span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
