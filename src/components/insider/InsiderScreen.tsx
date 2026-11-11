import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { InsiderPhases } from './InsiderPhases';
import { InsiderLobby } from './InsiderLobby';
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
  updateInsiderLobbySettings,
  startInsiderGameAndDealRoles,
  acknowledgeInsiderRole,
  updateInsiderSecretWord,
  triggerInsiderWakeReveal,
  startInsiderQuizPhase,
  sendMasterQuickSignal,
  confirmWordGuessedByPlayer,
  triggerInsiderQuizTimeout,
  castGuesserJudgmentVote,
  castInsiderGeneralVote,
  resetRoomToPlayAgain,
  listenToRoom,
  listenToRoomPlayers,
  addPracticeTablemate,
  removePlayer,
  deleteTableRoom,
  addFriendToRoomSeat,
  cleanupHostPreviousRooms,
  leaveOrCloseTableRoom,
  forceAcknowledgeAllInsiderRoles,
} from '../../firebase/tableService';
import {
  UserProfile,
  RoomInviteDoc,
  sendRoomInviteToFriend,
  dismissRoomInvite,
} from '../../firebase/userService';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';
import {
  saveActiveRoomSession,
  clearActiveRoomSession,
} from '../../utils/activeRoomPersistence';

// Subcomponents & Custom Hook for Insider
import { InsiderTopBar } from './InsiderTopBar';
import { InsiderSpeakerBar } from './InsiderSpeakerBar';
import { InsiderActiveRoomHeader } from './InsiderActiveRoomHeader';
import { InsiderInvitesBanner } from './InsiderInvitesBanner';
import { useInsiderGameMaster } from './useInsiderGameMaster';

export interface InsiderScreenProps {
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

const INSIDER_PHASE_LABELS: Partial<
  Record<GamePhase, { label: string; color: string }>
> = {
  lobby: {
    label: 'STEP 1 · ตั้งโต๊ะ (4-8 คน)',
    color: 'text-emerald-800 bg-emerald-100 border-emerald-200',
  },
  role_deal: {
    label: 'STEP 2 · แจกบทบาทลับ',
    color: 'text-amber-900 bg-amber-100 border-amber-200',
  },
  word_reveal: {
    label: 'STEP 3 · เปิดดูคำศัพท์ลับ',
    color: 'text-indigo-900 bg-indigo-100 border-indigo-200',
  },
  question_phase: {
    label: 'STEP 4 · ถาม-ตอบทายคำ',
    color: 'text-rose-900 bg-rose-100 border-rose-200',
  },
  discussion_guesser_vote: {
    label: 'STEP 5 (1/2) · โหวตตัดสินคนทายถูก',
    color: 'text-amber-950 bg-amber-200 border-amber-300',
  },
  general_vote: {
    label: 'STEP 5 (2/2) · โหวตชี้ตัว Insider',
    color: 'text-rose-900 bg-rose-100 border-rose-200',
  },
  game_over: {
    label: 'STEP 6 · เฉลย & สรุปผล',
    color: 'text-purple-900 bg-purple-100 border-purple-200',
  },
};

export const InsiderScreen: React.FC<InsiderScreenProps> = ({
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
  const insiderRooms = rooms.filter((r) => r.gameId === 'insider');

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickJoinCode, setQuickJoinCode] = useState<string>(initialRoomCode);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDisbandModalOpen, setIsDisbandModalOpen] = useState<boolean>(false);
  const [customLobbyWord, setCustomLobbyWord] = useState<string>('');

  // Common Room Transition Hook
  const {
    transitionProps,
    isCodeInputError,
    clearCodeInputError,
    runCreateRoomTransition,
    runJoinRoomTransition,
    runLeaveRoomTransition,
    runStartGameTransition,
  } = useRoomTransition('insider');

  // Gameplay Local Interaction States
  const [isPeekingRole, setIsPeekingRole] = useState<boolean>(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string>('');

  // Custom Hook: Game Master TTS Narration, Peek Timer, Quiz Timer & Discussion Timer
  const {
    isHostVoiceEnabled,
    setIsHostVoiceEnabled,
    insiderRevealCountdown,
    setInsiderRevealCountdown,
    insiderRevealStage,
    quizSecondsLeft,
    discussionSecondsLeft,
  } = useInsiderGameMaster({
    activeRoom,
    players,
    currentUid: currentUser.uid,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick join if passed an initial room code
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      handleJoinByIdOrCode(initialRoomCode.trim());
    }
  }, [initialRoomCode]);

  // Clean up any stale lobby rooms previously hosted by current user
  useEffect(() => {
    const myHosted = rooms.filter(
      (r) => r.hostId === currentUser.uid && r.status === 'lobby'
    );
    if (myHosted.length > 1) {
      const keepId = selectedRoomId || myHosted[0].id;
      cleanupHostPreviousRooms(currentUser.uid, keepId);
    }
  }, [rooms, currentUser.uid, selectedRoomId]);

  // Real-time listener for current active room & players
  useEffect(() => {
    if (!selectedRoomId) {
      setActiveRoom(null);
      setPlayers([]);
      onActiveRoomChange?.(null);
      return;
    }

    const unsubRoom = listenToRoom(selectedRoomId, (updatedRoom) => {
      setActiveRoom(updatedRoom);
      onActiveRoomChange?.(updatedRoom);
      if (updatedRoom) {
        saveActiveRoomSession({
          roomId: updatedRoom.id,
          roomCode: updatedRoom.roomCode,
          gameId: 'insider',
        });
      } else {
        clearActiveRoomSession();
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

  // Create Insider Room with Transition
  const handleCreateRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runCreateRoomTransition(async () => {
      const created = await createTableRoom(
        currentUser.accountName,
        'insider',
        `โต๊ะ Insider ของ ${currentUser.accountName}`,
        8
      );
      setActiveRoom(created);
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
      setSelectedVoteTarget('');
      setIsPeekingRole(false);
      showToast(`เปิดห้อง #${created.roomCode} สำเร็จ! เข้าสู่ห้องรอผู้เล่นแล้ว`);
      return created;
    });

    setIsLoading(false);
  };

  // Join existing room card with Transition
  const handleSelectAndJoinRoom = async (room: FirestoreRoom) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runJoinRoomTransition(room.roomCode, async () => {
      await joinTableRoom(room.id, currentUser.accountName);
      setActiveRoom(room);
      setSelectedRoomId(room.id);
      return room;
    });

    setIsLoading(false);
  };

  // Leave or Close Room with Transition
  const handleLeaveOrCloseRoom = async () => {
    if (!activeRoom) return;
    const targetRoom = activeRoom;
    const isHost = targetRoom.hostId === currentUser.uid;

    await runLeaveRoomTransition(targetRoom.roomCode, async () => {
      clearActiveRoomSession();
      setSelectedRoomId(null);
      setActiveRoom(null);
      setPlayers([]);
      onActiveRoomChange?.(null);
      setSelectedVoteTarget('');
      setIsPeekingRole(false);
      setInsiderRevealCountdown(null);
      try {
        await leaveOrCloseTableRoom(targetRoom.id, targetRoom.hostId);
        showToast(
          isHost
            ? `ยุบห้อง #${targetRoom.roomCode} เรียบร้อยแล้ว`
            : `ออกจากห้อง #${targetRoom.roomCode} แล้ว`
        );
      } catch (err) {
        console.error('Error leaving/closing room:', err);
      }
    });
  };

  // Safe Back to Catalog Intercept
  const handleBackToCatalogClick = async () => {
    if (!activeRoom) {
      onBackToCatalog();
      return;
    }
    if (activeRoom.hostId === currentUser.uid) {
      setIsDisbandModalOpen(true);
    } else {
      await handleLeaveOrCloseRoom();
      onBackToCatalog();
    }
  };

  const handleConfirmDisbandAndExit = async () => {
    setIsDisbandModalOpen(false);
    await handleLeaveOrCloseRoom();
    onBackToCatalog();
  };

  // Join by 4-Digit Code or ID
  const handleJoinByIdOrCode = async (target?: string) => {
    const clean = (target ?? quickJoinCode).trim();
    if (!clean || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runJoinRoomTransition(clean, async () => {
      if (clean.startsWith('room_')) {
        await joinTableRoom(clean, currentUser.accountName);
        setSelectedRoomId(clean);
        setQuickJoinCode('');
        return { roomCode: clean };
      }

      if (clean.length !== 4) {
        const msg = 'กรุณากรอกรหัสห้อง 4 หลักให้ครบถ้วน';
        setErrorMessage(msg);
        throw new Error(msg);
      }

      const found = await findRoomByCode(clean);
      if (!found) {
        const msg = `ไม่พบห้องรหัส "${clean}" กรุณาตรวจสอบรหัสห้องอีกครั้ง`;
        setErrorMessage(msg);
        throw new Error(msg);
      }

      await joinTableRoom(found.id, currentUser.accountName);
      setActiveRoom(found);
      setSelectedRoomId(found.id);
      setQuickJoinCode('');
      return found;
    });

    setIsLoading(false);
  };

  const handleInviteFriendToRoom = async (friend: UserProfile) => {
    if (!activeRoom) return;
    setErrorMessage(null);
    try {
      await addFriendToRoomSeat(activeRoom.id, friend);
      await sendRoomInviteToFriend(activeRoom, currentUser, friend.uid);
      showToast(
        `ดึงเพื่อน "${friend.accountName}" เข้าห้อง #${activeRoom.roomCode} เรียบร้อยแล้ว!`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถชวนเพื่อนเข้าห้องได้'
      );
    }
  };

  const handleAcceptRoomInvite = async (invite: RoomInviteDoc) => {
    await dismissRoomInvite(invite.id);
    await handleJoinByIdOrCode(invite.roomCode);
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
    if (!activeRoom) return;
    const myPlayer = players.find((p) => p.id === currentUser.uid);
    await togglePlayerReady(activeRoom.id, !myPlayer?.isReady);
  };

  const handleStartInsiderGame = async () => {
    if (!activeRoom || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runStartGameTransition(activeRoom.roomCode, async () => {
      if (!players.some((p) => p.id === currentUser.uid)) {
        await joinTableRoom(activeRoom.id, currentUser.accountName);
      }
      setSelectedVoteTarget('');
      setIsPeekingRole(false);
      await startInsiderGameAndDealRoles(activeRoom.id);
      if (customLobbyWord.trim()) {
        await updateInsiderSecretWord(
          activeRoom.id,
          customLobbyWord.trim(),
          'คำที่โฮสต์/Master กำหนดเอง'
        );
      }
      setCustomLobbyWord('');
    });

    setIsLoading(false);
  };

  const handleCastGeneralVote = async () => {
    if (!activeRoom || !selectedVoteTarget) return;
    setIsLoading(true);
    try {
      await castInsiderGeneralVote(activeRoom.id, selectedVoteTarget);
    } catch (err) {
      console.error('Error casting general vote:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!activeRoom) return;
    setIsLoading(true);
    try {
      await resetRoomToPlayAgain(activeRoom.id);
      setSelectedVoteTarget('');
      setIsPeekingRole(false);
      setInsiderRevealCountdown(null);
    } catch (err) {
      console.error('Error resetting room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = () => {
    const next = !isHostVoiceEnabled;
    setIsHostVoiceEnabled(next);
    thaiGameMaster.setEnabled(next);
    showToast(
      next
        ? 'เปิดเสียงบรรยาย Game Master แล้ว'
        : 'ปิดเสียงบรรยาย Game Master แล้ว'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/70 via-[#FDFBF7] to-amber-50/40 text-slate-800 w-full max-w-full overflow-x-hidden">
      {/* Common Portal Scene Transition for Create/Join/Leave/Start */}
      <GameSceneTransition {...transitionProps} />

      {/* Top Bar Subcomponent */}
      <InsiderTopBar
        activeRoom={activeRoom}
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Incoming Room Invites Banner Subcomponent */}
        <InsiderInvitesBanner
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
          {!activeRoom ? (
            <GameHubScreen
              key="insider-hub"
              variant="insider"
              emoji="🕵️"
              tagText="Oink Games Edition · 4–8 คน · สืบสวนทายคำลับ"
              title="จอมบงการคำใบ้ (Insider)"
              description='ช่วยกันถามคำถาม "ใช่ / ไม่ใช่" กับผู้คุมคำใบ้ (Master) เพื่อทายคำศัพท์ลับให้ทันเวลา และจับผิดจอมบงการ (Insider) ที่แอบรู้คำตอบแต่แรก!'
              createButtonLabel="+ สร้างห้องใหม่ (โฮสต์โต๊ะ 4–8 คน)"
              activeRoomsTitle="โต๊ะ Insider ที่เปิดรอผู้เล่น"
              emptyRoomsTitle="ยังไม่มีโต๊ะ Insider ที่เปิดอยู่ขณะนี้"
              emptyRoomsSubtitle='กดปุ่ม "+ สร้างห้องใหม่" ด้านบนเพื่อเปิดโต๊ะแรก แล้วชวนเพื่อนเข้ามาทายคำศัพท์ลับกันเลย'
              rooms={insiderRooms}
              phaseLabels={INSIDER_PHASE_LABELS}
              currentUid={currentUser.uid}
              friends={friends}
              quickJoinCode={quickJoinCode}
              isLoading={isLoading}
              isCodeInputError={isCodeInputError}
              onQuickJoinCodeChange={(val) => {
                clearCodeInputError();
                setQuickJoinCode(val);
              }}
              onCreateRoom={handleCreateRoom}
              onJoinByCode={(code) => handleJoinByIdOrCode(code)}
              onSelectAndJoinRoom={handleSelectAndJoinRoom}
              onDeleteRoom={handleDeleteRoom}
              onOpenFriendModal={onOpenFriendModal}
            />
          ) : (
            <motion.div
              key={`insider-room-${activeRoom.id}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="max-w-4xl mx-auto w-full bg-gradient-to-b from-rose-50/80 via-white to-amber-50/40 border border-rose-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5"
            >
              {/* Active Room Header Subcomponent */}
              <InsiderActiveRoomHeader
                roomCode={activeRoom.roomCode}
                roomName={activeRoom.roomName}
                hostName={activeRoom.hostName}
                isHost={activeRoom.hostId === currentUser.uid}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onLeaveOrCloseRoom={handleLeaveOrCloseRoom}
              />

              {/* Game Master Speaker Bar Subcomponent */}
              <InsiderSpeakerBar
                isHost={activeRoom.hostId === currentUser.uid}
                isHostVoiceEnabled={isHostVoiceEnabled}
                hostName={activeRoom.hostName}
                onTestVoice={() => thaiGameMaster.testInsiderVoice()}
                onToggleVoice={handleToggleVoice}
              />

              <AnimatePresence mode="wait">
                {activeRoom.status === 'lobby' ? (
                  <motion.div
                    key="insider-lobby-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <InsiderLobby
                      activeRoom={activeRoom}
                      players={players}
                      currentUser={currentUser}
                      friends={friends}
                      customLobbyWord={customLobbyWord}
                      isLoading={isLoading}
                      onCustomLobbyWordChange={setCustomLobbyWord}
                      onOpenShareModal={() => setIsShareModalOpen(true)}
                      onOpenFriendModal={onOpenFriendModal}
                      onInviteFriendToRoom={handleInviteFriendToRoom}
                      onUpdateLobbySettings={(cat, sec) =>
                        updateInsiderLobbySettings(activeRoom.id, cat, sec)
                      }
                      onAddPracticeBot={() =>
                        addPracticeTablemate(activeRoom.id)
                      }
                      onRemovePlayer={(pid) => removePlayer(activeRoom.id, pid)}
                      onToggleReady={handleToggleReady}
                      onStartGame={handleStartInsiderGame}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`insider-phase-${activeRoom.status}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                  >
                    <InsiderPhases
                      currentRoom={activeRoom}
                      players={players}
                      currentUid={currentUser.uid}
                      isPeekingRole={isPeekingRole}
                      insiderRevealCountdown={insiderRevealCountdown}
                      insiderRevealStage={insiderRevealStage}
                      quizSecondsLeft={quizSecondsLeft}
                      discussionSecondsLeft={discussionSecondsLeft}
                      selectedVoteTarget={selectedVoteTarget}
                      isLoading={isLoading}
                      onTogglePeekRole={() => setIsPeekingRole((prev) => !prev)}
                      onAcknowledgeRole={() =>
                        acknowledgeInsiderRole(activeRoom.id)
                      }
                      onUpdateSecretWord={(w, cat) =>
                        updateInsiderSecretWord(activeRoom.id, w, cat)
                      }
                      onStartInsiderPeekSequence={() =>
                        triggerInsiderWakeReveal(activeRoom.id, true)
                      }
                      onStartQuizImmediately={() =>
                        startInsiderQuizPhase(activeRoom.id)
                      }
                      onSendMasterSignal={(sig) =>
                        sendMasterQuickSignal(
                          activeRoom.id,
                          sig,
                          activeRoom.masterSignalCount || 0
                        )
                      }
                      onConfirmWordGuessed={(gid, gname) =>
                        confirmWordGuessedByPlayer(
                          activeRoom.id,
                          gid,
                          gname,
                          Math.max(
                            30,
                            (activeRoom.quizDurationSeconds || 180) -
                              quizSecondsLeft
                          )
                        )
                      }
                      onTriggerTimeoutLoss={() =>
                        triggerInsiderQuizTimeout(activeRoom.id)
                      }
                      onCastGuesserJudgment={(judgment) =>
                        castGuesserJudgmentVote(activeRoom.id, judgment)
                      }
                      onSelectVoteTarget={setSelectedVoteTarget}
                      onCastGeneralVote={handleCastGeneralVote}
                      onPlayAgain={handlePlayAgain}
                      onForceAcknowledgeRoles={() =>
                        forceAcknowledgeAllInsiderRoles(activeRoom.id)
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals rendered via Portal */}
      {activeRoom && (
        <>
          <ShareRoomModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            roomId={activeRoom.id}
            roomCode={activeRoom.roomCode}
            roomName={activeRoom.roomName}
          />
          <DisbandRoomConfirmModal
            isOpen={isDisbandModalOpen}
            roomCode={activeRoom.roomCode}
            gameTitle="จอมบงการคำใบ้ (Insider)"
            isLoading={isLoading}
            onConfirmDisband={handleConfirmDisbandAndExit}
            onClose={() => setIsDisbandModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
