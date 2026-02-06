import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'circle' | 'square' | 'star';
  delay: number;
}

const COLORS = [
  '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A',
];

const PARTICLE_COUNT = 24;

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * 360;
    const velocity = 40 + Math.random() * 60;
    const rad = (angle * Math.PI) / 180;

    return {
      id: i,
      x: Math.cos(rad) * velocity,
      y: Math.sin(rad) * velocity - 20, // bias upward
      rotation: Math.random() * 720 - 360,
      scale: 0.4 + Math.random() * 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
      delay: Math.random() * 0.1,
    };
  });
}

function ParticleShape({ shape, color }: { shape: Particle['shape']; color: string }) {
  if (shape === 'circle') {
    return (
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    );
  }
  if (shape === 'square') {
    return (
      <div
        className="w-2 h-2 rounded-sm"
        style={{ backgroundColor: color }}
      />
    );
  }
  // star shape using CSS
  return (
    <svg width="8" height="8" viewBox="0 0 10 10">
      <polygon
        points="5,0 6.2,3.5 10,3.5 7,5.8 8.2,9.5 5,7.2 1.8,9.5 3,5.8 0,3.5 3.8,3.5"
        fill={color}
      />
    </svg>
  );
}

interface ConfettiProps {
  trigger: boolean;
}

export function Confetti({ trigger }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setParticles(generateParticles());
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-50 flex items-center justify-center">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: p.x,
                y: p.y,
                scale: p.scale,
                rotate: p.rotation,
                opacity: 0,
              }}
              transition={{
                duration: 0.6 + Math.random() * 0.3,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute"
            >
              <ParticleShape shape={p.shape} color={p.color} />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
