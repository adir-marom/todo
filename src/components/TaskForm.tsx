import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Priority, TaskColor, TASK_COLORS } from '@/types/task';

interface TaskFormProps {
  groups: string[];
  onSubmit: (
    name: string,
    priority: Priority,
    groupName: string,
    dueDate: string | null,
    color: TaskColor
  ) => void;
  onAddGroup: (name: string) => void;
}

export function TaskForm({ groups, onSubmit, onAddGroup }: TaskFormProps) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [groupName, setGroupName] = useState(groups[0] || 'Personal');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [color, setColor] = useState<TaskColor>('blue');
  const [newGroup, setNewGroup] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const newGroupInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName('');
    setPriority('medium');
    setGroupName(groups[0] || 'Personal');
    setDueDate(undefined);
    setColor('blue');
    setNewGroup('');
    setShowNewGroup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit(
      name.trim(),
      priority,
      groupName,
      dueDate ? dueDate.toISOString() : null,
      color
    );

    // Reset form
    setName('');
    setDueDate(undefined);
    nameInputRef.current?.focus();
  };

  const handleAddGroup = () => {
    if (newGroup.trim()) {
      onAddGroup(newGroup.trim());
      setGroupName(newGroup.trim());
      setNewGroup('');
      setShowNewGroup(false);
    }
  };

  const handleCancelNewGroup = () => {
    setNewGroup('');
    setShowNewGroup(false);
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      resetForm();
      nameInputRef.current?.blur();
    }
  };

  const handleNewGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGroup();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelNewGroup();
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="name">Task Name</Label>
        <Input
          ref={nameInputRef}
          id="name"
          placeholder="Enter task name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {showNewGroup ? (
            <div className="flex gap-2">
              <Input
                ref={newGroupInputRef}
                placeholder="New group name (Enter to add, Esc to cancel)"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                onKeyDown={handleNewGroupKeyDown}
                className="flex-1"
                autoFocus
              />
              <Button type="button" size="sm" onClick={handleAddGroup}>
                Add
              </Button>
              <Button 
                type="button" 
                size="sm" 
                variant="ghost"
                onClick={handleCancelNewGroup}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={groupName} onValueChange={setGroupName}>
                <SelectTrigger className="flex-1">
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
              <Button 
                type="button" 
                size="icon" 
                variant="outline"
                onClick={() => setShowNewGroup(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
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

      <Button type="submit" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Task
      </Button>
    </form>
  );
}
