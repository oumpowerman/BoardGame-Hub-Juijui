import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Sparkles, Shield, Flame, Check } from 'lucide-react';
import { FirestorePlayer, PlayerRoleCard } from '../../firebase/tableService';
import { AVALON_ROLES_META, AvalonRoleMeta } from '../../data/avalonRules';
import { AvalonRoleIcon } from './AvalonRoleIcon';

export interface AvalonRoleCard3DProps {
  myPlayer: FirestorePlayer | undefined;
  roleMeta: AvalonRoleMeta | undefined;
  visionList: FirestorePlayer[];
  isManualMode: boolean;
  onSelectManualRole?: (role: PlayerRoleCard) => Promise<void>;
  onConfirmRoleRevealed: () => Promise<void>;
  isLoading: boolean;
  onPlayFlipSound?: () => void;
}

const ALL_ROLES_ORDER: PlayerRoleCard[] = [
  'avalon_merlin',
  'avalon_percival',
  'avalon_loyal_servant',
  'avalon_assassin',
  'avalon_morgana',
  'avalon_mordred',
  'avalon_oberon',
  'avalon_minion',
];

export const AvalonRoleCard3D: React.FC<AvalonRoleCard3DProps> = ({
  myPlayer,
  roleMeta,
  visionList,
  isManualMode,
  onSelectManualRole,
  onConfirmRoleRevealed,
  isLoading,
  onPlayFlipSound,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isGood = roleMeta?.faction === 'good';
  const hasRevealed = Boolean(myPlayer?.roleAcknowledged);

  const toggleFlip = () => {
    onPlayFlipSound?.();
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="space-y-6">
      {/* Top Explanation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1.5"
      >
        <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-full inline-block">
          SECRET ROLE IDENTIFICATION · 3D CARD
        </span>
        <h3 className="text-lg sm:text-xl font-black text-slate-900">
          ตรวจสอบบทบาทและนิมิตลับของคุณ
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          แตะหรือกดค้างที่ไพ่เพื่อเปิดเผยบทบาทลับ ระวังอย่าให้ผู้เล่นคนอื่นที่โต๊ะแอบมองหน้าจอของคุณ!
        </p>
      </motion.div>

      {/* Manual Role Selector if configured */}
      {isManualMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-3xl space-y-3 shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
            <span>🎴 เลือกบทบาทตามไพ่จริงที่คุณจับได้ที่โต๊ะ:</span>
            <span className="text-emerald-800 font-mono">
              ปัจจุบัน: {roleMeta ? roleMeta.nameTh : 'ยังไม่ได้เลือก'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_ROLES_ORDER.map((roleKey) => {
              const meta = AVALON_ROLES_META[roleKey];
              const isSelected = myPlayer?.role === roleKey;
              const isRoleGood = meta.faction === 'good';

              return (
                <motion.button
                  key={roleKey}
                  type="button"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onPlayFlipSound?.();
                    onSelectManualRole?.(roleKey);
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? isRoleGood
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300 shadow-sm'
                        : 'bg-rose-100 border-rose-400 text-rose-950 ring-2 ring-rose-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <AvalonRoleIcon roleId={roleKey} size="xs" />
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-black truncate">{meta.nameTh}</div>
                    <div className="text-[10px] font-mono text-slate-500">{meta.faction.toUpperCase()}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 3D Fantasy Card Arena */}
      <div className="flex flex-col items-center justify-center py-2">
        <div
          style={{ perspective: '1200px' }}
          className="w-72 sm:w-80 h-96 sm:h-[420px] cursor-pointer"
          onClick={toggleFlip}
        >
          <motion.div
            className="w-full h-full relative rounded-3xl shadow-xl select-none"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.65, type: 'spring', damping: 22, stiffness: 220 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Card Back (Hidden) */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-amber-950 border-4 border-amber-400/80 p-6 flex flex-col items-center justify-between text-amber-100 shadow-2xl overflow-hidden"
            >
              {/* Decorative Corner Filigree */}
              <div className="absolute top-3 left-3 text-amber-400/40 text-xs font-serif font-black">
                ✦ ✦
              </div>
              <div className="absolute top-3 right-3 text-amber-400/40 text-xs font-serif font-black">
                ✦ ✦
              </div>
              <div className="absolute bottom-3 left-3 text-amber-400/40 text-xs font-serif font-black">
                ✦ ✦
              </div>
              <div className="absolute bottom-3 right-3 text-amber-400/40 text-xs font-serif font-black">
                ✦ ✦
              </div>

              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono tracking-widest text-amber-300 font-bold uppercase">
                  THE RESISTANCE: AVALON
                </span>
                <h4 className="text-sm font-black text-amber-200/90">
                  ไพ่บทบาทลับประจำตัว
                </h4>
              </div>

              {/* Center Crest */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="w-32 h-32 rounded-full border border-dashed border-amber-400/40 absolute -inset-2"
                />
                <div className="w-28 h-28 rounded-full bg-gradient-to-b from-amber-500/20 to-slate-950 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-inner">
                  ⚔️
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-200 text-xs font-bold shadow-xs">
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span>แตะเพื่อพลิกไพ่ 3D</span>
                </div>
                <p className="text-[10px] text-amber-200/60 font-mono">
                  (แตะอีกครั้งเพื่อคว่ำไพ่กลับ)
                </p>
              </div>
            </div>

            {/* Card Front (Revealed Face Up) */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className={`absolute inset-0 rounded-3xl border-4 p-6 flex flex-col items-center justify-between shadow-2xl overflow-hidden ${
                isGood
                  ? 'bg-gradient-to-b from-emerald-100 via-white to-amber-50 border-emerald-400 text-emerald-950 shadow-emerald-200/50'
                  : 'bg-gradient-to-b from-rose-100 via-white to-amber-50 border-rose-400 text-rose-950 shadow-rose-200/50'
              }`}
            >
              {/* Header Badge */}
              <div className="w-full flex items-center justify-between border-b pb-2 border-current/20">
                <span
                  className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isGood
                      ? 'bg-emerald-200 text-emerald-900 border-emerald-400'
                      : 'bg-rose-200 text-rose-900 border-rose-400'
                  }`}
                >
                  {isGood ? '🛡️ ฝ่ายอัศวิน (GOOD)' : '🔥 ฝ่ายปีศาจ (EVIL)'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFlip();
                  }}
                  className="text-slate-500 hover:text-slate-800 p-1"
                  title="คว่ำไพ่กลับ"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              {/* Character Avatar Icon & Title */}
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="flex items-center justify-center py-2"
                >
                  <AvalonRoleIcon roleId={roleMeta?.roleId} size="lg" />
                </motion.div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    {roleMeta?.nameTh || 'ไม่ทราบบทบาท'}
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-500 uppercase">
                    {roleMeta?.nameEn}
                  </p>
                </div>
              </div>

              {/* Role Ability Description */}
              <div className="w-full p-3 rounded-2xl bg-white/90 border border-current/20 text-center space-y-1 shadow-2xs">
                <p className="text-xs font-extrabold text-slate-800 leading-snug">
                  {roleMeta?.description}
                </p>
              </div>

              {/* Tap to flip hint */}
              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <span>แตะไพ่อีกครั้งเพื่อคว่ำกลับ</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Secret Vision Panel if player has special vision */}
      <AnimatePresence>
        {isFlipped && visionList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`p-5 rounded-3xl border-2 space-y-3 shadow-md ${
              isGood
                ? 'bg-gradient-to-r from-emerald-50 via-white to-amber-50 border-emerald-300'
                : 'bg-gradient-to-r from-rose-50 via-white to-amber-50 border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles
                className={`w-4 h-4 ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}
              />
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                นิมิตลับเฉพาะบทบาทของคุณ (SECRET VISION):
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visionList.map((target, idx) => (
                <motion.div
                  key={target.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="p-3 bg-white/90 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {isGood ? '👁️' : '🗡️'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-800">
                      {target.name}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {myPlayer?.role === 'avalon_percival'
                      ? 'Merlin หรือ Morgana'
                      : isGood
                      ? 'ฝ่ายปีศาจ'
                      : 'เพื่อนร่วมฝ่ายปีศาจ'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Button */}
      <div className="text-center pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          disabled={hasRevealed || isLoading}
          onClick={onConfirmRoleRevealed}
          className={`px-8 py-3.5 font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2 ${
            hasRevealed
              ? 'bg-slate-200 text-slate-600 border border-slate-300'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>
            {hasRevealed
              ? 'ยืนยันดูบทบาทเรียบร้อยแล้ว ✓'
              : 'ฉันเข้าใจบทบาทแล้ว (พร้อมเริ่มเกม)'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
