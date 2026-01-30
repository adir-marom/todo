import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { 
  GripVertical, 
  Calendar, 
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
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { DeleteTaskButton } from '@/components/DeleteTaskButton';
import { cn } from '@/lib/utils';
import { Task, TASK_COLORS, PRIORITY_CONFIG } from '@/types/task';

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
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative transition-all',
        isDragging && 'opacity-50 shadow-lg',
        task.archived && 'opacity-70'
      )}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: colorConfig?.hex || '#6b7280' }}
      />
      <CardContent className="p-3 pl-4 sm:p-4 sm:pl-5">
        <div className="flex items-start gap-2 sm:gap-3">
          {isDraggable && !task.archived && (
            <button
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -m-2"
              aria-label={`Drag to reorder task: ${task.name}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
          )}

          {/* Only show checkbox for active tasks - archived tasks use the restore button */}
          {!task.archived && (
            <div className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-2">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                className="h-5 w-5 sm:h-4 sm:w-4"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Task title and actions - stacked on mobile */}
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <h3 
                className={cn(
                  'font-medium line-clamp-2 text-sm sm:text-base pr-1',
                  task.completed && 'line-through text-muted-foreground'
                )}
                title={task.name}
              >
                {task.name}
              </h3>
              <div className="flex items-center gap-0 sm:gap-1 flex-shrink-0 -mr-1 sm:mr-0">
                {!task.archived && (
                  <EditTaskDialog
                    task={task}
                    groups={groups}
                    onSave={onUpdate}
                  />
                )}
                {task.archived && onRestore && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px]"
                    onClick={() => onRestore(task.id)}
                    aria-label={`Restore task: ${task.name}`}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <DeleteTaskButton
                  taskName={task.name}
                  onDelete={() => onDelete(task.id)}
                />
              </div>
            </div>

            {/* Badges - wrap nicely on mobile */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                {task.groupName}
              </Badge>
              <Badge 
                variant="secondary" 
                className={cn('text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5', priorityConfig.color, priorityConfig.textColor)}
                aria-label={`Priority: ${priorityConfig.label}`}
              >
                {task.priority === 'high' && <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                {task.priority === 'medium' && <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                {task.priority === 'low' && <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                {priorityConfig.label}
              </Badge>
              
              {task.dueDate && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}
            </div>

            {/* Meta info - stack on very small screens */}
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 sm:gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
              <span>Created {format(new Date(task.createdAt), 'MMM d')}</span>
              
              {daysLeft && !task.completed && (
                <span className={cn(
                  'flex items-center gap-1',
                  daysLeft.urgent && 'text-destructive font-medium'
                )}>
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {daysLeft.text}
                </span>
              )}
            </div>

            {/* Comments Section - mobile optimized */}
            <div className="mt-2 sm:mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-9 px-2 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground min-h-[44px] -ml-2"
                onClick={() => setShowComments(!showComments)}
                aria-expanded={showComments}
                aria-label={`${showComments ? 'Hide' : 'Show'} ${task.comments?.length || 0} comments for task: ${task.name}`}
              >
                <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                {task.comments?.length || 0} comments
                {showComments ? (
                  <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                )}
              </Button>

              {showComments && (
                <div className="mt-2 space-y-2">
                  {/* Comment list */}
                  {task.comments && task.comments.length > 0 && (
                    <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                      {task.comments.map((comment) => (
                        <div 
                          key={comment.id} 
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
                        </div>
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
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
