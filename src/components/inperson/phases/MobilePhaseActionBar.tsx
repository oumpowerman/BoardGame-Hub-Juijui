import React from 'react';
import {
  CheckCircle2,
  Dices,
  Hand,
  ChevronRight,
  Sun,
  Vote,
  RotateCcw,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../../firebase/tableService';

interface MobilePhaseActionBarProps {
  currentRoom: FirestoreRoom;
  myPlayer?: FirestorePlayer;
  totalPlayers: number;
  isFourPlayerDualDice: boolean;
  rollingDice: boolean;
  rolledDicePair: number[];
  hourSecondsLeft: number;
  selectedFollowerTargets: string[];
  selectedVoteTarget: string;
  isLoading: boolean;
  onAcknowledgeRole: () => void;
  onRollDiceInCup: () => void;
  onConfirmDiceCupChoice: (primaryHour: number, secondaryHour?: number) => void;
  onGrabCheese: () => void;
  onAdvanceNightHour: (hour: number) => void;
  onSelectFollowers: (targetIds: string[]) => void;
  onConfirmFollowerPhase: () => void;
  onCastVote: () => void;
  onPlayAgain: () => void;
}

export const MobilePhaseActionBar: React.FC<MobilePhaseActionBarProps> = ({
  currentRoom,
  myPlayer,
  totalPlayers,
  isFourPlayerDualDice,
  rollingDice,
  rolledDicePair,
  hourSecondsLeft,
  selectedFollowerTargets,
  selectedVoteTarget,
  isLoading,
  onAcknowledgeRole,
  onRollDiceInCup,
  onConfirmDiceCupChoice,
  onGrabCheese,
  onAdvanceNightHour,
  onSelectFollowers,
  onConfirmFollowerPhase,
  onCastVote,
  onPlayAgain,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-amber-200/90 shadow-2xl md:hidden pb-safe">
      <div className="max-w-md mx-auto">
        {currentRoom.status === 'role_deal' && (
          <button
            type="button"
            disabled={myPlayer?.roleAcknowledged}
            onClick={onAcknowledgeRole}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] ${
              myPlayer?.roleAcknowledged
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-400 text-amber-950 hover:bg-amber-300 active:scale-98'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {myPlayer?.roleAcknowledged
                ? 'ดูการ์ดแล้ว (รอเพื่อนร่วมโต๊ะ...)'
                : 'จำบทบาทได้แล้ว → ไปสเต็ป 3'}
            </span>
          </button>
        )}

        {currentRoom.status === 'dice_roll' &&
          ((myPlayer?.diceHour || 0) > 0 ? (
            <div className="w-full py-3 px-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs flex items-center justify-center gap-2 text-center min-h-[48px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                คุณเลื่อนถ้วยแล้ว (ตื่น ตี {myPlayer?.diceHour}:00 น.)
                รอทุกคนพร้อม...
              </span>
            </div>
          ) : rolledDicePair.length > 0 ? (
            isFourPlayerDualDice && rolledDicePair.length === 2 ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onConfirmDiceCupChoice(
                      rolledDicePair[0],
                      rolledDicePair[1]
                    )
                  }
                  className="py-3 px-2 bg-amber-400 text-amber-950 font-black text-xs rounded-xl shadow-xs cursor-pointer min-h-[48px]"
                >
                  {myPlayer?.role === 'cheese_thief'
                    ? `ขโมย ตี ${rolledDicePair[0]}:00 น.`
                    : `ตื่น ตี ${rolledDicePair[0]}:00 น.`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onConfirmDiceCupChoice(
                      rolledDicePair[1],
                      rolledDicePair[0]
                    )
                  }
                  className="py-3 px-2 bg-amber-400 text-amber-950 font-black text-xs rounded-xl shadow-xs cursor-pointer min-h-[48px]"
                >
                  {myPlayer?.role === 'cheese_thief'
                    ? `ขโมย ตี ${rolledDicePair[1]}:00 น.`
                    : `ตื่น ตี ${rolledDicePair[1]}:00 น.`}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmDiceCupChoice(rolledDicePair[0], 0)}
                className="w-full py-3.5 px-4 bg-amber-400 text-amber-950 font-black text-sm rounded-2xl shadow-xs cursor-pointer min-h-[48px]"
              >
                ครอบถ้วยเต๋า (ตื่น ตี {rolledDicePair[0]}:00 น.) →
              </button>
            )
          ) : (
            <button
              type="button"
              disabled={rollingDice}
              onClick={onRollDiceInCup}
              className="w-full py-3.5 px-4 bg-amber-400 text-amber-950 font-black text-sm rounded-2xl shadow-xs cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Dices
                className={`w-5 h-5 ${rollingDice ? 'animate-spin' : ''}`}
              />
              <span>
                {rollingDice
                  ? 'กำลังเขย่าถ้วยเต๋า...'
                  : isFourPlayerDualDice
                  ? 'เขย่าลูกเต๋า 2 ลูกในถ้วย'
                  : 'เขย่าลูกเต๋าในถ้วย (1–6)'}
              </span>
            </button>
          ))}

        {currentRoom.status === 'night_phases' && (
          <div className="space-y-1.5">
            {myPlayer?.role === 'cheese_thief' &&
            currentRoom.nightHour === currentRoom.stolenHour &&
            !currentRoom.cheeseStolen &&
            !myPlayer?.hasGrabbedCheese ? (
              <button
                type="button"
                onClick={onGrabCheese}
                className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px] animate-bounce"
              >
                <Hand className="w-5 h-5" />
                <span>คว้าชีสก้อนทองไปซ่อนเดี๋ยวนี้!</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAdvanceNightHour(currentRoom.nightHour + 1)}
                className="w-full py-3 px-4 bg-indigo-900 hover:bg-indigo-800 text-amber-300 font-bold text-xs sm:text-sm rounded-2xl shadow-sm cursor-pointer flex items-center justify-center gap-1.5 min-h-[46px]"
              >
                <span>
                  {currentRoom.nightHour < 6
                    ? `ข้ามไป ตี ${
                        currentRoom.nightHour + 1
                      }:00 น. (${hourSecondsLeft}s)`
                    : totalPlayers >= 5
                    ? 'ครบ 6 ชม. → ไปช่วงลูกน้อง'
                    : 'ครบ 6 ชม. → เข้าสู่ตอนเช้า'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {currentRoom.status === 'follower_phase' &&
          (totalPlayers >= 6 &&
          (currentRoom.followerIds?.length || 0) === 0 &&
          myPlayer?.role === 'cheese_thief' ? (
            <button
              type="button"
              disabled={
                selectedFollowerTargets.length !== (totalPlayers === 6 ? 1 : 2)
              }
              onClick={() => onSelectFollowers(selectedFollowerTargets)}
              className="w-full py-3.5 px-4 bg-rose-600 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl cursor-pointer min-h-[48px]"
            >
              ยืนยันเลือกลูกน้อง ({selectedFollowerTargets.length}/
              {totalPlayers === 6 ? 1 : 2} คน)
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirmFollowerPhase}
              className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-2xl cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Sun className="w-4 h-4" />
              <span>เข้าสู่ตอนเช้า: ถกเถียง & โหวต →</span>
            </button>
          ))}

        {currentRoom.status === 'voting' && (
          <button
            type="button"
            disabled={
              isLoading || !selectedVoteTarget || Boolean(myPlayer?.voteTargetId)
            }
            onClick={onCastVote}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Vote className="w-5 h-5" />
            <span>
              {myPlayer?.voteTargetId
                ? 'ส่งผลโหวตแล้ว (รอเปิดการ์ด)'
                : selectedVoteTarget
                ? '3–2–1 VOTE! ยืนยันชี้ตัวคนนี้'
                : 'เลือกชี้ตัวผู้ต้องสงสัยด้านบน'}
            </span>
          </button>
        )}

        {currentRoom.status === 'game_over' && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onPlayAgain}
            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เล่นรอบใหม่ทันที (กลับล็อบบี้)</span>
          </button>
        )}
      </div>
    </div>
  );
};
