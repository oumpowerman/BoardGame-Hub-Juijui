import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon,
  Clock,
  CheckCircle2,
  Hand,
  Search,
  ChevronRight,
  Pause,
  Play,
  FastForward,
  SlidersHorizontal,
  Volume2,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
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
  onToggleNightPause?: (isPaused: boolean) => void;
  onChangeNightDuration?: (seconds: number) => void;
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
  onToggleNightPause,
  onChangeNightDuration,
}) => {
  const totalPlayers = players.length;
  const isHost = currentRoom.hostId === currentUid;
  const currentDuration = currentRoom.cheeseNightDuration || 10;
  const isNightPaused = Boolean(currentRoom.cheeseNightPaused);
  const currentHour = currentRoom.nightHour || 1;
  const hourName = HOUR_THAI_NAMES[currentHour] || `ตี ${currentHour}`;
  const isSleepWindow = hourSecondsLeft <= Math.max(2, Math.min(4, Math.floor(currentDuration / 2)));

  // Helper to render avatar with fallback
  const renderPlayerAvatar = (player: FirestorePlayer, sizeClass = 'w-10 h-10') => {
    if (player.avatarUrl) {
      return (
        <img
          src={player.avatarUrl}
          alt={player.name}
          className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-2xs shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-amber-200 border-2 border-amber-300 flex items-center justify-center font-bold text-amber-900 text-xs shrink-0 shadow-2xs`}
      >
        {player.name.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <motion.div
      key={`phase-night-${currentHour}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-4 text-center max-w-2xl mx-auto"
    >
      {/* Top Header Badge & Countdown Bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-100/90 px-3 py-1 rounded-full shadow-2xs">
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>ช่วงกลางคืน · ตี 1 ถึง ตี 6</span>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-black inline-flex items-center gap-1.5 border transition-all shadow-2xs ${
              isNightPaused
                ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300'
                : isSleepWindow
                ? 'bg-rose-100 text-rose-950 border-rose-300 animate-pulse'
                : 'bg-emerald-100 text-emerald-950 border-emerald-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isNightPaused
                ? `⏸️ หยุดเวลา: ${hourSecondsLeft}s`
                : isSleepWindow
                ? `💤 ช่วงใกล้หลับตา: ${hourSecondsLeft}s`
                : `⏱️ ตี ${currentHour}: เหลือ ${hourSecondsLeft}s`}
            </span>
          </div>
        </div>

        {/* Progress Bar of Current Hour */}
        <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden relative">
          <div
            style={{
              width: `${Math.min(100, Math.max(0, (hourSecondsLeft / currentDuration) * 100))}%`,
            }}
            className={`h-full transition-all duration-500 ${
              isNightPaused
                ? 'bg-amber-500'
                : isSleepWindow
                ? 'bg-gradient-to-r from-rose-400 to-amber-500'
                : 'bg-gradient-to-r from-emerald-400 via-amber-400 to-amber-500'
            }`}
          />
        </div>
      </div>

      {/* Hourly Timeline Tracker (1 to 6 AM) */}
      <div className="p-2 bg-white/95 border border-amber-200/80 rounded-2xl grid grid-cols-6 gap-1 shadow-2xs text-xs font-mono font-bold">
        {[1, 2, 3, 4, 5, 6].map((hour) => {
          const isCurrent = hour === currentHour;
          const isPast = hour < currentHour;
          const isMyWake =
            hour === myWakeHour ||
            (isFourPlayerDualDice && myPlayer?.role === 'cheese_thief' && hour === mySecondHour);

          return (
            <div
              key={hour}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                isCurrent
                  ? 'bg-amber-400 text-amber-950 font-black scale-105 shadow-xs ring-2 ring-amber-300'
                  : isPast
                  ? 'bg-slate-100 text-slate-400 line-through'
                  : 'bg-amber-50/50 text-amber-900/60'
              }`}
            >
              <span className="text-[11px] sm:text-xs">ตี {hour}</span>
              {isMyWake && (
                <span className="text-[9px] font-sans font-black text-rose-600 bg-rose-50 px-1 rounded-sm mt-0.5">
                  ตื่น
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sound / GM Broadcast Pill */}
      <div className="flex items-center justify-center gap-2 text-xs font-extrabold px-3 py-1.5 rounded-2xl bg-amber-100/70 border border-amber-300/80 text-amber-950 shadow-2xs">
        <Volume2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>
          {isNightPaused
            ? '⏸️ หัวหน้าโต๊ะหยุดเวลาชั่วคราว ทุกคนหลับตารอฟังสัญญาณ'
            : isSleepWindow
            ? `💤 สัญญาณเสียง: "หนู${hourName} หลับตา"`
            : `🔔 สัญญาณเสียง: "หนู${hourName} ลืมตา... ตรวจดูรอบตัวหรือส่องถ้วยเต๋า"`}
        </span>
      </div>

      {/* HIGH-CONTRAST FULL-CARD STATE: SLEEPING VS AWAKE */}
      <AnimatePresence mode="wait">
        {isMyHour ? (
          /* ========================================================= */
          /* AWAKE STATE: Radiant Gold Sunrise with Large Tactile Action */
          /* ========================================================= */
          <motion.div
            key="awake-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-5 sm:p-7 rounded-3xl border-3 border-amber-400 bg-gradient-to-b from-amber-50 via-amber-100/90 to-yellow-100 text-amber-950 shadow-xl space-y-4 text-center relative overflow-hidden"
          >
            {/* Ambient Awake Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-300/30 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1 relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-950 font-black text-xs rounded-full shadow-2xs uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                <span>ถึงชั่วโมงของคุณแล้ว!</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight pt-1">
                👀 ลืมตาเดี๋ยวนี้! (ตี {currentHour}:00 น.)
              </div>
              <div className="text-xs text-amber-800 font-bold">
                บทบาทของคุณ:{' '}
                <span className="underline">
                  {myPlayer?.role === 'cheese_thief' ? '🧀 จอมโจรชีส' : '🐭 หนูขี้เซา'}
                </span>{' '}
                · สังเกตโต๊ะและทำแอ็กชันภายใน {hourSecondsLeft} วินาที
              </div>
            </div>

            {/* CUTE ANIMATED CHEESE STATUS PEDESTAL (GLANCEABLE SAFE VS STOLEN) */}
            {currentHour < currentRoom.stolenHour ? (
              /* STATE 1: CHEESE IS SAFE -> Bouncy Floating Cheese Animation */
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-yellow-50 to-emerald-50 border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left relative overflow-hidden">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white border-2 border-amber-300 shadow-xs shrink-0">
                  <motion.span
                    animate={{
                      y: [0, -9, 0],
                      scale: [1, 1.08, 1],
                      rotate: [-3, 3, -3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-5xl select-none block"
                  >
                    🧀
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="absolute -top-1 -right-1 text-sm select-none"
                  >
                    ✨
                  </motion.span>
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-200/90 text-emerald-950">
                    ✓ SAFE ON TABLE · ชีสยังอยู่ครบ!
                  </span>
                  <div className="text-base sm:text-lg font-black text-emerald-950">
                    🧀 ก้อนชีสยังวางอยู่กลางโต๊ะ!
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    ณ เวลาตี {currentHour}:00 น. ชีสก้อนทองยังลอยดึ๋งๆ อยู่บนจานกลางโต๊ะ ยังไม่ถูกขโมยไป
                  </p>
                </div>
              </div>
            ) : currentHour === currentRoom.stolenHour ? (
              /* STATE 2: HEIST HOUR -> Animated Thief Mouse Stealing the Cheese */
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 border-2 border-amber-400 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left relative overflow-hidden">
                <div className="relative flex items-center justify-center w-24 h-20 rounded-2xl bg-white border-2 border-amber-400 shadow-xs shrink-0">
                  <motion.div
                    animate={{
                      x: [-5, 6, -5],
                      scale: [1, 1.08, 0.96, 1],
                      rotate: [-6, 6, -4, 0],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="flex items-center justify-center gap-0.5 select-none"
                  >
                    <span className="text-4xl">🐭</span>
                    <span className="text-3xl">🧀</span>
                  </motion.div>
                  <motion.span
                    animate={{ x: [6, 0, 6], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.75, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 text-xl select-none"
                  >
                    🐾
                  </motion.span>
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-amber-950">
                    ⚡ HEIST IN PROGRESS · หนูขโมยกำลังลงมือ!
                  </span>
                  <div className="text-base sm:text-lg font-black text-amber-950">
                    {currentRoom.cheeseStolen || myPlayer?.hasGrabbedCheese
                      ? '🐭💨 หนูจอมโจรอุ้มชีสหนีไปในชั่วโมงนี้แล้ว!'
                      : '🐭🧀 เห็นหนูจอมโจรกำลังย่องมาขโมยชีสกลางโต๊ะ!'}
                  </div>
                  <p className="text-xs text-amber-900 font-medium">
                    ชั่วโมงตี {currentHour}:00 น. ชีสยังอยู่ตอนลืมตา และหนูจอมโจรกำลังลงมือขโมยชีสในชั่วโมงนี้! (กดขโมยได้ทั้งบนจอ iPad โต๊ะกลางและบนมือถือ)
                  </p>
                </div>
              </div>
            ) : (
              /* STATE 3: CHEESE IS STOLEN -> Blinking Ghost Cheese + Empty Plate & Paw Prints */
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-rose-100 border-2 border-rose-300 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left relative overflow-hidden">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white/90 border-2 border-dashed border-rose-400 shadow-xs shrink-0">
                  <motion.span
                    animate={{
                      opacity: [0.15, 0.9, 0.15],
                      scale: [0.92, 1.04, 0.92],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-5xl select-none block grayscale-[35%]"
                  >
                    🧀
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-mono font-black text-[10px]"
                  >
                    หาย!
                  </motion.span>
                  <span className="absolute -bottom-1 -left-1 text-base select-none">
                    🐾
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-200 text-rose-950">
                    🚨 CHEESE MISSING · ชีสถูกขโมยไปแล้ว!
                  </span>
                  <div className="text-base sm:text-lg font-black text-rose-950">
                    🚨 ก้อนชีสหายไปแล้ว! เหลือแต่จานว่างเปล่า
                  </div>
                  <p className="text-xs text-rose-900 font-medium">
                    จอมโจรแอบขโมยชีสไปก่อนเวลาตี {currentHour}:00 น. แล้ว (ทิ้งไว้เพียงรอยเท้าหนู 🐾)
                  </p>
                </div>
              </div>
            )}

            {/* ACTION 1: Cheese Thief Steal Action */}
            {myPlayer?.role === 'cheese_thief' && currentHour === currentRoom.stolenHour && (
              <div className="p-4 bg-white/95 border-2 border-amber-400 rounded-2xl shadow-sm space-y-3">
                <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center justify-center gap-1.5">
                  <Hand className="w-4 h-4 text-amber-700" />
                  <span>ถึงเวลาลงมือของจอมโจรชีส! คว้าชีสไปซ่อนให้มิดชิด</span>
                </div>

                {currentRoom.cheeseStolen || myPlayer?.hasGrabbedCheese ? (
                  <div className="py-2.5 px-4 bg-emerald-100 text-emerald-900 font-black text-xs sm:text-sm rounded-xl inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>คุณคว้าชีสก้อนทองไปซ่อนสำเร็จแล้ว!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onGrabCheese}
                    className="w-full py-4 px-5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black text-base rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
                  >
                    <Hand className="w-5 h-5 fill-current" />
                    <span>🧀 กดคว้าชีสไปซ่อนเดี๋ยวนี้!</span>
                  </button>
                )}
              </div>
            )}

            {/* ACTION 2: Awake with other players vs Solo Wake Cup Peek */}
            <div className="p-4 sm:p-5 bg-white/95 border border-amber-300/80 rounded-2xl text-xs text-slate-800 space-y-3 shadow-2xs">
              {coAwakeWithMeNow.length > 0 ? (
                /* WOKE UP TOGETHER WITH OTHER PLAYERS */
                <div className="space-y-3">
                  <div className="font-extrabold text-rose-800 text-sm flex items-center justify-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-rose-600" />
                    <span>คุณลืมตามาเจอคนอื่นตื่นพร้อมกันในชั่วโมงนี้!</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {coAwakeWithMeNow.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl"
                      >
                        {renderPlayerAvatar(p, 'w-7 h-7')}
                        <span className="font-black text-rose-950 text-xs">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium">
                    กติกา: ยิ้มให้กันเงียบๆ ห้ามส่งเสียงหรือขยับตัวแรง
                    และไม่สามารถเปิดส่องถ้วยเต๋าได้
                  </p>

                  {currentHour === currentRoom.stolenHour && myPlayer?.role !== 'cheese_thief' && (
                    <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-rose-950 font-bold mt-2">
                      ⚡ คุณเห็น <strong>{thiefPlayer?.name || 'จอมโจรชีส'}</strong>{' '}
                      เอื้อมมือคว้าชีสไปต่อหน้าต่อตา!
                      {totalPlayers === 5 &&
                        ' (กติกา 5 คน: คุณกลายเป็น "ลูกน้อง" ย้ายข้างไปช่วยจอมโจรทันที!)'}
                    </div>
                  )}
                </div>
              ) : (
                /* SOLO WAKE: Peek another player's dice cup (5-8 players) */
                <div className="space-y-3">
                  <div className="font-extrabold text-emerald-800 text-sm flex items-center justify-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>คุณตื่นคนเดียวในชั่วโมงนี้! (ไม่มีใครตื่นชนกับคุณ)</span>
                  </div>

                  {myPlayer?.role !== 'cheese_thief' && !isFourPlayerDualDice ? (
                    myPlayer?.peekedTargetId ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 space-y-1">
                        <div className="font-bold">
                          🔍 คุณแอบเปิดส่องถ้วยเต๋าของ{' '}
                          <span className="underline font-black">
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
                          กติกาหนูขี้เซาตื่นคนเดียว: แอบส่องเลขเต๋าใต้ถ้วยเพื่อนได้ 1 คน:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {players
                            .filter((p) => p.id !== currentUid)
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => onPeekPlayerCup(p.id)}
                                className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-amber-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-2xs"
                              >
                                {renderPlayerAvatar(p, 'w-6 h-6')}
                                <div className="truncate text-left">
                                  <div className="truncate font-black">{p.name}</div>
                                  <div className="text-[10px] text-amber-800">แตะเพื่อส่อง</div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )
                  ) : isFourPlayerDualDice && myPlayer?.role !== 'cheese_thief' ? (
                    <p className="text-slate-600">
                      กติกาโหมด 4 คน: แม้จะตื่นคนเดียวก็ห้ามเปิดส่องถ้วยเต๋า
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ========================================================= */
          /* SLEEPING STATE: Deep Midnight Pastel with Animated Eyes   */
          /* ========================================================= */
          <motion.div
            key="sleeping-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 sm:p-8 rounded-3xl border-2 border-indigo-900/60 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#0b0f19] text-slate-100 shadow-2xl space-y-4 text-center relative overflow-hidden"
          >
            {/* Ambient Night Stars Effect */}
            <div className="absolute top-2 left-6 text-indigo-400/40 text-xs font-mono">✦</div>
            <div className="absolute top-8 right-10 text-amber-300/30 text-sm font-mono">★</div>
            <div className="absolute bottom-4 left-12 text-indigo-300/30 text-xs font-mono">✧</div>

            {/* Animated Closed Eyes Icon */}
            <div className="py-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-indigo-950/80 border border-indigo-700/50 flex flex-col items-center justify-center shadow-inner">
                <EyeOff className="w-8 h-8 text-indigo-300 animate-pulse" />
                <span className="text-[10px] font-mono text-indigo-300 font-bold mt-1">
                  z Z Z
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                💤 หลับตาอยู่... อย่าแอบมองโต๊ะ
              </div>
              <div className="text-xs sm:text-sm font-bold text-indigo-300">
                ขณะนี้เวลา ตี {currentHour}:00 น. · คุณไม่ได้ตื่นในชั่วโมงนี้
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ชั่วโมงที่คุณต้องตื่นคือ{' '}
                <strong className="text-amber-300 font-bold">
                  ตี {myWakeHour}:00 น.
                  {isFourPlayerDualDice && myPlayer?.role === 'cheese_thief' && mySecondHour
                    ? ` และ ตี ${mySecondHour}:00 น.`
                    : ''}
                </strong>
                <br />
                ฟังสัญญาณเสียงจากผู้คุมเกม หรือรอเสียงกริ่งปลุก
              </p>
            </div>

            {/* Countdown Badge inside Sleeping Card */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-950/70 border border-indigo-800/80 rounded-2xl text-xs font-mono text-indigo-200">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>
                {isNightPaused
                  ? '⏸️ พักหยุดเวลานับถอยหลัง'
                  : `ตี ${currentHour} จะผ่านไปในอีก ${hourSecondsLeft} วินาที`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOST PLAYBACK & NIGHT TIMER HUD CONTROLS */}
      {isHost ? (
        <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl shadow-xs space-y-2.5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
              <span>แผงควบคุมเวลาช่วงกลางคืน (หัวหน้าโต๊ะ)</span>
            </span>

            {/* Quick Duration Selector */}
            {onChangeNightDuration && (
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <span className="text-slate-600 mr-1">ปรับเวลา:</span>
                {[5, 8, 10, 15, 20].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onChangeNightDuration(sec)}
                    className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      currentDuration === sec
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-extrabold'
                        : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Pause / Resume Button */}
            {onToggleNightPause && (
              <button
                type="button"
                onClick={() => onToggleNightPause(!isNightPaused)}
                className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                  isNightPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-200/90 hover:bg-amber-300 text-amber-950 border border-amber-300'
                }`}
              >
                {isNightPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>เล่นต่อนับถอยหลัง (Resume)</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>หยุดเวลาชั่วคราว (Pause)</span>
                  </>
                )}
              </button>
            )}

            {/* Skip to Next Hour */}
            <button
              type="button"
              onClick={() => onAdvanceNightHour(currentHour + 1)}
              className="py-2.5 px-3 text-xs font-extrabold text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-400 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>
                {currentHour < 6
                  ? `ข้ามไปตี ${currentHour + 1}:00 น.`
                  : totalPlayers >= 5
                  ? 'ครบ 6 ชม. → ช่วงตั้งลูกน้อง'
                  : 'ครบ 6 ชม. → สู่ตอนเช้า'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Non-host Skip / Proceed indicator */
        <button
          type="button"
          onClick={() => onAdvanceNightHour(currentHour + 1)}
          className="w-full py-2.5 px-4 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px]"
        >
          <span>
            {currentHour < 6
              ? `ข้ามไปชั่วโมงถัดไป: ตี ${currentHour + 1}:00 น. (${hourSecondsLeft}s)`
              : totalPlayers >= 5
              ? `ครบ 6 ชั่วโมง → ไปช่วงตั้งลูกน้อง (Follower Phase)`
              : 'ครบ 6 ชั่วโมง → เข้าสู่ตอนเช้า (ถกเถียง & โหวต)'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};
