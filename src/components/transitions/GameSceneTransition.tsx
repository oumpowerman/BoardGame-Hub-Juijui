import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles,
  Dices,
  Hourglass,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  PlusCircle,
  LogOut,
  Play,
} from 'lucide-react';

export type TransitionGameVariant =
  | 'cheese-thief'
  | 'insider'
  | 'undercover'
  | 'detective-club'
  | 'avalon'
  | 'hues-cues';

export type SceneTransitionMode =
  | 'enter'
  | 'exit'
  | 'create_room'
  | 'join_verifying'
  | 'join_success'
  | 'join_error'
  | 'leave_room'
  | 'start_game';

export interface GameSceneTransitionProps {
  isVisible: boolean;
  direction?: 'enter' | 'exit';
  mode?: SceneTransitionMode;
  gameVariant?: TransitionGameVariant;
  roomCode?: string;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

interface PastelPalette {
  backdrop: string;
  cardBorder: string;
  cardShadow: string;
  emblemBg: string;
  emblemBorder: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentIconText: string;
  progressTrack: string;
  progressFill: string;
  buttonBg: string;
  buttonText: string;
  emoji: string;
  gameNameTh: string;
  tagLabel: string;
}

const PASTEL_PALETTES: Record<TransitionGameVariant, PastelPalette> = {
  'cheese-thief': {
    backdrop: 'bg-gradient-to-br from-amber-100/95 via-[#FFFDF7]/95 to-orange-100/95',
    cardBorder: 'border-amber-300',
    cardShadow: 'shadow-amber-200/70',
    emblemBg: 'bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-100',
    emblemBorder: 'border-amber-400',
    badgeBg: 'bg-amber-100/90',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-900',
    accentIconText: 'text-amber-700',
    progressTrack: 'bg-amber-100/90 border-amber-200',
    progressFill: 'bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500',
    buttonBg: 'bg-amber-400 hover:bg-amber-300',
    buttonText: 'text-amber-950',
    emoji: '🧀',
    gameNameTh: 'หนูขโมยชีส (Cheese Thief)',
    tagLabel: 'CHEESE THIEF TABLETOP',
  },
  insider: {
    backdrop: 'bg-gradient-to-br from-rose-100/95 via-[#FFFDF9]/95 to-pink-100/95',
    cardBorder: 'border-rose-300',
    cardShadow: 'shadow-rose-200/70',
    emblemBg: 'bg-gradient-to-tr from-rose-300 via-pink-200 to-amber-100',
    emblemBorder: 'border-rose-400',
    badgeBg: 'bg-rose-100/90',
    badgeBorder: 'border-rose-300',
    badgeText: 'text-rose-900',
    accentIconText: 'text-rose-700',
    progressTrack: 'bg-rose-100/90 border-rose-200',
    progressFill: 'bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400',
    buttonBg: 'bg-rose-500 hover:bg-rose-600',
    buttonText: 'text-white',
    emoji: '🕵️',
    gameNameTh: 'จอมบงการคำใบ้ (Insider)',
    tagLabel: 'INSIDER · SECRET WORD DEDUCTION',
  },
  undercover: {
    backdrop: 'bg-gradient-to-br from-violet-100/95 via-[#FDFBFF]/95 to-indigo-100/95',
    cardBorder: 'border-violet-300',
    cardShadow: 'shadow-violet-200/70',
    emblemBg: 'bg-gradient-to-tr from-violet-300 via-purple-200 to-indigo-100',
    emblemBorder: 'border-violet-400',
    badgeBg: 'bg-violet-100/90',
    badgeBorder: 'border-violet-300',
    badgeText: 'text-violet-900',
    accentIconText: 'text-violet-700',
    progressTrack: 'bg-violet-100/90 border-violet-200',
    progressFill: 'bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400',
    buttonBg: 'bg-violet-500 hover:bg-violet-600',
    buttonText: 'text-white',
    emoji: '🕶️',
    gameNameTh: 'สายลับสลับคำ (Undercover)',
    tagLabel: 'UNDERCOVER · WORD SPY PARTY',
  },
  'detective-club': {
    backdrop: 'bg-gradient-to-br from-amber-100/95 via-[#FCFBF7]/95 to-stone-200/95',
    cardBorder: 'border-amber-400',
    cardShadow: 'shadow-amber-300/60',
    emblemBg: 'bg-gradient-to-tr from-amber-400 via-yellow-200 to-stone-100',
    emblemBorder: 'border-amber-500',
    badgeBg: 'bg-amber-100/90',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-950',
    accentIconText: 'text-amber-800',
    progressTrack: 'bg-amber-100/90 border-amber-300',
    progressFill: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-stone-600',
    buttonBg: 'bg-amber-400 hover:bg-amber-300',
    buttonText: 'text-amber-950 font-black',
    emoji: '🔍',
    gameNameTh: 'สมาคมนักสืบ (Detective Club)',
    tagLabel: 'DETECTIVE CLUB · MYSTERY COMPANION',
  },
  avalon: {
    backdrop: 'bg-gradient-to-br from-emerald-100/95 via-[#F7FCF9]/95 to-slate-200/95',
    cardBorder: 'border-emerald-400',
    cardShadow: 'shadow-emerald-300/60',
    emblemBg: 'bg-gradient-to-tr from-emerald-400 via-amber-200 to-slate-100',
    emblemBorder: 'border-emerald-500',
    badgeBg: 'bg-emerald-100/90',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-950',
    accentIconText: 'text-emerald-800',
    progressTrack: 'bg-emerald-100/90 border-emerald-300',
    progressFill: 'bg-gradient-to-r from-emerald-500 via-amber-400 to-slate-700',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    buttonText: 'text-white font-black',
    emoji: '⚔️',
    gameNameTh: 'Avalon: ศึกอัศวินโต๊ะกลม',
    tagLabel: 'THE RESISTANCE: AVALON · KNIGHTS COMPANION',
  },
  'hues-cues': {
    backdrop: 'bg-gradient-to-br from-pink-100/95 via-[#FFFDFB]/95 to-amber-100/95',
    cardBorder: 'border-pink-400',
    cardShadow: 'shadow-pink-300/60',
    emblemBg: 'bg-gradient-to-tr from-pink-300 via-amber-200 to-yellow-100',
    emblemBorder: 'border-pink-500',
    badgeBg: 'bg-pink-100/90',
    badgeBorder: 'border-pink-300',
    badgeText: 'text-pink-950',
    accentIconText: 'text-pink-800',
    progressTrack: 'bg-pink-100/90 border-pink-300',
    progressFill: 'bg-gradient-to-r from-pink-500 via-amber-400 to-yellow-400',
    buttonBg: 'bg-pink-600 hover:bg-pink-700',
    buttonText: 'text-white font-black',
    emoji: '🎨',
    gameNameTh: 'ทายสีจากคำใบ้ (Hues and Cues)',
    tagLabel: 'HUES AND CUES · COLOR CLUE PARTY',
  },
};

/**
 * Unified Light Pastel Scene & Room Action Transition Curtain
 * Always rendered via React.createPortal at document.body
 */
export const GameSceneTransition: React.FC<GameSceneTransitionProps> = ({
  isVisible,
  direction = 'enter',
  mode,
  gameVariant = 'cheese-thief',
  roomCode,
  errorMessage,
  onDismissError,
}) => {
  if (typeof document === 'undefined') return null;

  const activeMode: SceneTransitionMode = mode || direction;
  const isError = activeMode === 'join_error';
  const isSuccess = activeMode === 'join_success';
  const palette = PASTEL_PALETTES[gameVariant] || PASTEL_PALETTES['cheese-thief'];

  // Dynamic Title & Subtitle based on mode
  const getCopy = (): { badge: string; title: string; subtitle: string } => {
    const cleanCode = roomCode ? `#${roomCode.replace(/^#/, '')}` : '';

    switch (activeMode) {
      case 'create_room':
        return {
          badge: `${palette.tagLabel} · CREATE ROOM`,
          title: 'กำลังจัดโต๊ะและสร้างห้องใหม่...',
          subtitle: `ระบบกำลังสุ่มรหัสห้อง 4 หลักสำหรับ ${palette.gameNameTh}`,
        };
      case 'join_verifying':
        return {
          badge: `${palette.tagLabel} · VERIFYING CODE`,
          title: cleanCode
            ? `กำลังตรวจสอบห้อง ${cleanCode}...`
            : 'กำลังค้นหาโต๊ะผู้เล่น...',
          subtitle: 'กำลังเชื่อมต่อสัญญาณโต๊ะและตรวจสอบที่นั่งว่าง',
        };
      case 'join_success':
        return {
          badge: `${palette.tagLabel} · ROOM CONNECTED`,
          title: cleanCode
            ? `พบห้อง ${cleanCode} เรียบร้อย!`
            : 'เชื่อมต่อห้องสำเร็จ!',
          subtitle: `กำลังพาคุณเข้าสู่ห้องรอผู้เล่น ${palette.gameNameTh}...`,
        };
      case 'join_error':
        return {
          badge: 'ROOM CODE VERIFICATION FAILED',
          title: cleanCode
            ? `ไม่สามารถเข้าห้อง ${cleanCode} ได้`
            : 'รหัสห้องไม่ถูกต้อง',
          subtitle:
            errorMessage ||
            'ไม่พบห้องรหัสนี้ในระบบ กรุณาตรวจสอบรหัส 4 หลักกับโฮสต์อีกครั้ง',
        };
      case 'leave_room':
        return {
          badge: `${palette.tagLabel} · LEAVING TABLE`,
          title: cleanCode
            ? `กำลังออกจากห้อง ${cleanCode}...`
            : 'กำลังออกจากโต๊ะเล่นเกม...',
          subtitle: 'กำลังสลับหน้าจอกลับสู่หน้าเลือกห้อง',
        };
      case 'start_game':
        return {
          badge: `${palette.tagLabel} · DEALING CARDS`,
          title: 'กำลังสับการ์ดและแจกบทบาทลับ!',
          subtitle: `เตรียมเข้าสู่รอบการเล่นของ ${palette.gameNameTh}...`,
        };
      case 'exit':
        return {
          badge: 'TABLETOP NEXUS CATALOG',
          title: 'กลับสู่คลังบอร์ดเกม',
          subtitle: `กำลังออกจากหน้า ${palette.gameNameTh} กลับไปยังหน้าหลัก...`,
        };
      case 'enter':
      default:
        return {
          badge: palette.tagLabel,
          title: palette.gameNameTh,
          subtitle: cleanCode
            ? `กำลังเข้าสู่โต๊ะเล่นสด รหัส ${cleanCode}...`
            : 'กำลังจัดเตรียมอุปกรณ์บนโต๊ะและเชื่อมต่อห้องเล่นสด...',
        };
    }
  };

  const copy = getCopy();

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={`scene-curtain-${gameVariant}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md px-5 select-none ${
            isError
              ? 'bg-gradient-to-br from-rose-100/95 via-[#FFFBFB]/95 to-orange-100/95'
              : palette.backdrop
          }`}
        >
          {/* Center Card Container */}
          <motion.div
            key={`scene-card-${activeMode}`}
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={
              isError
                ? {
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    x: [0, -14, 14, -10, 10, -6, 6, 0],
                  }
                : { scale: 1, y: 0, opacity: 1, x: 0 }
            }
            exit={{ scale: 0.94, y: -12, opacity: 0 }}
            transition={
              isError
                ? { duration: 0.48, ease: 'easeInOut' }
                : { type: 'spring', stiffness: 320, damping: 26 }
            }
            className={`max-w-md w-full rounded-3xl p-7 sm:p-8 shadow-2xl text-center space-y-5 border-2 bg-white/95 text-slate-900 ${
              isError
                ? 'border-rose-300 shadow-rose-200/80'
                : isSuccess
                ? 'border-emerald-300 shadow-emerald-200/80'
                : `${palette.cardBorder} ${palette.cardShadow}`
            }`}
          >
            {/* Animated Emblem */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <motion.div
                animate={
                  isError
                    ? { rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.06, 1] }
                    : { rotate: [0, -6, 6, 0], scale: [1, 1.07, 1] }
                }
                transition={{ duration: 0.75, ease: 'easeInOut' }}
                className={`w-20 h-20 rounded-3xl border-2 shadow-md flex items-center justify-center text-5xl ${
                  isError
                    ? 'bg-gradient-to-tr from-rose-200 via-rose-100 to-orange-100 border-rose-300'
                    : isSuccess
                    ? 'bg-gradient-to-tr from-emerald-200 via-teal-100 to-emerald-50 border-emerald-300'
                    : `${palette.emblemBg} ${palette.emblemBorder}`
                }`}
              >
                {isError ? '⚠️' : isSuccess ? '🎉' : palette.emoji}
              </motion.div>

              {/* Corner Status Floating Badge */}
              <motion.span
                animate={{ scale: [0.92, 1.14, 0.92] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute -top-1 -right-1 w-9 h-9 rounded-2xl border-2 border-white flex items-center justify-center shadow-sm ${
                  isError
                    ? 'bg-rose-500 text-white'
                    : isSuccess
                    ? 'bg-emerald-500 text-white'
                    : `${palette.badgeBg} ${palette.accentIconText}`
                }`}
              >
                {isError ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : activeMode === 'create_room' ? (
                  <PlusCircle className="w-4 h-4" />
                ) : activeMode === 'join_verifying' ? (
                  <KeyRound className="w-4 h-4" />
                ) : activeMode === 'leave_room' ? (
                  <LogOut className="w-4 h-4" />
                ) : activeMode === 'start_game' ? (
                  <Play className="w-4 h-4" />
                ) : gameVariant === 'undercover' ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : gameVariant === 'insider' ? (
                  <Hourglass className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </motion.span>
            </div>

            {/* Badge, Title & Subtitle */}
            <div className="space-y-2">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-mono font-extrabold uppercase tracking-wider ${
                  isError
                    ? 'bg-rose-100 border-rose-300 text-rose-800'
                    : isSuccess
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : `${palette.badgeBg} ${palette.badgeBorder} ${palette.badgeText}`
                }`}
              >
                {gameVariant === 'undercover' ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : gameVariant === 'insider' ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <Dices className="w-3.5 h-3.5" />
                )}
                <span>{copy.badge}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {copy.title}
              </h2>

              <p
                className={`text-xs sm:text-sm font-medium leading-relaxed ${
                  isError ? 'text-rose-700 font-bold' : 'text-slate-600'
                }`}
              >
                {copy.subtitle}
              </p>
            </div>

            {/* Smooth Animated Progress Bar or Error Action */}
            <div className="space-y-3 pt-1">
              <div
                className={`w-full h-2.5 rounded-full overflow-hidden border p-0.5 ${
                  isError
                    ? 'bg-rose-100 border-rose-200'
                    : isSuccess
                    ? 'bg-emerald-100 border-emerald-200'
                    : palette.progressTrack
                }`}
              >
                <motion.div
                  key={`progress-${activeMode}`}
                  initial={{ width: isError ? '100%' : '12%' }}
                  animate={{ width: isError ? '0%' : '100%' }}
                  transition={{
                    duration: isError ? 1.8 : 0.58,
                    ease: isError ? 'linear' : 'easeOut',
                  }}
                  className={`h-full rounded-full ${
                    isError
                      ? 'bg-gradient-to-r from-rose-400 to-orange-400'
                      : isSuccess
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                      : palette.progressFill
                  }`}
                />
              </div>

              {isError && onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="w-full py-2.5 px-5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                >
                  ตกลง · ลองกรอกรหัสอีกครั้ง
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
