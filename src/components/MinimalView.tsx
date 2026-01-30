import { useState } from 'react';
import { Plus, Maximize2, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MinimalTaskItem } from '@/components/MinimalTaskItem';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface MinimalViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onRestore?: (id: string) => void;
  onQuickAdd: (name: string) => void;
  onExpandView: () => void;
}

export function MinimalView({
  tasks,
  onToggleComplete,
  onRestore,
  onQuickAdd,
  onExpandView,
}: MinimalViewProps) {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onQuickAdd(newTask.trim());
      setNewTask('');
    }
  };

  const activeTasks = tasks.filter(t => !t.archived && !t.completed);
  const completedTasks = tasks.filter(t => !t.archived && t.completed);

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Compact header with drag handle area */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {activeTasks.length} tasks
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onExpandView}
              aria-label="Expand to full view"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Compact quick add */}
        <form onSubmit={handleSubmit} className="px-3 pb-2">
          <div className="flex gap-1.5">
            <Input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add task..."
              className="h-8 text-sm"
              aria-label="Quick add task"
            />
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              disabled={!newTask.trim()}
              aria-label="Add task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Task list */}
      <div className="px-2 py-1 space-y-0.5 max-h-[calc(100vh-100px)] overflow-y-auto">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks yet
          </div>
        ) : (
          <>
            {/* Active tasks */}
            {activeTasks.map((task) => (
              <MinimalTaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
              />
            ))}

            {/* Completed tasks (collapsible visual separator) */}
            {completedTasks.length > 0 && (
              <>
                {activeTasks.length > 0 && (
                  <div className="border-t border-dashed my-2 mx-2" />
                )}
                <div className="opacity-60">
                  {completedTasks.map((task) => (
                    <MinimalTaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-0 left-0 right-0 px-3 py-1.5 text-center border-t bg-background/95">
        <span className="text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded border">M</kbd> for full view
        </span>
      </div>
    </div>
  );
}
