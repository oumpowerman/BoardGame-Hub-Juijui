import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Swords, Crown } from 'lucide-react';

export interface AvalonCreationTransitionOverlayProps {
  isOpen: boolean;
  onAnimationComplete?: () => void;
}

const STAGES = [
  'กำลังสลักตราอัศวินโต๊ะกลม...',
  'เตรียมที่นั่งและสลับสำรับบทบาท...',
  'เปิดโต๊ะสำเร็จ! กำลังเข้าสู่ห้องรอ...',
];

// Floating pastel sparkles positions
const SPARKLE_PARTICLES = [
  { id: 1, x: -70, y: -65, color: 'text-amber-400', size: 18, delay: 0 },
  { id: 2, x: 75, y: -50, color: 'text-emerald-400', size: 16, delay: 0.2 },
  { id: 3, x: -80, y: 40, color: 'text-teal-400', size: 14, delay: 0.4 },
  { id: 4, x: 65, y: 60, color: 'text-amber-300', size: 20, delay: 0.1 },
  { id: 5, x: 0, y: -85, color: 'text-emerald-300', size: 15, delay: 0.3 },
  { id: 6, x: -45, y: -20, color: 'text-rose-300', size: 12, delay: 0.5 },
  { id: 7, x: 50, y: -10, color: 'text-teal-300', size: 14, delay: 0.25 },
  { id: 8, x: 0, y: 80, color: 'text-amber-400', size: 16, delay: 0.35 },
];

export const AvalonCreationTransitionOverlay: React.FC<AvalonCreationTransitionOverlayProps> = ({
  isOpen,
  onAnimationComplete,
}) => {
  const [mounted, setMounted] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Cycle through progressive status messages
  useEffect(() => {
    if (!isOpen) {
      setStageIndex(0);
      return;
    }

    const t1 = setTimeout(() => setStageIndex(1), 350);
    const t2 = setTimeout(() => setStageIndex(2), 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isOpen && (
        <motion.div
          key="avalon-creation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md"
        >
          {/* Centered Magical Aura and Seal */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Ambient Pastel Aura Glow */}
            <motion.div
              animate={{
                scale: [1, 1.18, 1],
                opacity: [0.35, 0.65, 0.35],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-emerald-300/40 via-amber-200/50 to-teal-200/40 blur-3xl pointer-events-none"
            />

            {/* Orbiting Pastel Sparkle Particles */}
            {SPARKLE_PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0.3, 1, 0.4],
                  scale: [0.8, 1.25, 0.9],
                  y: [p.y, p.y - 12, p.y],
                  x: [p.x, p.x + 4, p.x],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
                className={`absolute pointer-events-none ${p.color}`}
                style={{
                  left: `calc(50% + ${p.x}px)`,
                  top: `calc(50% + ${p.y}px)`,
                }}
              >
                <Sparkles style={{ width: p.size, height: p.size }} />
              </motion.div>
            ))}

            {/* Outer Rotating Runic Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-dashed border-emerald-400/60 flex items-center justify-center shadow-lg shadow-emerald-500/10"
            >
              <div className="w-32 h-32 sm:w-38 sm:h-38 rounded-full border border-amber-300/50" />
            </motion.div>

            {/* Inner Magical Arthurian Seal Badge */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{
                scale: [0.95, 1.05, 0.98],
                opacity: 1,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-emerald-300 shadow-xl shadow-emerald-900/10 flex flex-col items-center justify-center p-3"
            >
              <div className="relative flex items-center justify-center">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600 fill-emerald-100" />
                <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 absolute" />
              </div>
              <Crown className="w-3.5 h-3.5 text-amber-500 mt-1" />
            </motion.div>

            {/* Progressive Status Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-col items-center gap-2 text-center"
            >
              <div className="px-4 py-1.5 rounded-full bg-white/95 border border-emerald-300 shadow-sm flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-2.5 h-2.5 rounded-full border-2 border-emerald-600 border-t-transparent"
                />
                <span className="text-xs font-bold text-slate-800">
                  {STAGES[stageIndex]}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                TABLETOP ROUND TABLE
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
