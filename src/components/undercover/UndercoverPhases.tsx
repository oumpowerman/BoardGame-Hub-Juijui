import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  Clock,
  Send,
  Vote,
  RotateCcw,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Mic,
  Shield,
  Search,
  Shuffle,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
  getOrderedAlivePlayers,
} from '../../firebase/tableService';
import { InGameRolePrivacyBar } from '../common/InGameRolePrivacyBar';
import { UndercoverRoundVerdictCard } from './UndercoverRoundVerdictCard';

interface UndercoverPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isLoading: boolean;
  onAcknowledgeRole: () => void;
  onForceAcknowledgeRoles?: () => void;
  onSubmitClue: (clueText: string) => void;
  onSubmitVote: (targetId: string) => void;
  onSubmitMrWhiteGuess: (guessedWord: string) => void;
  onAdvanceNextRound: () => void;
  onRematch: () => void;
}

export const UndercoverPhases: React.FC<UndercoverPhasesProps> = ({
  currentRoom,
  players,
  currentUid,
  isLoading,
  onAcknowledgeRole,
  onForceAcknowledgeRoles,
  onSubmitClue,
  onSubmitVote,
  onSubmitMrWhiteGuess,
  onAdvanceNextRound,
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
  const alivePlayers = getOrderedAlivePlayers(
    players,
    currentRoom.undercoverTurnOrderIds,
    eliminatedIds
  );

  const myUndercoverRoleTitle =
    myPlayer?.role === 'undercover_mrwhite'
      ? 'คุณคือ Mr. White (ไม่มีคำศัพท์)'
      : 'ผู้ถือคำศัพท์ลับ (พลเมือง / สายลับ)';
  const myUndercoverSecretValue =
    myPlayer?.role === 'undercover_mrwhite'
      ? '??????? (คุณคือ Mr. White — แกล้งเนียนตามเพื่อน!)'
      : myPlayer?.undercoverWord || '-';

  const isMyTurn = currentRoom.undercoverTurnPlayerId === currentUid;
  const currentSpeaker = players.find(
    (p) => p.id === currentRoom.undercoverTurnPlayerId
  );

  // Turn timer countdown + automatic failover when deadline expires
  useEffect(() => {
    if (currentRoom.status !== 'undercover_clue') return;
    if (!currentRoom.undercoverTurnDeadline) {
      setClueSecondsLeft(currentRoom.clueDurationSeconds || 45);
      return;
    }

    let autoAdvanced = false;
    const updateTimer = () => {
      const deadline = new Date(currentRoom.undercoverTurnDeadline!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((deadline - now) / 1000));
      setClueSecondsLeft(diff);

      if (diff <= 0 && !autoAdvanced) {
        autoAdvanced = true;
        const delayMs =
          (isMyTurn || isHost) &&
          typeof document !== 'undefined' &&
          document.visibilityState === 'visible'
            ? 400
            : 2500;
        window.setTimeout(() => {
          onSubmitClue('หมดเวลาพูดคำใบ้ (ข้ามเทิร์นอัตโนมัติ)');
        }, delayMs);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [
    currentRoom.status,
    currentRoom.undercoverTurnDeadline,
    currentRoom.undercoverTurnPlayerId,
    isMyTurn,
    isHost,
  ]);

  const handleSendClue = () => {
    const text = clueInput.trim();
    onSubmitClue(text || 'พูดใบ้ต่อหน้าเรียบร้อยแล้ว');
    setClueInput('');
  };

  const handleQuickPassClue = () => {
    onSubmitClue('พูดใบ้ต่อหน้าเรียบร้อยแล้ว');
    setClueInput('');
  };

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
      {/* 4-Step Progress Navigation Header (Light Pastel Lavender) */}
      <div className="bg-white border border-violet-200 rounded-2xl p-4 shadow-xs">
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
                    ? 'text-violet-900 font-extrabold'
                    : isDone
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-violet-500 text-white shadow-2xs font-extrabold'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500'
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
          <div className="bg-white border border-violet-200 rounded-3xl p-6 sm:p-10 text-center shadow-sm relative overflow-hidden">
            <div className="max-w-md mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-xs font-mono font-bold text-violet-900">
                <Search className="w-3.5 h-3.5 text-violet-600" />
                <span>
                  หมวดหมู่: {currentRoom.undercoverCategoryLabel || 'ชีวิตประจำวัน'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                การ์ดภารกิจลับเฉพาะตัวคุณ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                แตะหรือกดปุ่มด้านล่างเพื่อแง้มดูคำลับ ระวังอย่าให้เพื่อนที่นั่งข้างๆ เห็น!
              </p>

              {/* Secret Word Scratch Card (Light Pastel) */}
              <div className="relative py-3">
                <div
                  className={`w-full min-h-[168px] rounded-3xl p-6 flex flex-col items-center justify-center border-2 transition-all duration-300 select-none ${
                    isPeekingWord
                      ? myPlayer?.role === 'undercover_mrwhite'
                        ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 text-amber-950 shadow-sm'
                        : 'bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-violet-300 text-slate-900 shadow-sm'
                      : 'bg-violet-50/50 border-dashed border-violet-300 text-slate-600 hover:bg-violet-50'
                  }`}
                >
                  {isPeekingWord ? (
                    <motion.div
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-3"
                    >
                      {myPlayer?.role === 'undercover_mrwhite' ? (
                        <>
                          <div className="text-xs font-mono font-extrabold uppercase tracking-wider text-amber-800 flex items-center justify-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>คุณคือ Mr. White (ผู้ไม่รู้อะไรเลย)</span>
                          </div>
                          <div className="text-3xl sm:text-4xl font-black text-amber-700">
                            ???????
                          </div>
                          <p className="text-xs text-amber-900/80 max-w-xs mx-auto font-medium">
                            คุณไม่มีคำศัพท์! ฟังคำใบ้ของคนอื่นเพื่อแกล้งทำเป็นรู้ และจำคำไว้ทายหากถูกจับได้
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-mono font-extrabold uppercase tracking-wider text-violet-700 flex items-center justify-center gap-1.5">
                            <Shield className="w-4 h-4 text-violet-600" />
                            <span>การ์ดคำศัพท์ประจำตัวของคุณ</span>
                          </div>
                          <div className="text-3xl sm:text-4xl font-black text-violet-950 tracking-wide">
                            {myPlayer?.undercoverWord || '...'}
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            จำคำนี้ไว้ให้ดี ห้ามพูดคำนี้ออกมาตรงๆ ในรอบบอกคำใบ้
                          </p>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div
                      className="space-y-2 cursor-pointer"
                      onClick={() => setIsPeekingWord(true)}
                    >
                      <Eye className="w-10 h-10 mx-auto text-violet-500 animate-pulse" />
                      <div className="text-sm font-extrabold text-slate-800">
                        แตะเพื่อเปิดดูคำลับของคุณ
                      </div>
                      <div className="text-[11px] text-slate-500">
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-xs font-bold text-violet-900 border border-violet-200 transition-colors cursor-pointer"
                  >
                    {isPeekingWord ? (
                      <>
                        <EyeOff className="w-4 h-4 text-rose-500" />
                        <span>ซ่อนการ์ดคำลับ</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-violet-600" />
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
                  className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    myPlayer?.roleAcknowledged
                      ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 cursor-default'
                      : 'bg-violet-500 hover:bg-violet-600 text-white shadow-sm active:scale-[0.98]'
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
              <div className="pt-4 border-t border-violet-100">
                <div className="text-xs text-slate-500 mb-2 font-bold">
                  สถานะการเปิดดูการ์ด ({players.filter((p) => p.roleAcknowledged).length}/
                  {players.length})
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {players.map((p) => (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        p.roleAcknowledged
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span>{p.name}</span>
                      {p.roleAcknowledged ? '✓' : '...'}
                    </span>
                  ))}
                </div>
                {isHost &&
                  onForceAcknowledgeRoles &&
                  players.some((p) => !p.roleAcknowledged) && (
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={onForceAcknowledgeRoles}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        <span>⚡ โฮสต์บังคับข้ามคนที่ค้าง → เริ่มรอบบอกคำใบ้ทันที</span>
                      </button>
                    </div>
                  )}
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
          <div className="bg-white border border-violet-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-violet-700">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    รอบที่ {currentRoom.undercoverRoundNumber || 1} · ช่วงบอกคำใบ้
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {isMyTurn ? (
                    <span className="text-violet-700">
                      👉 ถึงตาคุณแล้ว! บอกคำใบ้ 1 ประโยค
                    </span>
                  ) : (
                    <span>ถึงตา: {currentSpeaker?.name || 'ผู้เล่นถัดไป'}</span>
                  )}
                </h3>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                  <Clock
                    className={`w-4 h-4 ${
                      clueSecondsLeft <= 10
                        ? 'text-rose-600 animate-pulse'
                        : 'text-amber-600'
                    }`}
                  />
                  <span className="font-mono text-sm font-extrabold tabular-nums">
                    {clueSecondsLeft} วินาที
                  </span>
                </div>
              </div>
            </div>

            {/* Randomized Turn Order Queue Strip */}
            <div className="p-3 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-violet-800">
                <span className="inline-flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-violet-600" />
                  <span>ลำดับการพูดใบ้คำที่ระบบสุ่มในตานี้ (Mr. White จะไม่ได้เริ่มคนแรก):</span>
                </span>
                <span className="font-mono text-slate-500">
                  ผู้รอดชีวิต {alivePlayers.length} คน
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {alivePlayers.map((p, idx) => {
                  const isCurrentSpeaker =
                    p.id === currentRoom.undercoverTurnPlayerId;
                  const hasSpokenThisRound = Boolean(p.currentRoundClue);
                  return (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        isCurrentSpeaker
                          ? 'bg-violet-600 text-white border-violet-700 shadow-2xs scale-[1.03]'
                          : hasSpokenThisRound
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-600 border-violet-200'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-80">
                        #{idx + 1}
                      </span>
                      <span>{p.name}</span>
                      {hasSpokenThisRound && !isCurrentSpeaker && (
                        <span className="text-[10px]">✓</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* In-Game Privacy Shield Bar (Default Hidden so Neighbors Cannot Peek) */}
            <InGameRolePrivacyBar
              roleTitle={myUndercoverRoleTitle}
              roleEmoji={
                myPlayer?.role === 'undercover_mrwhite' ? '🎩' : '🕶️'
              }
              secretWordLabel="คำลับประจำตัวของคุณ"
              secretWordValue={myUndercoverSecretValue}
              extraHint="ห้ามพูดคำศัพท์นี้ออกมาตรงๆ ในประโยคคำใบ้เด็ดขาด!"
              accentTheme="violet"
            />

            {/* Speaker Interaction Box */}
            {isMyTurn ? (
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <input
                    type="text"
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendClue();
                    }}
                    placeholder="พิมพ์คำใบ้ของคุณสั้นๆ (ห้ามมีคำลับอยู่ในประโยค)..."
                    className="w-full px-4 py-3 bg-violet-50/40 border border-violet-300 focus:border-violet-500 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendClue}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>ส่งคำใบ้นี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickPassClue}
                    disabled={isLoading}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-amber-700" />
                    <span>พูดใบ้ต่อหน้าเสร็จแล้ว (ส่งเทิร์น)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500 space-y-2">
                <div className="font-bold text-violet-700 animate-pulse">
                  กำลังรอ {currentSpeaker?.name} บอกคำใบ้...
                </div>
                {isHost && (
                  <button
                    type="button"
                    onClick={handleQuickPassClue}
                    className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    โฮสต์กดข้ามเทิร์นให้ผู้เล่นนี้
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Clue History Feed */}
          <div className="bg-white border border-violet-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-600 uppercase tracking-wider">
              <span>
                ประวัติคำใบ้ในห้อง ({currentRoom.undercoverHistory?.length || 0})
              </span>
              <span>หมวด: {currentRoom.undercoverCategoryLabel || 'ทั่วไป'}</span>
            </div>

            {!currentRoom.undercoverHistory ||
            currentRoom.undercoverHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-violet-50/40 rounded-2xl border border-dashed border-violet-200">
                ยังไม่มีใครบอกคำใบ้ในรอบนี้ กำลังรอผู้เล่นคนแรก...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {currentRoom.undercoverHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-violet-50/50 border border-violet-200/70 text-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-violet-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      R{entry.round}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-extrabold text-slate-900">
                        {entry.playerName}
                      </div>
                      <div className="text-violet-800 font-semibold text-sm">
                        &ldquo;{entry.clue}&rdquo;
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PHASE 3: ELIMINATION VOTE OR ROUND ELIMINATION VERDICT */}
      {currentRoom.status === 'undercover_vote' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Privacy Bar also available during vote */}
          <InGameRolePrivacyBar
            roleTitle={myUndercoverRoleTitle}
            roleEmoji={myPlayer?.role === 'undercover_mrwhite' ? '🎩' : '🕶️'}
            secretWordLabel="คำลับประจำตัวของคุณ"
            secretWordValue={myUndercoverSecretValue}
            accentTheme="violet"
          />

          {currentRoom.undercoverRoundVerdictPending ? (
            <UndercoverRoundVerdictCard
              currentRoom={currentRoom}
              players={players}
              isLoading={isLoading}
              onAdvanceNextRound={onAdvanceNextRound}
            />
          ) : (
            <div className="bg-white border border-violet-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-xs font-mono font-bold text-rose-800">
                  <Vote className="w-3.5 h-3.5" />
                  <span>
                    รอบการโหวตคัดคนออก (รอบที่{' '}
                    {currentRoom.undercoverRoundNumber || 1})
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  ใครคือสายลับ Undercover หรือ Mr. White?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  วิเคราะห์คำใบ้ที่ผ่านมาแล้วเลือกโหวตผู้เล่นที่น่าสงสัยที่สุด 1 คน ผู้ที่ได้คะแนนโหวตสูงสุดจะถูกคัดออกจากเกมและเฉลยบทบาททันที
                </p>
              </div>

              {/* Voting Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {alivePlayers.map((p) => {
                  const isSelected = selectedVoteTargetId === p.id;
                  const isMe = p.id === currentUid;
                  const lastClue =
                    p.currentRoundClue ||
                    p.cluesSubmitted?.[p.cluesSubmitted.length - 1];

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isMe}
                      onClick={() => setSelectedVoteTargetId(p.id)}
                      className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-rose-50 border-rose-400 shadow-xs'
                          : isMe
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-violet-50/40 border-violet-200 hover:border-violet-400 hover:bg-violet-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900">
                          {p.name} {isMe && '(คุณ)'}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-extrabold text-rose-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            เลือกแล้ว
                          </span>
                        )}
                      </div>
                      {lastClue && (
                        <div className="text-xs text-violet-700 font-medium italic">
                          คำใบ้ล่าสุด: &ldquo;{lastClue}&rdquo;
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
                  disabled={
                    !selectedVoteTargetId ||
                    isLoading ||
                    Boolean(myPlayer?.voteTargetId)
                  }
                  onClick={() => onSubmitVote(selectedVoteTargetId)}
                  className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    myPlayer?.voteTargetId
                      ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 cursor-default'
                      : selectedVoteTargetId
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm active:scale-[0.98]'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
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
          )}
        </motion.div>
      )}

      {/* PHASE 4: MR. WHITE LAST CHANCE GUESS */}
      {currentRoom.status === 'undercover_mrwhite_guess' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-10 text-center shadow-sm space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-300 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-xs">
              🎯
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-950">
                Mr. White ได้รับโอกาสสุดท้าย!
              </h2>
              <p className="text-xs sm:text-sm text-slate-700">
                ผู้เล่นที่ถูกโหวตออกคือ{' '}
                <span className="font-extrabold text-slate-900">
                  {players.find((p) => p.id === currentRoom.accusedPlayerId)?.name}
                </span>{' '}
                (Mr. White) หากทายคำลับของพลเมืองได้ถูกต้อง Mr. White จะชนะเกมเดี่ยวทันที!
              </p>
            </div>

            {myPlayer?.id === currentRoom.accusedPlayerId ? (
              <div className="max-w-md mx-auto space-y-4 pt-2">
                <input
                  type="text"
                  value={mrWhiteGuessInput}
                  onChange={(e) => setMrWhiteGuessInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')
                      onSubmitMrWhiteGuess(mrWhiteGuessInput);
                  }}
                  placeholder="พิมพ์คำศัพท์ที่คิดว่าเป็นคำของพลเมือง..."
                  className="w-full px-4 py-3.5 bg-white border-2 border-amber-300 focus:border-amber-500 rounded-xl text-slate-900 placeholder-slate-400 text-sm outline-none font-bold"
                />
                <button
                  type="button"
                  disabled={!mrWhiteGuessInput.trim() || isLoading}
                  onClick={() => onSubmitMrWhiteGuess(mrWhiteGuessInput)}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>ทายคำลับนี้เพื่อพลิกชนะ!</span>
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-amber-900 animate-pulse font-bold">
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
          <div className="bg-white border border-violet-200 rounded-3xl p-6 sm:p-10 text-center shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl">
                {currentRoom.winnerTeam === 'civilians'
                  ? '🎉'
                  : currentRoom.winnerTeam === 'undercover'
                  ? '🕶️'
                  : '👑'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentRoom.winnerTeam === 'civilians' &&
                  'ฝ่ายพลเมือง (Civilians) ชนะ!'}
                {currentRoom.winnerTeam === 'undercover' &&
                  'ฝ่ายสายลับ (Undercover) ชนะ!'}
                {currentRoom.winnerTeam === 'mr_white' &&
                  'มิสเตอร์ไวท์ (Mr. White) ชนะเดี่ยว!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
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
              <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 space-y-1">
                <div className="text-xs font-mono font-bold text-violet-700">
                  คำของฝ่ายพลเมือง (Civilian)
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {currentRoom.undercoverCivilianWord || '-'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="text-xs font-mono font-bold text-amber-800">
                  คำของฝ่ายสายลับ (Undercover)
                </div>
                <div className="text-2xl font-black text-amber-950">
                  {currentRoom.undercoverSpyWord || '-'}
                </div>
              </div>
            </div>

            {/* All Players Identity List */}
            <div className="space-y-2 max-w-xl mx-auto text-left pt-2">
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                เฉลยบทบาทผู้เล่นทุกคนในโต๊ะ
              </div>
              <div className="space-y-2">
                {players.map((p) => {
                  const isCiv = p.role === 'undercover_civilian';
                  const isSpy = p.role === 'undercover_spy';

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-violet-50/40 border border-violet-200/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {p.name}
                        </span>
                        {p.id === currentUid && (
                          <span className="text-[10px] text-violet-700 font-bold">
                            (คุณ)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] border ${
                            isCiv
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isSpy
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-amber-100 text-amber-900 border-amber-200'
                          }`}
                        >
                          {isCiv ? 'พลเมือง' : isSpy ? 'สายลับ' : 'Mr. White'}
                        </span>
                        <span className="text-slate-600 text-xs font-bold">
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
                  className="w-full py-3.5 px-6 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
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
