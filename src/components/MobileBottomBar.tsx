import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={handleCollapse}
        />
      )}
      
      {/* Bottom bar */}
      <div className={cn(
        "relative bg-background border-t shadow-lg transition-all duration-200",
        isExpanded ? "pb-safe" : "pb-safe"
      )}>
        {isExpanded ? (
          // Expanded input form
          <form onSubmit={handleSubmit} className="p-3">
            <div className="flex items-center gap-2">
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
              <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="What needs to be done?"
                className="h-11 text-base flex-1"
                aria-label="Task name"
              />
              <Button
                type="submit"
                size="default"
                className="h-11 px-4 flex-shrink-0"
                disabled={!value.trim()}
              >
                Add
              </Button>
            </div>
          </form>
        ) : (
          // Collapsed FAB-style button
          <div className="flex justify-center p-3">
            <Button
              onClick={handleExpand}
              size="lg"
              className="h-12 px-6 rounded-full shadow-md gap-2"
              aria-label="Add new task"
            >
              <Plus className="h-5 w-5" />
              <span>Add Task</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
