import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  Clock,
  Send,
  Users,
  Vote,
  RotateCcw,
  Crown,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Mic,
  Shield,
  Search,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
  UndercoverClueEntry,
} from '../../firebase/tableService';

interface UndercoverPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isLoading: boolean;
  onAcknowledgeRole: () => void;
  onSubmitClue: (clueText: string) => void;
  onSubmitVote: (targetId: string) => void;
  onSubmitMrWhiteGuess: (guessedWord: string) => void;
  onRematch: () => void;
}

export const UndercoverPhases: React.FC<UndercoverPhasesProps> = ({
  currentRoom,
  players,
  currentUid,
  isLoading,
  onAcknowledgeRole,
  onSubmitClue,
  onSubmitVote,
  onSubmitMrWhiteGuess,
  onRematch,
}) => {
  const [isPeekingWord, setIsPeekingWord] = useState<boolean>(false);
  const [clueInput, setClueInput] = useState<string>('');
  const [selectedVoteTargetId, setSelectedVoteTargetId] = useState<string>('');
  const [mrWhiteGuessInput, setMrWhiteGuessInput] = useState<string>('');
  const [clueSecondsLeft, setClueSecondsLeft] = useState<number>(45);

  const myPlayer = players.find((p) => p.id === currentUid);
  const isHost = currentRoom.hostId === currentUid;
  const eliminatedIds = currentRoom.undercoverEliminatedIds || [];
  const alivePlayers = players.filter((p) => !eliminatedIds.includes(p.id));

  const isMyTurn = currentRoom.undercoverTurnPlayerId === currentUid;
  const currentSpeaker = players.find(
    (p) => p.id === currentRoom.undercoverTurnPlayerId
  );

  // Turn timer countdown
  useEffect(() => {
    if (currentRoom.status !== 'undercover_clue') return;
    if (!currentRoom.undercoverTurnDeadline) {
      setClueSecondsLeft(currentRoom.clueDurationSeconds || 45);
      return;
    }

    const updateTimer = () => {
      const deadline = new Date(currentRoom.undercoverTurnDeadline!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((deadline - now) / 1000));
      setClueSecondsLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentRoom.status, currentRoom.undercoverTurnDeadline]);

  // Handle clue submission
  const handleSendClue = () => {
    const text = clueInput.trim();
    onSubmitClue(text || 'พูดใบ้ต่อหน้าเรียบร้อยแล้ว');
    setClueInput('');
  };

  const handleQuickPassClue = () => {
    onSubmitClue('พูดใบ้ต่อหน้าเรียบร้อยแล้ว');
    setClueInput('');
  };

  // Step definition bar
  const STEPS = [
    { id: 'deal', label: '1. ดูคำลับ' },
    { id: 'clue', label: '2. ผลัดกันใบ้' },
    { id: 'vote', label: '3. โหวตคัดออก' },
    { id: 'over', label: '4. สรุปผล' },
  ];

  const currentStepId =
    currentRoom.status === 'undercover_deal'
      ? 'deal'
      : currentRoom.status === 'undercover_clue'
      ? 'clue'
      : currentRoom.status === 'undercover_vote' ||
        currentRoom.status === 'undercover_mrwhite_guess'
      ? 'vote'
      : 'over';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 4-Step Progress Navigation Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
          {STEPS.map((s, idx) => {
            const isActive = s.id === currentStepId;
            const isDone =
              (s.id === 'deal' && currentStepId !== 'deal') ||
              (s.id === 'clue' &&
                (currentStepId === 'vote' || currentStepId === 'over')) ||
              (s.id === 'vote' && currentStepId === 'over');

            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 ${
                  isActive
                    ? 'text-amber-400 font-bold'
                    : isDone
                    ? 'text-indigo-300'
                    : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                      : isDone
                      ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-700'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE 1: ROLE DEAL & SECRET WORD CARD REVEAL */}
      {currentRoom.status === 'undercover_deal' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="max-w-md mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-mono text-indigo-300">
                <Search className="w-3.5 h-3.5" />
                <span>หมวดหมู่: {currentRoom.undercoverCategoryLabel || 'ชีวิตประจำวัน'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                การ์ดภารกิจลับเฉพาะตัวคุณ
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                แตะหรือกดปุ่มด้านล่างเพื่อแง้มดูคำลับ ระวังอย่าให้เพื่อนที่นั่งข้างๆ เห็น!
              </p>

              {/* Secret Word Scratch Card */}
              <div className="relative py-4">
                <div
                  className={`w-full min-h-[160px] rounded-2xl p-6 flex flex-col items-center justify-center border-2 transition-all duration-300 select-none shadow-inner ${
                    isPeekingWord
                      ? myPlayer?.role === 'undercover_mrwhite'
                        ? 'bg-gradient-to-br from-amber-950/80 to-slate-900 border-amber-500/80 text-amber-200'
                        : myPlayer?.role === 'undercover_spy'
                        ? 'bg-gradient-to-br from-indigo-950/90 to-purple-950/80 border-indigo-500/80 text-white'
                        : 'bg-gradient-to-br from-slate-800 to-indigo-950/80 border-indigo-400/80 text-white'
                      : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {isPeekingWord ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-3"
                    >
                      {myPlayer?.role === 'undercover_mrwhite' ? (
                        <>
                          <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            <span>คุณคือ Mr. White (ผู้ไม่รู้อะไรเลย)</span>
                          </div>
                          <div className="text-3xl sm:text-4xl font-extrabold text-amber-300">
                            ???????
                          </div>
                          <p className="text-xs text-amber-200/80 max-w-xs mx-auto">
                            คุณไม่มีคำศัพท์! ฟังคำใบ้ของคนอื่นเพื่อแกล้งทำเป็นรู้ และจำคำไว้ทายหากถูกจับได้
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-center gap-1.5">
                            <Shield className="w-4 h-4" />
                            <span>
                              {myPlayer?.role === 'undercover_spy'
                                ? 'บทบาท: สายลับ (Undercover)'
                                : 'บทบาท: พลเมือง (Civilian)'}
                            </span>
                          </div>
                          <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-wide">
                            {myPlayer?.undercoverWord || '...'}
                          </div>
                          <p className="text-xs text-slate-300">
                            จำคำนี้ไว้ให้ดี ห้ามพูดคำนี้ออกมาตรงๆ ในรอบบอกคำใบ้
                          </p>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div className="space-y-2 cursor-pointer" onClick={() => setIsPeekingWord(true)}>
                      <Eye className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
                      <div className="text-sm font-bold text-slate-300">
                        แตะเพื่อเปิดดูคำลับของคุณ
                      </div>
                      <div className="text-[11px] text-slate-400">
                        (แตะอีกครั้งเพื่อซ่อนคำ)
                      </div>
                    </div>
                  )}
                </div>

                {/* Peek Toggle Button */}
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsPeekingWord((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {isPeekingWord ? (
                      <>
                        <EyeOff className="w-4 h-4 text-rose-400" />
                        <span>ซ่อนการ์ดคำลับ</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-indigo-400" />
                        <span>แง้มดูการ์ดคำลับ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ready Acknowledgment Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={myPlayer?.roleAcknowledged || isLoading}
                  onClick={onAcknowledgeRole}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    myPlayer?.roleAcknowledged
                      ? 'bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {myPlayer?.roleAcknowledged
                      ? 'พร้อมแล้ว (รอผู้เล่นท่านอื่นเปิดดูการ์ด)'
                      : 'ฉันจำคำลับได้แล้ว พร้อมเริ่มบอกคำใบ้!'}
                  </span>
                </button>
              </div>

              {/* Players Readiness Grid */}
              <div className="pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400 mb-2 font-medium">
                  สถานะการเปิดดูการ์ด ({players.filter((p) => p.roleAcknowledged).length}/{players.length})
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {players.map((p) => (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        p.roleAcknowledged
                          ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span>{p.name}</span>
                      {p.roleAcknowledged ? '✓' : '...'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* PHASE 2: CLUE ROUND (TURN-BY-TURN) */}
      {currentRoom.status === 'undercover_clue' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Active Speaker Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-indigo-400">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>รอบที่ {currentRoom.undercoverRoundNumber || 1} · ช่วงบอกคำใบ้</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {isMyTurn ? (
                    <span className="text-amber-400">👉 ถึงตาคุณแล้ว! บอกคำใบ้ 1 ประโยค</span>
                  ) : (
                    <span>ถึงตา: {currentSpeaker?.name || 'ผู้เล่นถัดไป'}</span>
                  )}
                </h3>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                  <Clock
                    className={`w-4 h-4 ${
                      clueSecondsLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                    }`}
                  />
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {clueSecondsLeft} วินาที
                  </span>
                </div>
              </div>
            </div>

            {/* My Secret Word Reminder Bar (Always visible to player quietly) */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-xs">
              <span className="text-slate-300">
                คำลับของคุณ:
              </span>
              <span className="font-bold text-amber-400 text-sm">
                {myPlayer?.role === 'undercover_mrwhite'
                  ? 'คุณคือ Mr. White (ไม่มีคำลับ)'
                  : myPlayer?.undercoverWord || '-'}
              </span>
            </div>

            {/* Speaker Interaction Box */}
            {isMyTurn ? (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendClue();
                    }}
                    placeholder="พิมพ์คำใบ้ของคุณสั้นๆ (ห้ามมีคำลับอยู่ในประโยค)..."
                    className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendClue}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>ส่งคำใบ้นี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickPassClue}
                    disabled={isLoading}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>พูดใบ้ต่อหน้าเสร็จแล้ว (ส่งเทิร์น)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 space-y-2">
                <div className="animate-pulse">
                  กำลังรอ {currentSpeaker?.name} บอกคำใบ้...
                </div>
                {isHost && (
                  <button
                    type="button"
                    onClick={handleQuickPassClue}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    โฮสต์กดข้ามเทิร์นให้ผู้เล่นนี้
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Clue History Feed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>ประวัติคำใบ้ในห้อง ({currentRoom.undercoverHistory?.length || 0})</span>
              <span>หมวด: {currentRoom.undercoverCategoryLabel || 'ทั่วไป'}</span>
            </div>

            {(!currentRoom.undercoverHistory || currentRoom.undercoverHistory.length === 0) ? (
              <div className="text-center py-8 text-xs text-slate-500">
                ยังไม่มีใครบอกคำใบ้ในรอบนี้ กำลังรอผู้เล่นคนแรก...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {currentRoom.undercoverHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                      R{entry.round}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-bold text-slate-200">
                        {entry.playerName}
                      </div>
                      <div className="text-amber-300 font-medium text-sm">
                        "{entry.clue}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PHASE 3: ELIMINATION VOTE */}
      {currentRoom.status === 'undercover_vote' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700/60 text-xs font-mono text-rose-300">
                <Vote className="w-3.5 h-3.5" />
                <span>รอบการโหวตคัดคนออก</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                ใครคือสายลับ Undercover หรือ Mr. White?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                วิเคราะห์คำใบ้ที่ผ่านมาแล้วเลือกโหวตผู้เล่นที่น่าสงสัยที่สุด 1 คน ผู้ที่ได้คะแนนโหวตสูงสุดจะถูกคัดออกจากเกม
              </p>
            </div>

            {/* Voting Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {alivePlayers.map((p) => {
                const isSelected = selectedVoteTargetId === p.id;
                const isMe = p.id === currentUid;
                const lastClue = p.currentRoundClue || p.cluesSubmitted?.[p.cluesSubmitted.length - 1];

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isMe}
                    onClick={() => setSelectedVoteTargetId(p.id)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-950/50'
                        : isMe
                        ? 'bg-slate-800/40 border-slate-800 opacity-60 cursor-not-allowed'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">
                        {p.name} {isMe && '(คุณ)'}
                      </span>
                      {isSelected && (
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          เลือกแล้ว
                        </span>
                      )}
                    </div>
                    {lastClue && (
                      <div className="text-xs text-amber-300/90 italic">
                        คำใบ้ล่าสุด: "{lastClue}"
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit Vote Action */}
            <div className="max-w-md mx-auto pt-2">
              <button
                type="button"
                disabled={!selectedVoteTargetId || isLoading || Boolean(myPlayer?.voteTargetId)}
                onClick={() => onSubmitVote(selectedVoteTargetId)}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  myPlayer?.voteTargetId
                    ? 'bg-emerald-950/70 border border-emerald-600 text-emerald-300 cursor-default'
                    : selectedVoteTargetId
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Vote className="w-4 h-4" />
                <span>
                  {myPlayer?.voteTargetId
                    ? 'คุณลงคะแนนโหวตเรียบร้อยแล้ว (กำลังรอคนอื่น)'
                    : 'ยืนยันโหวตคัดผู้เล่นนี้ออก'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* PHASE 4: MR. WHITE LAST CHANCE GUESS */}
      {currentRoom.status === 'undercover_mrwhite_guess' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-10 text-center shadow-2xl backdrop-blur-md space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg">
              🎯
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                Mr. White ได้รับโอกาสสุดท้าย!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                ผู้เล่นที่ถูกโหวตออกคือ <span className="font-bold text-white">{players.find((p) => p.id === currentRoom.accusedPlayerId)?.name}</span> (Mr. White)
                หากทายคำลับของพลเมืองได้ถูกต้อง Mr. White จะชนะเกมเดี่ยวทันที!
              </p>
            </div>

            {myPlayer?.id === currentRoom.accusedPlayerId ? (
              <div className="max-w-md mx-auto space-y-4 pt-2">
                <input
                  type="text"
                  value={mrWhiteGuessInput}
                  onChange={(e) => setMrWhiteGuessInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmitMrWhiteGuess(mrWhiteGuessInput);
                  }}
                  placeholder="พิมพ์คำศัพท์ที่คิดว่าเป็นคำของพลเมือง..."
                  className="w-full px-4 py-3.5 bg-slate-800 border-2 border-amber-400 rounded-xl text-white placeholder-slate-500 text-sm outline-none font-bold"
                />
                <button
                  type="button"
                  disabled={!mrWhiteGuessInput.trim() || isLoading}
                  onClick={() => onSubmitMrWhiteGuess(mrWhiteGuessInput)}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>ทายคำลับนี้เพื่อพลิกชนะ!</span>
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-amber-200/90 animate-pulse font-medium">
                กำลังรอให้ Mr. White พิมพ์ทายคำลับของพลเมือง...
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PHASE 5: GAME OVER & FULL REVEAL */}
      {currentRoom.status === 'undercover_game_over' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center shadow-2xl backdrop-blur-md space-y-6">
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl">
                {currentRoom.winnerTeam === 'civilians'
                  ? '🎉'
                  : currentRoom.winnerTeam === 'undercover'
                  ? '🕶️'
                  : '👑'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {currentRoom.winnerTeam === 'civilians' && 'ฝ่ายพลเมือง (Civilians) ชนะ!'}
                {currentRoom.winnerTeam === 'undercover' && 'ฝ่ายสายลับ (Undercover) ชนะ!'}
                {currentRoom.winnerTeam === 'mr_white' && 'มิสเตอร์ไวท์ (Mr. White) ชนะเดี่ยว!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {currentRoom.winnerTeam === 'civilians' &&
                  'พลเมืองร่วมมือกันจับสายลับและ Mr. White ออกจากโต๊ะได้สำเร็จ'}
                {currentRoom.winnerTeam === 'undercover' &&
                  'สายลับแฝงตัวอย่างแนบเนียนจนมีจำนวนเท่ากับหรือมากกว่าพลเมือง'}
                {currentRoom.winnerTeam === 'mr_white' &&
                  'Mr. White ทายคำลับของพลเมืองถูกต้องและขโมยชัยชนะไปครอง!'}
              </p>
            </div>

            {/* Secret Words Reveal Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto py-2">
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-700/60 space-y-1">
                <div className="text-xs font-mono font-bold text-indigo-300">
                  คำของฝ่ายพลเมือง (Civilian)
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {currentRoom.undercoverCivilianWord || '-'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/60 border border-purple-700/60 space-y-1">
                <div className="text-xs font-mono font-bold text-purple-300">
                  คำของฝ่ายสายลับ (Undercover)
                </div>
                <div className="text-2xl font-extrabold text-amber-400">
                  {currentRoom.undercoverSpyWord || '-'}
                </div>
              </div>
            </div>

            {/* All Players Identity List */}
            <div className="space-y-2 max-w-xl mx-auto text-left pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                เฉลยบทบาทผู้เล่นทุกคนในโต๊ะ
              </div>
              <div className="space-y-2">
                {players.map((p) => {
                  const isCiv = p.role === 'undercover_civilian';
                  const isSpy = p.role === 'undercover_spy';
                  const isWhite = p.role === 'undercover_mrwhite';

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/70 border border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{p.name}</span>
                        {p.id === currentUid && (
                          <span className="text-[10px] text-amber-400 font-bold">(คุณ)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            isCiv
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : isSpy
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {isCiv ? 'พลเมือง' : isSpy ? 'สายลับ' : 'Mr. White'}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">
                          ({p.undercoverWord || 'ไม่มีคำ'})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rematch Button */}
            {isHost && (
              <div className="max-w-md mx-auto pt-4">
                <button
                  type="button"
                  onClick={onRematch}
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เล่นใหม่อีกตา (สับคำ & บทบาทใหม่)</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
