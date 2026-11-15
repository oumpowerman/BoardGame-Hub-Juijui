import React from 'react';
import { motion } from 'motion/react';
import { Eye, HelpCircle, ArrowRight } from 'lucide-react';
import { DoraemonCard, DEFAULT_DORAEMON_RULES } from '../../data/doraemonRules';

export interface DoraemonDeckTableProps {
  remainingDeckCount: number;
  totalDrawn: number;
  lastDrawerName: string;
  currentCard: DoraemonCard | null;
  currentRuleText: string;
  isRevealOpen: boolean;
  onInitiateDraw: () => void;
  onInspectCurrentCard: () => void;
  onPlayAgain: () => void;
  onOpenKingModal: () => void;
}

export const DoraemonDeckTable: React.FC<DoraemonDeckTableProps> = ({
  remainingDeckCount,
  totalDrawn,
  lastDrawerName,
  currentCard,
  currentRuleText,
  isRevealOpen,
  onInitiateDraw,
  onInspectCurrentCard,
  onPlayAgain,
  onOpenKingModal,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      {/* Deck Button / Stack */}
      <motion.div
        whileHover={remainingDeckCount > 0 ? { scale: 1.015 } : undefined}
        whileTap={remainingDeckCount > 0 ? { scale: 0.97 } : undefined}
        onClick={remainingDeckCount > 0 ? onInitiateDraw : undefined}
        className={`p-6 sm:p-8 rounded-3xl border-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden min-h-[280px] sm:min-h-[340px] ${
          remainingDeckCount > 0
            ? 'bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 border-amber-400 text-white shadow-md'
            : 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        {/* Visual stacked card effect */}
        <div className="absolute top-2 left-4 right-4 h-3 bg-white/20 rounded-t-xl" />
        <div className="absolute top-4 left-6 right-6 h-2 bg-white/30 rounded-t-lg" />

        <div className="space-y-3 z-10">
          <motion.div
            animate={
              remainingDeckCount > 0
                ? { y: [0, -8, 0], rotate: [-3, 3, -3] }
                : undefined
            }
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-white/20 backdrop-blur-xs border-2 border-white/40 flex items-center justify-center shadow-inner"
          >
            <span className="text-4xl sm:text-5xl">🎴</span>
          </motion.div>

          {remainingDeckCount > 0 ? (
            <>
              <div className="text-xl sm:text-2xl font-black tracking-tight">
                แตะเพื่อหยิบไพ่ขึ้นมาลุ้น!
              </div>
              <p className="text-xs sm:text-sm text-white/90 max-w-xs mx-auto">
                ไพ่จะลอยขึ้นมากลางจอให้คุณแตะแง้มเปิดด้วยตัวเอง
              </p>
              <div className="inline-block px-4 py-1 rounded-full bg-white/20 text-xs font-black">
                เหลือ {remainingDeckCount} / 52 ใบ
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-black">
                ไพ่หมดสำรับ 52 ใบแล้ว!
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayAgain();
                }}
                className="mt-2 py-2.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm cursor-pointer"
              >
                สับไพ่เริ่มรอบใหม่
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Current Revealed Card Display */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[280px] sm:min-h-[340px]">
        {currentCard ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-slate-500">
                ไพ่ที่เปิดล่าสุด (ใบที่ {totalDrawn})
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  จั่วโดย: {lastDrawerName}
                </span>
                <button
                  type="button"
                  onClick={onInspectCurrentCard}
                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="ขยายดูไพ่เต็มจออีกครั้ง"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ขยายใหญ่</span>
                </button>
              </div>
            </div>

            {/* Card Visual Header */}
            <div
              onClick={onInspectCurrentCard}
              className="flex items-center gap-4 cursor-pointer group"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl border-2 flex flex-col items-center justify-between p-2 shadow-sm font-black ${
                  currentCard.isRed
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <div className="text-sm self-start leading-none">
                  {currentCard.rank}
                </div>
                <div className="text-2xl sm:text-3xl leading-none">
                  {currentCard.suitSymbol}
                </div>
                <div className="text-sm self-end leading-none">
                  {currentCard.rank}
                </div>
              </motion.div>

              <div className="space-y-1 min-w-0">
                <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-1.5">
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    {currentCard.badgeEmoji}
                  </motion.span>
                  <span>{currentCard.titleTh}</span>
                </div>
                <div className="text-xs font-extrabold text-amber-700">
                  {DEFAULT_DORAEMON_RULES[currentCard.rank]?.nameTh}
                </div>
              </div>
            </div>

            {/* Card Rule Description */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-slate-800 text-xs sm:text-sm font-bold leading-relaxed">
              {currentRuleText}
            </div>

            {currentCard.rank === 'K' && (
              <div className="p-3 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-between gap-2">
                <span>👑 คำสั่งของ King รอบนี้ถูกบันทึกแล้ว!</span>
                <button
                  type="button"
                  onClick={onOpenKingModal}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black cursor-pointer"
                >
                  ดู/แก้ไขคำสั่ง
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="my-auto text-center space-y-2 py-8 text-slate-400">
            <HelpCircle className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
            <div className="text-sm font-bold text-slate-600">
              ยังไม่มีการจั่วไพ่
            </div>
            <p className="text-xs text-slate-400">
              แตะที่กองไพ่ด้านซ้ายเพื่อหยิบไพ่ใบแรกขึ้นมาลุ้น!
            </p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            เริ่มรอบใหม่
          </button>
          <button
            type="button"
            disabled={remainingDeckCount <= 0 || isRevealOpen}
            onClick={onInitiateDraw}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>หยิบไพ่ใบถัดไป</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
