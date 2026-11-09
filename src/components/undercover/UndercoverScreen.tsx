import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { UndercoverPhases } from './UndercoverPhases';
import { UndercoverLobby } from './UndercoverLobby';
import { UndercoverTopBar } from './UndercoverTopBar';
import { UndercoverActiveRoomHeader } from './UndercoverActiveRoomHeader';
import { UndercoverInvitesBanner } from './UndercoverInvitesBanner';
import { ShareRoomModal } from '../common/ShareRoomModal';
import { GameHubScreen } from '../common/GameHubScreen';
import { DisbandRoomConfirmModal } from '../common/DisbandRoomConfirmModal';
import { GameSceneTransition } from '../transitions/GameSceneTransition';
import { useRoomTransition } from '../../hooks/useRoomTransition';
import {
  FirestoreRoom,
  FirestorePlayer,
  GamePhase,
  createTableRoom,
  findRoomByCode,
  joinTableRoom,
  togglePlayerReady,
  addPracticeTablemate,
  removePlayer,
  deleteTableRoom,
  addFriendToRoomSeat,
  cleanupHostPreviousRooms,
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
  UndercoverWordCategoryId,
  UndercoverWordPair,
} from '../../data/undercoverWords';
import { tableAudio } from '../../utils/tableAudio';

export interface UndercoverScreenProps {
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

const UNDERCOVER_PHASE_LABELS: Partial<
  Record<GamePhase, { label: string; color: string }>
> = {
  lobby: {
    label: 'STEP 1 · ตั้งโต๊ะ (4-10 คน)',
    color: 'text-emerald-800 bg-emerald-100 border-emerald-200',
  },
  undercover_deal: {
    label: 'STEP 2 · แจกการ์ดคำลับ',
    color: 'text-violet-900 bg-violet-100 border-violet-200',
  },
  undercover_clue: {
    label: 'STEP 3 · ผลัดกันบอกคำใบ้',
    color: 'text-amber-900 bg-amber-100 border-amber-200',
  },
  undercover_vote: {
    label: 'STEP 4 · โหวตคัดสายลับออก',
    color: 'text-rose-900 bg-rose-100 border-rose-200',
  },
  undercover_mrwhite_guess: {
    label: 'STEP 4 · Mr. White ทายคำลับ',
    color: 'text-orange-900 bg-orange-100 border-orange-200',
  },
  undercover_game_over: {
    label: 'STEP 5 · เฉลยคำคู่ & สรุปผล',
    color: 'text-purple-900 bg-purple-100 border-purple-200',
  },
};

export const UndercoverScreen: React.FC<UndercoverScreenProps> = ({
  currentUser,
  friends,
  pendingFriendRequestsCount,
  roomInvites,
  rooms,
  initialRoomCode = '',
  onBackToCatalog,
  onOpenFriendModal,
  onActiveRoomChange,
}) => {
  const undercoverRooms = rooms.filter((r) => r.gameId === 'undercover');

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState<string>(initialRoomCode);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDisbandModalOpen, setIsDisbandModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Common Room Transition Hook
  const {
    transitionProps,
    isCodeInputError,
    clearCodeInputError,
    runCreateRoomTransition,
    runJoinRoomTransition,
    runLeaveRoomTransition,
    runStartGameTransition,
  } = useRoomTransition('undercover');

  // Lobby Settings Local States
  const [enableMrWhite, setEnableMrWhite] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] =
    useState<UndercoverWordCategoryId>('all');
  const [clueTimerSeconds, setClueTimerSeconds] = useState<number>(45);

  // Gemini AI Word Generation State
  const [aiCustomTopic, setAiCustomTopic] = useState<string>('');
  const [isGeneratingAiWords, setIsGeneratingAiWords] =
    useState<boolean>(false);
  const [aiGeneratedPair, setAiGeneratedPair] =
    useState<UndercoverWordPair | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick join if passed an initial code
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      handleJoinByCode(initialRoomCode.trim());
    }
  }, [initialRoomCode]);

  // Clean up any stale rooms previously hosted by current user
  useEffect(() => {
    const myHosted = rooms.filter((r) => r.hostId === currentUser.uid);
    if (myHosted.length > 1) {
      const keepId = selectedRoomId || myHosted[0].id;
      cleanupHostPreviousRooms(currentUser.uid, keepId);
    }
  }, [rooms, currentUser.uid, selectedRoomId]);

  // Real-time listener for current active room & players
  useEffect(() => {
    if (!selectedRoomId) {
      setCurrentRoom(null);
      setPlayers([]);
      onActiveRoomChange?.(null);
      return;
    }

    const unsubRoom = listenToRoom(selectedRoomId, (updatedRoom) => {
      setCurrentRoom(updatedRoom);
      onActiveRoomChange?.(updatedRoom);
      if (updatedRoom) {
        if (typeof updatedRoom.enableMrWhite === 'boolean') {
          setEnableMrWhite(updatedRoom.enableMrWhite);
        }
        if (updatedRoom.undercoverCategory) {
          setSelectedCategory(
            updatedRoom.undercoverCategory as UndercoverWordCategoryId
          );
        }
        if (updatedRoom.clueDurationSeconds) {
          setClueTimerSeconds(updatedRoom.clueDurationSeconds);
        }
      }
    });

    const unsubPlayers = listenToRoomPlayers(selectedRoomId, (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [selectedRoomId]);

  // Game Over Fanfare & Confetti
  useEffect(() => {
    if (currentRoom?.status === 'undercover_game_over') {
      const myPlayer = players.find((p) => p.id === currentUser.uid);
      const isWinner =
        (currentRoom.winnerTeam === 'civilians' &&
          myPlayer?.role === 'undercover_civilian') ||
        (currentRoom.winnerTeam === 'undercover' &&
          myPlayer?.role === 'undercover_spy') ||
        (currentRoom.winnerTeam === 'mr_white' &&
          myPlayer?.role === 'undercover_mrwhite');

      if (soundEnabled) {
        tableAudio.playDramaticReveal(Boolean(isWinner));
      }
      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  }, [currentRoom?.status, currentRoom?.winnerTeam, players, currentUser.uid, soundEnabled]);

  const isHost = currentRoom?.hostId === currentUser.uid;

  // Create Room with Transition
  const handleCreateTable = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runCreateRoomTransition(async () => {
      const created = await createTableRoom(
        currentUser.accountName,
        'undercover',
        `โต๊ะสายลับของ ${currentUser.accountName}`,
        10
      );
      setCurrentRoom(created);
      setSelectedRoomId(created.id);
      setPlayers([
        {
          id: currentUser.uid,
          name: currentUser.accountName,
          isHost: true,
          isReady: true,
          joinedAt: new Date().toISOString(),
        },
      ]);
      onActiveRoomChange?.(created);
      setAiGeneratedPair(null);
      if (soundEnabled) tableAudio.playDiceRoll();
      showToast(`เปิดห้อง #${created.roomCode} สำเร็จ! เข้าสู่ห้องรอผู้เล่นแล้ว`);
      return created;
    });

    setIsLoading(false);
  };

  // Join existing room with Transition
  const handleSelectAndJoinRoom = async (room: FirestoreRoom) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runJoinRoomTransition(room.roomCode, async () => {
      await joinTableRoom(room.id, currentUser.accountName);
      setCurrentRoom(room);
      setSelectedRoomId(room.id);
      if (soundEnabled) tableAudio.playDiceRoll();
      return room;
    });

    setIsLoading(false);
  };

  // Join by 4-Digit Code
  const handleJoinByCode = async (codeToJoin?: string) => {
    const clean = (codeToJoin ?? joinCodeInput).trim();
    if (!clean || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runJoinRoomTransition(clean, async () => {
      if (clean.startsWith('room_')) {
        await joinTableRoom(clean, currentUser.accountName);
        setSelectedRoomId(clean);
        setJoinCodeInput('');
        if (soundEnabled) tableAudio.playDiceRoll();
        return { roomCode: clean };
      }

      if (clean.length !== 4) {
        const msg = 'กรุณากรอกรหัสห้อง 4 หลักให้ครบถ้วน';
        setErrorMessage(msg);
        throw new Error(msg);
      }

      const foundRoom = await findRoomByCode(clean);
      if (!foundRoom) {
        const msg = `ไม่พบห้องรหัส "${clean}" กรุณาตรวจสอบรหัสห้องอีกครั้ง`;
        setErrorMessage(msg);
        throw new Error(msg);
      }

      await joinTableRoom(foundRoom.id, currentUser.accountName);
      setCurrentRoom(foundRoom);
      setSelectedRoomId(foundRoom.id);
      setJoinCodeInput('');
      if (soundEnabled) tableAudio.playDiceRoll();
      return foundRoom;
    });

    setIsLoading(false);
  };

  const handleInviteFriendToRoom = async (friend: UserProfile) => {
    if (!currentRoom) return;
    setErrorMessage(null);
    try {
      await addFriendToRoomSeat(currentRoom.id, friend);
      await sendRoomInviteToFriend(currentRoom, currentUser, friend.uid);
      showToast(
        `ดึงเพื่อน "${friend.accountName}" เข้าห้อง #${currentRoom.roomCode} เรียบร้อยแล้ว!`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถชวนเพื่อนเข้าห้องได้'
      );
    }
  };

  const handleAcceptRoomInvite = async (invite: RoomInviteDoc) => {
    await dismissRoomInvite(invite.id);
    await handleJoinByCode(invite.roomCode);
  };

  const handleDeleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTableRoom(roomId);
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
      }
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  const handleToggleReady = async () => {
    if (!currentRoom) return;
    const myPlayer = players.find((p) => p.id === currentUser.uid);
    try {
      await togglePlayerReady(currentRoom.id, !myPlayer?.isReady);
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch {
      // Ignore
    }
  };

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

  const handleRemovePlayer = async (playerId: string) => {
    if (!currentRoom || !isHost) return;
    try {
      await removePlayer(currentRoom.id, playerId);
    } catch {
      // Ignore
    }
  };

  // Leave / Close Room with Transition
  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    const targetRoom = currentRoom;
    const hostLeaving = targetRoom.hostId === currentUser.uid;

    await runLeaveRoomTransition(targetRoom.roomCode, async () => {
      setSelectedRoomId(null);
      setCurrentRoom(null);
      setPlayers([]);
      try {
        await leaveOrCloseTableRoom(targetRoom.id, targetRoom.hostId);
        showToast(
          hostLeaving
            ? `ยุบห้อง #${targetRoom.roomCode} เรียบร้อยแล้ว`
            : `ออกจากห้อง #${targetRoom.roomCode} แล้ว`
        );
      } catch {
        // Ignore
      }
    });
  };

  // Safe Back to Catalog Intercept
  const handleBackToCatalogClick = async () => {
    if (!currentRoom) {
      onBackToCatalog();
      return;
    }
    if (currentRoom.hostId === currentUser.uid) {
      setIsDisbandModalOpen(true);
    } else {
      await handleLeaveRoom();
      onBackToCatalog();
    }
  };

  const handleConfirmDisbandAndExit = async () => {
    setIsDisbandModalOpen(false);
    await handleLeaveRoom();
    onBackToCatalog();
  };

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
      showToast('สร้างคำคู่ภาษาไทยสดด้วย Gemini เรียบร้อยแล้ว!');
    } catch {
      setErrorMessage(
        'การเชื่อมต่อ Gemini ล่าช้า สลับไปใช้คู่คำเริ่มต้นจากระบบแทน'
      );
    } finally {
      setIsGeneratingAiWords(false);
    }
  };

  // Start Game with Transition
  const handleStartGame = async () => {
    if (!currentRoom || !isHost || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runStartGameTransition(currentRoom.roomCode, async () => {
      await startUndercoverGameAndDealRoles(currentRoom.id);
      if (soundEnabled) tableAudio.playMorningGong();
    });

    setIsLoading(false);
  };

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

  const handleSubmitClue = async (clueText: string) => {
    if (!currentRoom) return;
    try {
      await submitUndercoverClue(currentRoom.id, clueText);
      if (soundEnabled) tableAudio.playDiceRoll();
    } catch {
      // Ignore
    }
  };

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50/70 via-[#FDFBFF] to-indigo-50/40 text-slate-800 w-full max-w-full overflow-x-hidden">
      {/* Common Portal Scene Transition for Create/Join/Leave/Start */}
      <GameSceneTransition {...transitionProps} />

      {/* Top Navigation Bar Subcomponent */}
      <UndercoverTopBar
        currentRoom={currentRoom}
        currentUser={currentUser}
        friendsCount={friends.length}
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        onBackClick={handleBackToCatalogClick}
        onOpenFriendModal={onOpenFriendModal}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-40 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Incoming Room Invites Banner Subcomponent */}
        <UndercoverInvitesBanner
          roomInvites={roomInvites}
          onAcceptInvite={handleAcceptRoomInvite}
          onDismissInvite={dismissRoomInvite}
        />

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!currentRoom ? (
            <GameHubScreen
              key="undercover-hub"
              variant="undercover"
              emoji="🕶️"
              tagText="Word Spy Party · 4–10 คน · สายลับสลับคำ & Mr. White"
              title="สายลับสลับคำ (Undercover)"
              description="ทุกคนจะได้รับคำลับภาษาไทยที่คล้ายกัน ยกเว้นสายลับ (Undercover) ที่ได้คำต่างออกไป และ Mr. White ที่ไม่ได้คำอะไรเลย! ผลัดกันบอกคำใบ้ จับผิด และโหวตคัดออก"
              createButtonLabel="+ สร้างห้องใหม่ (โฮสต์โต๊ะ 4–10 คน)"
              activeRoomsTitle="โต๊ะ Undercover ที่เปิดรอผู้เล่น"
              emptyRoomsTitle="ยังไม่มีโต๊ะ Undercover ที่เปิดอยู่ขณะนี้"
              emptyRoomsSubtitle='กดปุ่ม "+ สร้างห้องใหม่" ด้านบนเพื่อเปิดโต๊ะแรก แล้วชวนเพื่อนเข้ามาสนุกด้วยกันได้เลย'
              rooms={undercoverRooms}
              phaseLabels={UNDERCOVER_PHASE_LABELS}
              currentUid={currentUser.uid}
              friends={friends}
              quickJoinCode={joinCodeInput}
              isLoading={isLoading}
              isCodeInputError={isCodeInputError}
              onQuickJoinCodeChange={(val) => {
                clearCodeInputError();
                setJoinCodeInput(val);
              }}
              onCreateRoom={handleCreateTable}
              onJoinByCode={(code) => handleJoinByCode(code)}
              onSelectAndJoinRoom={handleSelectAndJoinRoom}
              onDeleteRoom={handleDeleteRoom}
              onOpenFriendModal={onOpenFriendModal}
            />
          ) : (
            <motion.div
              key={`undercover-room-${currentRoom.id}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="max-w-4xl mx-auto w-full bg-gradient-to-b from-violet-50/80 via-white to-indigo-50/40 border border-violet-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5"
            >
              {/* Active Room Header Subcomponent */}
              <UndercoverActiveRoomHeader
                roomCode={currentRoom.roomCode}
                roomName={currentRoom.roomName}
                hostName={currentRoom.hostName}
                isHost={isHost}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled((prev) => !prev)}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onLeaveRoom={handleLeaveRoom}
              />

              <AnimatePresence mode="wait">
                {currentRoom.status === 'lobby' ? (
                  <motion.div
                    key="undercover-lobby-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UndercoverLobby
                      currentRoom={currentRoom}
                      players={players}
                      currentUser={currentUser}
                      friends={friends}
                      isHost={isHost}
                      enableMrWhite={enableMrWhite}
                      selectedCategory={selectedCategory}
                      clueTimerSeconds={clueTimerSeconds}
                      aiCustomTopic={aiCustomTopic}
                      isGeneratingAiWords={isGeneratingAiWords}
                      aiGeneratedPair={aiGeneratedPair}
                      isLoading={isLoading}
                      onOpenShareModal={() => setIsShareModalOpen(true)}
                      onOpenFriendModal={onOpenFriendModal}
                      onInviteFriend={handleInviteFriendToRoom}
                      onToggleMrWhite={(enabled) => {
                        setEnableMrWhite(enabled);
                        handleSaveLobbySettings(
                          enabled,
                          selectedCategory,
                          clueTimerSeconds
                        );
                      }}
                      onSelectCategory={(cat) => {
                        setSelectedCategory(cat);
                        handleSaveLobbySettings(
                          enableMrWhite,
                          cat,
                          clueTimerSeconds
                        );
                      }}
                      onSelectClueTimer={(sec) => {
                        setClueTimerSeconds(sec);
                        handleSaveLobbySettings(
                          enableMrWhite,
                          selectedCategory,
                          sec
                        );
                      }}
                      onAiCustomTopicChange={setAiCustomTopic}
                      onGenerateAiWords={handleGenerateAiWords}
                      onAddBot={handleAddBot}
                      onRemovePlayer={handleRemovePlayer}
                      onToggleReady={handleToggleReady}
                      onStartGame={handleStartGame}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`undercover-phase-${currentRoom.status}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Share Room Modal & Disband Confirmation */}
      {currentRoom && (
        <>
          <ShareRoomModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            roomId={currentRoom.id}
            roomCode={currentRoom.roomCode}
            roomName={currentRoom.roomName || 'สายลับสลับคำ (Undercover)'}
          />
          <DisbandRoomConfirmModal
            isOpen={isDisbandModalOpen}
            roomCode={currentRoom.roomCode}
            gameTitle="สายลับสลับคำ (Undercover)"
            isLoading={isLoading}
            onConfirmDisband={handleConfirmDisbandAndExit}
            onClose={() => setIsDisbandModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
