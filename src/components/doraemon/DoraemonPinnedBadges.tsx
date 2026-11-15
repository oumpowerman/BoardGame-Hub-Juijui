import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, Shield } from 'lucide-react';
import { FirestoreRoom } from '../../firebase/table/types';

export interface DoraemonPinnedBadgesProps {
  activeRoom: FirestoreRoom;
  initialKingCommand: string;
  onOpenKingModal: () => void;
}

export const DoraemonPinnedBadges: React.FC<DoraemonPinnedBadgesProps> = ({
  activeRoom,
  initialKingCommand,
  onOpenKingModal,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
      {/* Pinned King (K) */}
      <div
        onClick={onOpenKingModal}
        className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 border-2 border-amber-300 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
      >
        <div className="flex items-center justify-between gap-1 text-xs font-black text-amber-950">
          <span className="flex items-center gap-1.5">
            <motion.span
              animate={{ rotate: [-8, 8, -8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-4 h-4 text-amber-600" />
            </motion.span>
            <span>👑 พระราชา (KING)</span>
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200/80 font-black">
            {activeRoom.doraemonPinnedKing?.playerName || 'ยังไม่มี'}
          </span>
        </div>
        <p className="text-xs text-amber-900 mt-1.5 font-bold line-clamp-2">
          คำสั่ง:{' '}
          {activeRoom.doraemonPinnedKing?.command ||
            activeRoom.doraemonInitialKingCommand ||
            initialKingCommand ||
            'เต้นท่าไก่ 10 วิ'}
        </p>
      </div>

      {/* Pinned Queen (Q) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-100/70 border-2 border-purple-300 shadow-2xs">
        <div className="flex items-center justify-between gap-1 text-xs font-black text-purple-950">
          <span className="flex items-center gap-1.5">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
            </motion.span>
            <span>👸 ควีนคำถาม (QUEEN)</span>
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-200/80 font-black">
            {activeRoom.doraemonPinnedQueen?.playerName || 'ยังไม่มี'}
          </span>
        </div>
        <p className="text-xs text-purple-900 mt-1.5 font-bold">
          {activeRoom.doraemonPinnedQueen
            ? `⚠️ ห้ามใครตอบคำถามของ "${activeRoom.doraemonPinnedQueen.playerName}" เผลอตอบดื่ม!`
            : 'ใครตอบคำถามของ Queen คนนั้นต้องดื่ม!'}
        </p>
      </div>

      {/* Pinned Jack (J) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-100/70 border-2 border-sky-300 shadow-2xs">
        <div className="flex items-center justify-between gap-1 text-xs font-black text-sky-950">
          <span className="flex items-center gap-1.5">
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="w-4 h-4 text-sky-600" />
            </motion.span>
            <span>🃏 แจ็คคุมกฎ (JACK)</span>
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-200/80 font-black">
            {activeRoom.doraemonPinnedJack?.playerName || 'ยังไม่มี'}
          </span>
        </div>
        <p className="text-xs text-sky-900 mt-1.5 font-bold">
          {activeRoom.doraemonPinnedJack
            ? `ผู้คุมกฎ: "${activeRoom.doraemonPinnedJack.playerName}" สั่งกฎพิเศษ 1 ข้อ`
            : 'ผู้ถือไพ่ J ล่าสุดมีสิทธิ์ออกกฎประจำวง'}
        </p>
      </div>
    </div>
  );
};
