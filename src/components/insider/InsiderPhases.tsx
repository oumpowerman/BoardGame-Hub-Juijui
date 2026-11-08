import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Eye,
  Hourglass,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Users,
  ThumbsUp,
  ThumbsDown,
  Vote,
  RotateCcw,
  RefreshCw,
  Edit3,
  Crown,
  HelpCircle,
  Check,
  X,
  Volume2,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer, GamePhase } from '../../firebase/tableService';
import {
  ALL_INSIDER_CATEGORY_OPTIONS,
  getRandomInsiderWord,
  InsiderWordCategoryId,
} from '../../data/insiderWords';

interface InsiderPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isPeekingRole: boolean;
  insiderRevealCountdown: number | null;
  quizSecondsLeft: number;
  discussionSecondsLeft: number;
  selectedVoteTarget: string;
  isLoading: boolean;
  onTogglePeekRole: () => void;
  onAcknowledgeRole: () => void;
  onUpdateSecretWord: (word: string, categoryLabel?: string) => void;
  onStartInsiderPeekSequence: () => void;
  onStartQuizImmediately: () => void;
  onSendMasterSignal: (signal: 'yes' | 'no' | 'unsure') => void;
  onConfirmWordGuessed: (guesserId: string, guesserName: string) => void;
  onTriggerTimeoutLoss: () => void;
  onCastGuesserJudgment: (judgment: 'yes_insider' | 'no_innocent') => void;
  onSelectVoteTarget: (targetId: string) => void;
  onCastGeneralVote: () => void;
  onPlayAgain: () => void;
}

const INSIDER_STEP_LIST: { step: number; phases: GamePhase[]; label: string }[] = [
  { step: 1, phases: ['lobby'], label: 'ตั้งโต๊ะ' },
  { step: 2, phases: ['role_deal'], label: 'แจกบทบาท' },
  { step: 3, phases: ['word_reveal'], label: 'ดูคำศัพท์ลับ' },
  { step: 4, phases: ['question_phase'], label: 'ถาม-ตอบทายคำ' },
  {
    step: 5,
    phases: ['discussion_guesser_vote', 'general_vote'],
    label: 'โหวต 2 ขั้นตอน',
  },
  { step: 6, phases: ['game_over'], label: 'เฉลย & ชนะ' },
];

export const InsiderPhases: React.FC<InsiderPhasesProps> = ({
  currentRoom,
  players,
  currentUid,
  isPeekingRole,
  insiderRevealCountdown,
  quizSecondsLeft,
  discussionSecondsLeft,
  selectedVoteTarget,
  isLoading,
  onTogglePeekRole,
  onAcknowledgeRole,
  onUpdateSecretWord,
  onStartInsiderPeekSequence,
  onStartQuizImmediately,
  onSendMasterSignal,
  onConfirmWordGuessed,
  onTriggerTimeoutLoss,
  onCastGuesserJudgment,
  onSelectVoteTarget,
  onCastGeneralVote,
  onPlayAgain,
}) => {
  const [customWordInput, setCustomWordInput] = useState<string>('');
  const [selectedRerollCat, setSelectedRerollCat] = useState<InsiderWordCategoryId>(
    currentRoom.wordCategory || 'all'
  );
  const [showMasterSecretInQuiz, setShowMasterSecretInQuiz] = useState<boolean>(false);

  const myPlayer = players.find((p) => p.id === currentUid);
  const masterPlayer = players.find((p) => p.role === 'insider_master');
  const insiderPlayer = players.find((p) => p.role === 'insider_traitor');
  const isMasterOrHost =
    myPlayer?.role === 'insider_master' || currentRoom.hostId === currentUid;

  const activeStepNumber =
    INSIDER_STEP_LIST.find((s) => s.phases.includes(currentRoom.status))?.step || 2;

  const getRoleDetails = (role?: string) => {
    if (role === 'insider_master') {
      return {
        titleTh: 'ผู้คุมคำใบ้ (Master)',
        emoji: '👑',
        color: 'text-amber-950 bg-amber-50 border-amber-400',
        goal: 'คุณเปิดเผยตัวให้ทุกคนรู้! ตรวจสอบคำศัพท์ลับ ตอบคำถามผู้เล่นได้เฉพาะ "ใช่ / ไม่ใช่ / ไม่แน่ใจ" และช่วยพลเมืองจับตาดูว่าใครตั้งคำถามชี้นำเหมือนรู้คำตอบอยู่แล้ว',
      };
    }
    if (role === 'insider_traitor') {
      return {
        titleTh: 'จอมบงการ (Insider)',
        emoji: '🕵️',
        color: 'text-rose-950 bg-rose-50 border-rose-500',
        goal: 'คุณแอบรู้คำศัพท์ลับ! ต้องแกล้งทำเป็นพลเมืองทั่วไปแล้วเนียนตั้งคำถามชี้นำให้กลุ่มทายคำถูกทันเวลา โดยห้ามให้มีพิรุธจนถูกโหวตจับได้ในตอนท้าย',
      };
    }
    return {
      titleTh: 'พลเมืองทั่วไป (Commons)',
      emoji: '🗣️',
      color: 'text-slate-900 bg-sky-50 border-sky-300',
      goal: 'คุณไม่รู้คำศัพท์ลับ! ช่วยกันถามคำถาม ใช่/ไม่ใช่ กับ Master เพื่อไขคำลับให้ทันเวลา และจับผิดว่าใครคือ Insider ที่แอบเนียนชี้นำกลุ่ม',
    };
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalQuizSecs = currentRoom.quizDurationSeconds || 180;
  const quizProgressPct = Math.max(
    0,
    Math.min(100, (quizSecondsLeft / totalQuizSecs) * 100)
  );
  const totalDiscussSecs = currentRoom.elapsedQuizSeconds || 120;
  const discussProgressPct = Math.max(
    0,
    Math.min(100, (discussionSecondsLeft / totalDiscussSecs) * 100)
  );

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      {/* 6-Step Progress Bar */}
      <div className="grid grid-cols-6 gap-1.5 p-2 bg-white/95 border border-rose-200 rounded-2xl">
        {INSIDER_STEP_LIST.map((item) => {
          const isCurrent = item.step === activeStepNumber;
          const isCompleted = item.step < activeStepNumber;
          return (
            <div
              key={item.step}
              className={`py-1.5 px-1 rounded-xl text-center transition-all ${
                isCurrent
                  ? 'bg-rose-600 text-white font-extrabold shadow-2xs scale-[1.02]'
                  : isCompleted
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'bg-slate-50 text-slate-400 font-medium'
              }`}
            >
              <div className="text-[10px] font-mono">STEP {item.step}</div>
              <div className="text-[10px] truncate">{item.label}</div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 2: ROLE DEAL */}
        {currentRoom.status === 'role_deal' && (
          <motion.div
            key="insider-role-deal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-5 text-center"
          >
            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-bold inline-block">
                STEP 2: แจกการ์ดบทบาท (Master 1 · Insider 1 · พลเมือง {players.length - 2})
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                แอบดูการ์ดบทบาทของคุณ
              </h3>
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl max-w-md mx-auto text-xs font-bold text-amber-950 flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  ผู้คุมคำใบ้ (Master) ประจำรอบนี้คือ:{' '}
                  <strong className="underline text-sm">
                    {masterPlayer?.name || 'กำลังสุ่ม'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Privacy Shield Card */}
            <div
              onClick={onTogglePeekRole}
              className={`p-7 rounded-3xl border-2 transition-all cursor-pointer select-none min-h-[210px] flex flex-col items-center justify-center ${
                isPeekingRole
                  ? `${getRoleDetails(myPlayer?.role).color} shadow-lg scale-[1.01]`
                  : 'bg-white border-dashed border-rose-300 hover:border-rose-500 shadow-xs'
              }`}
            >
              {isPeekingRole ? (
                <div className="space-y-3">
                  <span className="text-5xl">{getRoleDetails(myPlayer?.role).emoji}</span>
                  <div className="text-lg sm:text-xl font-extrabold">
                    {getRoleDetails(myPlayer?.role).titleTh}
                  </div>
                  <p className="text-xs leading-relaxed max-w-md mx-auto font-medium">
                    {getRoleDetails(myPlayer?.role).goal}
                  </p>
                  <span className="text-[10px] text-slate-500 pt-2 block font-mono">
                    (แตะอีกครั้งเพื่อคว่ำการ์ดบทบาทกลับ)
                  </span>
                </div>
              ) : (
                <div className="space-y-3 text-slate-400">
                  <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Eye className="w-7 h-7" />
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    แตะที่นี่เพื่อแอบดูการ์ดบทบาทของคุณ
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    ระวังอย่าให้เพื่อนข้างๆ เห็นว่าคุณได้การ์ด Insider หรือไม่!
                  </span>
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                disabled={myPlayer?.roleAcknowledged}
                onClick={onAcknowledgeRole}
                className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] ${
                  myPlayer?.roleAcknowledged
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {myPlayer?.roleAcknowledged
                    ? 'ดูบทบาทเรียบร้อยแล้ว (กำลังรอเพื่อนร่วมโต๊ะ)'
                    : 'จำบทบาทได้แล้ว → ไปสเต็ป 3: ช่วงเปิดดูคำศัพท์ลับ'}
                </span>
                {!myPlayer?.roleAcknowledged && <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="text-xs text-slate-500 font-mono pt-2">
                พร้อมแล้ว {players.filter((p) => p.roleAcknowledged).length}/{players.length} คน
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SECRET WORD REVEAL (MASTER & INSIDER) */}
        {currentRoom.status === 'word_reveal' && (
          <motion.div
            key="insider-word-reveal"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-5 text-center"
          >
            <div className="space-y-1">
              <span className="px-3 py-1 bg-slate-900 text-amber-300 rounded-full text-xs font-bold inline-block">
                STEP 3: ช่วงกลางคืน — เปิดดูคำศัพท์ลับ (Master & Insider)
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {currentRoom.insiderEyesOpen
                  ? '🔊 "จอมบงการ Insider ลืมตาดูคำศัพท์ลับบนหน้าจอ!"'
                  : '🔊 "ทุกคนหลับตา... Master ตรวจสอบคำศัพท์ลับ"'}
              </h3>
              <p className="text-xs text-slate-500">
                หมวดหมู่ปัจจุบัน:{' '}
                <strong className="text-rose-700">
                  {currentRoom.wordCategoryLabel || 'สุ่มทุกหมวดหมู่'}
                </strong>
              </p>
            </div>

            {/* Role-Specific View during Step 3 */}
            {myPlayer?.role === 'insider_master' ? (
              <div className="p-6 bg-amber-50/90 border-2 border-amber-400 rounded-3xl space-y-5 text-left">
                <div className="text-center space-y-2">
                  <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-black">
                    👑 หน้าจอสำหรับ Master ({myPlayer.name})
                  </span>
                  <div className="text-xs text-slate-600">
                    คำศัพท์ลับที่ระบบสุ่มให้ในรอบนี้คือ:
                  </div>
                  <div className="py-4 px-6 bg-white border-2 border-amber-400 rounded-2xl shadow-sm">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      &ldquo;{currentRoom.secretWord}&rdquo;
                    </div>
                    <div className="text-[11px] font-bold text-amber-800 mt-1">
                      หมวดหมู่: {currentRoom.wordCategoryLabel || 'ทั่วไป'}
                    </div>
                  </div>
                </div>

                {/* Random Re-roll or Custom Word Input before showing to Insider */}
                {!currentRoom.insiderEyesOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
                    <div className="p-3.5 bg-white rounded-2xl border border-amber-200 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        🎲 สุ่มคำศัพท์ใหม่จากคลังภาษาไทย:
                      </label>
                      <select
                        value={selectedRerollCat}
                        onChange={(e) =>
                          setSelectedRerollCat(e.target.value as InsiderWordCategoryId)
                        }
                        className="w-full px-3 py-2 text-xs font-bold bg-amber-50 border border-amber-200 rounded-xl text-slate-800"
                      >
                        {ALL_INSIDER_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.emoji} {opt.labelTh}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const picked = getRandomInsiderWord(
                            selectedRerollCat,
                            currentRoom.secretWord
                          );
                          onUpdateSecretWord(picked.word, picked.categoryLabel);
                        }}
                        className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>สุ่มเปลี่ยนคำใหม่ทันที</span>
                      </button>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-amber-200 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        ✏️ หรือพิมพ์กำหนดคำลับเอง:
                      </label>
                      <input
                        type="text"
                        maxLength={50}
                        value={customWordInput}
                        onChange={(e) => setCustomWordInput(e.target.value)}
                        placeholder="เช่น หมูเด้ง, ตลาดพลู..."
                        className="w-full px-3 py-2 text-xs font-bold bg-rose-50/40 border border-rose-200 rounded-xl text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={!customWordInput.trim()}
                        onClick={() => {
                          onUpdateSecretWord(customWordInput.trim(), 'คำที่โฮสต์/Master กำหนดเอง');
                          setCustomWordInput('');
                        }}
                        className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ใช้คำที่พิมพ์เอง</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Button to Trigger Insider Wake & Quiz Start */}
                <div className="pt-2 space-y-2">
                  {currentRoom.insiderEyesOpen ? (
                    <div className="p-4 bg-rose-600 text-white rounded-2xl text-center space-y-2 shadow-md">
                      <div className="text-sm font-black">
                        🕵️ ขณะนี้ระบบกำลังเปิดคำศัพท์ให้ Insider แอบดู ({insiderRevealCountdown ?? 6} วินาที)...
                      </div>
                      <p className="text-xs text-rose-100">
                        กรุณาหลับตารอสักครู่ ระบบจะเข้าสู่ช่วงถาม-ตอบอัตโนมัติเมื่อครบเวลา
                      </p>
                      <button
                        type="button"
                        onClick={onStartQuizImmediately}
                        className="mt-2 px-4 py-2 bg-white text-rose-900 font-extrabold text-xs rounded-xl cursor-pointer"
                      >
                        ข้ามไปเริ่มจับเวลาถาม-ตอบทันที →
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onStartInsiderPeekSequence}
                      className="w-full py-4 px-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>
                        ยืนยันคำลับนี้ & ให้ GM เรียก Insider ลืมตาดูคำ (6 วินาที) →
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : myPlayer?.role === 'insider_traitor' ? (
              /* INSIDER'S VIEW */
              <div
                className={`p-7 rounded-3xl border-2 transition-all min-h-[220px] flex flex-col items-center justify-center space-y-4 ${
                  currentRoom.insiderEyesOpen
                    ? 'bg-rose-950 text-white border-rose-500 shadow-xl'
                    : 'bg-slate-900 text-slate-200 border-slate-800'
                }`}
              >
                {currentRoom.insiderEyesOpen ? (
                  <div className="space-y-3">
                    <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black">
                      🕵️ คุณคือ INSIDER! จดจำคำศัพท์ลับนี้ให้แม่น:
                    </span>
                    <div className="py-4 px-8 bg-white text-slate-950 rounded-2xl shadow-lg border-2 border-amber-400">
                      <div className="text-3xl font-black tracking-tight">
                        &ldquo;{currentRoom.secretWord}&rdquo;
                      </div>
                      <div className="text-xs font-bold text-rose-700 mt-1">
                        หมวดหมู่: {currentRoom.wordCategoryLabel || 'ทั่วไป'}
                      </div>
                    </div>
                    <p className="text-xs text-rose-200 max-w-md mx-auto">
                      จำได้แล้วรีบหลับตาลง! ในรอบถาม-ตอบ ให้เนียนถามคำถามชี้นำเพื่อนไปหาคำนี้โดยอย่าให้ใครจับได้ ({insiderRevealCountdown ?? 6}s)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-4xl block">🤫</span>
                    <div className="text-lg font-extrabold text-rose-300">
                      คุณคือ Insider! หลับตารอสัญญาณเรียกจาก Game Master...
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      ขณะนี้ Master กำลังตรวจสอบคำศัพท์ลับ เมื่อเสียงพากย์สั่งให้ &ldquo;อินไซเดอร์ ลืมตา&rdquo; คำศัพท์ลับจะปรากฏขึ้นบนหน้าจอนี้ทันที
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* COMMONS' VIEW */
              <div className="p-8 bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl min-h-[220px] flex flex-col items-center justify-center space-y-3">
                <span className="text-5xl">😌</span>
                <div className="text-lg font-extrabold">
                  คุณเป็นพลเมืองทั่วไป (Commons) · กรุณาหลับตารอสักครู่
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Master และ Insider กำลังแอบดูคำศัพท์ลับตามเสียงพากย์ของ Game Master เมื่อได้ยินเสียงระฆังเริ่มเกมจึงลืมตาพร้อมกัน
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 4: QUESTION / QUIZ PHASE (SAND TIMER COUNTDOWN) */}
        {currentRoom.status === 'question_phase' && (
          <motion.div
            key="insider-question-phase"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 animate-spin" />
                <span>STEP 4: ช่วงถาม-ตอบทายคำศัพท์ลับ (Quiz Phase)</span>
              </span>
              <h3 className="text-xl font-black text-slate-900">
                ช่วยกันถามคำถาม &ldquo;ใช่ / ไม่ใช่&rdquo; กับ Master ({masterPlayer?.name})!
              </h3>
              <p className="text-xs text-slate-600">
                หมวดหมู่ใบ้เบื้องต้น:{' '}
                <strong className="text-rose-700 font-extrabold">
                  {currentRoom.wordCategoryLabel || 'ทุกหมวดหมู่'}
                </strong>{' '}
                · ถ้าเวลาหมดก่อนทายถูก ทุกคนจะแพ้ทันที!
              </p>
            </div>

            {/* Sand Hourglass Visual Card */}
            <div className="p-5 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-md space-y-3 text-center">
              <div className="flex items-center justify-between text-xs font-mono text-amber-300">
                <span>⏳ นาฬิกาทรายช่วงทายคำศัพท์</span>
                <span>
                  ใช้เวลาไปแล้ว: {formatTimer(Math.max(0, totalQuizSecs - quizSecondsLeft))}
                </span>
              </div>
              <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-amber-400 tabular-nums">
                {formatTimer(quizSecondsLeft)}
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  style={{ width: `${quizProgressPct}%` }}
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700"
                />
              </div>
            </div>

            {/* Live Master Signal Display */}
            {currentRoom.masterLastSignal && (
              <div
                className={`p-3.5 rounded-2xl border-2 text-center font-extrabold text-sm flex items-center justify-center gap-2 ${
                  currentRoom.masterLastSignal === 'yes'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : currentRoom.masterLastSignal === 'no'
                    ? 'bg-rose-50 border-rose-400 text-rose-900'
                    : 'bg-amber-50 border-amber-400 text-amber-900'
                }`}
              >
                <span>คำตอบล่าสุดจาก Master ({masterPlayer?.name}):</span>
                <span className="text-base underline">
                  {currentRoom.masterLastSignal === 'yes'
                    ? '✅ ใช่! (YES)'
                    : currentRoom.masterLastSignal === 'no'
                    ? '❌ ไม่ใช่! (NO)'
                    : '❓ ไม่แน่ใจ / ตอบไม่ได้'}
                </span>
              </div>
            )}

            {/* Secret Word Reminder for Master or Insider */}
            {(myPlayer?.role === 'insider_master' || myPlayer?.role === 'insider_traitor') && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-amber-950">
                    {myPlayer.role === 'insider_master'
                      ? '👑 คำศัพท์ลับที่คุณใช้ตอบคำถาม:'
                      : '🕵️ คำศัพท์ลับที่คุณต้องเนียนใบ้:'}
                  </span>{' '}
                  {showMasterSecretInQuiz ? (
                    <strong className="text-sm font-black text-rose-700 underline ml-1">
                      {currentRoom.secretWord}
                    </strong>
                  ) : (
                    <span className="text-slate-500 italic ml-1">(ซ่อนอยู่เพื่อกันคนแอบมองจอ)</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMasterSecretInQuiz((prev) => !prev)}
                  className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-xl shrink-0 cursor-pointer"
                >
                  {showMasterSecretInQuiz ? 'ซ่อนคำลับ' : '👁️ แตะดูคำลับ'}
                </button>
              </div>
            )}

            {/* Master's Control Console: Quick Yes/No/Unsure Signals & Select Who Guessed Right */}
            {isMasterOrHost ? (
              <div className="p-5 bg-white border-2 border-rose-200 rounded-3xl space-y-4 shadow-xs">
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-slate-800">
                    👑 ปุ่มส่งสัญญาณคำตอบด่วนของ Master (ขึ้นจอทุกคนพร้อมเสียง):
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onSendMasterSignal('yes')}
                      className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>ใช่ (YES)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendMasterSignal('no')}
                      className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>ไม่ใช่ (NO)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendMasterSignal('unsure')}
                      className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>ไม่แน่ใจ</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-rose-100 space-y-2.5">
                  <div className="text-xs sm:text-sm font-black text-rose-900">
                    🎉 เมื่อมีผู้เล่นทายคำลับถูกต้องแล้ว! กดเลือกชื่อผู้เล่นที่ทายถูกเพื่อคว่ำนาฬิกาทราย:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {players
                      .filter((p) => p.role !== 'insider_master')
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onConfirmWordGuessed(p.id, p.name)}
                          className="p-3 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-2xl text-amber-950 font-extrabold text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all"
                        >
                          <span className="truncate">🎯 {p.name} ทายถูก!</span>
                          <span className="px-2 py-0.5 bg-amber-400 text-amber-950 text-[10px] rounded-lg shrink-0">
                            เลือกคนนี้
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-right">
                  <button
                    type="button"
                    onClick={onTriggerTimeoutLoss}
                    className="text-xs font-bold text-slate-500 hover:text-rose-700 underline cursor-pointer"
                  >
                    หมดเวลา / ไม่มีใครทายคำลับถูก (แพ้ยกโต๊ะ)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-white border border-rose-100 rounded-3xl text-center space-y-2">
                <div className="text-sm font-extrabold text-slate-800">
                  🗣️ ตั้งคำถามสดๆ กับ {masterPlayer?.name} (Master) ได้เลย!
                </div>
                <p className="text-xs text-slate-500">
                  เมื่อมีผู้เล่นทายคำศัพท์ลับถูกต้อง Master จะกดเลือกชื่อผู้ทายถูกเพื่อคว่ำนาฬิกาทรายเข้าสู่ช่วงจับผิด Insider
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 5A: STAGE 1 OFFICIAL VOTE — JUDGE THE GUESSER */}
        {currentRoom.status === 'discussion_guesser_vote' && (
          <motion.div
            key="insider-guesser-vote"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-black inline-flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5" />
                <span>STEP 5 (ขั้นที่ 1/2): คว่ำนาฬิกาทรายถกเถียง & โหวตตัดสินคนทายถูก!</span>
              </span>
              <h3 className="text-xl font-black text-slate-900">
                คำศัพท์ลับคือ &ldquo;{currentRoom.secretWord}&rdquo; · ทายถูกโดย{' '}
                <span className="text-rose-600 underline">{currentRoom.guesserPlayerName}</span>!
              </h3>
              <div className="text-xs font-mono font-bold text-rose-700">
                ⏳ เวลาถกเถียงจากนาฬิกาทรายที่พลิกกลับ: เหลือ {formatTimer(discussionSecondsLeft)}
              </div>
            </div>

            {/* Flipped Sand Timer Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${discussProgressPct}%` }}
                className="h-full bg-gradient-to-r from-rose-600 to-amber-400 transition-all duration-700"
              />
            </div>

            <div className="p-6 bg-white border-2 border-rose-200 rounded-3xl space-y-4 text-center shadow-xs">
              <div className="space-y-1">
                <div className="text-xs font-bold text-rose-700 uppercase">
                  กติกาโหวตขั้นที่ 1 (Guesser Judgment)
                </div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900">
                  คุณคิดว่า &ldquo;{currentRoom.guesserPlayerName}&rdquo; (ผู้ที่ทายคำลับถูก) คือ{' '}
                  <span className="text-rose-600">Insider</span> หรือไม่?
                </div>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  หากเสียงข้างมากโหวตว่า &ldquo;ใช่ Insider&rdquo; จะเปิดการ์ดของ {currentRoom.guesserPlayerName} ทันที! แต่หากเสียงข้างมากโหวตว่า &ldquo;ไม่ใช่ (บริสุทธิ์)&rdquo; จะเข้าสู่การโหวตขั้นที่ 2 เพื่อชี้ตัวผู้ต้องสงสัยคนอื่นในโต๊ะ
                </p>
              </div>

              {currentUid === currentRoom.guesserPlayerId ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 font-bold text-xs sm:text-sm">
                  🎯 คุณคือผู้ที่ทายคำศัพท์ลับถูกต้อง! อธิบายให้เพื่อนๆ เชื่อว่าคุณคิดคำตอบออกเองโดยไม่ได้เป็น Insider (ผู้เล่นคนอื่นกำลังลงมติตัดสินคุณ)
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onCastGuesserJudgment('yes_insider')}
                    className={`p-4 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      myPlayer?.guesserJudgmentVote === 'yes_insider'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-[1.01]'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-950 border-rose-300'
                    }`}
                  >
                    <ThumbsUp className="w-6 h-6" />
                    <span>👍 ใช่! {currentRoom.guesserPlayerName} คือ Insider แน่นอน</span>
                    <span className="text-[11px] font-normal opacity-85">
                      (เปิดการ์ดตัดสินแพ้-ชนะทันที)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCastGuesserJudgment('no_innocent')}
                    className={`p-4 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      myPlayer?.guesserJudgmentVote === 'no_innocent'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.01]'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                    }`}
                  >
                    <ThumbsDown className="w-6 h-6" />
                    <span>👎 ไม่ใช่! เขาเป็นพลเมืองดีที่ทายถูกเอง</span>
                    <span className="text-[11px] font-normal opacity-85">
                      (ไปโหวตหาคนร้ายตัวจริงในขั้นที่ 2)
                    </span>
                  </button>
                </div>
              )}

              <div className="text-xs font-mono text-slate-500 pt-2">
                ลงมติขั้นที่ 1 แล้ว{' '}
                {
                  players.filter(
                    (p) =>
                      p.id !== currentRoom.guesserPlayerId && Boolean(p.guesserJudgmentVote)
                  ).length
                }
                /{Math.max(1, players.length - 1)} คน
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5B: STAGE 2 OFFICIAL VOTE — GENERAL ACCUSATION VOTE */}
        {currentRoom.status === 'general_vote' && (
          <motion.div
            key="insider-general-vote"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black inline-flex items-center gap-1.5">
                <Vote className="w-3.5 h-3.5" />
                <span>STEP 5 (ขั้นที่ 2/2): โหวตชี้ตัวหาจอมบงการ (Insider) ตัวจริง!</span>
              </span>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 max-w-lg mx-auto">
                ผลมติขั้นที่ 1: เสียงข้างมาก ({currentRoom.guesserNoVotes || 0} ต่อ{' '}
                {currentRoom.guesserYesVotes || 0}) เชื่อว่า{' '}
                <strong>{currentRoom.guesserPlayerName}</strong> เป็นพลเมืองดี!
              </div>
              <h3 className="text-xl font-black text-slate-900">
                ถ้าไม่ใช่คนทายถูก... แล้วใครในโต๊ะที่แอบถามคำถามชี้นำ?
              </h3>
              <p className="text-xs text-slate-500">
                เลือกชี้ตัวผู้เล่นที่คุณสงสัยว่าเป็น Insider มากที่สุด 1 คน (หากคะแนนโหวตเท่ากัน เสียงโหวตของ Master จะเป็นผู้ตัดสินชี้ขาด)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players
                .filter((p) => p.role !== 'insider_master')
                .map((p) => {
                  const isSelected = selectedVoteTarget === p.id;
                  const alreadySubmitted = myPlayer?.voteTargetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectVoteTarget(p.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected || alreadySubmitted
                          ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-rose-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 font-extrabold flex items-center justify-center shrink-0">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">
                            {p.name} {p.id === currentUid ? '(คุณ)' : ''}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.id === currentRoom.guesserPlayerId
                              ? '🎯 ผู้ทายคำลับถูก'
                              : 'ผู้ร่วมตั้งคำถาม'}
                          </div>
                        </div>
                      </div>
                      {(isSelected || alreadySubmitted) && (
                        <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg shrink-0">
                          ชี้ตัวคนนี้
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={!selectedVoteTarget || isLoading}
              onClick={onCastGeneralVote}
              className="w-full py-4 px-6 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Vote className="w-4 h-4" />
              <span>
                {myPlayer?.voteTargetId
                  ? 'ส่งผลโหวตเรียบร้อยแล้ว (แก้ไขได้จนกว่าเพื่อนจะโหวตครบ)'
                  : 'ยืนยันการชี้ตัว Insider!'}
              </span>
            </button>

            <div className="text-center text-xs font-mono text-slate-500">
              โหวตชี้ตัวแล้ว {players.filter((p) => Boolean(p.voteTargetId)).length}/{players.length} คน
            </div>
          </motion.div>
        )}

        {/* STEP 6: GAME OVER & DRAMATIC VERDICT */}
        {currentRoom.status === 'game_over' && (
          <motion.div
            key="insider-game-over"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26 }}
            className="space-y-5"
          >
            <div
              className={`p-7 rounded-3xl border-2 text-center space-y-3 shadow-md ${
                currentRoom.winnerTeam === 'commons'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                  : currentRoom.winnerTeam === 'insider'
                  ? 'bg-rose-50 border-rose-400 text-rose-950'
                  : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <span className="text-5xl block">
                {currentRoom.winnerTeam === 'commons'
                  ? '🏆'
                  : currentRoom.winnerTeam === 'insider'
                  ? '🕵️'
                  : '⌛'}
              </span>
              <h3 className="text-2xl font-black tracking-tight">
                {currentRoom.winnerTeam === 'commons'
                  ? 'ฝ่ายพลเมือง & Master ชนะ! กระชากหน้ากาก Insider สำเร็จ!'
                  : currentRoom.winnerTeam === 'insider'
                  ? 'จอมบงการ (Insider) ชนะ! ปั่นหัวคนทั้งโต๊ะสำเร็จ!'
                  : 'หมดเวลาทายคำลับ! ไม่มีใครทายถูกทันเวลา — แพ้ยกโต๊ะ!'}
              </h3>

              <div className="text-xs sm:text-sm font-bold">
                คำศัพท์ลับประจำรอบนี้คือ:{' '}
                <span className="px-3 py-1 bg-white/90 text-slate-900 rounded-xl font-black border border-slate-300">
                  &ldquo;{currentRoom.secretWord}&rdquo;
                </span>
              </div>

              <div className="pt-2 text-xs sm:text-sm space-y-1">
                <div>
                  🕵️ จอมบงการ (Insider) ตัวจริงคือ:{' '}
                  <strong className="underline text-base">
                    {insiderPlayer?.name || 'ไม่ทราบ'}
                  </strong>
                </div>
                {currentRoom.guesserPlayerName && (
                  <div>
                    🎯 ผู้ที่ทายคำศัพท์ถูกคือ:{' '}
                    <strong>{currentRoom.guesserPlayerName}</strong> (ผลโหวตขั้นที่ 1: ชี้ว่าเป็น
                    Insider {currentRoom.guesserYesVotes || 0} เสียง / เชื่อว่าบริสุทธิ์{' '}
                    {currentRoom.guesserNoVotes || 0} เสียง)
                  </div>
                )}
              </div>
            </div>

            {/* Full Player Role Reveal Table */}
            <div className="p-5 bg-white border border-rose-200 rounded-3xl space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-600" />
                <span>เฉลยการ์ดบทบาทและผลโหวตของทุกคนในโต๊ะ</span>
              </h4>
              <div className="space-y-2">
                {players.map((p) => {
                  const isAccused = p.id === currentRoom.accusedPlayerId;
                  const votedForPlayer = players.find((t) => t.id === p.voteTargetId);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                        p.role === 'insider_traitor'
                          ? 'bg-rose-50/80 border-rose-300'
                          : p.role === 'insider_master'
                          ? 'bg-amber-50/80 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRoleDetails(p.role).emoji}</span>
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {p.name} {p.id === currentUid ? '(คุณ)' : ''}
                            {isAccused && (
                              <span className="ml-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full">
                                ถูกโหวตชี้ตัวสูงสุด
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600">
                            บทบาท: {getRoleDetails(p.role).titleTh}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono text-[11px] text-slate-600">
                        {votedForPlayer ? (
                          <span>ชี้โหวต: {votedForPlayer.name}</span>
                        ) : p.guesserJudgmentVote ? (
                          <span>
                            โหวตขั้นที่ 1:{' '}
                            {p.guesserJudgmentVote === 'yes_insider'
                              ? '👍 ใช่ Insider'
                              : '👎 บริสุทธิ์'}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={onPlayAgain}
              className="w-full py-4 px-6 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เล่นรอบต่อไป (สับการ์ด & สุ่มคำศัพท์ใหม่)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
