import React from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Shield,
  Users,
  UserX,
  Sparkles,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
  PlayerRoleCard,
} from '../../firebase/tableService';

interface UndercoverRoundVerdictCardProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  isLoading: boolean;
  onAdvanceNextRound: () => void;
}

function getEliminatedRoleBadge(role?: PlayerRoleCard) {
  if (role === 'undercover_spy') {
    return {
      label: 'สายลับ (Undercover)',
      emoji: '🕶️',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      cardClass: 'from-rose-50 via-white to-amber-50 border-rose-300',
      headline: 'เยี่ยมมาก! โหวตจับสายลับออกได้ 1 คน แต่ยังมีตัวร้ายเหลืออยู่!',
    };
  }
  if (role === 'undercover_mrwhite') {
    return {
      label: 'มิสเตอร์ไวท์ (Mr. White)',
      emoji: '🎩',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
      cardClass: 'from-amber-50 via-white to-orange-50 border-amber-300',
      headline:
        'Mr. White ถูกโหวตออกและทายคำลับผิด! แต่เกมยังไม่จบเพราะยังมีสายลับแฝงตัวอยู่!',
    };
  }
  return {
    label: 'พลเมืองดี (Civilian)',
    emoji: '🧑‍💼',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    cardClass: 'from-rose-50/80 via-white to-violet-50 border-rose-300',
    headline: 'โหวตผิดคน! ผู้ที่ถูกคัดออกเป็นพลเมืองดี สายลับตัวจริงยังลอยนวลอยู่!',
  };
}

export const UndercoverRoundVerdictCard: React.FC<
  UndercoverRoundVerdictCardProps
> = ({ currentRoom, players, isLoading, onAdvanceNextRound }) => {
  const eliminatedIds = currentRoom.undercoverEliminatedIds || [];
  const alivePlayers = players.filter((p) => !eliminatedIds.includes(p.id));

  const aliveCiviliansCount = alivePlayers.filter(
    (p) => p.role === 'undercover_civilian'
  ).length;
  const aliveSpiesAndWhiteCount = alivePlayers.filter(
    (p) =>
      p.role === 'undercover_spy' || p.role === 'undercover_mrwhite'
  ).length;

  const eliminatedId =
    currentRoom.undercoverLastEliminatedId || currentRoom.accusedPlayerId || '';
  const eliminatedPlayer = players.find((p) => p.id === eliminatedId);
  const eliminatedName =
    currentRoom.undercoverLastEliminatedName ||
    eliminatedPlayer?.name ||
    'ผู้เล่นที่ถูกโหวต';
  const eliminatedRole =
    currentRoom.undercoverLastEliminatedRole || eliminatedPlayer?.role;

  const roleMeta = getEliminatedRoleBadge(eliminatedRole);
  const currentRound = currentRoom.undercoverRoundNumber || 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`bg-gradient-to-br ${roleMeta.cardClass} border-2 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center`}
    >
      {/* Top Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-rose-200 text-xs font-extrabold text-rose-800 shadow-2xs">
        <UserX className="w-4 h-4 text-rose-600" />
        <span>ผลการโหวตคัดคนออก รอบที่ {currentRound} · เกมยังไม่จบ!</span>
      </div>

      {/* Eliminated Player Identity Reveal */}
      <div className="space-y-3 max-w-xl mx-auto">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-white border-2 border-violet-200 flex items-center justify-center text-3xl shadow-xs">
          {roleMeta.emoji}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          ผู้ที่ถูกโหวตออกคือ &ldquo;{eliminatedName}&rdquo;
        </h2>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600">
            ตัวตนที่แท้จริงคือ:
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-black border ${roleMeta.badgeClass}`}
          >
            {roleMeta.emoji} {roleMeta.label}
          </span>
        </div>

        {eliminatedRole === 'undercover_mrwhite' &&
          currentRoom.mrWhiteGuessedWord && (
            <div className="text-xs font-bold text-amber-900 bg-amber-100/80 border border-amber-300 rounded-xl px-3.5 py-2 inline-block">
              คำที่ Mr. White ทายคือ &ldquo;{currentRoom.mrWhiteGuessedWord}&rdquo;
              (ทายไม่ถูกต้อง จึงถูกคัดออกจากเกม)
            </div>
          )}

        <p className="text-xs sm:text-sm font-bold text-rose-800 pt-1">
          {roleMeta.headline}
        </p>
      </div>

      {/* Remaining Players Breakdown Box */}
      <div className="max-w-lg mx-auto bg-white/95 border border-violet-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="text-xs font-extrabold text-slate-700 flex items-center justify-center gap-1.5">
          <Users className="w-4 h-4 text-violet-600" />
          <span>
            สถานการณ์ผู้รอดชีวิตในโต๊ะตอนนี้ (เหลือ {alivePlayers.length} คน)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>ฝ่ายพลเมืองดีที่เหลือ</span>
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">
              {aliveCiviliansCount} คน
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-xs font-bold text-rose-800 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>สายลับ / Mr. White ที่เหลือ</span>
            </div>
            <div className="text-2xl font-black text-rose-950 mt-0.5">
              {aliveSpiesAndWhiteCount} คน
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-200 text-left text-xs text-slate-700 space-y-1">
          <div className="font-extrabold text-violet-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span>ทำไมต้องเล่นและโหวตกันต่อในรอบถัดไป?</span>
          </div>
          <p className="leading-relaxed">
            เนื่องจากยังมี <strong>สายลับ / Mr. White อีก {aliveSpiesAndWhiteCount} คน</strong>{' '}
            แฝงตัวอยู่ในกลุ่มผู้รอดชีวิต และจำนวนพลเมืองดียังมากกว่าสายลับ
            ทุกคนที่เหลือจึงต้องผลัดกันพูดใบ้คำเพิ่มอีกคนละ 1 ประโยคในรอบที่{' '}
            {currentRound + 1} เพื่อจับพิรุธและโหวตหาตัวคนร้ายต่อไป!
          </p>
        </div>
      </div>

      {/* Continue to Next Round Action */}
      <div className="max-w-md mx-auto pt-1">
        <button
          type="button"
          onClick={onAdvanceNextRound}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>
            เริ่มการใบ้คำและโหวตรอบถัดไป (รอบที่ {currentRound + 1})
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
