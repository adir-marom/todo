import { Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, TASK_COLORS, PRIORITY_CONFIG } from '@/types/task';

interface MinimalTaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function MinimalTaskItem({ task, onToggleComplete, onRestore }: MinimalTaskItemProps) {
  const colorConfig = TASK_COLORS.find(c => c.value === task.color);
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className={cn(
        "group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors",
        task.completed && "opacity-60"
      )}
    >
      {/* Color indicator */}
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colorConfig?.hex || '#6b7280' }}
      />

      {/* Checkbox / Restore button */}
      {task.archived && onRestore ? (
        <button
          onClick={() => onRestore(task.id)}
          className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={`Restore task: ${task.name}`}
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      ) : (
        <button
          onClick={() => onToggleComplete(task.id)}
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
            task.completed
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          )}
          aria-label={task.completed ? `Mark "${task.name}" as incomplete` : `Mark "${task.name}" as complete`}
        >
          {task.completed && <Check className="h-2.5 w-2.5" />}
        </button>
      )}

      {/* Task name */}
      <span
        className={cn(
          "flex-1 text-sm truncate",
          task.completed && "line-through text-muted-foreground"
        )}
        title={task.name}
      >
        {task.name}
      </span>

      {/* Priority indicator (small dot) */}
      <div
        className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityConfig.color)}
        title={`${priorityConfig.label} priority`}
      />
    </div>
  );
}
