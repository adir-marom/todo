import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Pencil, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Task, Priority, TaskColor, TASK_COLORS } from '@/types/task';

interface EditTaskDialogProps {
  task: Task;
  groups: string[];
  onSave: (id: string, updates: Partial<Task>) => void;
}

export function EditTaskDialog({ task, groups, onSave }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(task.name);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [groupName, setGroupName] = useState(task.groupName);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );
  const [color, setColor] = useState<TaskColor>(task.color);

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(task.name);
      setPriority(task.priority);
      setGroupName(task.groupName);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setColor(task.color);
    }
  }, [open, task]);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    onSave(task.id, {
      name: name.trim(),
      priority,
      groupName,
      dueDate: dueDate ? dueDate.toISOString() : null,
      color,
    });

    setOpen(false);
  }, [name, priority, groupName, dueDate, color, onSave, task.id]);

  const handleClearDueDate = () => {
    setDueDate(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 min-h-[44px] min-w-[44px]"
          aria-label={`Edit task: ${task.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto sm:w-full sm:rounded-lg" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Task Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#A8E6CF]" />
                      <ArrowDown className="h-3 w-3 text-[#2D5A4A]" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FEF3A5]" />
                      <Minus className="h-3 w-3 text-[#6B5C00]" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#F8A5A5]" />
                      <ArrowUp className="h-3 w-3 text-[#7A2828]" />
                      High
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={groupName} onValueChange={setGroupName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Due Date</Label>
            <div className="flex flex-col sm:flex-row gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDueDate}
                  className="px-2 h-10 sm:h-auto"
                >
                  Clear
                </Button>
              )}
            </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={color} onValueChange={(v) => setColor(v as TaskColor)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <p className="text-xs text-muted-foreground mr-auto hidden sm:block">
            <kbd className="px-1 py-0.5 text-xs bg-muted rounded border">Esc</kbd> to cancel, <kbd className="px-1 py-0.5 text-xs bg-muted rounded border">Cmd+Enter</kbd> to save
          </p>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={!name.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
