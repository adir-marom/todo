import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen relative flex items-center justify-center bg-background overflow-hidden p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -120, 0],
            x: [0, -60, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] bg-purple-500/10 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-3xl"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>Personal Task Manager</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-5xl md:text-6xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-muted-foreground font-medium"
          >
            Choose your profile to continue
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {users.map((user, index) => {
            const colors = getUserColor(user.name);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                {/* Glow Effect */}
                <div className={cn(
                  "absolute -inset-0.5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500",
                  user.name === 'Adir' ? "bg-blue-500" : "bg-purple-500"
                )} />
                
                <button
                  onClick={() => onSelectUser(user.id)}
                  className={cn(
                    "relative w-full aspect-[4/5] sm:aspect-square flex flex-col items-center justify-center gap-6 p-8 rounded-[2rem] border-2 transition-all duration-500",
                    "bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl",
                    "hover:border-white/20 hover:bg-card/60",
                    "group-hover:ring-4 group-hover:ring-primary/10"
                  )}
                >
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <UserAvatar user={user} size="lg" className="w-32 h-32 md:w-40 md:h-32 text-4xl shadow-2xl border-4 border-white/10" />
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleEditImage(user, e)}
                      className="absolute -bottom-2 -right-2 p-3 rounded-2xl bg-primary text-primary-foreground shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20"
                    >
                      <Camera className="w-5 h-5" />
                    </motion.div>
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className={cn(
                      "text-3xl md:text-4xl font-black tracking-tight transition-colors duration-300",
                      user.name === 'Adir' ? "text-blue-500 group-hover:text-blue-400" : "text-purple-500 group-hover:text-purple-400"
                    )}>
                      {user.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span>Enter Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md border-white/10 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Update Avatar</DialogTitle>
            <DialogDescription className="text-base font-medium">
              Personalize {editingUser?.name}'s profile with an image URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                {profileImageUrl ? (
                  <motion.img 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    src={profileImageUrl} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-3xl object-cover border-4 border-primary/20 shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-32 h-32 rounded-3xl bg-muted flex items-center justify-center border-4 border-white/5 shadow-inner"
                  >
                    <User className="h-16 w-16 text-muted-foreground/50" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-3">
              <Label htmlFor="imageUrl" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://images.unsplash.com/..."
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditingUser(null)} className="rounded-xl h-12 font-bold">Cancel</Button>
            <Button 
              onClick={handleSaveImage} 
              disabled={isUpdating}
              className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
