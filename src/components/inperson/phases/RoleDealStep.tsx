import React from 'react';
import { motion } from 'motion/react';
import { Eye, CheckCircle2, ChevronRight } from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../../firebase/tableService';
import { getCheeseThiefRoleDetails } from './phaseUtils';

interface RoleDealStepProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  myPlayer?: FirestorePlayer;
  isPeekingRole: boolean;
  onTogglePeekRole?: () => void;
  onPeekRoleStart: () => void;
  onPeekRoleEnd: () => void;
  onAcknowledgeRole: () => void;
}

export const RoleDealStep: React.FC<RoleDealStepProps> = ({
  currentRoom,
  players,
  myPlayer,
  isPeekingRole,
  onTogglePeekRole,
  onPeekRoleStart,
  onPeekRoleEnd,
  onAcknowledgeRole,
}) => {
  const totalPlayers = players.length;
  const roleInfo = getCheeseThiefRoleDetails(myPlayer?.role, false);

  return (
    <motion.div
      key="phase-role-deal"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-5 text-center"
    >
      <div className="space-y-1">
        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold inline-block">
          STEP 2: สับและแจกการ์ดตัวละครคว่ำคนละ 1 ใบ
        </span>
        <h3 className="text-xl font-extrabold text-slate-900">
          แอบดูการ์ดบทบาทเริ่มต้นของคุณ
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ในกองการ์ดประกอบด้วย <strong>จอมโจรชีส 1 ใบ</strong> และ{' '}
          <strong>
            หนูขี้เซา{' '}
            {currentRoom.enableFallMouse && totalPlayers >= 6
              ? `${totalPlayers - 2} ใบ (+ Fall Mouse 1 ใบ)`
              : `${totalPlayers - 1} ใบ`}
          </strong>{' '}
          (ส่วนลูกน้องจะเกิดขึ้นในช่วงกลางคืนเมื่อเล่น 5–8 คน)
        </p>
      </div>

      {/* Privacy Shield Card */}
      <div
        onClick={onTogglePeekRole}
        onMouseDown={onPeekRoleStart}
        onMouseUp={onPeekRoleEnd}
        onTouchStart={onPeekRoleStart}
        onTouchEnd={onPeekRoleEnd}
        className={`p-7 rounded-3xl border-2 transition-all cursor-pointer select-none min-h-[210px] flex flex-col items-center justify-center ${
          isPeekingRole
            ? `${roleInfo.color} shadow-lg scale-[1.01]`
            : 'bg-white border-dashed border-amber-300 hover:border-amber-400 shadow-xs'
        }`}
      >
        {isPeekingRole ? (
          <div className="space-y-3">
            <span className="text-5xl">{roleInfo.emoji}</span>
            <div className="text-lg sm:text-xl font-extrabold">
              {roleInfo.titleTh}
            </div>
            <p className="text-xs leading-relaxed max-w-md mx-auto font-medium">
              {roleInfo.goal}
            </p>
            <span className="text-[10px] text-slate-500 pt-2 block font-mono">
              (แตะอีกครั้งหรือปล่อยมือเพื่อคว่ำการ์ดกลับ)
            </span>
          </div>
        ) : (
          <div className="space-y-3 text-slate-400">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Eye className="w-7 h-7" />
            </div>
            <div className="font-bold text-slate-800 text-sm">
              แตะที่นี่เพื่อแอบดูการ์ดตัวละครของคุณ
            </div>
            <span className="text-[11px] text-slate-500 block">
              การ์ดถูกคว่ำไว้เพื่อป้องกันคนข้างๆ แอบมองเห็นบทบาท
            </span>
          </div>
        )}
      </div>

      {/* Confirm Acknowledged Button -> Advance to Step 3 */}
      <div>
        <button
          type="button"
          disabled={myPlayer?.roleAcknowledged}
          onClick={onAcknowledgeRole}
          className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] ${
            myPlayer?.roleAcknowledged
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {myPlayer?.roleAcknowledged
              ? 'ดูการ์ดเรียบร้อยแล้ว (กำลังรอเพื่อนร่วมโต๊ะ)'
              : 'จำบทบาทได้แล้ว → ไปสเต็ป 3: ทอยเต๋าในถ้วยครอบเต๋า'}
          </span>
          {!myPlayer?.roleAcknowledged && <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="text-xs text-slate-500 font-mono pt-2">
          แอบดูการ์ดแล้ว {players.filter((p) => p.roleAcknowledged).length}/
          {players.length} คน
        </div>
      </div>
    </motion.div>
  );
};
