import { useState, useRef } from 'react';
import { User, ChevronDown, Check, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User as UserType } from '@/types/task';
import { cn } from '@/lib/utils';

// Fixed user colors for visual distinction
export const USER_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  'Adir': {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    ring: 'ring-blue-500',
  },
  'Tzuf': {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    ring: 'ring-purple-500',
  },
};

// Default color for any other users
const DEFAULT_USER_COLOR = {
  bg: 'bg-gray-100 dark:bg-gray-800',
  text: 'text-gray-700 dark:text-gray-300',
  border: 'border-gray-300 dark:border-gray-600',
  ring: 'ring-gray-500',
};

export function getUserColor(userName: string | undefined) {
  if (!userName) return DEFAULT_USER_COLOR;
  return USER_COLORS[userName] || DEFAULT_USER_COLOR;
}

interface UserSwitcherProps {
  users: UserType[];
  currentUser: UserType | null;
  onSwitchUser: (userId: number) => void;
  onUpdateUser?: (userId: number, updates: { name?: string; profileImage?: string | null }) => Promise<UserType | null>;
}

// Avatar component that displays profile image or initial
function UserAvatar({ 
  user, 
  size = 'md',
  className 
}: { 
  user: UserType; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const userColor = getUserColor(user.name);
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };
  
  if (user.profileImage) {
    return (
      <img 
        src={user.profileImage} 
        alt={user.name}
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          className
        )}
        onError={(e) => {
          // Fallback to initial if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-bold",
      sizeClasses[size],
      userColor.bg,
      userColor.text,
      className
    )}>
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function UserSwitcher({
  users,
  currentUser,
  onSwitchUser,
  onUpdateUser,
}: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserType | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const currentColor = getUserColor(currentUser?.name);

  const handleSelectUser = (user: UserType) => {
    if (user.id === currentUser?.id) {
      setIsOpen(false);
      return;
    }
    // Show confirmation dialog
    setPendingUser(user);
  };

  const confirmSwitch = () => {
    if (pendingUser) {
      onSwitchUser(pendingUser.id);
      setPendingUser(null);
      setIsOpen(false);
    }
  };

  const handleEditProfileImage = (user: UserType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(user);
    setProfileImageUrl(user.profileImage || '');
  };

  const handleSaveProfileImage = async () => {
    if (!editingUser || !onUpdateUser) return;
    
    setIsUpdating(true);
    try {
      const imageUrl = profileImageUrl.trim() || null;
      await onUpdateUser(editingUser.id, { profileImage: imageUrl });
      setEditingUser(null);
      setProfileImageUrl('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    if (!editingUser || !onUpdateUser) return;
    
    setIsUpdating(true);
    try {
      await onUpdateUser(editingUser.id, { profileImage: null });
      setEditingUser(null);
      setProfileImageUrl('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 sm:h-9 md:h-10 gap-1.5 sm:gap-2 px-2 sm:px-3 font-medium border-2 transition-all",
              currentColor.bg,
              currentColor.text,
              currentColor.border,
              "hover:opacity-90"
            )}
            aria-label="Switch user profile"
          >
            {currentUser ? (
              <UserAvatar user={currentUser} size="sm" />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="max-w-[80px] truncate">
              {currentUser?.name || 'Select'}
            </span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Switch Profile
            </div>
            
            {/* User list */}
            <div className="space-y-1">
              {users.map((user) => {
                const userColor = getUserColor(user.name);
                const isSelected = currentUser?.id === user.id;
                
                return (
                  <button
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between w-full rounded-md px-3 py-2.5 text-sm cursor-pointer transition-all",
                      "hover:bg-accent focus:outline-none focus:ring-2",
                      userColor.ring,
                      isSelected && cn(userColor.bg, "ring-2")
                    )}
                    onClick={() => handleSelectUser(user)}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <UserAvatar user={user} size="md" />
                        {onUpdateUser && (
                          <button
                            onClick={(e) => handleEditProfileImage(user, e)}
                            className={cn(
                              "absolute inset-0 rounded-full flex items-center justify-center",
                              "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            )}
                            aria-label="Edit profile image"
                          >
                            <Camera className="h-3 w-3 text-white" />
                          </button>
                        )}
                      </div>
                      <span className={cn(
                        "font-medium",
                        isSelected && userColor.text
                      )}>
                        {user.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className={cn("h-4 w-4", userColor.text)} />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="border-t mt-2 pt-2">
              <p className="px-2 py-1 text-xs text-muted-foreground">
                Each profile has separate tasks
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Switch confirmation dialog */}
      <AlertDialog open={!!pendingUser} onOpenChange={(open) => !open && setPendingUser(null)}>
        <AlertDialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto sm:w-full sm:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to {pendingUser?.name}'s profile?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll see {pendingUser?.name}'s tasks. Your current view ({currentUser?.name}'s tasks) will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch}>
              Switch Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit profile image dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto sm:w-full sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile Image</DialogTitle>
            <DialogDescription>
              Enter a URL for {editingUser?.name}'s profile image
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Preview */}
            <div className="flex justify-center">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-muted"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.className = 'hidden';
                  }}
                />
              ) : editingUser && (
                <UserAvatar user={{...editingUser, profileImage: null}} size="lg" className="w-20 h-20 text-2xl" />
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profileImageUrl">Image URL</Label>
              <Input
                id="profileImageUrl"
                placeholder="https://example.com/image.jpg"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a direct link to an image (PNG, JPG, etc.)
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingUser?.profileImage && (
              <Button
                variant="outline"
                onClick={handleRemoveProfileImage}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Image
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={() => setEditingUser(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfileImage}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { UserAvatar };
