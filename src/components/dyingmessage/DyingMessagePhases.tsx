import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Skull,
  Sparkles,
  ShieldAlert,
  FlaskConical,
  Gavel,
  RotateCcw,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
} from '../../firebase/tableService';
import {
  DYING_MESSAGE_ROLES,
  getDyingMessageCardById,
} from '../../data/dyingMessageCards';
import { DyingMessageMinimalPhonePad } from './DyingMessageMinimalPhonePad';

interface DyingMessagePhasesProps {
  room: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  debateSecondsLeft: number;
  isLoading: boolean;
  onAcknowledgeRole: () => void;
  onSelectVictim: (victimId: string) => void;
  onSubmitVictimRealClue: (cardId: string) => void;
  onSubmitKillerFakeClues: (cardIds: string[]) => void;
  onSubmitDetectiveInspect: (targetId: string) => void;
  onUseDoctorSkill: () => void;
  onStartVoting: () => void;
  onCastVote: (targetId: string) => void;
  onContinueNextNight: () => void;
  onPlayAgain: () => void;
}

export const DyingMessagePhases: React.FC<DyingMessagePhasesProps> = ({
  room,
  players,
  currentUid,
  debateSecondsLeft,
  isLoading,
  onAcknowledgeRole,
  onSelectVictim,
  onSubmitVictimRealClue,
  onSubmitKillerFakeClues,
  onSubmitDetectiveInspect,
  onUseDoctorSkill,
  onStartVoting,
  onCastVote,
  onContinueNextNight,
  onPlayAgain,
}) => {
  const [isPeekingRole, setIsPeekingRole] = useState<boolean>(false);
  const [selectedVictimCard, setSelectedVictimCard] = useState<string>('');
  const [selectedKillerCards, setSelectedKillerCards] = useState<string[]>([]);

  const myPlayer = players.find((p) => p.id === currentUid);
  const myRoleKey = (myPlayer?.role || 'dm_civilian') as keyof typeof DYING_MESSAGE_ROLES;
  const myRoleInfo =
    DYING_MESSAGE_ROLES[myRoleKey] || DYING_MESSAGE_ROLES.dm_civilian;

  const isKiller = myPlayer?.role === 'dm_killer';
  const isDetective = myPlayer?.role === 'dm_detective';
  const isDoctor = myPlayer?.role === 'dm_doctor';
  const isCurrentVictim = room.dmVictimId === currentUid;
  const killerPlayer = players.find((p) => p.id === room.dmKillerId);

  const toggleKillerFakeCard = (cardId: string) => {
    setSelectedKillerCards((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= 2) {
        return [prev[1], cardId];
      }
      return [...prev, cardId];
    });
  };

  // =========================================================================
  // PHASE 1: ROLE DEAL (แอบดูบทบาทลับส่วนตัว)
  // =========================================================================
  if (room.status === 'dm_role_deal') {
    return (
      <div className="max-w-md mx-auto bg-white border-2 border-amber-200 rounded-3xl p-6 text-center space-y-5 shadow-xs">
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold">
            STEP 2 · แจกการ์ดบทบาทลับ
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 pt-1">
            กดค้างเพื่อแอบดูบทบาทของคุณ
          </h3>
          <p className="text-xs text-slate-500">
            ระวังอย่าให้เพื่อนข้างๆ เห็นหน้าจอ เมื่อดูเสร็จแล้วให้กดยืนยันและวางมือถือลง
          </p>
        </div>

        {/* Hold to Peek Role Card */}
        <div
          onMouseDown={() => setIsPeekingRole(true)}
          onMouseUp={() => setIsPeekingRole(false)}
          onMouseLeave={() => setIsPeekingRole(false)}
          onTouchStart={() => setIsPeekingRole(true)}
          onTouchEnd={() => setIsPeekingRole(false)}
          className={`p-6 rounded-3xl border-2 transition-all select-none cursor-pointer ${
            isPeekingRole
              ? `${myRoleInfo.badgeBg} ${myRoleInfo.badgeBorder}`
              : 'bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 border-amber-300'
          }`}
        >
          {isPeekingRole ? (
            <div className="space-y-2.5">
              <div className="text-5xl">{myRoleInfo.emoji}</div>
              <div className={`text-lg font-black ${myRoleInfo.badgeText}`}>
                {myRoleInfo.nameTh}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {myRoleInfo.shortAbility}
              </p>
              {myPlayer?.role === 'dm_accomplice' && room.dmKillerName && (
                <div className="p-2.5 rounded-xl bg-rose-200/80 border border-rose-300 text-rose-950 text-xs font-extrabold">
                  🗡️ ฆาตกรตัวจริงในรอบนี้คือ: {room.dmKillerName}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 space-y-2">
              <Eye className="w-10 h-10 text-amber-600 mx-auto" />
              <div className="text-sm font-extrabold text-amber-950">
                แตะค้างที่นี่เพื่อเปิดดูการ์ดบทบาทลับ
              </div>
              <div className="text-xs text-slate-500">
                (ปล่อยนิ้วเพื่อปิดซ่อนอัตโนมัติ)
              </div>
            </div>
          )}
        </div>

        {myPlayer?.roleAcknowledged ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold">
            ✓ คุณกดพร้อมแล้ว · รอเพื่อนคนอื่นกดยืนยัน ({players.filter((p) => p.roleAcknowledged).length}/{players.length})
          </div>
        ) : (
          <button
            type="button"
            disabled={isLoading}
            onClick={onAcknowledgeRole}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xs cursor-pointer transition-all"
          >
            เข้าใจบทบาทแล้ว · พร้อมเข้าสู่ยามค่ำคืน
          </button>
        )}
      </div>
    );
  }

  // =========================================================================
  // PHASE 2: NIGHT KILL (ฆาตกรเลือกสังหารเหยื่อ)
  // =========================================================================
  if (room.status === 'dm_night_kill') {
    if (!isKiller) {
      return (
        <div className="max-w-md mx-auto bg-gradient-to-b from-indigo-50 via-purple-50 to-white border-2 border-indigo-200 rounded-3xl p-7 text-center space-y-3 shadow-xs">
          <div className="text-4xl">🌙</div>
          <h3 className="text-lg font-black text-indigo-950">
            ยามค่ำคืน — โปรดหลับตา
          </h3>
          <p className="text-xs sm:text-sm text-indigo-800 leading-relaxed">
            ขณะนี้ฆาตกรเงามืดกำลังเลือกเหยื่อผู้เคราะห์ร้าย รอฟังเสียงพากย์จาก Game Master...
          </p>
        </div>
      );
    }

    const validTargets = players.filter(
      (p) =>
        p.id !== currentUid &&
        p.id !== room.dmAccompliceId &&
        p.dmIsAlive !== false
    );

    return (
      <div className="max-w-md mx-auto bg-white border-2 border-rose-300 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="space-y-1 text-center">
          <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-900 text-xs font-extrabold">
            🗡️ ตาของฆาตกรเงามืด
          </span>
          <h3 className="text-lg font-black text-slate-900 pt-1">
            เลือกสังหารเหยื่อ 1 คนในคืนนี้
          </h3>
          <p className="text-xs text-slate-500">
            เหยื่อที่ถูกเลือกจะต้องทิ้งการ์ดเบาะแสมรณะ 1 ใบที่สื่อถึงตัวคุณ!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {validTargets.map((target) => (
            <button
              key={target.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectVictim(target.id)}
              className="p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100 border border-rose-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-extrabold text-amber-950 text-xs overflow-hidden">
                  {target.avatarUrl ? (
                    <img
                      src={target.avatarUrl}
                      alt={target.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    target.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-extrabold text-slate-900">
                  {target.name}
                </span>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-extrabold">
                เลือกสังหาร
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 3: VICTIM & KILLER EVIDENCE SELECTION (ผู้ตายเลือก 1 ใบจริง · ฆาตกรเลือก 2 ใบปลอม)
  // =========================================================================
  if (room.status === 'dm_victim_clue') {
    const victimSubmitted = (myPlayer?.dmSelectedCardIds?.length || 0) >= 1;
    const killerSubmitted = (myPlayer?.dmSelectedCardIds?.length || 0) >= 2;

    if (isCurrentVictim) {
      const candidateIds = myPlayer?.dmCandidateCards || [];
      return (
        <div className="max-w-lg mx-auto bg-white border-2 border-purple-300 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-rose-100 border-2 border-rose-400 flex items-center justify-center font-extrabold text-rose-950 text-sm overflow-hidden shrink-0">
              {killerPlayer?.avatarUrl ? (
                <img
                  src={killerPlayer.avatarUrl}
                  alt={killerPlayer.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                (room.dmKillerName || 'K').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="text-xs font-extrabold text-purple-900 flex items-center gap-1">
                <Skull className="w-3.5 h-3.5" />
                <span>คุณคือผู้ตาย! ฆาตกรที่สังหารคุณคือ:</span>
              </div>
              <div className="text-base sm:text-lg font-black text-rose-700">
                🗡️ {room.dmKillerName}
              </div>
              <div className="text-[11px] text-slate-600">
                เลือกการ์ดเบาะแสจริง 1 ใบที่สื่อถึงตัวจริง เสื้อผ้า ท่าทาง หรืออวตารของ{' '}
                <strong>{room.dmKillerName}</strong> ที่สุด!
              </div>
            </div>
          </div>

          {victimSubmitted ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900 text-xs sm:text-sm font-extrabold">
              ✓ ส่งเบาะแสมรณะเรียบร้อย! รอฆาตกรเลือกหลักฐานปลอมสักครู่...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {candidateIds.map((cId) => {
                  const card = getDyingMessageCardById(cId);
                  if (!card) return null;
                  const isPicked = selectedVictimCard === cId;
                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => setSelectedVictimCard(cId)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isPicked
                          ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300'
                          : `${card.pastelBg} ${card.pastelBorder}`
                      }`}
                    >
                      <span className="text-2xl shrink-0">{card.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900">
                          {card.titleTh}
                        </div>
                        <div className="text-[11px] text-slate-600 leading-snug">
                          {card.subtitleTh}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!selectedVictimCard || isLoading}
                onClick={() => onSubmitVictimRealClue(selectedVictimCard)}
                className="w-full py-3.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-sm cursor-pointer transition-all"
              >
                ยืนยันส่งการ์ดเบาะแสมรณะใบนี้ (1 ใบ)
              </button>
            </>
          )}
        </div>
      );
    }

    if (isKiller) {
      const candidateIds = myPlayer?.dmCandidateCards || [];
      return (
        <div className="max-w-lg mx-auto bg-white border-2 border-rose-300 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="space-y-1 text-center">
            <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-900 text-xs font-extrabold">
              🗡️ สร้างหลักฐานเท็จตบตาชาวบ้าน
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 pt-1">
              เลือกการ์ดเบาะแสปลอม 2 ใบ ({selectedKillerCards.length}/2)
            </h3>
            <p className="text-xs text-slate-500">
              เลือกการ์ดที่ชี้เป้าไปหาเพื่อนคนอื่นในวง เพื่อเบี่ยงประเด็นไม่ให้คนสงสัยคุณ!
            </p>
          </div>

          {killerSubmitted ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900 text-xs sm:text-sm font-extrabold">
              ✓ ใส่การ์ดหลักฐานปลอมครบ 2 ใบแล้ว! รอผู้ตายเลือกการ์ดสักครู่...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {candidateIds.map((cId) => {
                  const card = getDyingMessageCardById(cId);
                  if (!card) return null;
                  const isPicked = selectedKillerCards.includes(cId);
                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => toggleKillerFakeCard(cId)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isPicked
                          ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-300'
                          : `${card.pastelBg} ${card.pastelBorder}`
                      }`}
                    >
                      <span className="text-2xl shrink-0">{card.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900">
                          {card.titleTh}
                        </div>
                        <div className="text-[11px] text-slate-600 leading-snug">
                          {card.subtitleTh}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={selectedKillerCards.length !== 2 || isLoading}
                onClick={() => onSubmitKillerFakeClues(selectedKillerCards)}
                className="w-full py-3.5 px-5 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold text-sm cursor-pointer transition-all"
              >
                ยืนยันส่งการ์ดเบาะแสปลอม 2 ใบ
              </button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto bg-gradient-to-b from-indigo-50 via-purple-50 to-white border-2 border-indigo-200 rounded-3xl p-7 text-center space-y-3 shadow-xs">
        <div className="text-4xl">🕯️</div>
        <h3 className="text-lg font-black text-indigo-950">
          ผู้ตายกำลังทิ้งเบาะแสมรณะ...
        </h3>
        <p className="text-xs sm:text-sm text-indigo-800 leading-relaxed">
          โปรดหลับตารอสักครู่ ระบบกำลังรวบรวมการ์ดเบาะแสจริง 1 ใบ และการ์ดปลอม 2 ใบขึ้นสู่กระดานกลาง
        </p>
      </div>
    );
  }

  // =========================================================================
  // PHASE 4: SPECIAL ROLES NIGHT (ตำรวจสายสืบส่องผู้ต้องสงสัย)
  // =========================================================================
  if (room.status === 'dm_special_roles') {
    if (!isDetective || myPlayer?.dmIsAlive === false) {
      return (
        <div className="max-w-md mx-auto bg-gradient-to-b from-sky-50 via-indigo-50 to-white border-2 border-sky-200 rounded-3xl p-7 text-center space-y-3 shadow-xs">
          <div className="text-4xl">🕵️</div>
          <h3 className="text-lg font-black text-sky-950">
            ตำรวจสายสืบกำลังตรวจสอบประวัติลับ...
          </h3>
          <p className="text-xs sm:text-sm text-sky-800 leading-relaxed">
            อีกอึดใจเดียวจะเข้าสู่เช้าวันใหม่เพื่อเปิดการ์ดหลักฐานทั้ง 3 ใบ!
          </p>
        </div>
      );
    }

    const inspectTargets = players.filter(
      (p) => p.id !== currentUid && p.dmIsAlive !== false
    );

    return (
      <div className="max-w-md mx-auto bg-white border-2 border-sky-300 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="space-y-1 text-center">
          <span className="px-3 py-1 rounded-xl bg-sky-100 text-sky-900 text-xs font-extrabold">
            🕵️ สกิลตำรวจสายสืบ
          </span>
          <h3 className="text-lg font-black text-slate-900 pt-1">
            เลือกตรวจสอบผู้ต้องสงสัย 1 คน
          </h3>
          <p className="text-xs text-slate-500">
            ผลตรวจจะถูกบันทึกไว้ในปุ่มแอบดูส่วนตัวบนมือถือของคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {inspectTargets.map((suspect) => (
            <button
              key={suspect.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSubmitDetectiveInspect(suspect.id)}
              className="p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 flex items-center justify-between gap-3 cursor-pointer"
            >
              <span className="text-sm font-extrabold text-slate-900">
                {suspect.name}
              </span>
              <span className="px-3 py-1 rounded-xl bg-sky-600 text-white text-xs font-extrabold">
                ส่องประวัติ
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 5+: DAYLIGHT / VOTING / VERDICT / GAME OVER
  // CRITICAL REQUIREMENT: If iPad Central Board is connected (room.dmIpadConnected),
  // DO NOT duplicate the evidence cards or board UI on the phone! Render Minimal Pad.
  // =========================================================================
  if (room.dmIpadConnected) {
    return (
      <DyingMessageMinimalPhonePad
        room={room}
        players={players}
        myPlayer={myPlayer}
        isLoading={isLoading}
        onUseDoctorSkill={onUseDoctorSkill}
        onStartVoting={onStartVoting}
        onCastVote={onCastVote}
        onContinueNextNight={onContinueNextNight}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  // =========================================================================
  // STANDALONE PHONE FALLBACK (Only shown when NO iPad Central Board is connected)
  // =========================================================================
  const evidenceRounds = room.dmEvidenceRounds || [];
  const isGameOver = room.status === 'dm_game_over';
  const isVoting = room.status === 'dm_voting';
  const isRoundVerdict = room.status === 'dm_round_verdict';
  const isDayDiscussion = room.status === 'dm_day_discussion';

  const canUseDoctorSkill =
    isDayDiscussion &&
    myPlayer?.dmIsAlive !== false &&
    isDoctor &&
    !room.dmDoctorSkillUsed;

  return (
    <div className="space-y-5">
      {/* Status & Timer Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 font-mono text-sm font-black tabular-nums flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>
              {Math.floor(debateSecondsLeft / 60)}:
              {debateSecondsLeft % 60 < 10 ? '0' : ''}
              {debateSecondsLeft % 60}
            </span>
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              {isDayDiscussion
                ? 'ช่วงสืบสวนเบาะแสมรณะ'
                : isVoting
                ? 'โหวตชี้ตัวฆาตกร!'
                : isRoundVerdict
                ? `โหวตผิดคน! (${room.dmLastEliminatedName} เป็นผู้บริสุทธิ์)`
                : room.winnerTeam === 'dm_civilians'
                ? `🎉 จับฆาตกร (${room.dmKillerName}) สำเร็จ!`
                : `🗡️ ฆาตกร (${room.dmKillerName}) ลอยนวลสำเร็จ!`}
            </div>
            <div className="text-xs text-slate-500">
              (หากต้องการซ่อนกระดานจากมือถือ ให้เปิดโหมดจอ iPad กลางโต๊ะที่แถบด้านบน)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canUseDoctorSkill && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onUseDoctorSkill}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>ใช้สกิลหมอตัดการ์ดปลอม 1 ใบ</span>
            </button>
          )}

          {myPlayer?.isHost && isDayDiscussion && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onStartVoting}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>เริ่มโหวต</span>
            </button>
          )}

          {myPlayer?.isHost && isRoundVerdict && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onContinueNextNight}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <span>คืนถัดไป</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {myPlayer?.isHost && isGameOver && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onPlayAgain}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>เล่นอีกครั้ง</span>
            </button>
          )}
        </div>
      </div>

      {/* Evidence Cards */}
      {evidenceRounds.map((evRound) => (
        <div
          key={evRound.roundNumber}
          className="p-4 sm:p-5 rounded-3xl bg-white border border-amber-200 space-y-3 shadow-xs"
        >
          <div className="text-xs font-extrabold text-purple-900">
            👻 เบาะแสมรณะคืนที่ {evRound.roundNumber} จากผู้ตาย: {evRound.victimName}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {evRound.cardIds.map((cardId) => {
              const card = getDyingMessageCardById(cardId);
              if (!card) return null;
              const isEliminated = evRound.eliminatedFakeCardId === cardId;
              const isRealRevealed =
                isGameOver && evRound.realCardId === cardId;
              return (
                <div
                  key={cardId}
                  className={`p-4 rounded-2xl border-2 ${
                    isEliminated
                      ? 'bg-slate-100 border-slate-300 opacity-55'
                      : isRealRevealed
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                      : `${card.pastelBg} ${card.pastelBorder}`
                  }`}
                >
                  <div className="text-3xl mb-1">{card.emoji}</div>
                  <div className="text-sm font-black text-slate-900">
                    {card.titleTh}
                  </div>
                  <div className="text-xs text-slate-600">{card.subtitleTh}</div>
                  {isEliminated && (
                    <div className="mt-2 text-[11px] font-extrabold text-rose-700">
                      ✗ หมอชันสูตรตัดหลักฐานเท็จใบนี้แล้ว
                    </div>
                  )}
                  {isRealRevealed && (
                    <div className="mt-2 text-[11px] font-extrabold text-amber-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>เบาะแสจริงของผู้ตาย!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Voting / Suspects Grid in Standalone Phone Mode */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-200 space-y-3 shadow-xs">
        <div className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>ผู้ต้องสงสัยในวง</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {players.map((p) => {
            const isAlive = p.dmIsAlive !== false;
            const isVoted = myPlayer?.voteTargetId === p.id;
            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 ${
                  !isAlive
                    ? 'bg-purple-50/60 border-purple-200 opacity-75'
                    : 'bg-sky-50/40 border-sky-200'
                }`}
              >
                <div className="text-xs font-extrabold text-slate-900 truncate">
                  {p.name} {!isAlive && '(ผู้ตาย)'}
                </div>
                {isVoting &&
                  isAlive &&
                  myPlayer?.dmIsAlive !== false &&
                  p.id !== currentUid && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => onCastVote(p.id)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1 ${
                        isVoted
                          ? 'bg-rose-500 text-white'
                          : 'bg-white border border-rose-200 text-rose-800 hover:bg-rose-50'
                      }`}
                    >
                      {isVoted && <CheckCircle2 className="w-3 h-3" />}
                      <span>{isVoted ? 'โหวตแล้ว' : 'โหวตคนนี้'}</span>
                    </button>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
