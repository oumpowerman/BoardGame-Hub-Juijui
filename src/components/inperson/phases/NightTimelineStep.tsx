import React from 'react';
import { motion } from 'motion/react';
import {
  Moon,
  Clock,
  CheckCircle2,
  Hand,
  Search,
  ChevronRight,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../../firebase/tableService';
import { HOUR_THAI_NAMES } from './phaseUtils';

interface NightTimelineStepProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  myPlayer?: FirestorePlayer;
  thiefPlayer?: FirestorePlayer;
  isFourPlayerDualDice: boolean;
  myWakeHour: number;
  mySecondHour: number;
  isMyHour: boolean;
  coAwakeWithMeNow: FirestorePlayer[];
  hourSecondsLeft: number;
  onGrabCheese: () => void;
  onPeekPlayerCup: (targetPlayerId: string) => void;
  onAdvanceNightHour: (hour: number) => void;
}

export const NightTimelineStep: React.FC<NightTimelineStepProps> = ({
  currentRoom,
  players,
  currentUid,
  myPlayer,
  thiefPlayer,
  isFourPlayerDualDice,
  myWakeHour,
  mySecondHour,
  isMyHour,
  coAwakeWithMeNow,
  hourSecondsLeft,
  onGrabCheese,
  onPeekPlayerCup,
  onAdvanceNightHour,
}) => {
  const totalPlayers = players.length;

  return (
    <motion.div
      key={`phase-night-${currentRoom.nightHour}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-5 text-center"
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>STEP 4: Moderator ขานเวลากลางคืน (ตี 1 ถึง ตี 6 นาฬิกา)</span>
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-950 border border-amber-300 rounded-full text-xs font-mono font-extrabold inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>นับถอยหลังชั่วโมงนี้: {hourSecondsLeft} วินาที</span>
          </span>
        </div>

        <div className="text-3xl font-black text-indigo-950 font-mono tracking-tight pt-1">
          🔊 &ldquo;ขณะนี้เวลา ตี {currentRoom.nightHour}:00 นาฬิกา!&rdquo;
        </div>
        <div className="text-sm font-extrabold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-xl inline-block">
          {hourSecondsLeft > 3
            ? `📢 หนูตี${
                HOUR_THAI_NAMES[currentRoom.nightHour] || currentRoom.nightHour
              } ลืมตา... ตรวจดูรอบตัวหรือส่องถ้วยเต๋า`
            : `💤 หนูตี${
                HOUR_THAI_NAMES[currentRoom.nightHour] || currentRoom.nightHour
              } หลับตา`}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          เวลาตื่นของคุณคือ{' '}
          <strong className="text-amber-800">
            ตี {myWakeHour}:00 น.
            {isFourPlayerDualDice &&
            myPlayer?.role === 'cheese_thief' &&
            mySecondHour
              ? ` และ ตี ${mySecondHour}:00 น.`
              : ''}
          </strong>
        </div>
      </div>

      {/* 10-Second Moderator Progress Bar */}
      <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
        <div
          style={{ width: `${(hourSecondsLeft / 10) * 100}%` }}
          className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-700"
        />
      </div>

      {/* Dynamic State: Awake vs Sleeping */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border-2 transition-all min-h-[230px] flex flex-col items-center justify-center space-y-4 ${
          isMyHour
            ? 'bg-amber-100/95 border-amber-400 text-amber-950 shadow-xl'
            : 'bg-slate-900 text-slate-100 border-slate-800 shadow-inner'
        }`}
      >
        {isMyHour ? (
          <div className="space-y-4 w-full max-w-lg mx-auto">
            <div className="space-y-1">
              <span className="text-4xl block">👀</span>
              <div className="text-xl font-black text-amber-950">
                ถึงชั่วโมงตื่นของคุณแล้ว! (ตี {currentRoom.nightHour}:00 น.)
              </div>
            </div>

            {/* ACTION 1: If Player is CHEESE THIEF on their steal hour */}
            {myPlayer?.role === 'cheese_thief' &&
              currentRoom.nightHour === currentRoom.stolenHour && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-2.5 shadow-sm">
                  <div className="text-xs sm:text-sm font-extrabold text-amber-950">
                    🧀 ถึงเวลาลงมือของจอมโจรชีส! คุณ &ldquo;ต้อง&rdquo;
                    คว้าชีสไปซ่อนให้มิดชิด (แม้จะมีคนอื่นตื่นอยู่ด้วยก็ตาม)
                  </div>
                  {currentRoom.cheeseStolen || myPlayer?.hasGrabbedCheese ? (
                    <div className="py-2 px-4 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>คุณคว้าชีสก้อนทองไปซ่อนเรียบร้อยแล้ว!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onGrabCheese}
                      className="w-full py-3 px-5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Hand className="w-4 h-4" />
                      <span>กดคว้าชีสก้อนทองไปซ่อนเดี๋ยวนี้!</span>
                    </button>
                  )}
                </div>
              )}

            {/* ACTION 2: Who is awake with me vs Solo Wake Cup Peek */}
            <div className="p-4 bg-white/95 border border-amber-300 rounded-2xl text-xs text-slate-800 space-y-3">
              {coAwakeWithMeNow.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="font-extrabold text-rose-700 text-sm">
                    👀 คุณลืมตามาเจอคนอื่นตื่นพร้อมกันในชั่วโมงนี้!
                  </div>
                  <p className="text-slate-700 font-semibold">
                    ผู้ที่ลืมตาพร้อมกับคุณตอนตี {currentRoom.nightHour}:00 น.:{' '}
                    <strong className="text-rose-900 underline">
                      {coAwakeWithMeNow.map((p) => p.name).join(', ')}
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    กติกา: เมื่อเจอคนอื่นตื่นพร้อมกัน ให้อยู่เฉยๆ
                    หรือยิ้มให้กันเงียบๆ ห้ามส่งสัญญาณ
                    และไม่สามารถเปิดส่องถ้วยเต๋าได้
                  </p>
                  {currentRoom.nightHour === currentRoom.stolenHour &&
                    myPlayer?.role !== 'cheese_thief' && (
                      <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-rose-950 font-bold mt-2">
                        ⚡ คุณเห็น{' '}
                        <strong>{thiefPlayer?.name || 'จอมโจรชีส'}</strong>{' '}
                        เอื้อมมือคว้าชีสก้อนทองไปต่อหน้าต่อตา!
                        {totalPlayers === 5 &&
                          ' (กติกา 5 คน: เมื่อคุณเห็นตอนจอมโจรขโมยชีส คุณกลายเป็น "ลูกน้อง" ย้ายข้างไปช่วยจอมโจรทันที!)'}
                      </div>
                    )}
                </div>
              ) : (
                /* SOLO WAKE: Sleepyhead can peek at 1 player's dice cup (in 5-8 player mode!) */
                <div className="space-y-2.5">
                  <div className="font-extrabold text-emerald-800 text-sm">
                    ✨ คุณเป็นคนเดียวที่ตื่นในชั่วโมงนี้!
                    (ไม่มีใครลืมตาชนกับคุณ)
                  </div>

                  {myPlayer?.role !== 'cheese_thief' &&
                  !isFourPlayerDualDice ? (
                    myPlayer?.peekedTargetId ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 space-y-1">
                        <div className="font-bold">
                          🔍 คุณแอบเปิดส่องถ้วยเต๋าของ{' '}
                          <span className="underline">
                            {myPlayer.peekedTargetName}
                          </span>{' '}
                          เรียบร้อยแล้ว:
                        </div>
                        <div className="text-base font-mono font-black text-amber-900">
                          เลขเต๋าใต้ถ้วยคือ: ตี {myPlayer.peekedDiceValue}:00 น.!
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-slate-700 font-semibold">
                          กติกาหนูขี้เซาตื่นคนเดียว:
                          เลือกแอบส่องเลขเต๋าใต้ถ้วยของคนอื่นได้ 1 คน (ภายใน 10
                          วินาที):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {players
                            .filter((p) => p.id !== currentUid)
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => onPeekPlayerCup(p.id)}
                                className="p-2.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Search className="w-3.5 h-3.5 text-amber-700" />
                                <span className="truncate">
                                  ส่องถ้วย {p.name}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )
                  ) : isFourPlayerDualDice &&
                    myPlayer?.role !== 'cheese_thief' ? (
                    <p className="text-slate-600">
                      กติกาโหมดพิเศษ 4 คน:
                      แม้จะตื่นมาคนเดียวก็ห้ามเปิดส่องถ้วยเต๋าของคนอื่น
                    </p>
                  ) : null}
                </div>
              )}

              <div className="pt-2 border-t border-amber-200/70 text-[11px] font-mono text-slate-600">
                สถานะชีสกลางโต๊ะ:{' '}
                {currentRoom.nightHour < currentRoom.stolenHour
                  ? '🧀 ก้อนชีสยังวางอยู่กลางโต๊ะ'
                  : currentRoom.nightHour === currentRoom.stolenHour
                  ? '⚡ จอมโจรชีสกำลังขโมยชีสในชั่วโมงนี้!'
                  : '❗ ก้อนชีสกลางโต๊ะหายไปแล้ว!'}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 opacity-95">
            <span className="text-5xl">😴</span>
            <div className="text-lg font-bold text-slate-200">
              ตี {currentRoom.nightHour}:00 น. · หลับตาอยู่เงียบๆ
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Moderator กำลังขานเวลาชั่วโมงละ 10 วินาที
              (หรือกดปุ่มด้านล่างเพื่อข้ามไปชั่วโมงถัดไปได้ทันที)
            </p>
          </div>
        )}
      </div>

      {/* Visual Clock Timeline Tracker */}
      <div className="p-3 bg-white border border-amber-100 rounded-2xl grid grid-cols-6 gap-1.5 text-xs font-mono font-bold">
        {[1, 2, 3, 4, 5, 6].map((hour) => (
          <div
            key={hour}
            className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
              hour === currentRoom.nightHour
                ? 'bg-amber-400 text-amber-950 scale-105 shadow-xs font-extrabold'
                : hour < currentRoom.nightHour
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span>ตี {hour}</span>
            {(hour === myWakeHour ||
              (isFourPlayerDualDice &&
                myPlayer?.role === 'cheese_thief' &&
                hour === mySecondHour)) && (
              <span className="text-[9px] text-rose-600 font-sans font-bold">
                ตื่น
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Manual Skip / Advance Hour Button */}
      <button
        type="button"
        onClick={() => onAdvanceNightHour(currentRoom.nightHour + 1)}
        className="w-full py-3.5 px-5 text-sm font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
      >
        <span>
          {currentRoom.nightHour < 6
            ? `ข้ามไปชั่วโมงถัดไป: ตี ${
                currentRoom.nightHour + 1
              }:00 น. (${hourSecondsLeft}s)`
            : totalPlayers >= 5
            ? `ครบ 6 ชั่วโมง → ไปช่วงตั้งลูกน้อง (Follower Phase สำหรับ ${totalPlayers} คน)`
            : 'ครบ 6 ชั่วโมง → เข้าสู่ตอนเช้า (ถกเถียง & โหวต)'}
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
