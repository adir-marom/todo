import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'circle' | 'rect' | 'star' | 'ring';
  delay: number;
  duration: number;
}

const COLORS = [
  '#22c55e', '#16a34a', '#4ade80', // greens (success!)
  '#facc15', '#fbbf24', '#f59e0b', // golds
  '#3b82f6', '#60a5fa',            // blues
  '#a855f7', '#c084fc',            // purples
  '#f43f5e', '#fb7185',            // pinks
  '#06b6d4', '#22d3ee',            // cyans
];

const PARTICLE_COUNT = 45;

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // Spread particles across the full width of the card
    // Random angle biased upward for a "fountain" feel
    const angle = -30 - Math.random() * 120; // -30 to -150 degrees (upward arc)
    const velocity = 80 + Math.random() * 180;
    const rad = (angle * Math.PI) / 180;

    // Horizontal spread across the card width
    const xOffset = (Math.random() - 0.5) * 200;

    return {
      id: i,
      x: Math.cos(rad) * velocity + xOffset,
      y: Math.sin(rad) * velocity,
      rotation: Math.random() * 1080 - 540,
      scale: 0.6 + Math.random() * 1.0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: (['circle', 'rect', 'star', 'ring'] as const)[Math.floor(Math.random() * 4)],
      delay: Math.random() * 0.15,
      duration: 0.8 + Math.random() * 0.6,
    };
  });
}

function ParticleShape({ shape, color, scale }: { shape: Particle['shape']; color: string; scale: number }) {
  const size = Math.round(6 + scale * 6); // 6-12px based on scale

  if (shape === 'circle') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
    );
  }
  if (shape === 'rect') {
    // Elongated confetti strip
    return (
      <div
        style={{
          width: size * 1.8,
          height: size * 0.5,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
    );
  }
  if (shape === 'ring') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${color}`,
        }}
      />
    );
  }
  // star
  return (
    <svg width={size + 2} height={size + 2} viewBox="0 0 10 10">
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
  const [bursts, setBursts] = useState<{ id: number; particles: Particle[] }[]>([]);

  const fireBurst = useCallback(() => {
    const burstId = Date.now();
    setBursts(prev => [...prev, { id: burstId, particles: generateParticles() }]);

    // Clean up this burst after the animation completes
    setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== burstId));
    }, 1600);
  }, []);

  useEffect(() => {
    if (trigger) {
      fireBurst();
    }
  }, [trigger, fireBurst]);

  return (
    <AnimatePresence>
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute inset-0 pointer-events-none z-50"
          style={{ overflow: 'visible' }}
        >
          {burst.particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0, p.scale * 1.2, p.scale, 0],
                rotate: p.rotation,
                opacity: [1, 1, 1, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
                scale: {
                  duration: p.duration,
                  times: [0, 0.2, 0.6, 1],
                },
                opacity: {
                  duration: p.duration,
                  times: [0, 0.3, 0.7, 1],
                },
              }}
              className="absolute left-0 top-0"
              style={{ originX: '50%', originY: '50%' }}
            >
              <ParticleShape shape={p.shape} color={p.color} scale={p.scale} />
            </motion.div>
          ))}
        </div>
      ))}
    </AnimatePresence>
  );
}
