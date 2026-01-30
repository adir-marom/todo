import { motion } from 'framer-motion';
import { User, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User as UserType } from '@/types/task';
import { cn } from '@/lib/utils';
import { getUserColor, UserAvatar } from '@/components/UserSwitcher';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface UserSelectionProps {
  users: UserType[];
  onSelectUser: (userId: number) => void;
  onUpdateUser: (userId: number, updates: { name?: string; profileImage?: string | null }) => Promise<UserType | null>;
}

export function UserSelection({ users, onSelectUser, onUpdateUser }: UserSelectionProps) {
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditImage = (user: UserType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(user);
    setProfileImageUrl(user.profileImage || '');
  };

  const handleSaveImage = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      await onUpdateUser(editingUser.id, { profileImage: profileImageUrl.trim() || null });
      setEditingUser(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-lg">Who is using the todo list today?</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {users.map((user) => {
                const colors = getUserColor(user.name);
                return (
                  <motion.div
                    key={user.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group"
                  >
                    <button
                      onClick={() => onSelectUser(user.id)}
                      className={cn(
                        "w-full h-full flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300",
                        "hover:shadow-lg hover:border-primary/50 bg-card",
                        colors.border,
                        "group-hover:bg-accent/50"
                      )}
                    >
                      <div className="relative">
                        <UserAvatar user={user} size="lg" className="w-24 h-24 text-3xl shadow-md" />
                        <div 
                          onClick={(e) => handleEditImage(user, e)}
                          className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:scale-110 active:scale-95"
                        >
                          <Camera className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className={cn("text-2xl font-bold", colors.text)}>{user.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">Click to view tasks</p>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Image</DialogTitle>
            <DialogDescription>
              Enter a URL for {editingUser?.name}'s profile image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Preview" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://images.unsplash.com/..."
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleSaveImage} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
