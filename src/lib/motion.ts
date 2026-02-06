// Animation constants for consistent motion across the app
import { Variants, Transition } from 'framer-motion';

// Standard spring transition for layout animations
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

// Smooth ease transition for fades
export const easeTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

// Task card animations
export const taskCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    x: 300,
    scale: 0.3,
    rotate: 8,
    filter: 'blur(8px)',
    transition: {
      duration: 0.5,
      ease: [0.36, 0, 0.66, -0.56],
      opacity: { duration: 0.35 },
    },
  },
};

// Task completion animation - satisfying bounce on check
export const taskCompleteVariants: Variants = {
  uncompleted: {
    scale: 1,
    opacity: 1,
    y: 0,
  },
  completed: {
    scale: [1, 1.03, 0.97, 1],
    opacity: 0.75,
    y: 0,
    transition: {
      scale: {
        duration: 0.5,
        times: [0, 0.2, 0.4, 1],
        ease: 'easeOut',
      },
      opacity: { duration: 0.4, delay: 0.3 },
    },
  },
};

// View switching animations
export const viewTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: easeTransition,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15 },
  },
};

// Dialog animations
export const dialogOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const dialogContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

// Button hover/tap animations
export const buttonTapScale = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

export const buttonHoverScale = {
  scale: 1.02,
  transition: { duration: 0.15 },
};

// Pulse animation for focus states
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.5, 1],
    },
  },
};

// Slide up animation for mobile bottom bar
export const slideUpVariants: Variants = {
  initial: {
    y: 100,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      delay: 0.1,
    },
  },
};

// Breathing animation for sync status
export const breathingVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Stagger children animation
export const staggerContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Checkbox animation
export const checkmarkVariants: Variants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: 'spring', stiffness: 400, damping: 30 },
      opacity: { duration: 0.1 },
    },
  },
};

// Progress bar animation
export const progressVariants: Variants = {
  initial: { scaleX: 0 },
  animate: (progress: number) => ({
    scaleX: progress,
    transition: { duration: 0.3, ease: 'easeOut' },
  }),
};

// Empty state animation
export const emptyStateVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2,
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};
