import React from 'react';
import { motion } from 'motion/react';
import {
  Hourglass,
  Users,
  ThumbsUp,
  ThumbsDown,
  Vote,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { InGameRolePrivacyBar } from '../common/InGameRolePrivacyBar';

export interface RoleDetailMeta {
  titleTh: string;
  emoji: string;
  color: string;
  goal: string;
}

interface InsiderVoteAndResultPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  myPlayer?: FirestorePlayer;
  insiderPlayer?: FirestorePlayer;
  discussionSecondsLeft: number;
  discussProgressPct: number;
  selectedVoteTarget: string;
  isLoading: boolean;
  formatTimer: (sec: number) => string;
  getRoleDetails: (role?: string) => RoleDetailMeta;
  onCastGuesserJudgment: (judgment: 'yes_insider' | 'no_innocent') => void;
  onSelectVoteTarget: (targetId: string) => void;
  onCastGeneralVote: () => void;
  onPlayAgain: () => void;
}

export const InsiderVoteAndResultPhases: React.FC<
  InsiderVoteAndResultPhasesProps
> = ({
  currentRoom,
  players,
  currentUid,
  myPlayer,
  insiderPlayer,
  discussionSecondsLeft,
  discussProgressPct,
  selectedVoteTarget,
  isLoading,
  formatTimer,
  getRoleDetails,
  onCastGuesserJudgment,
  onSelectVoteTarget,
  onCastGeneralVote,
  onPlayAgain,
}) => {
  const myRoleMeta = getRoleDetails(myPlayer?.role);
  const mySecretWordDisplay =
    myPlayer?.role === 'insider_master' || myPlayer?.role === 'insider_traitor'
      ? currentRoom.secretWord || '-'
      : 'คุณเป็นพลเมืองทั่วไป (ตอนนี้คำลับเฉลยแล้วคือ "' +
        (currentRoom.secretWord || '-') +
        '")';

  return (
    <>
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
              <span>
                STEP 5 (ขั้นที่ 1/2): คว่ำนาฬิกาทรายถกเถียง & โหวตตัดสินคนทายถูก!
              </span>
            </span>
            <h3 className="text-xl font-black text-slate-900">
              คำศัพท์ลับคือ &ldquo;{currentRoom.secretWord}&rdquo; · ทายถูกโดย{' '}
              <span className="text-rose-600 underline">
                {currentRoom.guesserPlayerName}
              </span>
              !
            </h3>
            <div className="text-xs font-mono font-bold text-rose-700">
              ⏳ เวลาถกเถียงจากนาฬิกาทรายที่พลิกกลับ: เหลือ{' '}
              {formatTimer(discussionSecondsLeft)}
            </div>
          </div>

          {/* Flipped Sand Timer Bar */}
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${discussProgressPct}%` }}
              className="h-full bg-gradient-to-r from-rose-600 to-amber-400 transition-all duration-700"
            />
          </div>

          {/* In-Game Role Privacy Shield */}
          <InGameRolePrivacyBar
            roleTitle={myRoleMeta.titleTh}
            roleEmoji={myRoleMeta.emoji}
            secretWordLabel="คำศัพท์ลับของรอบนี้"
            secretWordValue={mySecretWordDisplay}
            extraHint={myRoleMeta.goal}
            accentTheme="rose"
          />

          <div className="p-6 bg-white border-2 border-rose-200 rounded-3xl space-y-4 text-center shadow-xs">
            <div className="space-y-1">
              <div className="text-xs font-bold text-rose-700 uppercase">
                กติกาโหวตขั้นที่ 1 (Guesser Judgment)
              </div>
              <div className="text-base sm:text-lg font-extrabold text-slate-900">
                คุณคิดว่า &ldquo;{currentRoom.guesserPlayerName}&rdquo;
                (ผู้ที่ทายคำลับถูก) คือ{' '}
                <span className="text-rose-600">Insider</span> หรือไม่?
              </div>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                หากเสียงข้างมากโหวตว่า &ldquo;ใช่ Insider&rdquo; จะเปิดการ์ดของ{' '}
                {currentRoom.guesserPlayerName} ทันที! แต่หากเสียงข้างมากโหวตว่า
                &ldquo;ไม่ใช่ (บริสุทธิ์)&rdquo; จะเข้าสู่การโหวตขั้นที่ 2
                เพื่อชี้ตัวผู้ต้องสงสัยคนอื่นในโต๊ะ
              </p>
            </div>

            {currentUid === currentRoom.guesserPlayerId ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 font-bold text-xs sm:text-sm">
                🎯 คุณคือผู้ที่ทายคำศัพท์ลับถูกต้อง! อธิบายให้เพื่อนๆ
                เชื่อว่าคุณคิดคำตอบออกเองโดยไม่ได้เป็น Insider
                (ผู้เล่นคนอื่นกำลังลงมติตัดสินคุณ)
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
                  <span>
                    👍 ใช่! {currentRoom.guesserPlayerName} คือ Insider แน่นอน
                  </span>
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
                    p.id !== currentRoom.guesserPlayerId &&
                    Boolean(p.guesserJudgmentVote)
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
          {/* In-Game Role Privacy Shield */}
          <InGameRolePrivacyBar
            roleTitle={myRoleMeta.titleTh}
            roleEmoji={myRoleMeta.emoji}
            secretWordLabel="คำศัพท์ลับของรอบนี้"
            secretWordValue={mySecretWordDisplay}
            extraHint={myRoleMeta.goal}
            accentTheme="rose"
          />

          {/* Stage 1 Verdict Banner explaining why everyone votes again */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-white to-rose-50 border-2 border-emerald-300 rounded-3xl text-center space-y-2 shadow-xs">
            <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black inline-flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5" />
              <span>
                STEP 5 (ขั้นที่ 2/2): โหวตชี้ตัวหาจอมบงการ (Insider) ตัวจริง!
              </span>
            </span>

            <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-2xl text-xs sm:text-sm font-extrabold text-emerald-950 max-w-xl mx-auto flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                ผลโหวตขั้นที่ 1: เสียงข้างมาก ({currentRoom.guesserNoVotes || 0}{' '}
                ต่อ {currentRoom.guesserYesVotes || 0} เสียง) เชื่อว่า &ldquo;
                {currentRoom.guesserPlayerName}&rdquo; เป็นผู้บริสุทธิ์!
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Insider ตัวจริงยังซ่อนอยู่ในกลุ่ม! ทุกคนต้องโหวตชี้ตัวอีกครั้ง
            </h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto">
              ในเมื่อคนทายถูกไม่ใช่ผู้ร้าย... แล้วใครในโต๊ะที่แอบตั้งคำถามชี้นำ?
              เลือกโหวตผู้ต้องสงสัย 1 คน (หากคะแนนเท่ากัน เสียงของ Master
              จะเป็นผู้ชี้ขาด)
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
                            ? '🎯 ผู้ทายคำลับถูก (ผ่านมติขั้นที่ 1)'
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
            โหวตชี้ตัวแล้ว {players.filter((p) => Boolean(p.voteTargetId)).length}
            /{players.length} คน
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
                  <strong>{currentRoom.guesserPlayerName}</strong> (ผลโหวตขั้นที่
                  1: ชี้ว่าเป็น Insider {currentRoom.guesserYesVotes || 0} เสียง
                  / เชื่อว่าบริสุทธิ์ {currentRoom.guesserNoVotes || 0} เสียง)
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
                const votedForPlayer = players.find(
                  (t) => t.id === p.voteTargetId
                );
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
                      <span className="text-lg">
                        {getRoleDetails(p.role).emoji}
                      </span>
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
    </>
  );
};
