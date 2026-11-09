import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Sparkles, Play, RotateCcw, Check, Flame } from 'lucide-react';
import { BaseModal } from '../BaseModal';
import { AvalonQuestResult } from '../../firebase/tableService';

export interface AvalonQuestRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AvalonQuestResult | null;
  requiredFails: number;
  questNumber: number;
  onPlaySuccessSound?: () => void;
  onPlayFailSound?: () => void;
  onPlayFlipSound?: () => void;
  onPlaySuspenseTick?: () => void;
}

interface ShuffledCard {
  id: string;
  type: 'success' | 'fail';
  isRevealed: boolean;
}

export const AvalonQuestRevealModal: React.FC<AvalonQuestRevealModalProps> = ({
  isOpen,
  onClose,
  result,
  requiredFails,
  questNumber,
  onPlaySuccessSound,
  onPlayFailSound,
  onPlayFlipSound,
  onPlaySuspenseTick,
}) => {
  const [cards, setCards] = useState<ShuffledCard[]>([]);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);

  // Initialize and shuffle cards whenever a new result is loaded
  useEffect(() => {
    if (!result || !isOpen) {
      setCards([]);
      setIsAutoRevealing(false);
      return;
    }

    const cardList: ('success' | 'fail')[] = [];
    for (let i = 0; i < result.successCount; i++) cardList.push('success');
    for (let i = 0; i < result.failCount; i++) cardList.push('fail');

    // Fisher-Yates shuffle
    for (let i = cardList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]];
    }

    setCards(
      cardList.map((type, idx) => ({
        id: `card-${questNumber}-${idx}-${type}`,
        type,
        isRevealed: false,
      }))
    );
    setIsAutoRevealing(false);
  }, [result, questNumber, isOpen]);

  const revealedCount = cards.filter((c) => c.isRevealed).length;
  const allRevealed = cards.length > 0 && revealedCount === cards.length;
  const currentFails = cards.filter((c) => c.isRevealed && c.type === 'fail').length;

  // Single card reveal action
  const handleRevealNext = () => {
    const nextIndex = cards.findIndex((c) => !c.isRevealed);
    if (nextIndex === -1) return;

    onPlayFlipSound?.();
    const targetCard = cards[nextIndex];
    if (targetCard.type === 'success') {
      setTimeout(() => onPlaySuccessSound?.(), 200);
    } else {
      setTimeout(() => onPlayFailSound?.(), 200);
    }

    setCards((prev) =>
      prev.map((card, idx) => (idx === nextIndex ? { ...card, isRevealed: true } : card))
    );
  };

  // Auto suspense timer
  useEffect(() => {
    if (!isAutoRevealing || allRevealed || !isOpen) return;

    onPlaySuspenseTick?.();
    const timer = setTimeout(() => {
      handleRevealNext();
    }, 1100);

    return () => clearTimeout(timer);
  }, [isAutoRevealing, revealedCount, allRevealed, isOpen]);

  const handleResetReveal = () => {
    setIsAutoRevealing(false);
    setCards((prev) => prev.map((c) => ({ ...c, isRevealed: false })));
  };

  if (!result) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={`ผลลัพธ์การ์ดภารกิจรอบที่ ${questNumber}`}
      subtitle="DRAMATIC QUEST REVEAL"
      icon={<Sparkles className="w-5 h-5 text-amber-950" />}
    >
      <div className="space-y-6 py-2">
        {/* Suspense Header Banner */}
        <div className="text-center space-y-1.5 bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <p className="text-xs font-mono font-bold text-amber-800 uppercase tracking-widest">
            สับการ์ดลับทั้งหมด {cards.length} ใบ (สมาชิกส่ง Success/Fail)
          </p>
          <p className="text-xs text-slate-600">
            ภารกิจนี้ต้องการ <strong>{requiredFails} การ์ดล้มเหลว (Fail)</strong> ในการขัดขวางภารกิจ
          </p>
        </div>

        {/* 3D Cards Arena */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-4 min-h-[190px]">
          {cards.map((card, index) => {
            const isSuccess = card.type === 'success';

            return (
              <div
                key={card.id}
                style={{ perspective: '1000px' }}
                className="w-24 sm:w-28 h-36 sm:h-40 cursor-pointer"
                onClick={() => {
                  if (!card.isRevealed) {
                    onPlayFlipSound?.();
                    if (isSuccess) setTimeout(() => onPlaySuccessSound?.(), 180);
                    else setTimeout(() => onPlayFailSound?.(), 180);

                    setCards((prev) =>
                      prev.map((c, i) => (i === index ? { ...c, isRevealed: true } : c))
                    );
                  }
                }}
              >
                <motion.div
                  className="w-full h-full relative rounded-2xl shadow-md transition-shadow"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: card.isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                  whileHover={{ scale: card.isRevealed ? 1.02 : 1.05, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {/* Card Back (Face Down) */}
                  <div
                    style={{ backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-amber-950 border-2 border-amber-400/60 p-2.5 flex flex-col items-center justify-between text-amber-200 select-none shadow-lg"
                  >
                    <div className="text-[10px] font-mono tracking-wider text-amber-300/80 font-bold">
                      AVALON
                    </div>
                    <div className="w-10 h-10 rounded-full border border-amber-400/40 bg-amber-900/30 flex items-center justify-center text-xl shadow-inner">
                      ⚔️
                    </div>
                    <div className="text-[9px] font-mono text-amber-300/70 font-semibold text-center">
                      แตะเพื่อพลิก #{index + 1}
                    </div>
                  </div>

                  {/* Card Front (Face Up) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                    className={`absolute inset-0 rounded-2xl border-2 p-3 flex flex-col items-center justify-between select-none shadow-xl ${
                      isSuccess
                        ? 'bg-gradient-to-b from-emerald-100 via-white to-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-gradient-to-b from-rose-100 via-white to-rose-50 border-rose-400 text-rose-950'
                    }`}
                  >
                    <span
                      className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                        isSuccess
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-rose-200/80 text-rose-900'
                      }`}
                    >
                      {isSuccess ? 'SUCCESS' : 'FAIL'}
                    </span>

                    <motion.div
                      initial={{ scale: 0.5, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 350 }}
                      className="text-3xl sm:text-4xl"
                    >
                      {isSuccess ? '⚔️' : '🔥'}
                    </motion.div>

                    <div className="text-center">
                      <div className="text-[11px] font-black leading-tight">
                        {isSuccess ? 'สำเร็จ' : 'ล้มเหลว'}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {isSuccess ? 'Loyalty' : 'Sabotage'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Revealed Outcome Banner if all cards turned */}
        <AnimatePresence>
          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className={`p-5 rounded-2xl border-2 text-center space-y-2 shadow-lg ${
                result.passed
                  ? 'bg-gradient-to-r from-emerald-100 via-emerald-50 to-amber-100 border-emerald-400 text-emerald-950'
                  : 'bg-gradient-to-r from-rose-100 via-rose-50 to-amber-100 border-rose-400 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {result.passed ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-700" />
                )}
                <h4 className="text-base sm:text-lg font-black">
                  {result.passed
                    ? 'ภารกิจนี้สำเร็จเรียบร้อย! (QUEST PASSED)'
                    : 'ภารกิจนี้ถูกทำลายล้มเหลว! (QUEST FAILED)'}
                </h4>
              </div>

              <p className="text-xs font-semibold text-slate-700">
                ผลตรวจนับ: สำเร็จ {result.successCount} ใบ · ล้มเหลว {result.failCount} ใบ
                {result.passed
                  ? ' (ไม่ถึงเงื่อนไขทำลายภารกิจ)'
                  : ` (ถึงเกณฑ์ทำลาย ${requiredFails} ใบ)`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200/60">
          <div className="flex items-center gap-2">
            {!allRevealed && (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleRevealNext}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>เปิดใบถัดไป ({revealedCount + 1}/{cards.length})</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setIsAutoRevealing((prev) => !prev)}
                  className={`px-3 py-2.5 font-bold text-xs rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isAutoRevealing
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isAutoRevealing ? 'animate-spin' : ''}`} />
                  <span>{isAutoRevealing ? 'หยุดเปิดอัตโนมัติ' : 'เปิดระทึกขวัญอัตโนมัติ'}</span>
                </motion.button>
              </>
            )}

            {revealedCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleResetReveal}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                title="ปิดไพ่เพื่อเปิดใหม่"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คว่ำไพ่ใหม่</span>
              </motion.button>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors ml-auto"
          >
            {allRevealed ? 'รับทราบผลภารกิจ ✓' : 'ปิดหน้าต่าง'}
          </motion.button>
        </div>
      </div>
    </BaseModal>
  );
};
