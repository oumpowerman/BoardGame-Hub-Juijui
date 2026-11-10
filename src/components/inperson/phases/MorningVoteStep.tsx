import React from 'react';
import { motion } from 'motion/react';
import { Sun, Clock, Sparkles, Vote } from 'lucide-react';
import { FirestorePlayer } from '../../../firebase/tableService';
import { getCheeseThiefRoleDetails } from './phaseUtils';
import { InGameRolePrivacyBar } from '../../common/InGameRolePrivacyBar';

interface MorningVoteStepProps {
  players: FirestorePlayer[];
  currentUid: string;
  myPlayer?: FirestorePlayer;
  myWakeHour: number;
  mySecondHour: number;
  coAwakeInMyPrimaryHour: FirestorePlayer[];
  debateSecondsLeft: number;
  selectedVoteTarget: string;
  isLoading: boolean;
  onSelectVoteTarget: (targetId: string) => void;
  onCastVote: () => void;
}

export const MorningVoteStep: React.FC<MorningVoteStepProps> = ({
  players,
  currentUid,
  myPlayer,
  myWakeHour,
  mySecondHour,
  coAwakeInMyPrimaryHour,
  debateSecondsLeft,
  selectedVoteTarget,
  isLoading,
  onSelectVoteTarget,
  onCastVote,
}) => {
  const roleDetails = getCheeseThiefRoleDetails(
    myPlayer?.role,
    myPlayer?.isFollower
  );

  return (
    <motion.div
      key="phase-voting"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="text-center space-y-1">
        <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-bold inline-flex items-center gap-1.5 mx-auto">
          <Sun className="w-3.5 h-3.5 text-amber-950" />
          <span>STEP 5: เช้าวันใหม่ — ชีสกลางโต๊ะหายไปแล้ว!</span>
        </span>
        <h3 className="text-xl font-black text-slate-900">
          ถกเถียงหาตัวคนร้าย & โหวตพร้อมกัน &ldquo;Who is the Cheese Thief?
          3–2–1 VOTE!&rdquo;
        </h3>
        <div className="text-xs font-mono font-bold text-rose-600 flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>
            เวลาถกเถียงในโต๊ะ: {debateSecondsLeft} วินาที
            (ห้ามเปิดการ์ดบทหรือโชว์เต๋าให้ใครเห็น)
          </span>
        </div>
      </div>

      {/* Player's Night Clue Notebook Protected by In-Game Role Privacy Shield */}
      <InGameRolePrivacyBar
        roleTitle={roleDetails.titleTh}
        roleEmoji={roleDetails.emoji}
        secretWordLabel="เวลาตื่นตามหน้าเต๋าของคุณ"
        secretWordValue={`ตี ${myWakeHour}:00 น.${
          mySecondHour > 0 ? ` (เต๋าลูกที่ 2: ตี ${mySecondHour}:00 น.)` : ''
        }`}
        extraHint="ซ่อนบทบาทและบันทึกเบาะแสเมื่อคืนไว้ไม่ให้เพื่อนข้างๆ แอบมองจอ"
        accentTheme="amber"
      >
        <div className="p-3 bg-white/90 border border-amber-200 rounded-xl text-xs space-y-1.5">
          <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>บันทึกเบาะแสส่วนตัวของคุณเมื่อคืน:</span>
          </div>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>
              ผู้ที่ลืมตาตื่นพร้อมคุณ:{' '}
              <strong>
                {coAwakeInMyPrimaryHour.length > 0
                  ? coAwakeInMyPrimaryHour.map((p) => p.name).join(', ')
                  : 'ไม่มี (คุณตื่นคนเดียว)'}
              </strong>
            </li>
            {myPlayer?.peekedTargetName && (
              <li className="text-emerald-800 font-bold">
                🔍 ผลจากการแอบส่องถ้วยเต๋าของ {myPlayer.peekedTargetName}:
                เลขเต๋าใต้ถ้วยคือ{' '}
                <span className="underline">
                  ตี {myPlayer.peekedDiceValue}:00 น.
                </span>
                !
              </li>
            )}
            {myPlayer?.isFollower && (
              <li className="text-rose-800 font-bold">
                🕵️ คุณคือลูกน้อง (Follower)! ห้ามบอกข้อมูลเต๋าช่วงกลางคืน
                แต่จงช่วยปั้นแพะให้คนอื่นโหวตผิดคน (แม้ลูกน้องโดนโหวตแทน
                จอมโจรและลูกน้องก็ยังชนะด้วยกัน!)
              </li>
            )}
          </ul>
        </div>
      </InGameRolePrivacyBar>

      <div className="p-4 sm:p-5 bg-white border border-rose-100 rounded-3xl shadow-xs space-y-3">
        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <Vote className="w-4 h-4 text-rose-600" />
          <span>
            ชี้ตัวผู้เล่นที่คุณคิดว่าเป็น &ldquo;จอมโจรชีส (Cheese
            Thief)&rdquo;:
          </span>
        </div>

        <div className="space-y-2">
          {players
            .filter((p) => p.id !== currentUid)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectVoteTarget(p.id)}
                className={`w-full p-3 rounded-2xl border text-left font-semibold text-sm transition-all cursor-pointer flex items-center justify-between min-h-[48px] ${
                  selectedVoteTarget === p.id
                    ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-xs'
                    : 'bg-slate-50/50 hover:bg-slate-100/60 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-xs shrink-0 overflow-hidden shadow-2xs">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      p.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="truncate">{p.name}</span>
                </div>
                {selectedVoteTarget === p.id && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold shrink-0">
                    ชี้โหวตคนนี้
                  </span>
                )}
              </button>
            ))}
        </div>

        <button
          type="button"
          disabled={
            isLoading || !selectedVoteTarget || Boolean(myPlayer?.voteTargetId)
          }
          onClick={onCastVote}
          className="w-full py-3.5 px-4 font-bold text-sm bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Vote className="w-4 h-4" />
          <span>
            {myPlayer?.voteTargetId
              ? 'ส่งผลโหวตแล้ว (รอเปิดการ์ดพร้อมกัน)'
              : '3–2–1 VOTE! ยืนยันชี้ตัวคนนี้ → เปิดการ์ดผู้ถูกโหวตสูงสุด'}
          </span>
        </button>

        <div className="text-xs text-center font-mono text-slate-500 pt-1">
          โหวตแล้ว {players.filter((p) => p.voteTargetId).length}/
          {players.length} คน
        </div>
      </div>
    </motion.div>
  );
};
