import { Search, Archive, Sparkles, Keyboard, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';
import { taskCardVariants, emptyStateVariants } from '@/lib/motion';

interface TaskListProps {
  tasks: Task[];
  groups: string[];
  totalCount: number; // Total tasks before filtering
  hasActiveFilters: boolean;
  isArchiveView?: boolean;
  userName?: string;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onReorder: (activeId: string, overId: string) => void;
  onRestore?: (id: string) => void;
  onAddComment?: (taskId: string, text: string) => void;
  onDeleteComment?: (taskId: string, commentId: string) => void;
  onClearFilters?: () => void;
  onShowFullForm?: () => void;
  isDraggable?: boolean;
}

export function TaskList({ 
  tasks, 
  groups,
  totalCount,
  hasActiveFilters,
  isArchiveView = false,
  userName,
  onToggleComplete, 
  onDelete, 
  onUpdate,
  onReorder,
  onRestore,
  onAddComment,
  onDeleteComment,
  onClearFilters,
  onShowFullForm,
  isDraggable = true 
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get task name by ID for accessibility announcements
  const getTaskName = (id: string | number) => {
    const task = tasks.find(t => t.id === id);
    return task?.name || 'task';
  };

  // Accessibility announcements for drag and drop
  const accessibilityAnnouncements = {
    onDragStart({ active }: DragStartEvent) {
      return `Picked up task: ${getTaskName(active.id)}. Use arrow keys to move.`;
    },
    onDragOver({ active, over }: DragOverEvent) {
      if (over) {
        return `Task ${getTaskName(active.id)} is over ${getTaskName(over.id)}`;
      }
      return `Task ${getTaskName(active.id)} is no longer over a droppable area`;
    },
    onDragEnd({ active, over }: DragEndEvent) {
      if (over && active.id !== over.id) {
        return `Task ${getTaskName(active.id)} was moved`;
      }
      return `Task ${getTaskName(active.id)} was dropped in its original position`;
    },
    onDragCancel({ active }: { active: { id: string | number } }) {
      return `Dragging cancelled. Task ${getTaskName(active.id)} was dropped.`;
    },
  };

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
        <motion.div
          variants={emptyStateVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center py-8 sm:py-16 px-3 sm:px-4"
        >
          <div className="rounded-full bg-muted p-3 sm:p-4 mb-3 sm:mb-4">
            <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-medium mb-1">No matching tasks</h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-4 sm:mb-6 max-w-sm">
            No tasks matching your filters. Try adjusting your search.
          </p>
          {onClearFilters && (
            <Button variant="default" size="sm" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
        </motion.div>
      );
    }

    if (isArchiveView) {
      // Archive is empty
      return (
        <motion.div
          variants={emptyStateVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center py-8 sm:py-16 px-3 sm:px-4"
        >
          <div className="rounded-full bg-muted p-3 sm:p-4 mb-3 sm:mb-4">
            <Archive className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-medium mb-1">No archived tasks</h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-sm">
            Completed tasks will appear here.
          </p>
        </motion.div>
      );
    }

    // No tasks yet (active view) - onboarding-focused empty state
    return (
      <motion.div
        variants={emptyStateVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col items-center justify-center py-8 sm:py-16 px-3 sm:px-4"
      >
        <div className="rounded-full bg-primary/10 p-3 sm:p-4 mb-3 sm:mb-4">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
        <h3 className="text-base sm:text-lg font-medium mb-1">
          {userName ? `Welcome, ${userName}!` : 'Ready to get started?'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground text-center mb-3 sm:mb-4 max-w-sm">
          {userName 
            ? "Your task list is empty. Create your first task!"
            : "Create your first task using quick add or the full form."
          }
        </p>
        
        {/* Action buttons */}
        {onShowFullForm && (
          <Button
            onClick={onShowFullForm}
            size="sm"
            className="mb-3 sm:mb-4"
          >
            Create First Task
          </Button>
        )}
        
        {/* Keyboard shortcuts help - hidden on very small screens */}
        <div className="mt-2 p-2 sm:p-3 bg-muted/50 rounded-lg hidden sm:block">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Keyboard className="h-3.5 w-3.5" />
            <span className="font-medium">Keyboard shortcuts</span>
          </div>
          <div className="grid gap-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Quick add task</span>
              <kbd className="px-1.5 py-0.5 font-mono bg-background rounded border text-[10px]">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K
              </kbd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Undo last action</span>
              <kbd className="px-1.5 py-0.5 font-mono bg-background rounded border text-[10px]">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Z
              </kbd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Minimal view</span>
              <kbd className="px-1.5 py-0.5 font-mono bg-background rounded border text-[10px]">M</kbd>
            </div>
          </div>
        </div>
        
        {/* Import hint */}
        <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
          <Download className="h-3 w-3" />
          <span>Have a backup? Use Export to import tasks.</span>
        </p>
      </motion.div>
    );
  }

  if (!isDraggable) {
    return (
      <div className="space-y-1.5 sm:space-y-2">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              variants={taskCardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <TaskCard
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: accessibilityAnnouncements,
        screenReaderInstructions: {
          draggable: 'To pick up a task, press Space or Enter. Use arrow keys to move. Press Space or Enter again to drop the task, or press Escape to cancel.',
        },
      }}
    >
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1.5 sm:space-y-2" role="list" aria-label="Task list">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                variants={taskCardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <TaskCard
                  task={task}
                  groups={groups}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onAddComment={onAddComment}
                  onDeleteComment={onDeleteComment}
                  isDraggable={isDraggable}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
