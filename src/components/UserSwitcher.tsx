import { useState } from 'react';
import { User, UserPlus, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User as UserType } from '@/types/task';
import { cn } from '@/lib/utils';

interface UserSwitcherProps {
  users: UserType[];
  currentUser: UserType | null;
  onSwitchUser: (userId: number) => void;
  onCreateUser: (name: string) => Promise<UserType | null>;
  onDeleteUser: (userId: number) => Promise<boolean>;
}

export function UserSwitcher({
  users,
  currentUser,
  onSwitchUser,
  onCreateUser,
  onDeleteUser,
}: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || isCreating) return;

    setIsCreating(true);
    const user = await onCreateUser(newUserName.trim());
    setIsCreating(false);

    if (user) {
      setNewUserName('');
      setIsAddingUser(false);
      // Switch to the new user
      onSwitchUser(user.id);
      setIsOpen(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || isDeleting) return;

    setIsDeleting(true);
    await onDeleteUser(userToDelete.id);
    setIsDeleting(false);
    setUserToDelete(null);
  };

  const handleSelectUser = (userId: number) => {
    onSwitchUser(userId);
    setIsOpen(false);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 md:h-10 gap-1 sm:gap-2 px-2 sm:px-3"
            aria-label="Switch user"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline max-w-[80px] truncate">
              {currentUser?.name || 'Select User'}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-2">
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              Switch User
            </div>
            
            {/* User list */}
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                    currentUser?.id === user.id && "bg-accent"
                  )}
                  onClick={() => handleSelectUser(user.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user.name}</span>
                  </div>
                  {users.length > 1 && currentUser?.id !== user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 opacity-50 hover:opacity-100 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserToDelete(user);
                      }}
                      aria-label={`Delete ${user.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Add new user */}
            {isAddingUser ? (
              <form onSubmit={handleCreateUser} className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter name..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  disabled={isCreating}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => {
                      setIsAddingUser(false);
                      setNewUserName('');
                    }}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1 h-8"
                    disabled={!newUserName.trim() || isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={() => setIsAddingUser(true)}
              >
                <UserPlus className="h-4 w-4" />
                Add New User
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{userToDelete?.name}"? This will also delete all their tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
