import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { 
  GripVertical, 
  Calendar, 
  Archive,
  RotateCcw,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Confetti } from '@/components/ui/confetti';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { DeleteTaskButton } from '@/components/DeleteTaskButton';
import { cn } from '@/lib/utils';
import { Task, TASK_COLORS, PRIORITY_CONFIG } from '@/types/task';
import { taskCompleteVariants, springTransition } from '@/lib/motion';

interface TaskCardProps {
  task: Task;
  groups: string[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onRestore?: (id: string) => void;
  onAddComment?: (taskId: string, text: string) => void;
  onDeleteComment?: (taskId: string, commentId: string) => void;
  isDraggable?: boolean;
}

export function TaskCard({ 
  task, 
  groups,
  onToggleComplete, 
  onDelete,
  onUpdate,
  onRestore,
  onAddComment,
  onDeleteComment,
  isDraggable = true 
}: TaskCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const prevCompletedRef = useRef(task.completed);

  // Trigger celebration when task transitions from incomplete -> complete
  useEffect(() => {
    if (task.completed && !prevCompletedRef.current) {
      setShowConfetti(true);
      setShowFlash(true);
      const confettiTimer = setTimeout(() => setShowConfetti(false), 1700);
      const flashTimer = setTimeout(() => setShowFlash(false), 800);
      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(flashTimer);
      };
    }
    prevCompletedRef.current = task.completed;
  }, [task.completed]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !isDraggable || task.archived });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colorConfig = TASK_COLORS.find(c => c.value === task.color);
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  // Calculate days left
  const getDaysLeft = () => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (isToday(dueDate)) return { text: 'Due Today', urgent: true };
    
    const days = differenceInDays(dueDate, today);
    
    if (isPast(dueDate)) {
      return { text: `${Math.abs(days)} days overdue`, urgent: true };
    }
    
    return { 
      text: days === 1 ? '1 day left' : `${days} days left`, 
      urgent: days <= 3 
    };
  };

  const daysLeft = getDaysLeft();

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={task.completed ? 'completed' : 'uncompleted'}
      variants={taskCompleteVariants}
      transition={springTransition}
    >
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative transition-shadow overflow-visible',
          isDragging && 'opacity-50 shadow-lg',
          task.archived && 'opacity-70'
        )}
      >
      {/* Confetti burst - card level for full width effect */}
      <Confetti trigger={showConfetti} />

      {/* Green success flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.25, 0.15, 0], scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-lg z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, #22c55e, #4ade80, transparent)',
              transformOrigin: 'left center',
            }}
          />
        )}
      </AnimatePresence>

      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: colorConfig?.hex || '#6b7280' }}
      />
      <CardContent className="p-1.5 pl-2.5 sm:p-3 sm:pl-4">
        <div className="flex items-start gap-1 sm:gap-2">
          {isDraggable && !task.archived && (
            <button
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center -m-1"
              aria-label={`Drag to reorder task: ${task.name}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {/* Only show checkbox for active tasks - archived tasks use the restore button */}
          {!task.archived && (
            <div className="min-h-[32px] min-w-[32px] flex items-center justify-center -m-1">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                className="h-4 w-4"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Task title and actions - stacked on mobile */}
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <h3 
                className={cn(
                  'font-medium line-clamp-2 sm:line-clamp-1 text-sm sm:text-base pr-1 break-words',
                  task.completed && 'line-through text-muted-foreground'
                )}
                title={task.name}
              >
                {task.name}
              </h3>
              <div className="flex items-center gap-0 sm:gap-0.5 flex-shrink-0 -mr-1 sm:mr-0">
                {!task.archived && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 sm:h-9 sm:w-9 min-h-[32px] min-w-[32px]"
                      onClick={() => onUpdate(task.id, { archived: true })}
                      aria-label={`Archive task: ${task.name}`}
                      title="Archive task"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                    <EditTaskDialog
                      task={task}
                      groups={groups}
                      onSave={onUpdate}
                    />
                  </>
                )}
                {task.archived && onRestore && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 sm:h-9 sm:w-9 min-h-[32px] min-w-[32px]"
                    onClick={() => onRestore(task.id)}
                    aria-label={`Restore task: ${task.name}`}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <DeleteTaskButton
                  taskName={task.name}
                  onDelete={() => onDelete(task.id)}
                />
              </div>
            </div>

            {/* Badges and Meta - more compact row */}
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 mt-0.5 sm:mt-1">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 leading-none h-4">
                  {task.groupName}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={cn('text-[10px] flex items-center gap-0.5 px-1.5 py-0 leading-none h-4', priorityConfig.color, priorityConfig.textColor)}
                  aria-label={`Priority: ${priorityConfig.label}`}
                >
                  {task.priority === 'high' && <ArrowUp className="h-2.5 w-2.5" />}
                  {task.priority === 'medium' && <Minus className="h-2.5 w-2.5" />}
                  {task.priority === 'low' && <ArrowDown className="h-2.5 w-2.5" />}
                  {priorityConfig.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(new Date(task.dueDate), 'MMM d')}
                  </div>
                )}
                
                {daysLeft && !task.completed && (
                  <span className={cn(
                    'flex items-center gap-1',
                    daysLeft.urgent && 'text-destructive font-medium'
                  )}>
                    <Clock className="h-2.5 w-2.5" />
                    {daysLeft.text}
                  </span>
                )}
              </div>
            </div>

            {/* Comments Section - more compact */}
            <div className="mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground min-h-[24px] -ml-1.5"
                onClick={() => setShowComments(!showComments)}
                aria-expanded={showComments}
                aria-label={`${showComments ? 'Hide' : 'Show'} ${task.comments?.length || 0} comments for task: ${task.name}`}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {task.comments?.length || 0}
                {showComments ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>

              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-2">
                      {/* Comment list */}
                      {task.comments && task.comments.length > 0 && (
                        <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                          {task.comments.map((comment) => (
                            <motion.div 
                              key={comment.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-muted/50 rounded-md p-2 text-xs sm:text-sm group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-foreground flex-1">{comment.text}</p>
                                {onDeleteComment && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 min-h-[44px] min-w-[44px] -m-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    onClick={() => onDeleteComment(task.id, comment.id)}
                                    aria-label="Delete comment"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Add comment input - mobile friendly */}
                      {onAddComment && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="h-9 sm:h-8 text-sm flex-1"
                          />
                          <Button 
                            size="icon" 
                            className="h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] flex-shrink-0"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            aria-label="Send comment"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
