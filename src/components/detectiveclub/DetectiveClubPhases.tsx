import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Eye,
  EyeOff,
  Send,
  Sparkles,
  Timer,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Vote,
  RotateCcw,
  Hand,
  Smartphone,
  Mic,
  Volume2,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { InGameRolePrivacyBar } from '../common/InGameRolePrivacyBar';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

const WORD_INSPIRATION_CHIPS = [
  'การเดินทาง',
  'ความทรงจำ',
  'ความฝัน',
  'เวทมนตร์',
  'ความลับ',
  'ฤดูฝน',
  'อวกาศ',
  'กาลเวลา',
  'งานฉลอง',
  'ปริศนา',
  'เสรีภาพ',
  'ธรรมชาติ',
];

export interface DetectiveClubPhasesProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  discussionSecondsLeft: number;
  isLoading: boolean;
  onSubmitSecretWord: (word: string) => Promise<void>;
  onConfirmCardPlaced: (playerId: string) => Promise<void>;
  onAdvanceCardRound: (target: 2 | 'discussion') => Promise<void>;
  onAdvanceSpeaker: (nextSpeakerIndex: number) => Promise<void>;
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
  onConfirmCardPlaced,
  onAdvanceCardRound,
  onAdvanceSpeaker,
  onStartVoting,
  onSubmitVote,
  onRematch,
}) => {
  const [typedWord, setTypedWord] = useState<string>('');
  const [hasPlacedFirstPhysicalCard, setHasPlacedFirstPhysicalCard] =
    useState<boolean>(false);
  // Default notebook to CLOSED so neighbors at the physical table cannot peek at the screen
  const [isPeekingNotebook, setIsPeekingNotebook] = useState<boolean>(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('');

  // Auto-hide notebook whenever phase or round changes
  useEffect(() => {
    setIsPeekingNotebook(false);
    setHasPlacedFirstPhysicalCard(false);
    setSelectedSuspectId('');
  }, [currentRoom.status, currentRoom.dcRoundNumber]);

  const myPlayer = players.find((p) => p.id === currentUid);
  const activePlayer = players.find(
    (p) => p.id === currentRoom.dcActivePlayerId
  );
  const isMeActivePlayer = currentRoom.dcActivePlayerId === currentUid;
  const isConspirator = myPlayer?.role === 'dc_conspirator';
  const isHost = currentRoom.hostId === currentUid;
  const roundNumber = currentRoom.dcRoundNumber || 1;

  // Ordered players list starting with Active Player (Informer)
  const turnOrderIds =
    currentRoom.dcTurnOrderIds && currentRoom.dcTurnOrderIds.length > 0
      ? currentRoom.dcTurnOrderIds
      : [
          currentRoom.dcActivePlayerId || '',
          ...players
            .filter((p) => p.id !== currentRoom.dcActivePlayerId)
            .map((p) => p.id),
        ].filter(Boolean);

  const orderedPlayers = turnOrderIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is FirestorePlayer => Boolean(p));

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedWord.trim() || isLoading) return;
    await onSubmitSecretWord(typedWord.trim());
    setTypedWord('');
  };

  const handlePickRandomIdea = () => {
    const pick =
      WORD_INSPIRATION_CHIPS[
        Math.floor(Math.random() * WORD_INSPIRATION_CHIPS.length)
      ];
    setTypedWord(pick);
  };

  const handleVoteSubmit = async () => {
    if (!selectedSuspectId || isLoading) return;
    await onSubmitVote(selectedSuspectId);
  };

  // Privacy Shield Role Summary for InGameRolePrivacyBar
  const roleBadgeLabel = isMeActivePlayer
    ? '👑 ผู้ตั้งโจทย์ (Informer)'
    : isConspirator
    ? '🎭 ผู้สมรู้ร่วมคิด (Conspirator)'
    : '🕵️ นักสืบ (Detective)';

  const secretWordDisplay =
    currentRoom.status === 'dc_word_entry'
      ? isMeActivePlayer
        ? 'กำลังตั้งคำศัพท์ลับ...'
        : 'รอรับสมุดโน้ตดิจิทัล...'
      : isConspirator
      ? '❌ หน้ากระดาษว่างเปล่า (ไม่รู้คำลับ!)'
      : `คำศัพท์ลับ: "${myPlayer?.dcNotebookWord || currentRoom.dcSecretWord}"`;

  // -------------------------------------------------------------
  // PHASE 1: Active Player Word Entry & Physical Card #1
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_word_entry') {
    return (
      <div className="space-y-5">
        {/* Step Header */}
        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="px-2 py-1 bg-amber-700 text-white rounded-lg">
              รอบที่ {roundNumber} · STEP 1
            </span>
            <span>ผู้ตั้งโจทย์คิดคำลับ & วางไพ่จริงใบที่ 1</span>
          </div>
          <span className="text-xs font-bold bg-amber-600/30 px-2.5 py-1 rounded-lg">
            ผู้ตั้งโจทย์รอบนี้: {activePlayer?.name || 'Active Player'}
          </span>
        </div>

        {/* Hybrid Physical vs Digital Cue Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
            <span className="p-2 bg-amber-400 text-amber-950 rounded-xl shrink-0">
              <Hand className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-black text-amber-950 block">
                🃏 ทำบนโต๊ะจริง (Physical Action)
              </span>
              <span className="text-slate-700">
                ทุกคนถือไพ่รูปภาพจริงคนละ 6 ใบ · ผู้ตั้งโจทย์เลือกไพ่ 2 ใบที่เข้าคู่กัน แล้ว{' '}
                <strong>วางไพ่ใบที่ 1 หงายลงบนโต๊ะหน้าตัวเองทันที</strong>
              </span>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
              <Smartphone className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-black text-emerald-950 block">
                📱 กดในมือถือ (Digital Action)
              </span>
              <span className="text-slate-700">
                ผู้ตั้งโจทย์พิมพ์คำศัพท์ลับในแอป แล้วกดส่งสมุดโน้ตดิจิทัลให้ทุกคนในโต๊ะ (มี Conspirator 1 คนที่จะได้สมุดหน้าว่าง!)
              </span>
            </div>
          </div>
        </div>

        {isMeActivePlayer ? (
          <form
            onSubmit={handleWordSubmit}
            className="p-6 sm:p-8 bg-white border-2 border-amber-300 rounded-3xl space-y-6 shadow-sm"
          >
            <div className="text-center space-y-2">
              <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-bold text-2xl flex items-center justify-center mx-auto">
                ✍️
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                คุณคือผู้ตั้งโจทย์ (Informer) ประจำรอบที่ {roundNumber}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                ดูไพ่รูปภาพจริง 6 ใบในมือคุณ คิดคำศัพท์หรือวลีที่เชื่อมโยงกับไพ่ 2 ใบในมือคุณได้
                <strong className="text-amber-900 block mt-1">
                  ⚠️ ห้ามพูดคำศัพท์ลับออกมาดังๆ เด็ดขาด!
                </strong>
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
              {/* Step A: Type Secret Word */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-amber-950">
                    1. พิมพ์คำศัพท์ลับประจำรอบ (Secret Word):
                  </label>
                  <button
                    type="button"
                    onClick={handlePickRandomIdea}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>สุ่มไอเดียคำหมวดภาพ</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value)}
                  placeholder="พิมพ์คำที่เข้ากับไพ่จริงในมือคุณ เช่น ความฝัน, การเดินทาง..."
                  className="w-full px-4 py-3 bg-amber-50/60 border-2 border-amber-300 focus:border-amber-500 rounded-2xl font-bold text-base text-slate-900 placeholder-slate-400 outline-none transition-all shadow-inner"
                  autoFocus
                />

                {/* Quick Inspiration Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold mr-1">
                    ไอเดียยอดฮิต:
                  </span>
                  {WORD_INSPIRATION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTypedWord(chip)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        typedWord === chip
                          ? 'bg-amber-400 border-amber-500 text-amber-950'
                          : 'bg-stone-50 border-slate-200 text-slate-600 hover:bg-amber-50'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step B: Physical Card #1 Confirmation Checkbox */}
              <label className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPlacedFirstPhysicalCard}
                  onChange={(e) =>
                    setHasPlacedFirstPhysicalCard(e.target.checked)
                  }
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-xs font-bold text-amber-950">
                  🃏 2. ฉันได้วางไพ่รูปภาพจริงใบที่ 1 หงายไว้บนโต๊ะหน้าตัวเองเรียบร้อยแล้ว
                </span>
              </label>

              <button
                type="submit"
                disabled={!typedWord.trim() || isLoading}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-amber-950 font-black text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  ส่งสมุดโน้ตดิจิทัลให้ทุกคน & เริ่มเวียนวางไพ่ใบที่ 1 →
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 sm:p-10 bg-white border border-amber-200 rounded-3xl text-center space-y-4 shadow-sm">
            <span className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-700 font-bold text-3xl flex items-center justify-center mx-auto animate-bounce">
              ⏳
            </span>
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                รอผู้ตั้งโจทย์ คุณ {activePlayer?.name} เลือกไพ่ใบแรกและพิมพ์คำลับ...
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                ระหว่างรอ ให้คุณดูไพ่รูปภาพจริง 6 ใบในมือตัวเองไว้ก่อน ทันทีที่คุณ{' '}
                <strong>{activePlayer?.name}</strong> วางไพ่ใบแรกบนโต๊ะและกดส่งคำลับ
                สมุดโน้ตดิจิทัลจะส่งมาที่หน้าจอมือถือของคุณทันที!
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
    const placedIds = currentRoom.dcCardPlacedPlayerIds || [];
    const turnIndex = currentRoom.dcTurnIndex ?? 0;
    const currentTurnPlayerId = turnOrderIds[turnIndex] || '';
    const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
    const isMyCardTurn = currentTurnPlayerId === currentUid;
    const haveIPlacedThisRound = placedIds.includes(currentUid);

    return (
      <div className="space-y-5">
        {/* Privacy Shield Bar */}
        <InGameRolePrivacyBar
          roleTitle={roleBadgeLabel}
          secretWordLabel="สมุดโน้ตของคุณ"
          secretWordValue={secretWordDisplay}
          accentTheme="amber"
          extraHint={
            isConspirator
              ? 'คุณไม่รู้คำลับ! ดูไพ่จริงบนโต๊ะแล้ววางไพ่เนียนตามน้ำ'
              : 'เลือกไพ่จริงในมือที่ตรงกับคำศัพท์ลับนี้วางหงายหน้าตัวเอง'
          }
        />

        {/* Step Header */}
        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="px-2 py-1 bg-amber-700 text-white rounded-lg">
              STEP 2 · รอบไพ่ใบที่ {cardRound}/2
            </span>
            <span>เวียนวางไพ่รูปภาพจริงหงายบนโต๊ะ (ใบที่ {cardRound})</span>
          </div>
          <span className="text-xs font-bold bg-amber-600/30 px-2.5 py-1 rounded-lg">
            วางแล้ว {placedIds.length}/{orderedPlayers.length} คน
          </span>
        </div>

        {/* Hybrid Physical vs Digital Cue Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
            <span className="p-2 bg-amber-400 text-amber-950 rounded-xl shrink-0">
              <Hand className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-black text-amber-950 block">
                🃏 ทำบนโต๊ะจริง (Physical Table)
              </span>
              <span className="text-slate-700">
                เมื่อถึงคิวคุณ ให้หยิบไพ่รูปภาพจริงจากมือ 1 ใบ{' '}
                <strong>วางหงายไว้บนโต๊ะหน้าตัวเอง</strong> (ยังไม่ต้องพูดอธิบายใดๆ)
              </span>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
              <Smartphone className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-black text-emerald-950 block">
                📱 กดในมือถือ (Digital App)
              </span>
              <span className="text-slate-700">
                1. แอบเปิดดูสมุดโน้ตส่วนตัวด้านล่าง · 2. เมื่อวางไพ่จริงบนโต๊ะเสร็จแล้ว ให้กดปุ่ม{' '}
                <strong>&ldquo;ยืนยันวางไพ่ใบที่ {cardRound} แล้ว&rdquo;</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Secret Digital Notebook Card (Shielded by Default!) */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50 via-white to-stone-50 border-2 border-amber-300 rounded-3xl space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  สมุดโน้ตลับดิจิทัลส่วนตัวของคุณ
                </h3>
                <p className="text-[11px] text-slate-500">
                  ระวังอย่าให้เพื่อนข้างๆ มองเห็นหน้าจอขณะเปิดสมุดโน้ต
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPeekingNotebook((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs ${
                isPeekingNotebook
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
              }`}
            >
              {isPeekingNotebook ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>ปิดซ่อนสมุดโน้ต</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>แตะเพื่อแอบเปิดดูสมุดโน้ต</span>
                </>
              )}
            </button>
          </div>

          {isPeekingNotebook ? (
            <div className="p-6 bg-amber-100/60 border border-amber-300/80 rounded-2xl text-center space-y-2">
              {isConspirator ? (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-black text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-xl uppercase tracking-wider inline-block">
                    🎭 บทบาทของคุณ: CONSPIRATOR (ผู้สมรู้ร่วมคิด / คนแอบเนียน)
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-500 italic py-2">
                    [ หน้ากระดาษว่างเปล่า — ไม่มีคำศัพท์ ]
                  </div>
                  <p className="text-xs text-rose-950 max-w-md mx-auto font-semibold leading-relaxed">
                    คุณไม่รู้คำศัพท์ลับในรอบนี้! สังเกตไพ่รูปภาพจริงที่ผู้ตั้งโจทย์และคนก่อนหน้าวางหงายอยู่บนโต๊ะ แล้วเลือกไพ่จริงในมือคุณที่ดูเนียนเข้าพวกที่สุดวางตามน้ำไป!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl uppercase tracking-wider inline-block">
                    {isMeActivePlayer
                      ? '👑 บทบาทของคุณ: ผู้ตั้งโจทย์ (INFORMER)'
                      : '🕵️ บทบาทของคุณ: นักสืบ (DETECTIVE)'}
                  </span>
                  <div className="text-2xl sm:text-4xl font-black text-amber-950 py-2 tracking-wide">
                    &ldquo;{myPlayer?.dcNotebookWord || currentRoom.dcSecretWord}&rdquo;
                  </div>
                  <p className="text-xs text-slate-700 max-w-md mx-auto font-medium">
                    เลือกไพ่รูปภาพจริงจากมือ 1 ใบที่สื่อถึงคำว่า{' '}
                    <strong>
                      &ldquo;{myPlayer?.dcNotebookWord || currentRoom.dcSecretWord}&rdquo;
                    </strong>{' '}
                    วางหงายไว้บนโต๊ะหน้าตัวเอง
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsPeekingNotebook(true)}
              className="w-full p-6 bg-stone-100 hover:bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl text-center space-y-1 transition cursor-pointer"
            >
              <div className="text-sm font-black text-slate-800">
                🔒 สมุดโน้ตถูกปิดซ่อนไว้เพื่อป้องกันคนข้างๆ แอบมอง
              </div>
              <div className="text-xs text-amber-800 font-semibold">
                กดที่นี่เพื่อแอบเปิดดูบทบาทและคำศัพท์ลับในสมุดของคุณ
              </div>
            </button>
          )}
        </div>

        {/* Interactive Turn-by-Turn Physical Card Placement Tracker */}
        <div className="p-5 sm:p-6 bg-white border border-amber-200 rounded-3xl space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                ลำดับการวางไพ่จริงบนโต๊ะ (รอบใบที่ {cardRound}/2)
              </h4>
              <p className="text-xs text-slate-500">
                วางไพ่รูปภาพจริงหงายหน้าตัวเองทีละคนตามลำดับ เพื่อให้คนถัดไปได้เห็นไพ่บนโต๊ะก่อนเลือกวาง
              </p>
            </div>
            {currentTurnPlayer && (
              <button
                type="button"
                onClick={() =>
                  thaiGameMaster.speakDetectivePlayerCardTurn(
                    cardRound,
                    currentTurnPlayer.name
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>เรียกชื่อคิวซ้ำ</span>
              </button>
            )}
          </div>

          {/* Current Turn Callout Action Box */}
          {currentTurnPlayer && (
            <div
              className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isMyCardTurn
                  ? 'bg-amber-100/90 border-amber-500 text-amber-950'
                  : 'bg-stone-50 border-amber-200 text-slate-800'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800">
                  {isMyCardTurn
                    ? '🎯 ถึงตาคุณวางไพ่บนโต๊ะจริงแล้ว!'
                    : `⏳ กำลังรอคิววางไพ่ใบที่ ${cardRound}`}
                </div>
                <div className="text-sm sm:text-base font-black">
                  คิวปัจจุบัน: คุณ {currentTurnPlayer.name}{' '}
                  {currentTurnPlayer.id === currentRoom.dcActivePlayerId
                    ? '(ผู้ตั้งโจทย์)'
                    : ''}
                </div>
                <p className="text-xs text-slate-600">
                  หยิบไพ่รูปภาพจริงใบที่ {cardRound} จากมือวางหงายบนโต๊ะหน้าตัวเอง แล้วกดปุ่มยืนยันด้านขวา
                </p>
              </div>

              {(isMyCardTurn || isHost || isMeActivePlayer) && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onConfirmCardPlaced(currentTurnPlayer.id)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isMyCardTurn
                      ? `🃏 ฉันวางไพ่ใบที่ ${cardRound} บนโต๊ะแล้ว!`
                      : `✓ ยืนยันแทนคุณ ${currentTurnPlayer.name}`}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Ordered Table Seats Progress Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {orderedPlayers.map((p, idx) => {
              const hasPlacedCurrent = placedIds.includes(p.id);
              const isCurrentTurn = p.id === currentTurnPlayerId && !hasPlacedCurrent;
              const isPlayerInformer = p.id === currentRoom.dcActivePlayerId;
              // Calculate how many physical cards are currently face-up in front of this player
              const cardsOnTableCount =
                cardRound === 1
                  ? hasPlacedCurrent
                    ? 1
                    : 0
                  : hasPlacedCurrent
                  ? 2
                  : 1;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                    isCurrentTurn
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                      : hasPlacedCurrent
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-stone-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                        isCurrentTurn
                          ? 'bg-amber-500 text-white'
                          : hasPlacedCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isPlayerInformer && (
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                            ผู้ตั้งโจทย์
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hasPlacedCurrent
                          ? `✓ วางไพ่ใบที่ ${cardRound} บนโต๊ะแล้ว`
                          : isCurrentTurn
                          ? `👉 กำลังเลือกไพ่ใบที่ ${cardRound} วางบนโต๊ะ...`
                          : 'รอคิววางไพ่'}
                      </div>
                    </div>
                  </div>

                  {/* Visual Physical Cards on Table Counter */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                        cardsOnTableCount >= 1
                          ? 'bg-amber-100 border-amber-300 text-amber-950'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      🃏 ใบ 1
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                        cardsOnTableCount >= 2
                          ? 'bg-amber-100 border-amber-300 text-amber-950'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      🃏 ใบ 2
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Allow self-confirm if a player placed slightly out of turn, plus Host fast-forward */}
          <div className="pt-3 border-t border-amber-100 flex flex-wrap items-center justify-between gap-2">
            {!isMyCardTurn && !haveIPlacedThisRound ? (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => onConfirmCardPlaced(currentUid)}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                ✓ ฉันวางไพ่ใบที่ {cardRound} บนโต๊ะแล้ว
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">
                เมื่อทุกคนกดยืนยันครบ ระบบจะเปลี่ยนไพ่รอบถัดไปให้อัตโนมัติ
              </span>
            )}

            {(isHost || isMeActivePlayer) && (
              <div>
                {cardRound === 1 ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onAdvanceCardRound(2)}
                    className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>ข้ามไปรอบวางไพ่ใบที่ 2 ทันที</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onAdvanceCardRound('discussion')}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>ทุกคนวางครบ 2 ใบแล้ว → เฉลยคำลับ & เริ่มอธิบาย!</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 3: Discussion & Explanation Phase
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_discussion') {
    const speakerIndex = currentRoom.dcSpeakerIndex ?? 0;
    const currentSpeaker =
      orderedPlayers[speakerIndex] || activePlayer || orderedPlayers[0];
    const hasNextSpeaker = speakerIndex + 1 < orderedPlayers.length;

    return (
      <div className="space-y-5">
        {/* Privacy Bar */}
        <InGameRolePrivacyBar
          roleTitle={roleBadgeLabel}
          secretWordLabel="สมุดโน้ตของคุณ"
          secretWordValue={secretWordDisplay}
          accentTheme="amber"
          extraHint={
            isConspirator
              ? 'ตอนนี้คำลับเฉลยแล้ว! รีบด้นสดอธิบายไพ่ 2 ใบของคุณให้เนียนที่สุด'
              : 'ฟังคำอธิบายของแต่ละคนเพื่อจับพิรุธว่าใครเพิ่งรู้คำศัพท์ลับตอนนี้!'
          }
        />

        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="px-2 py-1 bg-amber-700 text-white rounded-lg">
              STEP 3
            </span>
            <span>เฉลยคำศัพท์ลับ & ผลัดกันอธิบายไพ่ 2 ใบบนโต๊ะ</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-black bg-amber-600/30 px-3 py-1 rounded-xl">
            <Timer className="w-4 h-4" />
            <span>{discussionSecondsLeft}s</span>
          </div>
        </div>

        {/* Revealed Secret Word Banner */}
        <div className="p-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 rounded-3xl text-center shadow-sm space-y-2 border-2 border-amber-500">
          <span className="text-xs font-mono font-black uppercase tracking-wider block">
            📢 เฉลยคำศัพท์ลับที่ผู้ตั้งโจทย์กำหนดคือ:
          </span>
          <div className="text-3xl sm:text-5xl font-black tracking-wide py-1">
            &ldquo;{currentRoom.dcSecretWord}&rdquo;
          </div>
          <p className="text-xs font-bold text-amber-900">
            (ตอนนี้ Conspirator เพิ่งจะเห็นคำศัพท์นี้พร้อมทุกคน! สังเกตพิรุธตอนอธิบายไพ่ให้ดี)
          </p>
        </div>

        {/* Active Speaker Spotlight & Speaker Order */}
        <div className="p-6 bg-white border border-amber-200 rounded-3xl space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                ลำดับการชี้ไพ่จริง 2 ใบบนโต๊ะเพื่อเล่าเหตุผล:
              </h3>
              <p className="text-xs text-slate-500">
                ผู้ตั้งโจทย์อธิบายเป็นคนแรก แล้ววนตามลำดับคิวเพื่อให้ทุกคนเล่าว่าทำไมถึงเลือกไพ่ 2 ใบนั้น
              </p>
            </div>
          </div>

          {currentSpeaker && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[11px] font-mono font-bold text-amber-800 uppercase block">
                    กำลังอธิบายไพ่ 2 ใบบนโต๊ะ ({speakerIndex + 1}/{orderedPlayers.length})
                  </span>
                  <div className="text-base font-black text-slate-900">
                    เชิญคุณ {currentSpeaker.name}{' '}
                    {currentSpeaker.id === currentRoom.dcActivePlayerId
                      ? '(ผู้ตั้งโจทย์เล่าคนแรก)'
                      : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasNextSpeaker ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => onAdvanceSpeaker(speakerIndex + 1)}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>คนถัดไปอธิบาย →</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                    ✓ ครบทุกคนแล้ว พร้อมโหวต!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Speaker Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {orderedPlayers.map((p, idx) => {
              const isCurrent = idx === speakerIndex;
              const isDone = idx < speakerIndex;
              return (
                <div
                  key={p.id}
                  onClick={() => onAdvanceSpeaker(idx)}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                    isCurrent
                      ? 'bg-amber-100/90 border-amber-500 font-black text-amber-950'
                      : isDone
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                      : 'bg-stone-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold">#{idx + 1}</span>
                    <span className="truncate">{p.name}</span>
                    {p.id === currentRoom.dcActivePlayerId && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                        ผู้ตั้งโจทย์
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold shrink-0">
                    {isCurrent
                      ? '🎙️ กำลังพูด'
                      : isDone
                      ? '✓ พูดแล้ว'
                      : 'รอพูด'}
                  </span>
                </div>
              );
            })}
          </div>

          {(isHost || isMeActivePlayer) && (
            <div className="pt-4 border-t border-amber-100 flex justify-end">
              <button
                type="button"
                disabled={isLoading}
                onClick={onStartVoting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Vote className="w-4 h-4" />
                <span>อธิบายครบทุกคนแล้ว → เปิดโหวตจับตัว Conspirator ในมือถือ!</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PHASE 4: Voting Phase (Digital Voting on App)
  // -------------------------------------------------------------
  if (currentRoom.status === 'dc_voting') {
    const votes = currentRoom.dcVotes || {};
    const hasVoted = Boolean(votes[currentUid]);
    // Can suspect anyone except oneself and Active Player
    const eligibleSuspects = players.filter(
      (p) => p.id !== currentUid && p.id !== currentRoom.dcActivePlayerId
    );
    const requiredVoters = players.filter(
      (p) => p.id !== currentRoom.dcActivePlayerId
    );

    return (
      <div className="space-y-5">
        <div className="p-4 bg-amber-500 text-amber-950 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
            <span className="px-2 py-1 bg-amber-700 text-white rounded-lg">
              STEP 4
            </span>
            <span>โหวตจับตัว Conspirator ในมือถือ (DIGITAL VOTING)</span>
          </div>
          <span className="text-xs font-bold bg-amber-600/30 px-2.5 py-1 rounded-lg">
            คำลับ: &ldquo;{currentRoom.dcSecretWord}&rdquo;
          </span>
        </div>

        {/* Hybrid Physical vs Digital Cue Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
            <span className="p-2 bg-amber-400 text-amber-950 rounded-xl shrink-0">
              <Hand className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-black text-amber-950 block">
                🃏 ดูหลักฐานบนโต๊ะจริง
              </span>
              <span className="text-slate-700">
                เปรียบเทียบไพ่รูปภาพจริง 2 ใบหน้าผู้เล่นแต่ละคน ว่าของใครดูแถหรือหลุดธีมจากคำว่า{' '}
                <strong>&ldquo;{currentRoom.dcSecretWord}&rdquo;</strong> มากที่สุด
              </span>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
              <Smartphone className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-black text-emerald-950 block">
                📱 กดโหวตในมือถือ (ไม่ต้องใช้แว่นขยายจริง)
              </span>
              <span className="text-slate-700">
                นักสืบและ Conspirator กดเลือกผู้ต้องสงสัย 1 คนในหน้าจอด้านล่าง (ผู้ตั้งโจทย์ไม่ต้องโหวต)
              </span>
            </div>
          </div>
        </div>

        {isMeActivePlayer ? (
          <div className="p-8 bg-white border border-amber-200 rounded-3xl text-center space-y-3 shadow-sm">
            <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-bold text-2xl flex items-center justify-center mx-auto">
              👑
            </span>
            <h3 className="text-base font-black text-slate-900">
              คุณคือผู้ตั้งโจทย์ (Informer)
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              ตามกติกา Detective Club ผู้ตั้งโจทย์จะไม่ลงคะแนนโหวต (คุณจะได้{' '}
              <strong>+4 VP</strong> ร่วมกับ Conspirator หากมีนักสืบจับตัว Conspirator ได้ไม่เกิน 1 คน!)
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-amber-800">
              ลงคะแนนแล้ว {Object.keys(votes).length} / {requiredVoters.length} คน
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white border border-amber-200 rounded-3xl space-y-5 shadow-sm">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                คุณคิดว่าใครคือ Conspirator ที่ไม่ได้รับคำศัพท์ลับ?
              </h3>
              <p className="text-xs text-slate-500">
                {isConspirator
                  ? 'คุณคือ Conspirator! กดโหวตชี้ตัวคนอื่นเพื่อตีเนียนเป็นนักสืบได้เลย'
                  : 'หากคุณโหวตถูกตัว Conspirator คุณจะได้รับ +3 VP ทันที!'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {eligibleSuspects.map((suspect) => {
                const isSelected =
                  (hasVoted ? votes[currentUid] : selectedSuspectId) ===
                  suspect.id;
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
                      <div className="text-[11px] text-slate-500">
                        ผู้ต้องสงสัย (วางไพ่บนโต๊ะ 2 ใบ)
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="max-w-xs mx-auto pt-1">
              <button
                type="button"
                disabled={!selectedSuspectId || hasVoted || isLoading}
                onClick={handleVoteSubmit}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-amber-950 font-black text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                {hasVoted
                  ? '✓ คุณยืนยันผลโหวตเรียบร้อยแล้ว'
                  : 'ยืนยันการโหวตชี้ตัว Conspirator'}
              </button>
            </div>
          </div>
        )}

        {/* Live Voter Progress Strip */}
        <div className="p-4 bg-white border border-amber-200 rounded-2xl space-y-2">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>สถานะการโหวตของผู้เล่นในโต๊ะ</span>
            <span className="font-mono text-amber-800">
              {Object.keys(votes).length}/{requiredVoters.length} คน
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {requiredVoters.map((voter) => {
              const voted = Boolean(votes[voter.id]);
              return (
                <span
                  key={voter.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    voted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-stone-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {voter.name}: {voted ? '✓ โหวตแล้ว' : '⏳ กำลังตัดสินใจ'}
                </span>
              );
            })}
          </div>
        </div>
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
              Conspirator ตัวจริงคือ: คุณ {summary?.conspiratorName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              คำศัพท์ลับประจำรอบที่ {roundNumber} คือ:{' '}
              <strong className="text-amber-950">
                &ldquo;{summary?.secretWord}&rdquo;
              </strong>
            </p>
          </div>

          {/* Official Scoring Rules Summary Banner */}
          <div className="max-w-2xl mx-auto pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left text-[11px] text-slate-700">
            <div className="p-2.5 bg-white/80 border border-amber-200/80 rounded-xl">
              <strong className="text-emerald-800 block">
                🕵️ นักสืบที่ทายถูก
              </strong>
              <span>ได้คนละ +3 VP เสมอไม่ว่าจะมีกี่คน</span>
            </div>
            <div className="p-2.5 bg-white/80 border border-amber-200/80 rounded-xl">
              <strong className="text-rose-800 block">
                🎭 ถ้าคนทายถูก 0–1 คน
              </strong>
              <span>Conspirator +5 VP · ผู้ตั้งโจทย์ +4 VP</span>
            </div>
            <div className="p-2.5 bg-white/80 border border-amber-200/80 rounded-xl">
              <strong className="text-slate-800 block">
                🚨 ถ้าคนทายถูก ≥ 2 คน
              </strong>
              <span>Conspirator 0 VP · ผู้ตั้งโจทย์ 0 VP</span>
            </div>
          </div>
        </div>

        {/* Physical Card Cleanup & Refill Reminder Banner */}
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3">
          <span className="p-2.5 bg-amber-400 text-amber-950 rounded-xl shrink-0">
            <Hand className="w-5 h-5" />
          </span>
          <div className="text-xs space-y-1">
            <span className="font-black text-amber-950 block text-sm">
              🃏 สิ่งที่ต้องทำบนโต๊ะจริงก่อนเริ่มรอบถัดไป (Physical Deck Reset)
            </span>
            <p className="text-slate-700 leading-relaxed">
              1. ให้ผู้เล่นทุกคนเก็บไพ่รูปภาพจริง 2 ใบที่วางอยู่หน้าตัวเองแยกไปไว้กองทิ้ง{' '}
              <br />
              2. <strong>จั่วไพ่รูปภาพใบใหม่จากกองกลางคนละ 2 ใบ</strong>{' '}
              เพื่อให้ทุกคนกลับมามีไพ่ในมือครบ <strong>6 ใบ</strong> เท่าเดิม
            </p>
          </div>
        </div>

        {/* Victory Points Standings Grid */}
        <div className="p-6 bg-white border border-amber-200 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900">
                ตารางคะแนนสะสม (จบการสืบสวนรอบที่ {roundNumber})
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
                disabled={isLoading}
                onClick={onRematch}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  ทุกคนจั่วไพ่ครบ 6 ใบแล้ว → เริ่มรอบที่ {roundNumber + 1} (สลับผู้ตั้งโจทย์)
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
