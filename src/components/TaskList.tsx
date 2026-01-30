import { ListTodo, Search, Plus, ClipboardList, Archive, Sparkles } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  groups: string[];
  totalCount: number; // Total tasks before filtering
  hasActiveFilters: boolean;
  isArchiveView?: boolean;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onReorder: (activeId: string, overId: string) => void;
  onRestore?: (id: string) => void;
  onAddComment?: (taskId: string, text: string) => void;
  onDeleteComment?: (taskId: string, commentId: string) => void;
  onClearFilters?: () => void;
  isDraggable?: boolean;
}

export function TaskList({ 
  tasks, 
  groups,
  totalCount,
  hasActiveFilters,
  isArchiveView = false,
  onToggleComplete, 
  onDelete, 
  onUpdate,
  onReorder,
  onRestore,
  onAddComment,
  onDeleteComment,
  onClearFilters,
  isDraggable = true 
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  if (tasks.length === 0) {
    // Determine the appropriate empty state message
    if (hasActiveFilters) {
      // Filters are active but no results
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No matching tasks</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
            We couldn't find any tasks matching your current filters. Try adjusting your search criteria.
          </p>
          {onClearFilters && (
            <Button variant="default" size="sm" onClick={onClearFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      );
    }

    if (isArchiveView) {
      // Archive is empty
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No archived tasks</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            When you complete tasks, they'll be moved here for your records. Keep up the great work!
          </p>
        </div>
      );
    }

    // No tasks yet (active view)
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-1">Ready to get started?</h3>
        <p className="text-sm text-muted-foreground text-center mb-2 max-w-sm">
          Create your first task using the quick add above or expand the full form for more options.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <kbd className="px-1.5 py-0.5 font-semibold bg-muted rounded border">Cmd+K</kbd>
          <span>to quick add a task</span>
        </div>
      </div>
    );
  }

  if (!isDraggable) {
    return (
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            groups={groups}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onRestore={onRestore}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
            isDraggable={false}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              groups={groups}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              isDraggable={isDraggable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
