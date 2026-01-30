import { useState } from 'react';
import { Settings, Trash2, Pencil, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GroupManagementDialogProps {
  groups: string[];
  taskCountByGroup: Record<string, number>;
  onAddGroup: (name: string) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (name: string, reassignTo?: string) => void;
}

export function GroupManagementDialog({
  groups,
  taskCountByGroup,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
}: GroupManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleStartEdit = (group: string) => {
    setEditingGroup(group);
    setEditValue(group);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue.trim() !== editingGroup) {
      onRenameGroup(editingGroup!, editValue.trim());
    }
    setEditingGroup(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditValue('');
  };

  const handleAddGroup = () => {
    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setShowAddForm(false);
    }
  };

  const handleDeleteGroup = (group: string) => {
    // If there are tasks in this group, reassign to the first available group
    // Otherwise just delete
    const count = taskCountByGroup[group] || 0;
    if (count > 0) {
      const otherGroups = groups.filter(g => g !== group);
      if (otherGroups.length > 0) {
        onDeleteGroup(group, otherGroups[0]);
      }
    } else {
      onDeleteGroup(group);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      if (editingGroup) {
        handleCancelEdit();
      } else {
        setShowAddForm(false);
        setNewGroupName('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Groups
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
          <DialogDescription>
            Add, rename, or delete task groups. Deleting a group will move its tasks to another group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {groups.map((group) => {
            const taskCount = taskCountByGroup[group] || 0;
            const isEditing = editingGroup === group;
            const canDelete = groups.length > 1;

            return (
              <div
                key={group}
                className="flex items-center gap-2 p-2 rounded-md border bg-card"
              >
                {isEditing ? (
                  <>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, handleSaveEdit)}
                      className="h-8 flex-1"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{group}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({taskCount} {taskCount === 1 ? 'task' : 'tasks'})
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleStartEdit(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {canDelete ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Group</AlertDialogTitle>
                            <AlertDialogDescription>
                              {taskCount > 0 ? (
                                <>
                                  This group contains {taskCount} {taskCount === 1 ? 'task' : 'tasks'}. 
                                  They will be moved to another group. Are you sure you want to delete "{group}"?
                                </>
                              ) : (
                                <>Are you sure you want to delete the group "{group}"?</>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGroup(group)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        disabled
                        title="Cannot delete the last group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Add new group */}
          {showAddForm ? (
            <div className="flex items-center gap-2 p-2 rounded-md border border-dashed">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleAddGroup)}
                placeholder="New group name..."
                className="h-8 flex-1"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-green-600"
                onClick={handleAddGroup}
                disabled={!newGroupName.trim() || groups.includes(newGroupName.trim())}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setShowAddForm(false);
                  setNewGroupName('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
