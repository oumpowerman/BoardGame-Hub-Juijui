import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { InPersonLobby } from '../inperson/InPersonLobby';
import { InPersonPhases } from '../inperson/InPersonPhases';
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
  toggleFallMouseMode,
  setCheeseNightDuration,
  toggleCheeseNightPause,
  startGameAndDealRoles,
  acknowledgePlayerRole,
  submitSecretDiceRoll,
  grabCheeseInNight,
  peekPlayerDiceCup,
  selectFollowersByThief,
  confirmFollowerPhaseToMorning,
  advanceNightHour,
  castAccusationVote,
  resetRoomToPlayAgain,
  listenToRoom,
  listenToRoomPlayers,
  addPracticeTablemate,
  removePlayer,
  deleteTableRoom,
  addFriendToRoomSeat,
  cleanupHostPreviousRooms,
  leaveOrCloseTableRoom,
  updatePlayerAvatarInRoom,
} from '../../firebase/tableService';
import {
  UserProfile,
  RoomInviteDoc,
  sendRoomInviteToFriend,
  dismissRoomInvite,
} from '../../firebase/userService';
import { tableAudio } from '../../utils/tableAudio';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

// Subcomponents & Custom Hook for Cheese Thief
import { CheeseThiefTopBar } from './CheeseThiefTopBar';
import { CheeseThiefSpeakerBar } from './CheeseThiefSpeakerBar';
import { CheeseThiefActiveRoomHeader } from './CheeseThiefActiveRoomHeader';
import { CheeseThiefInvitesBanner } from './CheeseThiefInvitesBanner';
import { useCheeseThiefGameMaster } from './useCheeseThiefGameMaster';

export interface CheeseThiefScreenProps {
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

const PHASE_LABELS: Partial<Record<GamePhase, { label: string; color: string }>> = {
  lobby: {
    label: 'STEP 1 · ตั้งโต๊ะ (4-8 คน)',
    color: 'text-emerald-800 bg-emerald-100 border-emerald-200',
  },
  role_deal: {
    label: 'STEP 2 · แจกการ์ดบทบาท',
    color: 'text-amber-900 bg-amber-100 border-amber-200',
  },
  dice_roll: {
    label: 'STEP 3 · ทอยเต๋าในถ้วย',
    color: 'text-orange-900 bg-orange-100 border-orange-200',
  },
  night_phases: {
    label: 'STEP 4 · คืนขโมยชีส (1-6 น.)',
    color: 'text-indigo-900 bg-indigo-100 border-indigo-200',
  },
  follower_phase: {
    label: 'STEP 4 · ช่วงลูกน้อง (Follower)',
    color: 'text-rose-900 bg-rose-100 border-rose-200',
  },
  voting: {
    label: 'STEP 5 · ถกเถียง & โหวต',
    color: 'text-rose-900 bg-rose-100 border-rose-200',
  },
  game_over: {
    label: 'STEP 6 · เปิดการ์ด & ชนะ',
    color: 'text-purple-900 bg-purple-100 border-purple-200',
  },
};

export const CheeseThiefScreen: React.FC<CheeseThiefScreenProps> = ({
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
  const cheeseRooms = rooms.filter((r) => r.gameId === 'cheese-thief');

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickJoinCode, setQuickJoinCode] = useState<string>(initialRoomCode);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDisbandModalOpen, setIsDisbandModalOpen] = useState<boolean>(false);

  // Common Room Scene Transition
  const {
    transitionProps,
    isCodeInputError,
    clearCodeInputError,
    runCreateRoomTransition,
    runJoinRoomTransition,
    runLeaveRoomTransition,
    runStartGameTransition,
  } = useRoomTransition('cheese-thief');

  // Gameplay Local Interaction States
  const [isPeekingRole, setIsPeekingRole] = useState<boolean>(false);
  const [rollingDice, setRollingDice] = useState<boolean>(false);
  const [rolledDicePair, setRolledDicePair] = useState<number[]>([]);
  const [chosenWakeHour, setChosenWakeHour] = useState<number | null>(null);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string>('');

  // Custom Hook: Game Master TTS Narration, 10s Night Timer, 90s Debate Countdown, Fanfare
  const {
    isHostVoiceEnabled,
    setIsHostVoiceEnabled,
    hourSecondsLeft,
    debateSecondsLeft,
  } = useCheeseThiefGameMaster({
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
      setActiveRoom(null);
      setPlayers([]);
      onActiveRoomChange?.(null);
      return;
    }

    const unsubRoom = listenToRoom(selectedRoomId, (updatedRoom) => {
      setActiveRoom(updatedRoom);
      onActiveRoomChange?.(updatedRoom);
    });

    const unsubPlayers = listenToRoomPlayers(selectedRoomId, (updatedPlayers) => {
      setPlayers(updatedPlayers);
      // Auto-sync player avatar to room seat if available
      const meInRoom = updatedPlayers.find((p) => p.id === currentUser.uid);
      if (
        meInRoom &&
        currentUser.avatarUrl &&
        meInRoom.avatarUrl !== currentUser.avatarUrl
      ) {
        updatePlayerAvatarInRoom(
          selectedRoomId,
          currentUser.uid,
          currentUser.avatarUrl
        ).catch(() => {});
      }
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [selectedRoomId, currentUser.uid, currentUser.avatarUrl]);

  // Create Room with Transition
  const handleCreateRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runCreateRoomTransition(async () => {
      const created = await createTableRoom(
        currentUser.accountName,
        'cheese-thief',
        `โต๊ะหนูขโมยชีสของ ${currentUser.accountName}`,
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
      setRolledDicePair([]);
      setChosenWakeHour(null);
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
      setSelectedRoomId(null);
      setActiveRoom(null);
      setPlayers([]);
      onActiveRoomChange?.(null);
      setRolledDicePair([]);
      setChosenWakeHour(null);
      setSelectedVoteTarget('');
      setIsPeekingRole(false);
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

  const handleStartGame = async () => {
    if (!activeRoom || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runStartGameTransition(activeRoom.roomCode, async () => {
      if (!players.some((p) => p.id === currentUser.uid)) {
        await joinTableRoom(activeRoom.id, currentUser.accountName);
      }
      setRolledDicePair([]);
      setChosenWakeHour(null);
      setSelectedVoteTarget('');
      await startGameAndDealRoles(activeRoom.id);
    });

    setIsLoading(false);
  };

  const handleRollDiceInCup = () => {
    if (!activeRoom || rollingDice) return;
    setRollingDice(true);
    tableAudio.playDiceRoll();
    const isFourPlayer = players.length === 4;
    const d1 = Math.floor(1 + Math.random() * 6);
    let d2 = Math.floor(1 + Math.random() * 6);
    if (d2 === d1) {
      d2 = (d1 % 6) + 1;
    }

    setTimeout(() => {
      setRolledDicePair(isFourPlayer ? [d1, d2] : [d1]);
      setRollingDice(false);
    }, 600);
  };

  const handleConfirmDiceCupChoice = async (
    primaryHour: number,
    secondaryHour: number = 0
  ) => {
    if (!activeRoom) return;
    setChosenWakeHour(primaryHour);
    try {
      await submitSecretDiceRoll(
        activeRoom.id,
        primaryHour,
        secondaryHour,
        rolledDicePair
      );
    } catch (err) {
      console.error('Error submitting dice roll:', err);
    }
  };

  const handleCastVote = async () => {
    if (!activeRoom || !selectedVoteTarget) return;
    setIsLoading(true);
    try {
      await castAccusationVote(activeRoom.id, selectedVoteTarget);
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = async () => {
    if (!activeRoom) return;
    setIsLoading(true);
    try {
      await resetRoomToPlayAgain(activeRoom.id);
      setRolledDicePair([]);
      setChosenWakeHour(null);
      setSelectedVoteTarget('');
      setIsPeekingRole(false);
    } catch (err) {
      console.error('Error resetting:', err);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/60 via-[#FDFBF7] to-rose-50/40 text-slate-800">
      {/* Common Portal Scene Transition for Create/Join/Leave/Start */}
      <GameSceneTransition {...transitionProps} />

      {/* Top Bar Subcomponent */}
      <CheeseThiefTopBar
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

      {/* Main Content */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Incoming Room Invites Banner */}
        <CheeseThiefInvitesBanner
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
              key="cheese-hub"
              variant="cheese-thief"
              emoji="🧀"
              tagText="ปาร์ตี้บอร์ดเกมสืบสวน · 4–8 คน · จบใน 10 นาที"
              title="ชีสหนูอยู่ไหน (Cheese Thief)"
              description="วางก้อนชีสกลางโต๊ะ แจกการ์ดบทบาทลับ ทอยเต๋าในถ้วย แอบส่องเบาะแสตอนกลางคืน และโหวตจับจอมโจรชีสพร้อมกัน พร้อมระบบเสียงพากย์ Game Master ภาษาไทย"
              createButtonLabel="+ สร้างห้องใหม่ (โฮสต์โต๊ะ 4–8 คน)"
              activeRoomsTitle="โต๊ะหนูขโมยชีสที่เปิดรอผู้เล่น"
              emptyRoomsTitle="ยังไม่มีโต๊ะที่เปิดรอผู้เล่นในขณะนี้"
              emptyRoomsSubtitle='กดปุ่ม "+ สร้างห้องใหม่" ด้านบนเพื่อเปิดโต๊ะแรก แล้วชวนเพื่อนเข้ามาสนุกด้วยกันได้เลย'
              rooms={cheeseRooms}
              phaseLabels={PHASE_LABELS}
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
              onJoinByCode={handleJoinByIdOrCode}
              onSelectAndJoinRoom={handleSelectAndJoinRoom}
              onDeleteRoom={handleDeleteRoom}
              onOpenFriendModal={onOpenFriendModal}
            />
          ) : (
            <motion.div
              key={`cheese-room-${activeRoom.id}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="max-w-4xl mx-auto w-full bg-gradient-to-b from-amber-50/90 via-white to-rose-50/50 border border-amber-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5"
            >
              {/* Active Room Header Subcomponent */}
              <CheeseThiefActiveRoomHeader
                roomCode={activeRoom.roomCode}
                roomName={activeRoom.roomName}
                hostName={activeRoom.hostName}
                isHost={activeRoom.hostId === currentUser.uid}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onLeaveOrCloseRoom={handleLeaveOrCloseRoom}
              />

              {/* Game Master Speaker Bar Subcomponent */}
              <CheeseThiefSpeakerBar
                isHost={activeRoom.hostId === currentUser.uid}
                isHostVoiceEnabled={isHostVoiceEnabled}
                hostName={activeRoom.hostName}
                onTestVoice={() => thaiGameMaster.testVoice()}
                onToggleVoice={handleToggleVoice}
              />

              <AnimatePresence mode="wait">
                {activeRoom.status === 'lobby' ? (
                  <motion.div
                    key="cheese-lobby-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <InPersonLobby
                      currentRoom={activeRoom}
                      players={players}
                      currentUid={currentUser.uid}
                      playerName={currentUser.accountName}
                      roomCodeInput={quickJoinCode}
                      isLoading={isLoading}
                      friends={friends}
                      onPlayerNameChange={() => {}}
                      onRoomCodeChange={setQuickJoinCode}
                      onJoinTable={handleJoinByIdOrCode}
                      onCreateTable={handleCreateRoom}
                      onToggleReady={handleToggleReady}
                      onStartGame={handleStartGame}
                      onToggleFallMouse={(enabled) =>
                        toggleFallMouseMode(activeRoom.id, enabled)
                      }
                      onChangeNightDuration={(sec) =>
                        setCheeseNightDuration(activeRoom.id, sec)
                      }
                      onAddPracticeTablemate={() =>
                        addPracticeTablemate(activeRoom.id)
                      }
                      onRemovePlayer={(pid) => removePlayer(activeRoom.id, pid)}
                      onInviteFriend={handleInviteFriendToRoom}
                      onOpenFriendModal={onOpenFriendModal}
                      onOpenShareModal={() => setIsShareModalOpen(true)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`cheese-phase-${activeRoom.status}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                  >
                    <InPersonPhases
                      currentRoom={activeRoom}
                      players={players}
                      currentUid={currentUser.uid}
                      isPeekingRole={isPeekingRole}
                      rollingDice={rollingDice}
                      rolledDicePair={rolledDicePair}
                      chosenWakeHour={chosenWakeHour}
                      hourSecondsLeft={hourSecondsLeft}
                      selectedVoteTarget={selectedVoteTarget}
                      debateSecondsLeft={debateSecondsLeft}
                      isLoading={isLoading}
                      onPeekRoleStart={() => setIsPeekingRole(true)}
                      onPeekRoleEnd={() => setIsPeekingRole(false)}
                      onTogglePeekRole={() => setIsPeekingRole((prev) => !prev)}
                      onAcknowledgeRole={() =>
                        acknowledgePlayerRole(activeRoom.id)
                      }
                      onRollDiceInCup={handleRollDiceInCup}
                      onConfirmDiceCupChoice={handleConfirmDiceCupChoice}
                      onGrabCheese={() => grabCheeseInNight(activeRoom.id)}
                      onPeekPlayerCup={(tid) =>
                        peekPlayerDiceCup(activeRoom.id, tid)
                      }
                      onSelectFollowers={(tids) =>
                        selectFollowersByThief(activeRoom.id, tids)
                      }
                      onConfirmFollowerPhase={() =>
                        confirmFollowerPhaseToMorning(activeRoom.id)
                      }
                      onAdvanceNightHour={(h) =>
                        advanceNightHour(activeRoom.id, h)
                      }
                      onToggleNightPause={(paused) =>
                        toggleCheeseNightPause(activeRoom.id, paused)
                      }
                      onChangeNightDuration={(sec) =>
                        setCheeseNightDuration(activeRoom.id, sec)
                      }
                      onSelectVoteTarget={setSelectedVoteTarget}
                      onCastVote={handleCastVote}
                      onPlayAgain={handlePlayAgain}
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
            gameTitle="หนูขโมยชีส"
            isLoading={isLoading}
            onConfirmDisband={handleConfirmDisbandAndExit}
            onClose={() => setIsDisbandModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
