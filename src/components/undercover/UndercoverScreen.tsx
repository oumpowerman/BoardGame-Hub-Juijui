import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Users,
  Plus,
  KeyRound,
  Trash2,
  AlertCircle,
  X,
  UserPlus,
  Bell,
  LogOut,
  CheckCircle2,
  QrCode,
  Volume2,
  VolumeX,
  Radio,
  Hourglass,
  Sparkles,
  Play,
  Bot,
  Crown,
  Shield,
  HelpCircle,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { UndercoverPhases } from './UndercoverPhases';
import { ShareRoomModal } from '../common/ShareRoomModal';
import {
  FirestoreRoom,
  FirestorePlayer,
  createTableRoom,
  findRoomByCode,
  joinTableRoom,
  togglePlayerReady,
  addPracticeTablemate,
  removePlayer,
  deleteTableRoom,
  addFriendToRoomSeat,
  leaveOrCloseTableRoom,
  listenToRoom,
  listenToRoomPlayers,
  updateUndercoverLobbySettings,
  setUndercoverWordPair,
  startUndercoverGameAndDealRoles,
  acknowledgeUndercoverRole,
  submitUndercoverClue,
  submitUndercoverVote,
  submitMrWhiteGuess,
  rematchUndercoverGame,
} from '../../firebase/tableService';
import {
  UserProfile,
  RoomInviteDoc,
  sendRoomInviteToFriend,
  dismissRoomInvite,
} from '../../firebase/userService';
import {
  UNDERCOVER_CATEGORIES,
  UndercoverWordCategoryId,
  UndercoverWordPair,
} from '../../data/undercoverWords';
import { tableAudio } from '../../utils/tableAudio';

interface UndercoverScreenProps {
  currentUser: UserProfile;
  friends: UserProfile[];
  pendingFriendRequestsCount: number;
  roomInvites: RoomInviteDoc[];
  rooms: FirestoreRoom[];
  initialRoomCode?: string;
  onBackToCatalog: () => void;
  onOpenFriendModal: () => void;
  onActiveRoomChange?: (room: FirestoreRoom | null) => void;
}

export const UndercoverScreen: React.FC<UndercoverScreenProps> = ({
  currentUser,
  friends,
  pendingFriendRequestsCount,
  roomInvites,
  rooms,
  initialRoomCode,
  onBackToCatalog,
  onOpenFriendModal,
  onActiveRoomChange,
}) => {
  const [currentRoom, setCurrentRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Lobby Configuration states
  const [enableMrWhite, setEnableMrWhite] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] =
    useState<UndercoverWordCategoryId>('all');
  const [clueTimerSeconds, setClueTimerSeconds] = useState<number>(45);

  // AI Gemini Generation state
  const [isGeneratingAiWords, setIsGeneratingAiWords] = useState<boolean>(false);
  const [aiCustomTopic, setAiCustomTopic] = useState<string>('');
  const [aiGeneratedPair, setAiGeneratedPair] = useState<UndercoverWordPair | null>(
    null
  );

  const isHost = currentRoom?.hostId === currentUser.uid;
  const myPlayer = players.find((p) => p.id === currentUser.uid);

  // Sync active room back to App for global friend invites
  useEffect(() => {
    onActiveRoomChange?.(currentRoom);
  }, [currentRoom, onActiveRoomChange]);

  // Auto-join from initialRoomCode
  useEffect(() => {
    if (initialRoomCode && !currentRoom) {
      handleJoinByCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Listen to Room updates
  useEffect(() => {
    if (!currentRoom?.id) return;
    const unsub = listenToRoom(currentRoom.id, (updated) => {
      if (updated) {
        setCurrentRoom(updated);
        if (updated.enableMrWhite !== undefined) {
          setEnableMrWhite(updated.enableMrWhite);
        }
        if (updated.undercoverCategory) {
          setSelectedCategory(
            updated.undercoverCategory as UndercoverWordCategoryId
          );
        }
        if (updated.clueDurationSeconds) {
          setClueTimerSeconds(updated.clueDurationSeconds);
        }
      } else {
        // Room was deleted
        setCurrentRoom(null);
        setPlayers([]);
      }
    });
    return () => unsub();
  }, [currentRoom?.id]);

  // Listen to Players updates
  useEffect(() => {
    if (!currentRoom?.id) return;
    const unsub = listenToRoomPlayers(currentRoom.id, (livePlayers) => {
      setPlayers(livePlayers);
    });
    return () => unsub();
  }, [currentRoom?.id]);

  // Confetti when game concludes
  useEffect(() => {
    if (currentRoom?.status === 'undercover_game_over') {
      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore canvas-confetti error in unsupported environments
      }
    }
  }, [currentRoom?.status]);

  // 1. Create Room
  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const room = await createTableRoom(currentUser.accountName, 'undercover');
      setCurrentRoom(room);
      if (soundEnabled) tableAudio.playMorningGong();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถสร้างห้องได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Join Room by Code
  const handleJoinByCode = async (targetCode: string) => {
    const code = targetCode.trim().toUpperCase();
    if (!code) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const foundRoom = await findRoomByCode(code);
      if (!foundRoom) {
        throw new Error(`ไม่พบห้องรหัส #${code}`);
      }
      await joinTableRoom(foundRoom.id, currentUser.accountName);
      setCurrentRoom(foundRoom);
      setJoinCodeInput('');
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเข้าร่วมห้องได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Toggle Ready
  const handleToggleReady = async () => {
    if (!currentRoom) return;
    try {
      await togglePlayerReady(currentRoom.id, !myPlayer?.isReady);
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch {
      // Ignore
    }
  };

  // 4. Add Bot Seat
  const handleAddBot = async () => {
    if (!currentRoom) return;
    try {
      await addPracticeTablemate(currentRoom.id);
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเพิ่มผู้เล่นบอทได้'
      );
    }
  };

  // 5. Kick / Remove Player
  const handleRemovePlayer = async (playerId: string) => {
    if (!currentRoom || !isHost) return;
    try {
      await removePlayer(currentRoom.id, playerId);
    } catch {
      // Ignore
    }
  };

  // 6. Delete / Leave Room
  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    setIsLoading(true);
    try {
      await leaveOrCloseTableRoom(currentRoom.id, currentRoom.hostId);
      setCurrentRoom(null);
      setPlayers([]);
    } catch {
      setCurrentRoom(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Update Lobby Rule Settings
  const handleSaveLobbySettings = async (
    newMrWhite: boolean,
    newCat: UndercoverWordCategoryId,
    newTimer: number
  ) => {
    if (!currentRoom || !isHost) return;
    try {
      await updateUndercoverLobbySettings(
        currentRoom.id,
        newMrWhite,
        newCat,
        newTimer
      );
    } catch {
      // Ignore
    }
  };

  // 8. Generate Words via Server-Side Gemini 3.8 Flash
  const handleGenerateAiWords = async () => {
    if (!currentRoom || !isHost) return;
    setIsGeneratingAiWords(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/undercover/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          themePrompt: aiCustomTopic.trim(),
        }),
      });
      if (!res.ok) throw new Error('API server returned error');
      const data = (await res.json()) as UndercoverWordPair;
      setAiGeneratedPair(data);
      await setUndercoverWordPair(currentRoom.id, data);
      if (soundEnabled) tableAudio.playMorningGong();
    } catch (err) {
      setErrorMessage(
        'การเชื่อมต่อ Gemini ล่าช้า สลับไปใช้คู่คำเริ่มต้นจากระบบแทน'
      );
    } finally {
      setIsGeneratingAiWords(false);
    }
  };

  // 9. Start Game
  const handleStartGame = async () => {
    if (!currentRoom || !isHost) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await startUndercoverGameAndDealRoles(currentRoom.id);
      if (soundEnabled) tableAudio.playMorningGong();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเริ่มเกมได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 10. Acknowledge Role
  const handleAcknowledgeRole = async () => {
    if (!currentRoom) return;
    setIsLoading(true);
    try {
      await acknowledgeUndercoverRole(currentRoom.id);
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  // 11. Submit Clue
  const handleSubmitClue = async (clueText: string) => {
    if (!currentRoom) return;
    try {
      await submitUndercoverClue(currentRoom.id, clueText);
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch {
      // Ignore
    }
  };

  // 12. Submit Elimination Vote
  const handleSubmitVote = async (targetId: string) => {
    if (!currentRoom) return;
    setIsLoading(true);
    try {
      await submitUndercoverVote(currentRoom.id, targetId);
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  // 13. Mr. White Guess
  const handleSubmitMrWhiteGuess = async (guessedWord: string) => {
    if (!currentRoom) return;
    setIsLoading(true);
    try {
      await submitMrWhiteGuess(currentRoom.id, guessedWord);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  // 14. Rematch Game
  const handleRematch = async () => {
    if (!currentRoom || !isHost) return;
    setIsLoading(true);
    try {
      await rematchUndercoverGame(currentRoom.id);
      setAiGeneratedPair(null);
      if (soundEnabled) tableAudio.playMorningGong();
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#090D16]/90 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToCatalog}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="กลับสู่คลังบอร์ดเกม"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400">
                🕶️
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>สายลับสลับคำ (Undercover)</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-700 text-indigo-300">
                    MASTER SERVER
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  ปาร์ตี้เกมสืบสวนและสลับคำ · รองรับ 4–10 คน
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentRoom && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>ชวนเพื่อน (#{currentRoom.roomCode})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {currentRoom && (
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isHost ? 'ปิดห้อง' : 'ออกจากห้อง'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!currentRoom ? (
          /* ========================================================= */
          /* NO ROOM: Create Room or Join by 4-digit Code Screen       */
          /* ========================================================= */
          <div className="space-y-8 max-w-2xl mx-auto py-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-mono text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>พร้อมฟีเจอร์ AI คิดคำคู่สดจาก Gemini 3.8 Flash</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                สายลับสลับคำ (Undercover)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                จับโกหกคำศัพท์ สวมรอย และค้นหาว่าใครคือสายลับที่ได้คำต่างจากคนอื่น หรือใครคือ Mr. White ที่ไม่รู้อะไรเลย!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Create Table */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-xl">
                    👑
                  </div>
                  <h3 className="text-lg font-bold text-white">สร้างห้องเล่นใหม่</h3>
                  <p className="text-xs text-slate-400">
                    เป็นโฮสต์คุมห้อง ตั้งกติกา เปิด-ปิด Mr. White และชวนเพื่อนหรือดึงบอทมาเล่นด้วยกัน
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างห้อง Undercover</span>
                </button>
              </div>

              {/* Card 2: Join by 4-Digit Code */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                    🔑
                  </div>
                  <h3 className="text-lg font-bold text-white">เข้าร่วมด้วยรหัสห้อง</h3>
                  <p className="text-xs text-slate-400">
                    กรอกรหัสห้อง 4 หลักที่เพื่อนส่งให้เพื่อเข้าร่วมโต๊ะทันที
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="เช่น 7A2B"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-white uppercase outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinByCode(joinCodeInput)}
                    disabled={joinCodeInput.trim().length !== 4 || isLoading}
                    className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                  >
                    <span>เข้าร่วมโต๊ะ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : currentRoom.status === 'lobby' ? (
          /* ========================================================= */
          /* LOBBY VIEW: Seats, Bot Add, Rules & AI Word Generation    */
          /* ========================================================= */
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Lobby Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 backdrop-blur-md">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                  <Crown className="w-3.5 h-3.5" />
                  <span>โฮสต์ห้อง: {currentRoom.hostName}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  โต๊ะ Undercover #{currentRoom.roomCode}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  ผู้เล่นในห้อง {players.length} / {currentRoom.maxPlayers || 10} คน (ต้องการขั้นต่ำ 4 คนเพื่อเริ่มเกม)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>QR Code ห้อง</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenFriendModal}
                  className="px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-xs font-semibold text-indigo-200 flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-indigo-300" />
                  <span>ดึงเพื่อนเข้าโต๊ะ ({friends.length})</span>
                </button>
              </div>
            </div>

            {/* Lobby Settings (Host Only Control) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>การตั้งค่ากติกา & คลังคำศัพท์</span>
                </h3>
                {!isHost && (
                  <span className="text-xs text-slate-500">
                    (เฉพาะโฮสต์ที่ปรับแต่งได้)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Rule 1: Toggle Mr. White */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>บทบาท Mr. White</span>
                    <span className="text-[10px] font-mono text-amber-400">
                      {enableMrWhite ? 'เปิดใช้งาน' : 'ปิด'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    มีผู้เล่น 1 คนที่ไม่รู้คำลับ และสามารถทายคำของพลเมืองเพื่อชนะได้
                  </p>
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = !enableMrWhite;
                        setEnableMrWhite(next);
                        handleSaveLobbySettings(next, selectedCategory, clueTimerSeconds);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        enableMrWhite
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                          : 'bg-slate-700 border-slate-600 text-slate-400'
                      }`}
                    >
                      {enableMrWhite ? '✓ มี Mr. White ในเกม' : '✕ ไม่มี Mr. White'}
                    </button>
                  )}
                </div>

                {/* Rule 2: Word Category Selection */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    หมวดหมู่คำคู่เปรียบเทียบ
                  </div>
                  <p className="text-[11px] text-slate-400">
                    เลือกหมวดหมู่คำภาษาไทยในชีวิตประจำวัน
                  </p>
                  {isHost ? (
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const cat = e.target.value as UndercoverWordCategoryId;
                        setSelectedCategory(cat);
                        handleSaveLobbySettings(enableMrWhite, cat, clueTimerSeconds);
                      }}
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white outline-none cursor-pointer"
                    >
                      {UNDERCOVER_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs font-bold text-indigo-300">
                      {UNDERCOVER_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'ทุกหมวดหมู่'}
                    </div>
                  )}
                </div>

                {/* Rule 3: Clue Round Timer Duration */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    เวลาบอกคำใบ้ต่อคน
                  </div>
                  <p className="text-[11px] text-slate-400">
                    เวลานับถอยหลังต่อเทิร์นการพูดใบ้
                  </p>
                  {isHost ? (
                    <div className="flex items-center gap-1.5">
                      {[30, 45, 60].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setClueTimerSeconds(sec);
                            handleSaveLobbySettings(enableMrWhite, selectedCategory, sec);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                            clueTimerSeconds === sec
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs font-mono font-bold text-slate-200">
                      {clueTimerSeconds} วินาที
                    </div>
                  )}
                </div>
              </div>

              {/* Gemini 3.8 Flash AI Word Generator Sub-panel */}
              {isHost && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-800/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>สร้างคำคู่ภาษาไทยสดใหม่ด้วย Gemini 3.8 Flash</span>
                    </div>
                    {aiGeneratedPair && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        ✓ เตรียมคำคู่ AI เรียบร้อย
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={aiCustomTopic}
                      onChange={(e) => setAiCustomTopic(e.target.value)}
                      placeholder="ระบุธีมที่ต้องการ (เช่น สตรีทฟู้ดเยาวราช, ไอที, ซีรีส์) หรือปล่อยว่าง..."
                      className="w-full sm:flex-1 px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingAiWords}
                      onClick={handleGenerateAiWords}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{isGeneratingAiWords ? 'กำลังคิดคำคู่...' : 'สร้างคำคู่สดด้วย AI'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Player Seats Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>รายชื่อที่นั่ง ({players.length} คน)</span>
                </h3>

                {isHost && players.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddBot}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5 text-amber-400" />
                    <span>เพิ่มบอทอัตโนมัติ (+1)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {players.map((p, idx) => {
                  const isMe = p.id === currentUser.uid;
                  const isBotSeat = p.id.startsWith('bot_');

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                        p.isHost
                          ? 'bg-slate-900/90 border-amber-500/50 shadow-md'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1">
                              <span>{p.name}</span>
                              {p.isHost && (
                                <Crown className="w-3 h-3 text-amber-400" />
                              )}
                              {isMe && (
                                <span className="text-[10px] text-amber-400">
                                  (คุณ)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {isBotSeat ? 'บอทจำลอง' : 'ผู้เล่นจริง'}
                            </div>
                          </div>
                        </div>

                        {isHost && !p.isHost && (
                          <button
                            type="button"
                            onClick={() => handleRemovePlayer(p.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="เตะออกจากห้อง"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                        <span className="text-slate-400">สถานะ:</span>
                        <span
                          className={`font-semibold ${
                            p.isReady ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {p.isReady ? '✓ พร้อมแล้ว' : 'กำลังเตรียมตัว'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <div>
                {!isHost && (
                  <button
                    type="button"
                    onClick={handleToggleReady}
                    className={`px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                      myPlayer?.isReady
                        ? 'bg-emerald-950/70 border border-emerald-600 text-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{myPlayer?.isReady ? 'พร้อมแล้ว (กดยกเลิก)' : 'กดพร้อมเล่น'}</span>
                  </button>
                )}
              </div>

              {isHost && (
                <button
                  type="button"
                  disabled={players.length < 4 || isLoading}
                  onClick={handleStartGame}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>
                    {players.length < 4
                      ? `ต้องการผู้เล่นอีก ${4 - players.length} คน`
                      : 'เริ่มเกม & แจกการ์ดคำลับ!'}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* ACTIVE GAME PHASES: Role Reveal, Clue, Vote, Game Over    */
          /* ========================================================= */
          <UndercoverPhases
            currentRoom={currentRoom}
            players={players}
            currentUid={currentUser.uid}
            isLoading={isLoading}
            onAcknowledgeRole={handleAcknowledgeRole}
            onSubmitClue={handleSubmitClue}
            onSubmitVote={handleSubmitVote}
            onSubmitMrWhiteGuess={handleSubmitMrWhiteGuess}
            onRematch={handleRematch}
          />
        )}
      </main>

      {/* Share Room Modal */}
      {currentRoom && (
        <ShareRoomModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roomId={currentRoom.id}
          roomCode={currentRoom.roomCode}
          roomName={currentRoom.roomName || 'สายลับสลับคำ (Undercover)'}
        />
      )}
    </div>
  );
};
