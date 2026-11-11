import React from 'react';
import { motion } from 'motion/react';
import { Dices, FastForward } from 'lucide-react';
import { FirestorePlayer } from '../../../firebase/tableService';

interface DiceRollStepProps {
  players: FirestorePlayer[];
  myPlayer?: FirestorePlayer;
  isHost?: boolean;
  isFourPlayerDualDice: boolean;
  rollingDice: boolean;
  rolledDicePair: number[];
  onRollDiceInCup: () => void;
  onConfirmDiceCupChoice: (primaryHour: number, secondaryHour?: number) => void;
  onForceAdvancePhase?: () => void;
}

export const DiceRollStep: React.FC<DiceRollStepProps> = ({
  players,
  myPlayer,
  isHost = false,
  isFourPlayerDualDice,
  rollingDice,
  rolledDicePair,
  onRollDiceInCup,
  onConfirmDiceCupChoice,
  onForceAdvancePhase,
}) => {
  const unrolledPlayers = players.filter((p) => (p.diceHour || 0) <= 0);

  return (
    <motion.div
      key="phase-dice-roll"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-5 text-center"
    >
      <div className="space-y-1">
        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold inline-block">
          STEP 3: ทอยลูกเต๋าในถ้วยแล้วครอบคว่ำไว้ (
          {isFourPlayerDualDice ? 'โหมด 4 คน ใช้เต๋า 2 ลูก' : 'ใช้เต๋า 1 ลูก'})
        </span>
        <h3 className="text-xl font-extrabold text-slate-900">
          เขย่าถ้วยเต๋า แอบดูเลขชั่วโมงตื่น (1–6 น.) แล้วเลื่อนถ้วยเข้าใกล้ก้อนชีส
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isFourPlayerDualDice
            ? myPlayer?.role === 'cheese_thief'
              ? 'โหมด 4 คน (เต๋า 2 ลูก): คุณคือจอมโจรชีส! คุณสามารถตื่นได้ทั้ง 2 ชั่วโมงตามเลขเต๋า และเลือกชั่วโมงที่จะลงมือขโมยชีส'
              : 'โหมด 4 คน (เต๋า 2 ลูก): คุณคือหนูขี้เซา! เขย่าเต๋า 2 ลูกแล้วเลือก 1 ลูกเพื่อใช้เป็นชั่วโมงตื่นนอนของคุณ'
            : 'แต่ละคนทอยเต๋าในถ้วยแล้วแอบดูเลขที่ได้ (= ชั่วโมงที่จะตื่น 1–6 น.) จากนั้นเลื่อนถ้วยเข้าใกล้ก้อนชีสกลางโต๊ะ'}
        </p>
      </div>

      <div className="p-7 bg-white border border-amber-200 rounded-3xl shadow-xs flex flex-col items-center justify-center min-h-[220px] space-y-4">
        {(myPlayer?.diceHour || 0) > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="w-20 h-20 bg-amber-400 text-amber-950 rounded-2xl flex flex-col items-center justify-center shadow-md border-2 border-amber-300">
                <span className="text-[10px] font-bold">ชั่วโมงหลัก</span>
                <span className="text-3xl font-mono font-black">
                  {myPlayer?.diceHour}
                </span>
              </div>
              {(myPlayer?.secondaryDiceHour || 0) > 0 && (
                <div className="w-20 h-20 bg-amber-100 text-amber-900 rounded-2xl flex flex-col items-center justify-center shadow-xs border border-amber-300">
                  <span className="text-[10px] font-bold">เต๋าลูกที่ 2</span>
                  <span className="text-3xl font-mono font-black">
                    {myPlayer?.secondaryDiceHour}
                  </span>
                </div>
              )}
            </div>
            <div className="font-bold text-slate-900 text-base">
              {isFourPlayerDualDice && myPlayer?.role === 'cheese_thief'
                ? `คุณตื่นได้ทั้ง ตี ${myPlayer?.diceHour}:00 น. และ ตี ${myPlayer?.secondaryDiceHour}:00 น. (ขโมยชีสตอน ตี ${myPlayer?.diceHour}:00 น.)`
                : `เลื่อนถ้วยครอบเต๋าเข้าใกล้ชีสแล้ว · คุณจะตื่นเวลา ตี ${myPlayer?.diceHour}:00 น.`}
            </div>
            <span className="text-xs text-emerald-700 font-semibold block">
              รอผู้เล่นครบทุกคนเพื่อเริ่มขานเวลากลางคืน...
            </span>
          </div>
        ) : rolledDicePair.length > 0 ? (
          /* Rolled in cup: let player peek & confirm / choose die */
          <div className="space-y-4 max-w-md mx-auto">
            <div className="text-xs font-bold text-amber-900">
              🎲 เปิดแอบดูเลขเต๋าในถ้วยของคุณ:
            </div>
            <div className="flex items-center justify-center gap-4">
              {rolledDicePair.map((val, idx) => (
                <div
                  key={idx}
                  className="w-20 h-20 bg-amber-100 border-2 border-amber-400 rounded-2xl flex flex-col items-center justify-center shadow-sm"
                >
                  <span className="text-[10px] font-bold text-amber-800">
                    ลูกที่ {idx + 1}
                  </span>
                  <span className="text-3xl font-mono font-black text-amber-950">
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {isFourPlayerDualDice && rolledDicePair.length === 2 ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-700 font-semibold">
                  {myPlayer?.role === 'cheese_thief'
                    ? 'จอมโจรชีส (โหมด 4 คน): คุณตื่นได้ทั้งสองชั่วโมง เลือกชั่วโมงที่คุณต้องการคว้าชีส:'
                    : 'หนูขี้เซา (โหมด 4 คน): เลือกเลขเต๋า 1 ลูกที่จะใช้เป็นชั่วโมงตื่นนอนของคุณ:'}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onConfirmDiceCupChoice(
                        rolledDicePair[0],
                        rolledDicePair[1]
                      )
                    }
                    className="py-3 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-xs cursor-pointer"
                  >
                    {myPlayer?.role === 'cheese_thief'
                      ? `ขโมยตอน ตี ${rolledDicePair[0]}:00 น.`
                      : `เลือกตื่น ตี ${rolledDicePair[0]}:00 น.`}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onConfirmDiceCupChoice(
                        rolledDicePair[1],
                        rolledDicePair[0]
                      )
                    }
                    className="py-3 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-xs cursor-pointer"
                  >
                    {myPlayer?.role === 'cheese_thief'
                      ? `ขโมยตอน ตี ${rolledDicePair[1]}:00 น.`
                      : `เลือกตื่น ตี ${rolledDicePair[1]}:00 น.`}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmDiceCupChoice(rolledDicePair[0], 0)}
                className="w-full py-3.5 px-6 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-sm rounded-2xl shadow-xs cursor-pointer"
              >
                ครอบถ้วยเต๋า & เลื่อนเข้าใกล้ชีส (ตื่น ตี {rolledDicePair[0]}:00
                น.) →
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={rollingDice}
            onClick={onRollDiceInCup}
            className="px-8 py-6 rounded-3xl bg-amber-400 hover:bg-amber-300 text-amber-950 flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 hover:scale-105 cursor-pointer space-y-2"
          >
            <Dices className={`w-12 h-12 ${rollingDice ? 'animate-spin' : ''}`} />
            <span className="text-sm font-extrabold">
              {rollingDice
                ? 'กำลังเขย่าถ้วยเต๋า...'
                : isFourPlayerDualDice
                ? 'กดเขย่าลูกเต๋า 2 ลูกในถ้วยครอบเต๋า'
                : 'กดเขย่าลูกเต๋าในถ้วยครอบเต๋า (1–6)'}
            </span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-slate-500 font-mono">
          เลื่อนถ้วยเต๋าพร้อมแล้ว{' '}
          {players.filter((p) => (p.diceHour || 0) > 0).length}/{players.length}{' '}
          คน
          {unrolledPlayers.length > 0 && (
            <span className="block text-[11px] text-amber-700 mt-0.5">
              รอทอยเต๋า: {unrolledPlayers.map((p) => p.name).join(', ')}
            </span>
          )}
        </div>

        {isHost && unrolledPlayers.length > 0 && onForceAdvancePhase && (
          <div>
            <button
              type="button"
              onClick={onForceAdvancePhase}
              className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>โฮสต์บังคับสุ่มเต๋าคนที่ค้าง → เริ่มคืนขโมยชีสทันที</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
