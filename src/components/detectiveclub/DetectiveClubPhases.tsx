import React, { useState } from 'react';
import {
  BookOpen,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  Timer,
  CheckCircle2,
  Crown,
  Trophy,
  ArrowRight,
  HelpCircle,
  Vote,
  RotateCcw,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';

export interface DetectiveClubPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  discussionSecondsLeft: number;
  isLoading: boolean;
  onSubmitSecretWord: (word: string) => Promise<void>;
  onAdvanceCardRound: (target: 2 | 'discussion') => Promise<void>;
  onStartVoting: () => Promise<void>;
  onSubmitVote: (targetId: string) => Promise<void>;
  onRematch: () => Promise<void>;
}

export const DetectiveClubPhases: React.FC<DetectiveClubPhasesProps> = ({
  currentRoom,
  players,
  currentUid,
  discussionSecondsLeft,
  isLoading,
  onSubmitSecretWord,
  onAdvanceCardRound,
  onStartVoting,
  onSubmitVote,
  onRematch,
}) => {
  const [typedWord, setTypedWord] = useState<string>('');
  const [isPeekingNotebook, setIsPeekingNotebook] = useState<boolean>(true);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('');

  const myPlayer = players.find((p) => p.id === currentUid);
  const activePlayer = players.find((p) => p.id === currentRoom.dcActivePlayerId);
  const isMeActivePlayer = currentRoom.dcActivePlayerId === currentUid;
  const isConspirator = myPlayer?.role === 'dc_conspirator';
  const isHost = currentRoom.hostId === currentUid;

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedWord.trim() || isLoading) return;
    await onSubmitSecretWord(typedWord.trim());
    setTypedWord('');
  };

  const handleVoteSubmit = async () => {
    if (!selectedSuspectId || isLoading) return;
    await onSubmitVote(selectedSuspectId);
  };

  // -------------------------------------------------------------
  // PHASE 1: Active Player Word Entry
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_word_entry') {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="p-1.5 bg-amber-600 text-white rounded-lg">STEP 1</span>
            <span>ผู้ตั้งโจทย์ (ACTIVE PLAYER) คิดคำลับ</span>
          </div>
          <span className="text-xs font-bold bg-amber-600/30 px-2.5 py-1 rounded-lg">
            โจทย์โดย: {activePlayer?.name || 'Active Player'}
          </span>
        </div>

        {isMeActivePlayer ? (
          <form
            onSubmit={handleWordSubmit}
            className="p-6 sm:p-8 bg-white border border-amber-300 rounded-3xl space-y-6 shadow-sm"
          >
            <div className="text-center space-y-2">
              <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-bold text-2xl flex items-center justify-center mx-auto">
                ✍️
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                คุณคือผู้ตั้งโจทย์ประจำรอบนี้!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                1. ดูการ์ดจริง 6 ใบในมือคุณ <br />
                2. คิดคำศัพท์หรือวลีภาษาไทยที่เชื่อมโยงกับการ์ดจริงอย่างน้อย 2 ใบ <br />
                3. พิมพ์คำศัพท์ลับลงในช่องด้านล่าง แล้ววางการ์ดจริงใบแรกหงายไว้กลางโต๊ะ
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <label className="block text-xs font-extrabold text-amber-950">
                คำศัพท์ลับประจำรอบ (Secret Word):
              </label>
              <input
                type="text"
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                placeholder="เช่น กาลเวลา, ทะเลสาบ, เวทมนตร์, การเดินทาง..."
                className="w-full px-4 py-3 bg-amber-50/60 border-2 border-amber-300 focus:border-amber-500 rounded-2xl font-bold text-base text-slate-900 placeholder-slate-400 outline-none transition-all shadow-inner"
                autoFocus
              />
              <button
                type="submit"
                disabled={!typedWord.trim() || isLoading}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-amber-950 font-black text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>แจกสมุดบันทึกดิจิทัลให้ทุกคนในโต๊ะ →</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 sm:p-12 bg-white border border-amber-200 rounded-3xl text-center space-y-4 shadow-sm">
            <span className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-700 font-bold text-3xl flex items-center justify-center mx-auto animate-bounce">
              ⏳
            </span>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                รอคุณ {activePlayer?.name} กำลังตั้งคำศัพท์ลับ...
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ผู้ตั้งโจทย์กำลังดูการ์ดจริงในมือและพิมพ์คำลับ เมื่อเสร็จแล้วระบบจะส่งสมุดบันทึกลับมาที่เครื่องคุณทันที
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 2: Card Placement Rounds 1 & 2 on Physical Table
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_card_rounds') {
    const cardRound = currentRoom.dcCardRound || 1;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="p-1.5 bg-amber-600 text-white rounded-lg">STEP 2</span>
            <span>วางการ์ดจริงบนโต๊ะ (รอบที่ {cardRound}/2)</span>
          </div>
          <span className="text-xs font-bold bg-amber-600/30 px-2.5 py-1 rounded-lg">
            Active: {activePlayer?.name}
          </span>
        </div>

        {/* Digital Notebook Display Card */}
        <div className="p-6 bg-gradient-to-br from-amber-50 via-white to-stone-50 border-2 border-amber-300 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900">
                สมุดบันทึกลับดิจิทัลส่วนตัวของคุณ
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsPeekingNotebook((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {isPeekingNotebook ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>ซ่อนสมุด</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>แอบเปิดดู</span>
                </>
              )}
            </button>
          </div>

          {isPeekingNotebook ? (
            <div className="p-6 bg-amber-100/60 border border-amber-300/80 rounded-2xl text-center space-y-2">
              {isConspirator ? (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-black text-rose-700 bg-rose-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    ⚠️ คุณคือ Conspirator (ผู้สมรู้ร่วมคิด)
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-400 italic py-2">
                    --- หน้ากระดาษว่างเปล่า ---
                  </div>
                  <p className="text-xs text-rose-900 max-w-md mx-auto font-semibold">
                    คุณไม่รู้คำลับ! มองการ์ดจริงที่ผู้เล่นคนอื่นวางบนโต๊ะ สันนิษฐานธีม และเลือกวางการ์ดจริง 2 ใบให้แนบเนียนที่สุด
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    ✓ คุณคือ {isMeActivePlayer ? 'ผู้ตั้งโจทย์' : 'นักสืบ (Detective)'}
                  </span>
                  <div className="text-2xl sm:text-4xl font-black text-amber-950 py-2 tracking-wide">
                    "{myPlayer?.dcNotebookWord || currentRoom.dcSecretWord}"
                  </div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    เลือกการ์ดจริงจากมือ 1 ใบที่มีองค์ประกอบตรงกับคำลับนี้ วางหงายไว้บนโต๊ะจริง
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-100 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-bold">
              🔒 สมุดบันทึกถูกปิดซ่อนไว้ กดปุ่ม "แอบเปิดดู" ด้านบนเพื่อดูเนื้อหา
            </div>
          )}
        </div>

        {/* Physical Board Guidance & Progression Card */}
        <div className="p-5 bg-white border border-amber-200 rounded-3xl space-y-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
              ขั้นตอนบนโต๊ะจริง (Physical Table Flow):
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {cardRound === 1
                ? 'วนตามเข็มนาฬิกา: ทุกคนเลือกการ์ดจริงจากมือคนละ 1 ใบ วางข้างการ์ดของผู้ตั้งโจทย์บนโต๊ะ'
                : 'วนรอบที่สอง: ทุกคนเลือกการ์ดจริงใบที่ 2 จากมือ วางต่อจากการ์ดใบแรกของตนเองบนโต๊ะ'}
            </p>
          </div>

          {(isHost || isMeActivePlayer) && (
            <div className="pt-2 border-t border-amber-100 flex justify-end">
              {cardRound === 1 ? (
                <button
                  type="button"
                  onClick={() => onAdvanceCardRound(2)}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <span>ทุกคนวางการ์ดจริงรอบ 1 ครบแล้ว → ไปรอบ 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAdvanceCardRound('discussion')}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <span>ทุกคนวางการ์ดครบ 2 ใบแล้ว → เริ่มช่วงถกเถียงและอธิบาย!</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 3: Discussion & Explanation Phase
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_discussion') {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="p-1.5 bg-amber-600 text-white rounded-lg">STEP 3</span>
            <span>เฉลยคำลับ & อธิบายการ์ด (EXPLANATION & DEFENSE)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-black bg-amber-600/30 px-3 py-1 rounded-xl">
            <Timer className="w-4 h-4" />
            <span>{discussionSecondsLeft}s</span>
          </div>
        </div>

        {/* Revealed Secret Word Banner */}
        <div className="p-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 rounded-3xl text-center shadow-sm space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider block">
            คำศัพท์ลับที่ผู้ตั้งโจทย์กำหนดคือ:
          </span>
          <div className="text-3xl sm:text-5xl font-black tracking-wide py-1">
            "{currentRoom.dcSecretWord}"
          </div>
        </div>

        {/* Defense & Discussion Instructions */}
        <div className="p-6 bg-white border border-amber-200 rounded-3xl space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">
            กติกาช่วงอธิบายเหตุผล:
          </h3>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              ผู้ตั้งโจทย์ (คุณ {activePlayer?.name}) อธิบายก่อนว่าการ์ด 2 ใบของตนเกี่ยวอะไรกับคำลับ
            </li>
            <li>
              จากนั้นผู้เล่นคนอื่นๆ ผลัดกันอธิบายเหตุผลว่าการ์ด 2 ใบของตนเชื่อมโยงกับคำลับอย่างไร
            </li>
            <li>
              <strong>สำหรับ Conspirator:</strong> ตอนนี้คุณรู้คำลับแล้ว! รีบด้นสดแถหาเหตุผลให้แนบเนียนที่สุดว่าทำไมการ์ด 2 ใบที่คุณมั่วมาถึงเข้ากับคำนี้ได้!
            </li>
          </ul>

          {(isHost || isMeActivePlayer) && (
            <div className="pt-4 border-t border-amber-100 flex justify-end">
              <button
                type="button"
                onClick={onStartVoting}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Vote className="w-4 h-4" />
                <span>สิ้นสุดการถกเถียง → ไปช่วงโหวตชี้ตัว Conspirator!</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 4: Voting Phase
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_voting') {
    const votes = currentRoom.dcVotes || {};
    const hasVoted = Boolean(votes[currentUid]);
    // Can suspect anyone except oneself and Active Player
    const eligibleSuspects = players.filter(
      (p) => p.id !== currentUid && p.id !== currentRoom.dcActivePlayerId
    );

    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="p-1.5 bg-amber-600 text-white rounded-lg">STEP 4</span>
            <span>โหวตชี้ตัว Conspirator (ACCUSATION & VOTING)</span>
          </div>
          <span className="text-xs font-bold bg-amber-600/30 px-2.5 py-1 rounded-lg">
            คำลับ: "{currentRoom.dcSecretWord}"
          </span>
        </div>

        {isMeActivePlayer ? (
          <div className="p-8 bg-white border border-amber-200 rounded-3xl text-center space-y-3 shadow-sm">
            <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-bold text-2xl flex items-center justify-center mx-auto">
              👑
            </span>
            <h3 className="text-base font-black text-slate-900">
              คุณคือ Active Player (ผู้ตั้งโจทย์)
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              ในฐานะผู้ตั้งโจทย์ คุณไม่ต้องลงคะแนนโหวต กรุณารอนักสืบและสายลับทุกคนลงคะแนนชี้ตัว Conspirator
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-amber-800">
              ลงคะแนนแล้ว {Object.keys(votes).length} / {players.length - 1} คน
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white border border-amber-200 rounded-3xl space-y-5 shadow-sm">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                คุณคิดว่าใครคือ Conspirator ที่แอบเนียน?
              </h3>
              <p className="text-xs text-slate-500">
                เลือกผู้เล่นที่คุณคิดว่าคำอธิบายการ์ดไม่สมเหตุสมผลที่สุด แล้วกดยืนยันการโหวต
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {eligibleSuspects.map((suspect) => {
                const isSelected = selectedSuspectId === suspect.id;
                return (
                  <button
                    key={suspect.id}
                    type="button"
                    disabled={hasVoted}
                    onClick={() => setSelectedSuspectId(suspect.id)}
                    className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-500 text-amber-950 font-black shadow-xs'
                        : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-extrabold">{suspect.name}</div>
                      <div className="text-[11px] text-slate-500">ผู้ต้องสงสัย</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="max-w-xs mx-auto pt-2">
              <button
                type="button"
                disabled={!selectedSuspectId || hasVoted || isLoading}
                onClick={handleVoteSubmit}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-amber-950 font-black text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                {hasVoted ? '✓ คุณโหวตเรียบร้อยแล้ว' : 'ยืนยันการโหวตชี้ตัว'}
              </button>
            </div>

            <div className="text-center text-xs font-mono font-bold text-slate-500">
              ลงคะแนนแล้ว {Object.keys(votes).length} / {players.length - 1} คน
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 5: Scoring & Resolution Phase
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_scoring') {
    const summary = currentRoom.dcRoundSummary;
    const scores = currentRoom.dcScores || {};
    const votes = currentRoom.dcVotes || {};
    const conspiratorId = currentRoom.dcConspiratorId || '';
    const detectiveVoters = players.filter(
      (p) => p.id !== currentRoom.dcActivePlayerId && p.id !== conspiratorId
    );
    const votesForConspirator = detectiveVoters.filter(
      (p) => votes[p.id] === conspiratorId
    ).length;

    const sortedPlayers = [...players].sort(
      (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)
    );

    return (
      <div className="space-y-6">
        {/* Reveal Outcome Card */}
        <div
          className={`p-6 sm:p-8 rounded-3xl text-center space-y-3 shadow-md ${
            summary?.caught
              ? 'bg-gradient-to-br from-emerald-100 via-white to-amber-100 border-2 border-emerald-300 text-emerald-950'
              : 'bg-gradient-to-br from-rose-100 via-white to-amber-100 border-2 border-rose-300 text-rose-950'
          }`}
        >
          <span className="text-4xl block">
            {summary?.caught ? '🎉' : '🕵️‍♂️'}
          </span>
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 bg-white/80 rounded-full inline-block border">
              {summary?.caught
                ? `CONSPIRATOR BUSTED · นักสืบชี้ตัวถูก ${votesForConspirator} คน (ตั้งแต่ 2 คนขึ้นไป)`
                : `CONSPIRATOR ESCAPED · นักสืบชี้ตัวถูกเพียง ${votesForConspirator} คน (ไม่เกิน 1 คน)`}
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Conspirator ตัวจริงคือ: {summary?.conspiratorName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              คำศัพท์ลับประจำรอบนี้คือ:{' '}
              <strong className="text-amber-950">
                &ldquo;{summary?.secretWord}&rdquo;
              </strong>
            </p>
          </div>

          {/* Official Scoring Rules Summary Banner */}
          <div className="max-w-2xl mx-auto pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left text-[11px] text-slate-700">
            <div className="p-2.5 bg-white/80 border border-amber-200/80 rounded-xl">
              <strong className="text-emerald-800 block">🕵️ นักสืบที่ทายถูก</strong>
              <span>ได้คนละ +3 VP เสมอไม่ว่าจะมีกี่คน</span>
            </div>
            <div className="p-2.5 bg-white/80 border border-amber-200/80 rounded-xl">
              <strong className="text-rose-800 block">🎭 ถ้าคนทายถูก 0–1 คน</strong>
              <span>Conspirator +5 VP · ผู้ตั้งโจทย์ +4 VP</span>
            </div>
            <div className="p-2.5 bg-white/80 border border-amber-200/80 rounded-xl">
              <strong className="text-slate-800 block">🚨 ถ้าคนทายถูก ≥ 2 คน</strong>
              <span>Conspirator 0 VP · ผู้ตั้งโจทย์ 0 VP</span>
            </div>
          </div>
        </div>

        {/* Victory Points Standings Grid */}
        <div className="p-6 bg-white border border-amber-200 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900">
                ตารางคะแนนสะสม (VICTORY POINTS LEADERBOARD)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              เรียงตามคะแนนรวมสูงสุด
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedPlayers.map((p, index) => {
              const roundGain = summary?.pointsAwarded?.[p.id] || 0;
              const totalVp = scores[p.id] || 0;
              const isPActive = p.id === currentRoom.dcActivePlayerId;
              const isPConspirator = p.id === currentRoom.dcConspiratorId;
              const votedTarget = players.find((t) => t.id === votes[p.id]);

              return (
                <div
                  key={p.id}
                  className="p-3.5 bg-amber-50/40 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
                      <span className="text-amber-700 font-mono">
                        #{index + 1}
                      </span>
                      <span>{p.name}</span>
                      {isPActive && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                          ผู้ตั้งโจทย์
                        </span>
                      )}
                      {isPConspirator && (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-200 px-1.5 py-0.5 rounded">
                          Conspirator
                        </span>
                      )}
                      {!isPActive && !isPConspirator && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          นักสืบ
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                      <span>
                        รอบนี้:{' '}
                        <strong
                          className={
                            roundGain > 0
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }
                        >
                          +{roundGain} VP
                        </strong>
                      </span>
                      {!isPActive && votedTarget && (
                        <span>· โหวตชี้ตัว: {votedTarget.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-mono font-black text-amber-950">
                      {totalVp} VP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isHost && (
            <div className="pt-4 border-t border-amber-100 flex justify-end">
              <button
                type="button"
                onClick={onRematch}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>เล่นรอบถัดไป (สลับ Active Player) →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
