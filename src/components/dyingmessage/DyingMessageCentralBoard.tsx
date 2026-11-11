import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Tablet,
  Smartphone,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  QrCode,
  ShieldAlert,
  Gavel,
  ArrowRight,
  Skull,
  Maximize2,
  Minimize2,
  Check,
  X,
  ZoomIn,
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
} from '../../firebase/tableService';
import {
  getDyingMessageCardById,
  DYING_MESSAGE_ROLES,
} from '../../data/dyingMessageCards';
import { tableAudio } from '../../utils/tableAudio';

interface DyingMessageCentralBoardProps {
  room: FirestoreRoom;
  players: FirestorePlayer[];
  isVoiceEnabled: boolean;
  debateSecondsLeft: number;
  isLoading: boolean;
  onToggleVoice: () => void;
  onSwitchToPhoneView: () => void;
  onOpenShareModal: () => void;
  onStartGameFromBoard?: () => void;
  onForceAcknowledgeRoles?: () => void;
  onStartVoting: () => void;
  onResolveAccusationOnBoard: (suspectId: string) => void;
  onContinueNextNight: () => void;
  onPlayAgain: () => void;
}

export const DyingMessageCentralBoard: React.FC<
  DyingMessageCentralBoardProps
> = ({
  room,
  players,
  isVoiceEnabled,
  debateSecondsLeft,
  isLoading,
  onToggleVoice,
  onSwitchToPhoneView,
  onOpenShareModal,
  onStartGameFromBoard,
  onForceAcknowledgeRoles,
  onStartVoting,
  onResolveAccusationOnBoard,
  onContinueNextNight,
  onPlayAgain,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [inspectedCardId, setInspectedCardId] = useState<string | null>(null);
  const [inspectedRoundNumber, setInspectedRoundNumber] = useState<number>(1);
  const [cardTags, setCardTags] = useState<
    Record<string, 'likely_real' | 'likely_fake' | null>
  >({});

  const roundNumber = room.dmRoundNumber || 1;
  const evidenceRounds = room.dmEvidenceRounds || [];
  const isGameOver = room.status === 'dm_game_over';
  const isVoting = room.status === 'dm_voting';
  const isRoundVerdict = room.status === 'dm_round_verdict';
  const isDayDiscussion = room.status === 'dm_day_discussion';

  // Listen to browser fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const el = containerRef.current || document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
          (el as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
          (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  const handleTagCard = (
    cardId: string,
    tag: 'likely_real' | 'likely_fake' | null,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    tableAudio.playCardFlip();
    setCardTags((prev) => ({
      ...prev,
      [cardId]: prev[cardId] === tag ? null : tag,
    }));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Count votes per player during voting phase
  const voteCounts: Record<string, number> = {};
  for (const p of players) {
    if (p.dmIsAlive !== false && p.voteTargetId) {
      voteCounts[p.voteTargetId] = (voteCounts[p.voteTargetId] || 0) + 1;
    }
  }

  return (
    <div
      ref={containerRef}
      className={`w-full transition-all text-slate-900 overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen overflow-y-auto bg-gradient-to-b from-sky-50 via-[#FFFDF9] to-rose-50/80 p-4 sm:p-8 space-y-6'
          : 'rounded-3xl bg-gradient-to-b from-sky-50 via-[#FFFDF9] to-rose-50/70 border-2 border-sky-300 shadow-xl p-4 sm:p-7 space-y-6'
      }`}
    >
      {/* 1. Top iPad Tabletop Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sky-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
            🔎
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-extrabold text-sky-800 uppercase tracking-wider">
                iPad CENTRAL EVIDENCE BOARD · โต๊ะ #{room.roomCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 font-mono text-xs font-extrabold">
                คืนที่ {roundNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-extrabold">
                ซ่อนข้อมูลซ้ำบนมือถือแล้ว
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {room.roomName || `กระดานสืบคดีเบาะแสมรณะของ ${room.hostName}`}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
              isFullscreen
                ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                : 'bg-white hover:bg-sky-50 border-sky-200 text-sky-900 shadow-2xs'
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>ย่อจอปกติ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-sky-600" />
                <span>ขยายเต็มจอ iPad</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-sky-600" />
            <span>QR เข้าโต๊ะ</span>
          </button>

          <button
            type="button"
            onClick={onToggleVoice}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
              isVoiceEnabled
                ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {isVoiceEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-700" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span>{isVoiceEnabled ? 'เสียง GM: เปิด' : 'เสียง GM: ปิด'}</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToPhoneView}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>สลับกลับจอมือถือผู้เล่น</span>
          </button>
        </div>
      </div>

      {/* 2. Active Phase Status Callout on Central Board */}
      {room.status === 'lobby' && (
        <div className="p-6 rounded-3xl bg-white border-2 border-sky-200 text-center space-y-4 shadow-xs">
          <div className="text-4xl">📲</div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            กระดานกลาง iPad เชื่อมต่อแล้ว! รอผู้เล่นเข้าโต๊ะ #{room.roomCode}
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            ขณะนี้มีผู้เล่นในวง {players.length} คน (เครื่อง iPad นี้จะไม่ถูกนับเป็นผู้เล่น) เมื่อพร้อมแล้วสามารถกดเริ่มเกมจากมือถือโฮสต์ หรือกดปุ่มด้านล่างได้เลย
          </p>
          {onStartGameFromBoard && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onStartGameFromBoard}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm shadow-sm cursor-pointer transition-all"
            >
              <span>▶ เริ่มเกมเบาะแสมรณะทันที ({players.length} คน)</span>
            </button>
          )}
        </div>
      )}

      {room.status === 'dm_role_deal' && (
        <div className="p-6 rounded-3xl bg-white border-2 border-amber-200 text-center space-y-3 shadow-xs">
          <div className="text-3xl">🃏</div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            กำลังแจกบทบาทลับให้ผู้เล่นทุกคน...
          </h3>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            ให้ทุกคนกดค้างดูบทบาทของตัวเองในมือถือ แล้วกดปุ่ม{' '}
            <strong>&ldquo;เข้าใจบทบาทแล้ว&rdquo;</strong> จากนั้นวางมือถือลงบนโต๊ะ
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {players.map((p) => (
              <span
                key={p.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                  p.roleAcknowledged
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {p.name}: {p.roleAcknowledged ? '✓ พร้อมแล้ว' : 'กำลังดูบทบาท...'}
              </span>
            ))}
          </div>
          {onForceAcknowledgeRoles && players.some((p) => !p.roleAcknowledged) && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onForceAcknowledgeRoles}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold transition-colors cursor-pointer"
              >
                <span>⚡ บังคับข้ามคนที่ค้าง → เข้าสู่ยามค่ำคืนทันที</span>
              </button>
            </div>
          )}
        </div>
      )}

      {(room.status === 'dm_night_kill' ||
        room.status === 'dm_victim_clue' ||
        room.status === 'dm_special_roles') && (
        <div className="p-7 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-sky-50 border-2 border-indigo-200 text-center space-y-3 shadow-xs">
          <div className="text-4xl">🌙</div>
          <h3 className="text-xl sm:text-2xl font-black text-indigo-950">
            {room.status === 'dm_night_kill'
              ? 'ยามค่ำคืน — ฆาตกรกำลังเลือกเหยื่อ...'
              : room.status === 'dm_victim_clue'
              ? `ผู้ตาย (${room.dmVictimName || 'ปริศนา'}) กำลังทิ้งเบาะแสมรณะ และฆาตกรกำลังใส่หลักฐานปลอม...`
              : 'ตำรวจสายสืบกำลังตรวจสอบประวัติผู้ต้องสงสัย...'}
          </h3>
          <p className="text-sm sm:text-base text-indigo-800 max-w-xl mx-auto">
            ผู้ที่ไม่มีบทบาทในจังหวะนี้ โปรดหลับตาและรอฟังเสียงประกาศเช้าวันใหม่จากจอ iPad นี้
          </p>
        </div>
      )}

      {/* 3. CENTRAL EVIDENCE CARDS TABLE (Displayed prominently for Day Discussion, Voting, Verdict, Game Over) */}
      {evidenceRounds.length > 0 &&
        (isDayDiscussion || isVoting || isRoundVerdict || isGameOver) && (
          <div className="space-y-5">
            {/* Timer & Action Bar for Daylight Investigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-sky-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 font-mono text-lg sm:text-xl font-black tabular-nums flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-600" />
                  <span>{formatTime(debateSecondsLeft)}</span>
                </div>
                <div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    {isDayDiscussion
                      ? 'ช่วงสืบสวนกลางโต๊ะ — วิเคราะห์การ์ดเบาะแสมรณะทั้ง 3 ใบ!'
                      : isVoting
                      ? 'ช่วงชี้ตัวคนร้าย — แตะที่ชื่อผู้ต้องสงสัยบนจอ iPad นี้เพื่อตัดสินโหวตได้เลย!'
                      : isRoundVerdict
                      ? `ผลโหวตรอบที่ ${roundNumber}: โหวตผิดคน! (${room.dmLastEliminatedName} เป็นผู้บริสุทธิ์)`
                      : room.winnerTeam === 'dm_civilians'
                      ? `🎉 ปิดคดีสำเร็จ! จับฆาตกรตัวจริง (${room.dmKillerName}) ได้แล้ว!`
                      : `🗡️ คดีพลิก! ฆาตกรตัวจริงคือ ${room.dmKillerName} ลอยนวลสำเร็จ!`}
                  </div>
                  <div className="text-xs text-slate-600">
                    มีเพียง 1 ใบเท่านั้นที่เป็นเบาะแสจริงจากผู้ตาย (เชื่อมโยงกับตัวจริงหรืออวตารของฆาตกร) ส่วนอีก 2 ใบเป็นของปลอม!
                  </div>
                </div>
              </div>

              {isDayDiscussion && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onStartVoting}
                  className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Gavel className="w-4 h-4" />
                  <span>เริ่มโหวตชี้ตัวคนร้าย</span>
                </button>
              )}

              {isRoundVerdict && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onContinueNextNight}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>เข้าสู่คืนถัดไป (ผู้ตายคนใหม่ทิ้งเบาะแสเพิ่ม)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {isGameOver && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onPlayAgain}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เปิดคดีใหม่ (เล่นอีกครั้ง)</span>
                </button>
              )}
            </div>

            {/* Evidence Cards Rows by Night */}
            <div className="space-y-4">
              {evidenceRounds.map((evRound) => (
                <div
                  key={evRound.roundNumber}
                  className="p-5 rounded-3xl bg-white/95 border-2 border-amber-200/90 space-y-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-xl bg-purple-100 border border-purple-300 text-purple-950 text-xs font-extrabold flex items-center gap-1.5">
                        <Skull className="w-3.5 h-3.5 text-purple-700" />
                        <span>
                          เบาะแสมรณะคืนที่ {evRound.roundNumber} จากผู้ตาย:{' '}
                          {evRound.victimName}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        (ห้าม {evRound.victimName} พูดใบ้เพิ่มเติมเด็ดขาด!)
                      </span>
                    </div>

                    {evRound.eliminatedFakeCardId && (
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold">
                        🧪 หมอชันสูตรตัดหลักฐานเท็จออกให้แล้ว 1 ใบ!
                      </span>
                    )}
                  </div>

                  {/* 3 Large Tabletop Evidence Cards (Interactive with Tap to Inspect & Deduction Tags) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {evRound.cardIds.map((cardId, idx) => {
                      const card = getDyingMessageCardById(cardId);
                      const isEliminatedFake =
                        evRound.eliminatedFakeCardId === cardId;
                      const isRealTruthRevealed =
                        isGameOver && evRound.realCardId === cardId;
                      const currentTag = cardTags[cardId];

                      if (!card) return null;

                      return (
                        <motion.div
                          key={cardId}
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          whileHover={{ scale: 1.025, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.22, delay: idx * 0.08 }}
                          onClick={() => {
                            setInspectedCardId(cardId);
                            setInspectedRoundNumber(evRound.roundNumber);
                            tableAudio.playCardFlip();
                          }}
                          className={`relative rounded-3xl p-5 border-2 transition-all flex flex-col justify-between min-h-[200px] cursor-pointer group select-none ${
                            isEliminatedFake
                              ? 'bg-slate-100 border-slate-300 opacity-60'
                              : isRealTruthRevealed
                              ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/60 shadow-md'
                              : currentTag === 'likely_real'
                              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300/70 shadow-sm'
                              : currentTag === 'likely_fake'
                              ? 'bg-rose-50/70 border-rose-300 opacity-75 shadow-2xs'
                              : `${card.pastelBg} ${card.pastelBorder} shadow-xs hover:shadow-md`
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-4xl sm:text-5xl select-none group-hover:scale-110 transition-transform">
                              {card.emoji}
                            </span>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[11px] font-mono font-bold text-slate-500">
                                #{idx + 1} · {card.categoryLabel}
                              </span>
                              {currentTag === 'likely_real' && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] shadow-xs flex items-center gap-0.5 animate-bounce">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>น่าจะจริง!</span>
                                </span>
                              )}
                              {currentTag === 'likely_fake' && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] shadow-xs flex items-center gap-0.5">
                                  <X className="w-2.5 h-2.5" />
                                  <span>น่าจะปลอม!</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 mt-2">
                            <h4
                              className={`text-lg sm:text-xl font-black ${
                                currentTag === 'likely_fake'
                                  ? 'text-slate-500 line-through'
                                  : card.pastelText
                              }`}
                            >
                              {card.titleTh}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                              {card.subtitleTh}
                            </p>
                          </div>

                          {/* Stamp when Forensic Doctor eliminates this fake card */}
                          {isEliminatedFake && (
                            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold text-center shadow-xs">
                              ✗ หมอชันสูตรยืนยัน: ใบนี้คือหลักฐานปลอม!
                            </div>
                          )}

                          {/* Game Over Truth Badge */}
                          {isRealTruthRevealed && (
                            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-400 text-amber-950 text-xs font-black text-center shadow-xs flex items-center justify-center gap-1.5">
                              <Sparkles className="w-4 h-4" />
                              <span>เบาะแสจริงที่ผู้ตายเลือก!</span>
                            </div>
                          )}

                          {/* Tabletop Interactive Deduction Buttons */}
                          {!isEliminatedFake && !isGameOver && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 mt-3">
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleTagCard(cardId, 'likely_real', e)
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                  currentTag === 'likely_real'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                }`}
                                title="ปักป้ายว่าการ์ดใบนี้น่าจะจริง"
                              >
                                <Check className="w-3 h-3" />
                                <span>จริง</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleTagCard(cardId, 'likely_fake', e)
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                  currentTag === 'likely_fake'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-100 hover:bg-rose-200 text-rose-900'
                                }`}
                                title="ปักป้ายว่าการ์ดใบนี้น่าจะปลอม"
                              >
                                <X className="w-3 h-3" />
                                <span>ปลอม</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectedCardId(cardId);
                                  setInspectedRoundNumber(evRound.roundNumber);
                                  tableAudio.playCardFlip();
                                }}
                                className="ml-auto px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                title="แตะส่องแว่นขยายดูหลักฐานแบบละเอียด"
                              >
                                <ZoomIn className="w-3.5 h-3.5 text-sky-600" />
                                <span>ส่อง</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* 4. Suspect Circle & Direct Finger-Pointing Vote Controls on iPad */}
      <div className="p-5 rounded-3xl bg-white border border-sky-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>
                รายชื่อผู้เล่นในวง ({players.filter((p) => p.dmIsAlive !== false).length}{' '}
                คนมีชีวิต · {players.filter((p) => p.dmIsAlive === false).length}{' '}
                วิญญาณพยาน)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isVoting
                ? 'นับ 3-2-1 ชี้โหวตผู้ต้องสงสัยในวงจริง แล้วแตะปุ่ม "ตัดสินโหวตคนนี้" บนจอ iPad ได้เลย!'
                : 'สังเกตเสื้อผ้า ท่าทาง และอวตารของคนที่ยังมีชีวิตอยู่เพื่อหาว่าใครตรงกับเบาะแสจริง'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map((p) => {
            const isAlive = p.dmIsAlive !== false;
            const votesOnPlayer = voteCounts[p.id] || 0;
            const roleInfo = p.role ? DYING_MESSAGE_ROLES[p.role as keyof typeof DYING_MESSAGE_ROLES] : null;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2.5 ${
                  !isAlive
                    ? 'bg-purple-50/70 border-purple-200 opacity-85'
                    : isGameOver && p.id === room.dmKillerId
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
                    : 'bg-sky-50/50 border-sky-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-extrabold text-amber-950 text-sm overflow-hidden shrink-0">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      p.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs font-bold">
                      {!isAlive ? (
                        <span className="text-purple-700">👻 วิญญาณผู้ตาย (ห้ามใบ้)</span>
                      ) : (
                        <span className="text-emerald-700">ผู้ต้องสงสัย</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reveal Role on Game Over */}
                {isGameOver && roleInfo && (
                  <div
                    className={`px-2.5 py-1 rounded-xl border text-xs font-extrabold text-center ${roleInfo.badgeBg} ${roleInfo.badgeBorder} ${roleInfo.badgeText}`}
                  >
                    {roleInfo.emoji} {roleInfo.nameTh}
                  </div>
                )}

                {/* Vote count & Direct iPad Tap-to-Accuse button during Voting */}
                {isVoting && isAlive && (
                  <div className="space-y-1.5 pt-1 border-t border-sky-200/70">
                    {votesOnPlayer > 0 && (
                      <div className="text-xs font-extrabold text-rose-700 text-center">
                        โหวตจากมือถือ: {votesOnPlayer} เสียง
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => onResolveAccusationOnBoard(p.id)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ชี้โหวตคนนี้</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Interactive Evidence Magnifying Glass Spotlight Modal (Pop-up on iPad) */}
      <AnimatePresence>
        {inspectedCardId && (() => {
          const inspectedCard = getDyingMessageCardById(inspectedCardId);
          if (!inspectedCard) return null;
          const currentRoundEvidence = evidenceRounds.find(
            (r) => r.roundNumber === inspectedRoundNumber
          );
          const currentRoundCardIds = currentRoundEvidence?.cardIds || [];
          const currentCardIndex = currentRoundCardIds.indexOf(inspectedCardId);
          const currentTag = cardTags[inspectedCardId];

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectedCardId(null)}
              className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-xl w-full rounded-3xl p-6 sm:p-8 border-4 shadow-2xl relative flex flex-col justify-between gap-5 bg-white ${inspectedCard.pastelBorder}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-sky-700 uppercase">
                        แว่นขยายส่องหลักฐาน · คืนที่ {inspectedRoundNumber} (ชิ้นที่ {currentCardIndex + 1}/{currentRoundCardIds.length})
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        หมวดหมู่: {inspectedCard.categoryLabel}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectedCardId(null)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Card Center Visual */}
                <div
                  className={`p-6 sm:p-7 rounded-3xl border-2 text-center space-y-4 shadow-inner relative overflow-hidden ${inspectedCard.pastelBg} ${inspectedCard.pastelBorder}`}
                >
                  {/* Subtle Background Spotlight Glow */}
                  <div className="absolute inset-0 bg-radial from-white/70 via-transparent to-transparent pointer-events-none" />

                  <div className="text-7xl sm:text-8xl select-none filter drop-shadow-md animate-pulse">
                    {inspectedCard.emoji}
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    <h4
                      className={`text-2xl sm:text-3xl font-black ${
                        currentTag === 'likely_fake'
                          ? 'text-slate-400 line-through'
                          : inspectedCard.pastelText
                      }`}
                    >
                      {inspectedCard.titleTh}
                    </h4>
                    <p className="text-sm sm:text-base text-slate-700 font-semibold max-w-md mx-auto leading-relaxed">
                      {inspectedCard.subtitleTh}
                    </p>
                  </div>
                </div>

                {/* Detective Deduction Tip Box */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>วิธีวิเคราะห์เบาะแสมรณะนี้:</span>
                  </div>
                  <p className="leading-relaxed">
                    สังเกตผู้ต้องสงสัยที่ยังมีชีวิตอยู่ว่าใครมีลักษณะสอดคล้องกับ &ldquo;{inspectedCard.titleTh}&rdquo; (เช่น สีเสื้อ, เครื่องประดับ, ทรงผม, แว่นตา, หรือรูปโปรไฟล์) โดยผู้ตายเลือกชี้ใบนี้ก่อนหมดสติ!
                  </p>
                </div>

                {/* Card Navigation & Tagging Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  {/* Previous / Next Card in this round */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentCardIndex <= 0}
                      onClick={() => {
                        if (currentCardIndex > 0) {
                          setInspectedCardId(currentRoundCardIds[currentCardIndex - 1]);
                          tableAudio.playCardFlip();
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>ใบก่อน</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentCardIndex >= currentRoundCardIds.length - 1}
                      onClick={() => {
                        if (currentCardIndex < currentRoundCardIds.length - 1) {
                          setInspectedCardId(currentRoundCardIds[currentCardIndex + 1]);
                          tableAudio.playCardFlip();
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>ใบถัดไป</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tagging Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleTagCard(inspectedCard.id, 'likely_real', e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                        currentTag === 'likely_real'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>น่าจะจริง!</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleTagCard(inspectedCard.id, 'likely_fake', e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                        currentTag === 'likely_fake'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-100 hover:bg-rose-200 text-rose-900'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>น่าจะปลอม!</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectedCardId(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer shadow-xs"
                  >
                    ปิดแว่นขยาย
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
