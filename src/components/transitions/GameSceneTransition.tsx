import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Dices, Hourglass, Eye, ShieldAlert } from 'lucide-react';

export type TransitionGameVariant = 'cheese-thief' | 'insider' | 'undercover';

export interface GameSceneTransitionProps {
  isVisible: boolean;
  direction?: 'enter' | 'exit';
  gameVariant?: TransitionGameVariant;
  roomCode?: string;
}

/**
 * Full-screen Scene Transition Curtain with distinct visual identity per game:
 * - 'cheese-thief': Warm Golden-Amber Cheese & Dice Cup theme
 * - 'insider': Crimson-Rose Oink Games Mystery, Spy & Sand Timer theme
 * - 'undercover': Slate-Indigo Noir Secret Agent Word Deduction theme
 */
export const GameSceneTransition: React.FC<GameSceneTransitionProps> = ({
  isVisible,
  direction = 'enter',
  gameVariant = 'cheese-thief',
  roomCode,
}) => {
  if (typeof document === 'undefined') return null;

  const isInsider = gameVariant === 'insider';
  const isUndercover = gameVariant === 'undercover';

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={`scene-curtain-${gameVariant}-${direction}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md px-6 select-none ${
            isUndercover
              ? 'bg-gradient-to-br from-slate-950/95 via-indigo-950/90 to-slate-900/95'
              : isInsider
              ? 'bg-gradient-to-br from-rose-950/90 via-slate-900/95 to-rose-900/90'
              : 'bg-gradient-to-br from-amber-100 via-[#FFFDF7] to-rose-100'
          }`}
        >
          {/* Center Card Container */}
          <motion.div
            initial={{ scale: 0.88, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: -12, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 26,
            }}
            className={`max-w-md w-full rounded-3xl p-8 shadow-2xl text-center space-y-5 border-2 ${
              isUndercover
                ? 'bg-slate-900/95 border-indigo-500/80 text-white shadow-indigo-950/50'
                : isInsider
                ? 'bg-slate-900/95 border-rose-500/90 text-white'
                : 'bg-white/90 border-amber-300/90 text-slate-900'
            }`}
          >
            {/* Game-Specific Animated Emblem */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              {isUndercover ? (
                <>
                  <motion.div
                    animate={{
                      rotate: [0, -5, 5, 0],
                      scale: [1, 1.06, 1],
                    }}
                    transition={{ duration: 0.75, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-600/30 flex items-center justify-center text-5xl"
                  >
                    🕶️
                  </motion.div>
                  <motion.span
                    animate={{ scale: [0.95, 1.15, 0.95] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-1 -right-1 w-9 h-9 rounded-2xl bg-amber-500 border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow-md"
                  >
                    <ShieldAlert className="w-4 h-4 text-slate-950" />
                  </motion.span>
                </>
              ) : isInsider ? (
                <>
                  <motion.div
                    animate={{
                      rotate: [0, 6, -6, 0],
                      scale: [1, 1.08, 1],
                    }}
                    transition={{ duration: 0.75, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 border-2 border-rose-400 shadow-lg shadow-rose-600/30 flex items-center justify-center text-5xl"
                  >
                    🕵️
                  </motion.div>
                  <motion.span
                    animate={{ rotate: [0, 180, 180], scale: [0.95, 1.15, 1] }}
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                    className="absolute -top-1 -right-1 w-9 h-9 rounded-2xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-md"
                  >
                    <Hourglass className="w-4 h-4 text-slate-950" />
                  </motion.span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 border-2 border-amber-400 shadow-lg flex items-center justify-center text-5xl"
                  >
                    🧀
                  </motion.div>
                  <motion.span
                    animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-8 h-8 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-amber-700 shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </motion.span>
                </>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              {isUndercover ? (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/50 text-[11px] font-mono font-extrabold text-indigo-300 uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {direction === 'enter'
                        ? 'UNDERCOVER · SECRET AGENT DEDUCTION'
                        : 'TABLETOP NEXUS CATALOG'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {direction === 'enter'
                      ? 'สายลับสลับคำ (Undercover)'
                      : 'กลับสู่คลังบอร์ดเกม'}
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-200/90 font-medium">
                    {direction === 'enter'
                      ? roomCode
                        ? `กำลังเข้าสู่โต๊ะ Undercover รหัส #${roomCode}...`
                        : 'กำลังแจกการ์ดคำลับและเตรียมรอบบอกคำใบ้...'
                      : 'กำลังออกจากโต๊ะ Undercover กลับไปยังคลังบอร์ดเกม...'}
                  </p>
                </>
              ) : isInsider ? (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-400/50 text-[11px] font-mono font-extrabold text-rose-300 uppercase tracking-wider">
                    <Eye className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {direction === 'enter'
                        ? 'INSIDER · SECRET WORD DEDUCTION'
                        : 'TABLETOP NEXUS CATALOG'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {direction === 'enter'
                      ? 'จอมบงการคำใบ้ (Insider)'
                      : 'กลับสู่คลังบอร์ดเกม'}
                  </h2>
                  <p className="text-xs sm:text-sm text-rose-200/90 font-medium">
                    {direction === 'enter'
                      ? roomCode
                        ? `กำลังเข้าสู่โต๊ะ Insider รหัส #${roomCode}...`
                        : 'กำลังสุ่มคลังคำศัพท์ลับและตั้งนาฬิกาทราย...'
                      : 'กำลังออกจากโต๊ะ Insider กลับไปยังคลังบอร์ดเกม...'}
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/90 border border-amber-200 text-[11px] font-mono font-extrabold text-amber-900 uppercase tracking-wider">
                    <Dices className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {direction === 'enter'
                        ? 'CHEESE THIEF TABLETOP'
                        : 'TABLETOP NEXUS CATALOG'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {direction === 'enter'
                      ? 'หนูขโมยชีส (Cheese Thief)'
                      : 'กลับสู่คลังบอร์ดเกม'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {direction === 'enter'
                      ? roomCode
                        ? `กำลังเข้าสู่โต๊ะหนูขโมยชีส รหัส #${roomCode}...`
                        : 'กำลังจัดเตรียมถ้วยเต๋าและเชื่อมต่อห้องเล่นสด...'
                      : 'กำลังสลับหน้าจอกลับไปยังคลังบอร์ดเกม...'}
                  </p>
                </>
              )}
            </div>

            {/* Smooth Animated Progress Bar */}
            <div
              className={`w-full h-2.5 rounded-full overflow-hidden border p-0.5 ${
                isUndercover
                  ? 'bg-slate-800 border-indigo-500/40'
                  : isInsider
                  ? 'bg-slate-800 border-rose-500/40'
                  : 'bg-amber-100/90 border-amber-200/80'
              }`}
            >
              <motion.div
                initial={{ width: '10%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.62, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isUndercover
                    ? 'bg-gradient-to-r from-indigo-500 via-amber-400 to-indigo-400'
                    : isInsider
                    ? 'bg-gradient-to-r from-rose-600 via-amber-400 to-rose-500'
                    : 'bg-gradient-to-r from-amber-400 via-rose-400 to-amber-500'
                }`}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

