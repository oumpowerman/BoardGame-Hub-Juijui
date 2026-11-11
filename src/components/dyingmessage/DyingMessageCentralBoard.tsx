import React from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
} from '../../firebase/tableService';
import {
  getDyingMessageCardById,
  DYING_MESSAGE_ROLES,
} from '../../data/dyingMessageCards';

interface DyingMessageCentralBoardProps {
  room: FirestoreRoom;
  players: FirestorePlayer[];
  isVoiceEnabled: boolean;
  debateSecondsLeft: number;
  isLoading: boolean;
  onToggleVoice: () => void;
  onSwitchToPhoneView: () => void;
  onOpenShareModal: () => void;
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
  onStartVoting,
  onResolveAccusationOnBoard,
  onContinueNextNight,
  onPlayAgain,
}) => {
  const roundNumber = room.dmRoundNumber || 1;
  const evidenceRounds = room.dmEvidenceRounds || [];
  const isGameOver = room.status === 'dm_game_over';
  const isVoting = room.status === 'dm_voting';
  const isRoundVerdict = room.status === 'dm_round_verdict';
  const isDayDiscussion = room.status === 'dm_day_discussion';

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
    <div className="w-full rounded-3xl bg-gradient-to-b from-sky-50 via-[#FFFDF9] to-rose-50/70 text-slate-900 border-2 border-sky-300 shadow-xl overflow-hidden p-4 sm:p-7 space-y-6">
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

                  {/* 3 Large Tabletop Evidence Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {evRound.cardIds.map((cardId, idx) => {
                      const card = getDyingMessageCardById(cardId);
                      const isEliminatedFake =
                        evRound.eliminatedFakeCardId === cardId;
                      const isRealTruthRevealed =
                        isGameOver && evRound.realCardId === cardId;

                      if (!card) return null;

                      return (
                        <motion.div
                          key={cardId}
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.22, delay: idx * 0.08 }}
                          className={`relative rounded-3xl p-5 border-2 transition-all flex flex-col justify-between min-h-[170px] ${
                            isEliminatedFake
                              ? 'bg-slate-100 border-slate-300 opacity-60'
                              : isRealTruthRevealed
                              ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/60 shadow-md'
                              : `${card.pastelBg} ${card.pastelBorder} shadow-xs`
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-4xl sm:text-5xl select-none">
                              {card.emoji}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-500">
                              หลักฐานชิ้นที่ #{idx + 1} · {card.categoryLabel}
                            </span>
                          </div>

                          <div className="space-y-1.5 mt-3">
                            <h4
                              className={`text-lg sm:text-xl font-black ${card.pastelText}`}
                            >
                              {card.titleTh}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                              {card.subtitleTh}
                            </p>
                          </div>

                          {/* Stamp when Forensic Doctor eliminates this fake card */}
                          {isEliminatedFake && (
                            <div className="mt-3 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold text-center shadow-xs">
                              ✗ หมอชันสูตรยืนยัน: ใบนี้คือหลักฐานปลอม!
                            </div>
                          )}

                          {/* Game Over Truth Badge */}
                          {isRealTruthRevealed && (
                            <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-400 text-amber-950 text-xs font-black text-center shadow-xs flex items-center justify-center gap-1.5">
                              <Sparkles className="w-4 h-4" />
                              <span>เบาะแสจริงที่ผู้ตายเลือก!</span>
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
    </div>
  );
};
