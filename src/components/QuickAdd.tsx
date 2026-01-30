import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { pulseVariants, buttonTapScale } from '@/lib/motion';

interface QuickAddProps {
  onAdd: (name: string) => void;
  placeholder?: string;
}

export function QuickAdd({ onAdd, placeholder = "Quick add a task..." }: QuickAddProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setValue('');
      inputRef.current?.blur();
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + K to focus quick add
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <motion.div
        variants={pulseVariants}
        initial="initial"
        animate={isFocused ? "pulse" : "initial"}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border bg-card transition-all",
          isFocused && "ring-2 ring-ring ring-offset-2 ring-offset-background"
        )}
      >
        <motion.div
          animate={{
            scale: isFocused ? 1.1 : 1,
            rotate: isFocused ? [0, -10, 10, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <Zap className={cn(
            "h-4 w-4 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} />
        </motion.div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8 text-sm"
          aria-label="Quick add task"
        />
        <motion.div
          whileTap={buttonTapScale}
          whileHover={{ scale: 1.02 }}
        >
          <Button 
            type="submit" 
            size="sm"
            disabled={!value.trim()}
            className="h-8 px-3"
            aria-label="Add task"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </motion.div>
      </motion.div>
      <p className="text-xs text-muted-foreground mt-1 ml-1">
        Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">⌘K</kbd> to focus, <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Enter</kbd> to add, <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Esc</kbd> to clear
      </p>
    </form>
  );
}
