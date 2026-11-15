import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  Sparkles,
  PartyPopper,
  Shuffle,
  ArrowRight,
  Hand,
  Star,
  Zap,
  Flame,
  X,
} from 'lucide-react';
import {
  DoraemonCard,
  DEFAULT_DORAEMON_RULES,
  KING_COMMAND_PRESETS,
} from '../../data/doraemonRules';

export interface DoraemonCardRevealModalProps {
  isOpen: boolean;
  stage: 'suspense' | 'revealed';
  drawerPlayerName: string;
  nextPlayerName: string;
  remainingDeckCount: number;
  card: DoraemonCard | null;
  ruleText: string;
  activeKingCommand: string;
  isFlipping: boolean;
  onConfirmFlip: () => void;
  onAcknowledgeAndContinue: (newKingCommand?: string) => void;
  onClose?: () => void;
}

const FLOATING_ORBIT_ICONS = [
  { emoji: '♠️', top: '8%', left: '8%', delay: 0 },
  { emoji: '♥️', top: '10%', right: '8%', delay: 0.3 },
  { emoji: '👑', top: '40%', left: '4%', delay: 0.6 },
  { emoji: '🍻', top: '44%', right: '4%', delay: 0.9 },
  { emoji: '♦️', bottom: '10%', left: '10%', delay: 0.4 },
  { emoji: '♣️', bottom: '8%', right: '10%', delay: 0.7 },
];

export const DoraemonCardRevealModal: React.FC<DoraemonCardRevealModalProps> = ({
  isOpen,
  stage,
  drawerPlayerName,
  nextPlayerName,
  remainingDeckCount,
  card,
  ruleText,
  activeKingCommand,
  isFlipping,
  onConfirmFlip,
  onAcknowledgeAndContinue,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [newKingCommandInput, setNewKingCommandInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && stage === 'suspense') {
      setNewKingCommandInput('');
    }
  }, [isOpen, stage]);

  if (!mounted || typeof document === 'undefined') return null;

  const isRevealed = stage === 'revealed';
  const isKing = card?.rank === 'K';
  const isQueen = card?.rank === 'Q';
  const isJack = card?.rank === 'J';
  const isSpecial = isKing || isQueen || isJack;

  const auraGradient = !isRevealed
    ? 'from-amber-200/90 via-rose-200/80 to-sky-200/80'
    : isKing
    ? 'from-amber-300/95 via-yellow-200/90 to-orange-200/90'
    : isQueen
    ? 'from-purple-200/95 via-pink-200/90 to-rose-200/90'
    : isJack
    ? 'from-sky-200/95 via-indigo-200/90 to-cyan-200/90'
    : card?.isRed
    ? 'from-rose-200/90 via-amber-100/85 to-pink-200/90'
    : 'from-amber-200/90 via-slate-100/90 to-sky-200/90';

  const handleRandomPreset = () => {
    const picked =
      KING_COMMAND_PRESETS[
        Math.floor(Math.random() * KING_COMMAND_PRESETS.length)
      ];
    setNewKingCommandInput(picked);
  };

  const handleContinue = () => {
    if (isKing && newKingCommandInput.trim()) {
      onAcknowledgeAndContinue(newKingCommandInput.trim());
    } else {
      onAcknowledgeAndContinue();
    }
  };

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      handleContinue();
    }
  };

  const portalNode = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="doraemon-reveal-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.24, ease: 'easeInOut' }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none"
        >
          {/* Pastel Glowing Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={isRevealed ? handleDismiss : undefined}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md -z-20 cursor-pointer"
          />

          {/* Ambient Rotating Sacred Light Rays */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.65, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden -z-10"
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.08, 1] }}
              transition={{
                rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
              }}
              className={`w-[520px] h-[520px] sm:w-[720px] sm:h-[720px] rounded-full bg-gradient-to-tr ${auraGradient} blur-3xl`}
            />
          </motion.div>

          {/* Floating Animated Orbit Icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 pointer-events-none overflow-hidden -z-10 max-w-5xl mx-auto"
          >
            {FLOATING_ORBIT_ICONS.map((item, idx) => (
              <motion.div
                key={`orbit-${idx}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0.45, 0.95, 0.45],
                  y: [0, -14, 0],
                  rotate: [-8, 8, -8],
                  scale: [0.95, 1.15, 0.95],
                }}
                transition={{
                  duration: 3 + (idx % 3) * 0.6,
                  delay: item.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  top: item.top,
                  bottom: item.bottom,
                  left: item.left,
                  right: item.right,
                }}
                className="absolute text-3xl sm:text-5xl drop-shadow-md"
              >
                {item.emoji}
              </motion.div>
            ))}
          </motion.div>

          {/* ================================================================= */}
          {/* MODAL CONTENT CONTAINER (MAJESTIC TABLET / DESKTOP GRAND SHOWCASE) */}
          {/* ================================================================= */}
          <div className="relative w-full max-w-2xl sm:max-w-4xl lg:max-w-5xl my-auto flex items-center justify-center">
            {/* --------------------------------------------------------------- */}
            {/* STAGE 1: SUSPENSE CARD BACK (ลอยเด่น แตะเพื่อเปิดไพ่)             */}
            {/* --------------------------------------------------------------- */}
            {!isRevealed ? (
              <motion.div
                key="suspense-card-back"
                initial={{ scale: 0.75, opacity: 0, y: 30 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  rotateY: isFlipping ? 90 : 0,
                }}
                exit={{ scale: 0.85, opacity: 0, rotateY: 90 }}
                transition={{
                  rotateY: { duration: 0.28 },
                  scale: { type: 'spring', stiffness: 280, damping: 24 },
                  opacity: { duration: 0.2 },
                }}
                className="w-full max-w-lg flex flex-col items-center text-center space-y-6 py-4"
              >
                {/* Player Turn Header Pill */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-7 py-3 rounded-2xl bg-amber-100/95 border-2 border-amber-300 shadow-xl flex items-center gap-2.5 text-amber-950"
                >
                  <Flame className="w-6 h-6 text-rose-500 animate-bounce" />
                  <span className="text-base sm:text-lg font-black">
                    จังหวะชี้ชะตาของ:{' '}
                    <span className="text-rose-600 underline">
                      {drawerPlayerName}
                    </span>
                  </span>
                </motion.div>

                {/* Floating Mystical Card Back */}
                <div className="relative flex items-center justify-center py-4">
                  {/* Pulsing Sacred Halo Rings */}
                  <motion.div
                    animate={{
                      scale: [1, 1.18, 1],
                      opacity: [0.35, 0.7, 0.35],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="absolute w-76 h-104 sm:w-92 sm:h-124 rounded-[2.5rem] border-2 border-amber-300/80 bg-amber-200/20"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 14,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute w-88 h-88 sm:w-104 sm:h-104 rounded-full border border-dashed border-amber-200/70"
                  />

                  {/* Interactive Card Back Button */}
                  <button
                    type="button"
                    disabled={isFlipping}
                    onClick={onConfirmFlip}
                    className="relative w-68 h-96 sm:w-80 sm:h-112 rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-rose-400 to-amber-500 p-3.5 shadow-2xl border-4 border-amber-100 cursor-pointer group overflow-hidden active:scale-95 transition-transform"
                  >
                    {/* Inner Ornate Frame */}
                    <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-amber-50/95 via-rose-50/95 to-amber-100/95 border-2 border-amber-300 flex flex-col items-center justify-between p-6 relative overflow-hidden">
                      {/* Corner Suit Ornaments */}
                      <div className="w-full flex items-center justify-between text-amber-700/70 text-lg font-black">
                        <span>♠ ♥</span>
                        <span>♦ ♣</span>
                      </div>

                      {/* Center Mystical Emblem */}
                      <div className="relative flex flex-col items-center space-y-4 my-auto">
                        <motion.div
                          animate={{
                            scale: [1, 1.14, 1],
                            rotate: [0, 6, -6, 0],
                          }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                          className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-amber-300 via-yellow-200 to-rose-200 border-2 border-amber-400 shadow-md flex items-center justify-center text-6xl sm:text-7xl"
                        >
                          🎴
                        </motion.div>
                        <div className="text-sm sm:text-base font-black tracking-widest text-amber-900 uppercase">
                          DORAEMON ORACLE
                        </div>
                        <div className="px-5 py-2 rounded-full bg-amber-200/80 border border-amber-400 text-sm sm:text-base font-black text-amber-950 flex items-center gap-2 shadow-2xs">
                          <Hand className="w-5 h-5 text-rose-600 animate-pulse" />
                          <span>แตะที่ไพ่เพื่อหงายเปิด!</span>
                        </div>
                      </div>

                      {/* Bottom Corner Suit Ornaments */}
                      <div className="w-full flex items-center justify-between text-amber-700/70 text-lg font-black">
                        <span>♣ ♦</span>
                        <span>♥ ♠</span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-lg sm:text-xl font-black text-amber-100 drop-shadow-xs">
                    ✨ ไพ่ถูกดึงขึ้นมาจากสำรับแล้ว... แตะที่การ์ดเพื่อลุ้นผล!
                  </p>
                  <p className="text-sm sm:text-base text-amber-200/80 font-bold">
                    (เหลือไพ่ในสำรับ {remainingDeckCount} ใบ)
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ------------------------------------------------------------- */
              /* STAGE 2: GRAND REVEALED CARD (การ์ดขยายใหญ่ สง่างาม เต็มตาใน Tablet) */
              /* ------------------------------------------------------------- */
              <motion.div
                key="grand-revealed-card"
                initial={{ scale: 0.82, opacity: 0, rotateY: -90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{
                  rotateY: { type: 'spring', stiffness: 220, damping: 24 },
                  scale: { type: 'spring', stiffness: 280, damping: 25 },
                  opacity: { duration: 0.2 },
                }}
                className="relative w-full max-h-[94vh] overflow-y-auto rounded-[3rem] bg-gradient-to-b from-amber-50 via-white to-rose-50 border-4 border-amber-300 p-8 sm:p-10 lg:p-12 shadow-2xl space-y-6 sm:space-y-8 text-slate-900 flex flex-col justify-between"
              >
                {/* Close Button on Top Right */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="absolute top-6 right-6 p-3 rounded-2xl bg-amber-100/85 hover:bg-amber-200 text-amber-900 transition-colors cursor-pointer z-20 shadow-2xs"
                  title="ปิดหน้าต่างขยาย"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Top Header Badge */}
                <div className="flex items-center justify-between gap-4 border-b border-amber-200/80 pb-5 pr-12 shrink-0">
                  <div className="flex items-center gap-4">
                    <motion.span
                      animate={{ rotate: [0, 14, -14, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="p-3 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900"
                    >
                      <PartyPopper className="w-6 h-6 text-rose-600" />
                    </motion.span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500">
                        ผู้ที่จั่วได้ไพ่ใบนี้
                      </div>
                      <div className="text-lg sm:text-xl font-black text-slate-900">
                        🎯 {drawerPlayerName}
                      </div>
                    </div>
                  </div>

                  {isSpecial && (
                    <motion.span
                      animate={{ scale: [1, 1.07, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-300 to-rose-300 border border-amber-400 text-amber-950 text-sm sm:text-base font-black shadow-2xs flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>📌 ปักหมุดประจำวง!</span>
                    </motion.span>
                  )}
                </div>

                {/* Grand Playing Card Showcase Centerpiece (ขนาดใหญ่สมจริงใน Tablet) */}
                {card ? (
                  <div className="relative flex flex-col items-center justify-center py-4 shrink-0">
                    {/* Animated Aura Behind the Playing Card */}
                    <motion.div
                      animate={{ scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className={`absolute w-72 h-96 sm:w-88 sm:h-116 rounded-[3rem] blur-2xl ${
                        isKing
                          ? 'bg-amber-300/80'
                          : isQueen
                          ? 'bg-purple-300/80'
                          : isJack
                          ? 'bg-sky-300/80'
                          : card.isRed
                          ? 'bg-rose-200/85'
                          : 'bg-amber-200/85'
                      }`}
                    />

                    {/* Giant Tactile Playing Card (Tablet Grand Scale) */}
                    <div
                      className={`relative w-64 h-88 sm:w-76 sm:h-104 lg:w-84 lg:h-112 rounded-[2.5rem] border-4 bg-white shadow-2xl p-6 sm:p-8 flex flex-col justify-between ${
                        card.isRed
                          ? 'border-rose-300 text-rose-600'
                          : 'border-slate-300 text-slate-900'
                      }`}
                    >
                      {/* Top-Left Rank & Suit */}
                      <div className="flex items-start justify-between w-full">
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-4xl sm:text-5xl font-black">
                            {card.rank}
                          </span>
                          <span className="text-3xl sm:text-4xl">
                            {card.suitSymbol}
                          </span>
                        </div>
                        <span className="text-amber-400">
                          <Star className="w-7 h-7 fill-amber-300" />
                        </span>
                      </div>

                      {/* Center Animated Icon & Suit Watermark */}
                      <div className="relative flex flex-col items-center justify-center my-auto">
                        <motion.div
                          animate={{
                            scale: [1, 1.16, 1],
                            rotate: [0, -6, 6, 0],
                          }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                          className="text-7xl sm:text-8xl drop-shadow-md z-10"
                        >
                          {card.badgeEmoji}
                        </motion.div>
                        <span className="text-sm sm:text-base font-extrabold px-4 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-950 mt-3">
                          {card.titleTh}
                        </span>
                      </div>

                      {/* Bottom-Right Rank & Suit */}
                      <div className="flex items-end justify-between w-full">
                        <span className="text-rose-400">
                          <Zap className="w-6 h-6 fill-rose-300" />
                        </span>
                        <div className="flex flex-col items-center leading-none rotate-180">
                          <span className="text-4xl sm:text-5xl font-black">
                            {card.rank}
                          </span>
                          <span className="text-3xl sm:text-4xl">
                            {card.suitSymbol}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-500 font-bold shrink-0">
                    กำลังโหลดข้อมูลการ์ด...
                  </div>
                )}

                {/* Rule Title & Detailed Meaning Box */}
                {card && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-100/85 via-amber-50 to-rose-50 border-2 border-amber-300 space-y-3 text-center shadow-inner shrink-0">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white/95 border border-amber-300 text-base sm:text-lg font-black text-amber-950 shadow-2xs">
                      <span className="text-xl">{card.badgeEmoji}</span>
                      <span>{DEFAULT_DORAEMON_RULES[card.rank]?.nameTh}</span>
                    </div>
                    <p className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-800 leading-relaxed max-w-2xl mx-auto">
                      {ruleText}
                    </p>
                  </div>
                )}

                {/* SPECIAL KING (K) SECTION: Show Current Penalty + Input Next King Command */}
                {isKing && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-amber-100/95 border-2 border-amber-400 space-y-4 shrink-0">
                    <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm sm:text-base">
                      <Crown className="w-6 h-6 text-amber-600 shrink-0 animate-bounce" />
                      <span>👑 คำสั่งที่ {drawerPlayerName} ต้องทำเดี๋ยวนี้:</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-amber-300 text-center text-base sm:text-lg font-black text-rose-700 shadow-2xs">
                      &ldquo;{activeKingCommand}&rdquo;
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-black text-amber-950">
                        <span>ตั้งคำสั่งใหม่ส่งต่อให้ K คนต่อไป:</span>
                        <button
                          type="button"
                          onClick={handleRandomPreset}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Shuffle className="w-4 h-4" />
                          <span>สุ่มคำสั่ง</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newKingCommandInput}
                        onChange={(e) => setNewKingCommandInput(e.target.value)}
                        placeholder="พิมพ์คำสั่งใหม่สำหรับ King คนถัดไป..."
                        className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-amber-300 focus:border-amber-600 focus:outline-hidden text-sm sm:text-base font-bold text-slate-900 shadow-inner"
                      />
                    </div>
                  </div>
                )}

                {/* Confirm & Pass Turn Button */}
                <div className="pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:opacity-95 text-white font-black text-lg sm:text-xl shadow-xl flex items-center justify-center gap-3 cursor-pointer transition-transform active:scale-98"
                  >
                    <span>
                      รับทราบกติกา · ส่งต่อให้คิวถัดไป ({nextPlayerName})
                    </span>
                    <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(portalNode, document.body);
};
