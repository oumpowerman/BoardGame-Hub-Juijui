import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../../firebase/tableService';
import { getCheeseThiefRoleDetails } from './phaseUtils';

interface GameOverVerdictStepProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isLoading: boolean;
  onPlayAgain: () => void;
}

export const GameOverVerdictStep: React.FC<GameOverVerdictStepProps> = ({
  currentRoom,
  players,
  currentUid,
  isLoading,
  onPlayAgain,
}) => {
  return (
    <motion.div
      key="phase-game-over"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-5 text-center"
    >
      <div className="space-y-2">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold inline-block">
          STEP 6: เปิดการ์ดคนที่ถูกชี้มากที่สุด & ตัดสินผลผู้ชนะ
        </span>
        <div className="text-5xl pt-1">
          {currentRoom.winnerTeam === 'fall_mouse'
            ? '🃏'
            : currentRoom.winnerTeam === 'mice'
            ? '🏆'
            : '🧀'}
        </div>
        <h3 className="text-2xl font-black text-slate-900">
          {currentRoom.winnerTeam === 'fall_mouse'
            ? 'Fall Mouse ถูกโหวตมากที่สุด — ชนะเดี่ยวทันที!'
            : currentRoom.winnerTeam === 'mice'
            ? 'เปิดโปงจอมโจรชีสสำเร็จ — ฝ่ายหนูขี้เซาชนะพร้อมกันทุกคน!'
            : 'จอมโจรชีสไม่ถูกเปิดโปง — จอมโจรชีสและลูกน้องชนะไปด้วยกัน!'}
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          {currentRoom.winnerTeam === 'fall_mouse'
            ? 'ทุกคนหลงกลชี้โหวต Fall Mouse มากที่สุด ทำให้ Fall Mouse พลิกเกมคว้าชัยชนะเดี่ยวไปครอง!'
            : currentRoom.winnerTeam === 'mice'
            ? 'ผู้เล่นที่ถูกชี้โหวตมากที่สุดเปิดการ์ดออกมาเป็น "จอมโจรชีส" ฝ่ายหนูขี้เซาคว้าชัยชนะ!'
            : 'แม้จะโหวตโดนหนูขี้เซาหรือลูกน้องแทน แต่จอมโจรชีสตัวจริงไม่ถูกเปิดการ์ด จอมโจรและลูกน้องจึงชนะร่วมกัน!'}
        </p>
      </div>

      {/* Reveal All Roles & Dice Cups Around the Table */}
      <div className="p-4 sm:p-5 bg-white border border-amber-100 rounded-3xl shadow-xs space-y-3 text-left">
        <div className="text-xs font-bold text-slate-800 pb-2 border-b border-amber-100 flex items-center justify-between flex-wrap gap-2">
          <span>เฉลยการ์ดตัวละครและเลขเต๋าใต้ถ้วยของทุกคน</span>
          <span className="font-mono text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg">
            ชีสถูกขโมยตอน ตี {currentRoom.stolenHour}:00 น.
          </span>
        </div>

        <div className="space-y-2">
          {players.map((p) => {
            const isAccused = currentRoom.accusedPlayerId === p.id;
            const roleInfo = getCheeseThiefRoleDetails(p.role, p.isFollower);
            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
                  isAccused
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-amber-50/40 border-amber-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-xs shrink-0 overflow-hidden shadow-2xs">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      p.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>
                        {p.name} {p.id === currentUid && '(คุณ)'}
                      </span>
                      {isAccused && (
                        <span className="text-[10px] px-2 py-0.5 bg-rose-600 text-white rounded-full font-bold">
                          ถูกชี้โหวตมากที่สุด (เปิดการ์ด)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      เต๋าในถ้วย: ตี {p.diceHour || '?'}:00 น.
                      {p.secondaryDiceHour
                        ? ` / ลูกที่ 2: ตี ${p.secondaryDiceHour}:00 น.`
                        : ''}
                      {p.peekedTargetName
                        ? ` · ส่องถ้วย ${p.peekedTargetName} (ตี ${p.peekedDiceValue})`
                        : ''}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border shrink-0 ${roleInfo.color}`}
                >
                  {roleInfo.titleTh}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Play Again Button */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          disabled={isLoading}
          onClick={onPlayAgain}
          className="flex-1 py-3.5 px-4 font-bold text-sm bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-2xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>เล่นรอบใหม่ทันที (กลับสู่ล็อบบี้ตั้งโต๊ะ)</span>
        </button>
      </div>
    </motion.div>
  );
};
