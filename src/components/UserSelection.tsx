import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { User, Camera, Sparkles, ArrowRight, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User as UserType } from '@/types/task';
import { cn } from '@/lib/utils';
import { getUserColor, UserAvatar } from '@/components/UserSwitcher';
import { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div className="min-h-screen relative flex items-center justify-center bg-background overflow-hidden p-4 sm:p-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={shouldReduceMotion ? {} : { 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-500/15 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={shouldReduceMotion ? {} : { 
            scale: [1, 1.3, 1],
            rotate: [0, -120, 0],
            x: [0, -60, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[65%] h-[65%] bg-purple-500/15 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="text-center mb-10 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-bold tracking-widest uppercase mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isMobile ? "Mobile Edition" : "Desktop Workspace"}</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 leading-none"
          >
            Welcome
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 text-muted-foreground"
          >
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            <p className="text-lg md:text-xl font-medium">Select your profile to begin</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
          {users.map((user, index) => {
            const isAdir = user.name === 'Adir';
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: isMobile ? 50 : 0, x: !isMobile ? (index === 0 ? -50 : 50) : 0 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ 
                  delay: 0.6 + index * 0.2, 
                  duration: 1, 
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                whileHover={isMobile ? {} : { y: -15, scale: 1.02 }}
                className="relative group"
              >
                {/* Dynamic Glow */}
                <div className={cn(
                  "absolute -inset-2 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-60 transition-all duration-700",
                  isAdir ? "bg-blue-600/30" : "bg-purple-600/30"
                )} />
                
                <button
                  onClick={() => onSelectUser(user.id)}
                  className={cn(
                    "relative w-full overflow-hidden flex flex-col items-center justify-center gap-8 p-10 md:p-14 rounded-[3rem] border-2 transition-all duration-500",
                    "bg-card/20 backdrop-blur-3xl border-white/10 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]",
                    "hover:border-white/25 hover:bg-card/40",
                    "active:scale-95 transition-transform"
                  )}
                >
                  <div className="relative z-10">
                    <motion.div
                      whileHover={shouldReduceMotion ? {} : { rotate: [0, -8, 8, 0], scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="relative"
                    >
                      <UserAvatar 
                        user={user} 
                        size="lg" 
                        className="w-36 h-36 md:w-52 md:h-52 text-6xl shadow-2xl border-4 border-white/10 rounded-[2.5rem] object-cover" 
                      />
                      <motion.div 
                        whileHover={{ scale: 1.15, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleEditImage(user, e)}
                        className="absolute -bottom-3 -right-3 p-4 rounded-2xl bg-primary text-primary-foreground shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 border-4 border-background/50 backdrop-blur-md"
                      >
                        <Camera className="w-6 h-6" />
                      </motion.div>
                    </motion.div>
                  </div>

                  <div className="text-center space-y-4 z-10">
                    <h3 className={cn(
                      "text-5xl md:text-6xl font-black tracking-tighter transition-all duration-500",
                      isAdir 
                        ? "text-blue-500 group-hover:text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
                        : "text-purple-500 group-hover:text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    )}>
                      {user.name}
                    </h3>
                    <div className="flex items-center justify-center gap-3 text-muted-foreground font-black text-xs md:text-sm uppercase tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      <span>{isMobile ? "Tap to Open" : "Click to Launch"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Decorative corner accent */}
                  <div className={cn(
                    "absolute top-0 right-0 w-32 h-32 opacity-10 transition-all duration-500 group-hover:opacity-20",
                    isAdir ? "bg-blue-500" : "bg-purple-500",
                    "translate-x-16 -translate-y-16 rotate-45"
                  )} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      
      {/* ... (Dialog code remains the same) */}
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
