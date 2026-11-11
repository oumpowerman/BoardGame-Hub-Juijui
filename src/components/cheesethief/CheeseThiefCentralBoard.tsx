import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Tablet,
  Smartphone,
  Volume2,
  VolumeX,
  Trophy,
  Clock,
  Play,
  Pause,
  FastForward,
  CheckCircle2,
  Sparkles,
  QrCode,
  Users,
  Eye,
  RotateCcw,
  Hand,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import {
  HOUR_THAI_NAMES,
  getCheeseThiefRoleDetails,
} from '../inperson/phases/phaseUtils';

export interface CheeseThiefCentralBoardProps {
  room: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isHostVoiceEnabled: boolean;
  hourSecondsLeft: number;
  debateSecondsLeft: number;
  isLoading: boolean;
  onToggleVoice: () => void;
  onTestVoice: () => void;
  onSwitchToPhoneView: () => void;
  onOpenScoreModal: () => void;
  onOpenShareModal: () => void;
  onStartGame: () => void;
  onGrabCheese: () => void;
  onAdvanceNightHour: (targetHour: number) => void;
  onToggleNightPause: (isPaused: boolean) => void;
  onPlayAgain: () => void;
}

export const CheeseThiefCentralBoard: React.FC<CheeseThiefCentralBoardProps> = ({
  room,
  players,
  currentUid,
  isHostVoiceEnabled,
  hourSecondsLeft,
  debateSecondsLeft,
  isLoading,
  onToggleVoice,
  onTestVoice,
  onSwitchToPhoneView,
  onOpenScoreModal,
  onOpenShareModal,
  onStartGame,
  onGrabCheese,
  onAdvanceNightHour,
  onToggleNightPause,
  onPlayAgain,
}) => {
  const currentHour = room.nightHour || 1;
  const stolenHour = room.stolenHour || 0;
  const hourName = HOUR_THAI_NAMES[currentHour] || `ตี ${currentHour}`;
  const currentDuration = room.cheeseNightDuration || 10;
  const isNightPaused = Boolean(room.cheeseNightPaused);
  const roundNumber = room.ctRoundNumber || 1;
  const scoresMap = room.ctScores || {};
  const roundScoresMap = room.ctRoundScores || {};

  // Determine the 3 states of the Central Cheese Plate during Night Phases:
  // 1. 'safe': Before Thief's wake hour (currentHour < stolenHour)
  // 2. 'stealing_now': Currently at the Thief's wake hour (currentHour === stolenHour)
  // 3. 'stolen_gone': After Thief's wake hour (currentHour > stolenHour)
  const getNightCheesePlateState = (): 'safe' | 'stealing_now' | 'stolen_gone' => {
    if (stolenHour <= 0) return 'safe';
    if (currentHour < stolenHour) return 'safe';
    if (currentHour === stolenHour) return 'stealing_now';
    return 'stolen_gone';
  };

  const cheesePlateState = getNightCheesePlateState();

  const playerJoinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?game=cheese-thief&room=${room.roomCode}`
      : '';
  const qrImageUrl = playerJoinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        playerJoinUrl
      )}`
    : '';

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-slate-900 via-[#17152B] to-slate-950 text-white border-2 border-amber-400/50 shadow-2xl overflow-hidden p-4 sm:p-6 space-y-5">
      {/* Top iPad Tabletop Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            🧀
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-extrabold text-amber-300 uppercase tracking-wider">
                iPad CENTRAL CHEESE TABLE · โต๊ะ #{room.roomCode}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-200 font-mono text-[11px] font-bold">
                รอบที่ {roundNumber}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              {room.roomName || `กระดานกลางโต๊ะของ ${room.hostName}`}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleVoice}
            className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isHostVoiceEnabled
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
            }`}
          >
            {isHostVoiceEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span>{isHostVoiceEnabled ? 'เสียงพากย์ GM: เปิด' : 'เสียงพากย์ GM: ปิด'}</span>
          </button>

          <button
            type="button"
            onClick={onTestVoice}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-amber-200 cursor-pointer transition-colors"
          >
            🔊 ทดสอบเสียง
          </button>

          <button
            type="button"
            onClick={onOpenScoreModal}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Trophy className="w-4 h-4" />
            <span>จบเกม & สรุปคะแนนโต๊ะ</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToPhoneView}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>สลับเป็นจอมือถือผู้เล่น</span>
          </button>
        </div>
      </div>

      {/* Hourly Timeline Strip when in Night Phases */}
      {room.status === 'night_phases' && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950 font-mono text-sm font-black">
                🌙 เวลาปัจจุบัน: ตี {currentHour}:00 น.
              </span>
              <span className="text-xs font-bold text-amber-200">
                “หนู{hourName} ลืมตามองชีสกลางโต๊ะ!”
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 font-mono text-sm font-black tabular-nums text-amber-300">
                ⏱️ เหลือ {hourSecondsLeft} วินาที
              </span>

              <button
                type="button"
                onClick={() => onToggleNightPause(!isNightPaused)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                {isNightPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>เดินเวลาต่อ</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>หยุดเวลา</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onAdvanceNightHour(currentHour + 1)}
                className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>ข้ามไปชั่วโมงถัดไป</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1.5 p-2 bg-white/5 border border-white/10 rounded-2xl">
            {[1, 2, 3, 4, 5, 6].map((h) => {
              const isCurr = h === currentHour;
              const isPast = h < currentHour;
              return (
                <div
                  key={h}
                  className={`py-2 px-1 rounded-xl text-center font-mono text-xs font-bold transition-all ${
                    isCurr
                      ? 'bg-amber-400 text-amber-950 font-black scale-[1.03] shadow-md'
                      : isPast
                      ? 'bg-white/5 text-slate-500 line-through'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  ตี {h}:00
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CENTRAL WOODEN / FELT TABLETOP ARENA */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#2B1D14] via-[#3A2618] to-[#23170F] border-4 border-amber-500/60 shadow-inner p-5 sm:p-8 min-h-[420px] flex flex-col justify-between gap-6">
        {/* Top Row of Seated Players (Seats 1 - 4) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {players.slice(0, 4).map((p, idx) => {
            const pts = scoresMap[p.id] || 0;
            const hasRolled = (p.diceHour || 0) > 0;
            const hasVoted = Boolean(p.voteTargetId);
            return (
              <div
                key={p.id}
                className="p-2.5 rounded-2xl bg-black/35 border border-amber-300/25 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-amber-300 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center font-bold text-amber-200 text-xs shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate">
                      {idx + 1}. {p.name}
                    </div>
                    <div className="text-[10px] font-mono text-amber-300">
                      สะสม {pts} แต้ม
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {room.status === 'dice_roll' && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        hasRolled
                          ? 'bg-emerald-500/25 text-emerald-300'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {hasRolled ? '🎲 ทอยแล้ว' : 'รอทอย...'}
                    </span>
                  )}
                  {room.status === 'voting' && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        hasVoted
                          ? 'bg-emerald-500/25 text-emerald-300'
                          : 'bg-amber-500/25 text-amber-200'
                      }`}
                    >
                      {hasVoted ? '✓ โหวตแล้ว' : 'กำลังคิด'}
                    </span>
                  )}
                  {room.status === 'night_phases' && (
                    <span className="text-lg" title="ถ้วยลูกเต๋าคว่ำอยู่หน้าผู้เล่น">
                      🥤
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* =============================================================== */}
        {/* CENTER CHEESE PLATE PEDESTAL (DYNAMIC BY PHASE & WAKE HOUR)     */}
        {/* =============================================================== */}
        <div className="my-auto flex flex-col items-center justify-center text-center py-4">
          <AnimatePresence mode="wait">
            {/* 1. LOBBY STATE ON IPAD */}
            {room.status === 'lobby' && (
              <motion.div
                key="ipad-lobby"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-xl w-full bg-black/40 border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                  {qrImageUrl && (
                    <div className="p-2.5 bg-white rounded-2xl shadow-md shrink-0">
                      <img
                        src={qrImageUrl}
                        alt="QR Code เข้าห้องหนูขโมยชีส"
                        referrerPolicy="no-referrer"
                        className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                      />
                    </div>
                  )}
                  <div className="text-center sm:text-left space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black">
                      <Tablet className="w-3.5 h-3.5" />
                      <span>วาง iPad เครื่องนี้ไว้กลางวงแทนก้อนชีส</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      สแกนเข้าโต๊ะ #{room.roomCode} ({players.length}/8 คน)
                    </h3>
                    <p className="text-xs text-amber-100/80 leading-relaxed">
                      ผู้เล่นแต่ละคนใช้มือถือสแกน QR Code เพื่อรับการ์ดบทบาทลับและทอยเต๋าในถ้วยส่วนตัว ส่วนหน้าจอ iPad นี้จะแสดงจานชีสและอนิเมชันหนูขโมยชีสตามเวลาตื่นนอน!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={onStartGame}
                    className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      เริ่มเกมรอบที่ {roundNumber} ({Math.max(4, players.length)} คน)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenShareModal}
                    className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>ขยาย QR Code</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. ROLE DEAL & DICE ROLL PREPARATION */}
            {(room.status === 'role_deal' || room.status === 'dice_roll') && (
              <motion.div
                key="ipad-prep"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 max-w-md mx-auto"
              >
                <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-full bg-gradient-to-b from-amber-200 via-amber-100 to-amber-300 border-8 border-amber-500 shadow-2xl flex items-center justify-center relative">
                  <motion.span
                    animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="text-7xl sm:text-8xl select-none"
                  >
                    🧀
                  </motion.span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-amber-300 uppercase">
                    {room.status === 'role_deal'
                      ? 'STEP 2 · ทุกคนดูการ์ดบทบาทลับในมือถือ'
                      : 'STEP 3 · เขย่าเต๋าในถ้วยแล้วเลื่อนมาวางรอบชีส'}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {room.status === 'role_deal'
                      ? 'ชีสก้อนโตวางอยู่กลางโต๊ะแล้ว!'
                      : 'ทอยลูกเต๋าเวลาตื่นนอนในมือถือของคุณ'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    เมื่อทุกคนกดยืนยันบนมือถือครบแล้ว คืนขโมยชีส (ตี 1 ถึง ตี 6) จะเริ่มต้นขึ้นทันที
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. NIGHT PHASES (1:00 - 6:00 AM): SAFE vs THIEF STEALING ANIMATION vs STOLEN */}
            {room.status === 'night_phases' && (
              <motion.div
                key={`ipad-night-plate-${cheesePlateState}-${Boolean(room.cheeseStolen)}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.22 }}
                className="space-y-4 max-w-lg mx-auto w-full"
              >
                {cheesePlateState === 'safe' && (
                  /* STATE A: BEFORE THIEF WAKE HOUR -> CHEESE IS SAFE ON THE PLATE */
                  <div className="p-6 rounded-3xl bg-emerald-950/60 border-3 border-emerald-400/70 shadow-2xl space-y-3">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-full bg-gradient-to-b from-amber-100 to-amber-300 border-8 border-emerald-400 shadow-xl flex items-center justify-center relative">
                      <motion.span
                        animate={{
                          y: [0, -10, 0],
                          scale: [1, 1.08, 1],
                          rotate: [-4, 4, -4],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-7xl sm:text-8xl select-none"
                      >
                        🧀
                      </motion.span>
                      <span className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-sm">
                        ✓ ชีสยังอยู่!
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                        <Eye className="w-3.5 h-3.5" />
                        <span>สถานะโต๊ะกลาง ตอนตี {currentHour}:00 น.</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white">
                        🧀 ชีสยังวางอยู่ปลอดภัยบนโต๊ะ!
                      </h3>
                      <p className="text-xs text-emerald-200/90">
                        หนูที่ลืมตาในชั่วโมงนี้เห็นก้อนชีสยังอยู่ครบ แปลว่าจอมโจรชีสยังไม่ได้ตื่นมาขโมย
                      </p>
                    </div>
                  </div>
                )}

                {cheesePlateState === 'stealing_now' && (
                  /* STATE B: THIEF'S WAKE HOUR -> ANIMATED THIEF MOUSE STEALING THE CHEESE! */
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/90 via-rose-950/80 to-slate-950 border-3 border-amber-400 shadow-2xl space-y-4">
                    <button
                      type="button"
                      onClick={onGrabCheese}
                      className="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-full bg-gradient-to-b from-amber-200 via-yellow-100 to-amber-300 border-8 border-amber-400 shadow-2xl flex flex-col items-center justify-center relative cursor-pointer group hover:scale-105 active:scale-95 transition-transform"
                    >
                      {/* Animated Sneaky Thief Mouse + Cheese */}
                      <motion.div
                        animate={
                          room.cheeseStolen
                            ? { x: [-12, 18, -12], y: [0, -10, 0], rotate: [-6, 8, -6] }
                            : { x: [-16, 10, -16], scale: [1, 1.1, 1] }
                        }
                        transition={{ duration: 1.1, repeat: Infinity }}
                        className="flex items-center justify-center gap-1 select-none"
                      >
                        <span className="text-6xl sm:text-7xl">🐭</span>
                        <span className="text-5xl sm:text-6xl">🧀</span>
                      </motion.div>

                      <span className="mt-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black shadow-xs">
                        {room.cheeseStolen
                          ? '🐾 อุ้มชีสหนีแล้ว!'
                          : '👆 แตะขโมยชีส!'}
                      </span>
                    </button>

                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ชั่วโมงขโมยชีส! (ตี {currentHour}:00 น.)</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-amber-300">
                        {room.cheeseStolen
                          ? '🐭💨 หนูจอมโจรกำลังอุ้มชีสหนีไป!'
                          : '🐭🕶️ หนูจอมโจรกำลังย่องมาขโมยชีส!'}
                      </h3>
                      <p className="text-xs text-amber-100/90 max-w-md mx-auto leading-relaxed">
                        {room.cheeseStolen
                          ? 'ก้อนชีสถูกคว้าออกจากจานในชั่วโมงนี้แล้ว! ใครที่ลืมตาอยู่ตอนนี้เห็นเหตุการณ์คาตา!'
                          : 'จอมโจรชีสสามารถแตะที่ก้อนชีสบนจอ iPad นี้ หรือกดปุ่มขโมยชีสในมือถือของตัวเองได้เลย!'}
                      </p>

                      {!room.cheeseStolen && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={onGrabCheese}
                            className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
                          >
                            <Hand className="w-4 h-4" />
                            <span>แตะคว้าก้อนชีสจากโต๊ะกลาง</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {cheesePlateState === 'stolen_gone' && (
                  /* STATE C: AFTER THIEF'S HOUR -> EMPTY PLATE WITH PAWPRINTS */
                  <div className="p-6 rounded-3xl bg-rose-950/70 border-3 border-rose-400/70 shadow-2xl space-y-3">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-full bg-gradient-to-b from-slate-200 to-slate-300 border-8 border-rose-400 shadow-xl flex flex-col items-center justify-center relative">
                      <span className="text-6xl sm:text-7xl select-none">🍽️</span>
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-2xl select-none -mt-1"
                      >
                        🐾🐾
                      </motion.span>
                      <span className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-xs shadow-sm">
                        ✗ ชีสหายไปแล้ว!
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-black">
                        <span>สถานะโต๊ะกลาง ตอนตี {currentHour}:00 น.</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-rose-200">
                        🍽️ จานว่างเปล่า! ชีสถูกขโมยไปแล้ว
                      </h3>
                      <p className="text-xs text-rose-200/80">
                        หนูที่ลืมตาในชั่วโมงนี้พบแต่รอยเท้าหนู แปลว่าจอมโจรตื่นมาขโมยชีสไปตั้งแต่ชั่วโมงก่อนหน้านี้แล้ว!
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. FOLLOWER PHASE & MORNING VOTING */}
            {(room.status === 'follower_phase' || room.status === 'voting') && (
              <motion.div
                key={`ipad-${room.status}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 max-w-lg mx-auto"
              >
                <div className="w-32 h-32 mx-auto rounded-full bg-slate-200 border-8 border-amber-400 shadow-xl flex flex-col items-center justify-center">
                  <span className="text-5xl">🍽️</span>
                  <span className="text-lg">🐾</span>
                </div>

                {room.status === 'follower_phase' ? (
                  <div className="space-y-1.5">
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-black">
                      STEP 4B · ช่วงลูกน้องจอมโจร (Follower Phase)
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      จอมโจรชีสกำลังส่งสัญญาณหาลูกน้อง...
                    </h3>
                    <p className="text-xs text-slate-300">
                      กรุณาทำรายการบนหน้าจอมือถือเพื่อเข้าสู่ช่วงเช้า
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 font-mono text-sm font-black">
                      <Clock className="w-4 h-4" />
                      <span>เวลาถกเถียงหาตัวคนร้าย: {debateSecondsLeft} วินาที</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white">
                      ☀️ เช้าแล้ว! ชีสหายไปไหน?
                    </h3>
                    <p className="text-xs text-amber-100/90">
                      พูดคุยสอบถามเวลาตื่นนอนของแต่ละคน แล้วกดโหวตชี้ตัวจอมโจรชีสในมือถือพร้อมกัน!
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 5. GAME OVER VERDICT ON IPAD TABLE */}
            {room.status === 'game_over' && (
              <motion.div
                key="ipad-game-over"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl mx-auto bg-black/45 border-2 border-amber-400/50 rounded-3xl p-5 sm:p-6 space-y-4"
              >
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black">
                    STEP 6 · ผลตัดสินรอบที่ {roundNumber} (ขโมยตอนตี {room.stolenHour}:00 น.)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white pt-1">
                    {room.winnerTeam === 'fall_mouse'
                      ? '🃏 Fall Mouse ถูกชี้โหวตมากที่สุด — ชนะเดี่ยวรับ +3 แต้ม!'
                      : room.winnerTeam === 'mice'
                      ? '🏆 จับจอมโจรชีสสำเร็จ — ฝ่ายหนูขี้เซาชนะ!'
                      : '🧀 จอมโจรชีสลอยนวล — ฝ่ายจอมโจรและลูกน้องชนะ!'}
                  </h3>
                </div>

                {/* Revealed Cards & Round Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {players.map((p) => {
                    const isAccused = room.accusedPlayerId === p.id;
                    const roleInfo = getCheeseThiefRoleDetails(
                      p.role,
                      p.isFollower
                    );
                    const roundPts = roundScoresMap[p.id] || 0;
                    const totalPts = scoresMap[p.id] || 0;
                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                          isAccused
                            ? 'bg-rose-500/20 border-rose-400'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {p.name} (ตื่นตี {p.diceHour || '?'})
                          </div>
                          <div className="text-[11px] text-amber-200">
                            {roleInfo.titleTh} · รวม {totalPts} แต้ม
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {roundPts > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-400 text-slate-950 font-mono font-black text-xs">
                              +{roundPts}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={onPlayAgain}
                    className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>เล่นรอบต่อไปทันที (สะสมแต้มต่อ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenScoreModal}
                    className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>จบเกม & ดูสรุปคะแนนโต๊ะนี้</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Row of Seated Players (Seats 5 - 8) */}
        {players.length > 4 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {players.slice(4, 8).map((p, idx) => {
              const pts = scoresMap[p.id] || 0;
              const hasRolled = (p.diceHour || 0) > 0;
              const hasVoted = Boolean(p.voteTargetId);
              return (
                <div
                  key={p.id}
                  className="p-2.5 rounded-2xl bg-black/35 border border-amber-300/25 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-amber-300 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center font-bold text-amber-200 text-xs shrink-0">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">
                        {idx + 5}. {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-amber-300">
                        สะสม {pts} แต้ม
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {room.status === 'dice_roll' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          hasRolled
                            ? 'bg-emerald-500/25 text-emerald-300'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {hasRolled ? '🎲 ทอยแล้ว' : 'รอทอย...'}
                      </span>
                    )}
                    {room.status === 'voting' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          hasVoted
                            ? 'bg-emerald-500/25 text-emerald-300'
                            : 'bg-amber-500/25 text-amber-200'
                        }`}
                      >
                        {hasVoted ? '✓ โหวตแล้ว' : 'กำลังคิด'}
                      </span>
                    )}
                    {room.status === 'night_phases' && (
                      <span className="text-lg" title="ถ้วยลูกเต๋าคว่ำอยู่หน้าผู้เล่น">
                        🥤
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-[11px] text-amber-200/60 flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>ผู้เล่นในโต๊ะ {players.length} คน · สามารถกดปุ่ม “จบเกม & สรุปคะแนนโต๊ะ” ด้านบนได้ทุกเมื่อ</span>
          </div>
        )}
      </div>
    </div>
  );
};
