import React, { useState } from 'react';
import {
  Tablet,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  FlaskConical,
  Gavel,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
} from '../../firebase/tableService';
import { DYING_MESSAGE_ROLES } from '../../data/dyingMessageCards';

interface DyingMessageMinimalPhonePadProps {
  room: FirestoreRoom;
  players: FirestorePlayer[];
  myPlayer: FirestorePlayer | undefined;
  isLoading: boolean;
  onUseDoctorSkill: () => void;
  onStartVoting: () => void;
  onCastVote: (targetId: string) => void;
  onContinueNextNight: () => void;
  onPlayAgain: () => void;
}

export const DyingMessageMinimalPhonePad: React.FC<
  DyingMessageMinimalPhonePadProps
> = ({
  room,
  players,
  myPlayer,
  isLoading,
  onUseDoctorSkill,
  onStartVoting,
  onCastVote,
  onContinueNextNight,
  onPlayAgain,
}) => {
  const [isPeekingSecret, setIsPeekingSecret] = useState<boolean>(false);

  const isHost = myPlayer?.isHost;
  const isAlive = myPlayer?.dmIsAlive !== false;
  const myRoleKey = (myPlayer?.role || 'dm_civilian') as keyof typeof DYING_MESSAGE_ROLES;
  const myRoleInfo = DYING_MESSAGE_ROLES[myRoleKey] || DYING_MESSAGE_ROLES.dm_civilian;

  const canUseDoctorSkill =
    room.status === 'dm_day_discussion' &&
    isAlive &&
    myPlayer?.role === 'dm_doctor' &&
    !room.dmDoctorSkillUsed;

  const aliveSuspects = players.filter(
    (p) => p.dmIsAlive !== false && p.id !== myPlayer?.id
  );

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* 1. Primary Heads-Up Notice Card (No Duplicate Evidence Board!) */}
      <div className="rounded-3xl bg-gradient-to-b from-sky-50 via-[#FFFDF9] to-amber-50/60 border-2 border-sky-200 p-6 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700">
          <Tablet className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold">
            HEADS-UP MODE · เชื่อมจอ iPad กลางโต๊ะแล้ว
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            {room.status === 'dm_day_discussion'
              ? 'วางมือถือลง แล้วดูหลักฐานบนจอ iPad กลางโต๊ะ!'
              : room.status === 'dm_voting'
              ? 'ถึงเวลาโหวตชี้ตัวฆาตกรในวง!'
              : room.status === 'dm_round_verdict'
              ? 'ดูผลโหวตประจำรอบบนจอ iPad กลางโต๊ะ'
              : 'คดีสิ้นสุดแล้ว! ดูเฉลยเบาะแสจริงบนจอ iPad'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {!isAlive
              ? '👻 คุณเป็นวิญญาณผู้ตายในคดีนี้ ห้ามพูดใบ้หรือส่งซิกเด็ดขาด นั่งชมเพื่อนๆ ถกเถียงกันได้เลย!'
              : 'การ์ดเบาะแสมรณะและรายชื่อผู้ต้องสงสัยแสดงอยู่บนจอ iPad กลางโต๊ะแล้ว เงยหน้าสังเกตเสื้อผ้า ท่าทาง และพูดคุยจับพิรุธเพื่อนในวงได้เลย'}
          </p>
        </div>

        {/* 2. Convenience Action 1: Forensic Doctor Skill Button (Only if Doctor) */}
        {canUseDoctorSkill && (
          <div className="pt-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={onUseDoctorSkill}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <FlaskConical className="w-4 h-4" />
              <span>ใช้สกิลหมอชันสูตร: ตัดหลักฐานปลอมบน iPad 1 ใบ!</span>
            </button>
          </div>
        )}

        {/* 3. Convenience Action 2: Minimal Secret Vote Pad (Only during dm_voting for alive players) */}
        {room.status === 'dm_voting' && isAlive && (
          <div className="pt-3 border-t border-sky-200/80 space-y-2.5 text-left">
            <div className="text-xs font-extrabold text-slate-700 text-center">
              ชี้ตัวโหวตสดๆ ที่โต๊ะ (กดตัดสินบน iPad) หรือแตะโหวตลับด้านล่าง:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {aliveSuspects.map((suspect) => {
                const isSelected = myPlayer?.voteTargetId === suspect.id;
                return (
                  <button
                    key={suspect.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => onCastVote(suspect.id)}
                    className={`p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-white hover:bg-rose-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="truncate">{suspect.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Convenience Action 3: Press & Hold to Peek Own Role / Secret Note */}
      <div className="rounded-3xl bg-white border border-amber-200 p-4 space-y-3 shadow-2xs">
        <button
          type="button"
          onMouseDown={() => setIsPeekingSecret(true)}
          onMouseUp={() => setIsPeekingSecret(false)}
          onMouseLeave={() => setIsPeekingSecret(false)}
          onTouchStart={() => setIsPeekingSecret(true)}
          onTouchEnd={() => setIsPeekingSecret(false)}
          className="w-full py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 select-none cursor-pointer"
        >
          {isPeekingSecret ? (
            <>
              <EyeOff className="w-4 h-4 text-amber-700" />
              <span>ปล่อยนิ้วเพื่อซ่อนความลับ</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-amber-700" />
              <span>กดค้างเพื่อแอบดูบทบาท / ผลส่องส่วนตัว</span>
            </>
          )}
        </button>

        {isPeekingSecret && (
          <div
            className={`p-4 rounded-2xl border ${myRoleInfo.badgeBg} ${myRoleInfo.badgeBorder} space-y-2 text-center`}
          >
            <div className="text-2xl">{myRoleInfo.emoji}</div>
            <div className={`text-sm font-black ${myRoleInfo.badgeText}`}>
              บทบาทของคุณ: {myRoleInfo.nameTh}
            </div>
            <p className="text-xs text-slate-700">{myRoleInfo.shortAbility}</p>

            {/* Accomplice Secret Info: Who the Killer is */}
            {myPlayer?.role === 'dm_accomplice' && room.dmKillerName && (
              <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-extrabold">
                🗡️ ฆาตกรตัวจริงที่คุณต้องช่วยปั่นโหวตคือ: {room.dmKillerName}
              </div>
            )}

            {/* Detective Secret Inspection Note */}
            {myPlayer?.role === 'dm_detective' &&
              myPlayer.dmInspectedTargetName && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-extrabold ${
                    myPlayer.dmInspectedIsKiller
                      ? 'bg-rose-100 border-rose-300 text-rose-950'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-950'
                  }`}
                >
                  🕵️ ผลส่อง {myPlayer.dmInspectedTargetName}:{' '}
                  {myPlayer.dmInspectedIsKiller
                    ? 'ใช่ฆาตกรตัวจริง!'
                    : 'ไม่ใช่ฆาตกรลงมือ'}
                </div>
              )}
          </div>
        )}
      </div>

      {/* 5. Minimal Host Remote Shortcut (Optional so Host can trigger from phone or iPad) */}
      {isHost && (
        <div className="flex justify-center pt-1">
          {room.status === 'dm_day_discussion' && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onStartVoting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-extrabold cursor-pointer"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>รีโมทโฮสต์: เริ่มโหวตชี้ตัว</span>
            </button>
          )}
          {room.status === 'dm_round_verdict' && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onContinueNextNight}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 text-xs font-extrabold cursor-pointer"
            >
              <span>รีโมทโฮสต์: เข้าสู่คืนถัดไป</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {room.status === 'dm_game_over' && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onPlayAgain}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-extrabold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีโมทโฮสต์: เล่นรอบใหม่</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
