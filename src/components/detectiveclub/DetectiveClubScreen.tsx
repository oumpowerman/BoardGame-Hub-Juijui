import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
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
  startDetectiveClubGame,
  submitDetectiveClubSecretWord,
  confirmDetectiveClubCardPlaced,
  advanceDetectiveClubCardRound,
  advanceDetectiveClubSpeaker,
  startDetectiveClubVoting,
  submitDetectiveClubVote,
  rematchDetectiveClubGame,
} from '../../firebase/tableService';
import {
  UserProfile,
  RoomInviteDoc,
  sendRoomInviteToFriend,
  dismissRoomInvite,
} from '../../firebase/userService';
import { useRoomTransition } from '../../hooks/useRoomTransition';
import { ShareRoomModal } from '../common/ShareRoomModal';
import { GameHubScreen } from '../common/GameHubScreen';
import { DisbandRoomConfirmModal } from '../common/DisbandRoomConfirmModal';
import { GameSceneTransition } from '../transitions/GameSceneTransition';

// Modular Subcomponents & Hook for Detective Club
import { DetectiveClubTopBar } from './DetectiveClubTopBar';
import { DetectiveClubActiveRoomHeader } from './DetectiveClubActiveRoomHeader';
import { DetectiveClubInvitesBanner } from './DetectiveClubInvitesBanner';
import { DetectiveClubLobby } from './DetectiveClubLobby';
import { DetectiveClubPhases } from './DetectiveClubPhases';
import { useDetectiveClubGameMaster } from './useDetectiveClubGameMaster';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';
import {
  saveActiveRoomSession,
  clearActiveRoomSession,
} from '../../utils/activeRoomPersistence';

export interface DetectiveClubScreenProps {
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

const DETECTIVE_CLUB_PHASE_LABELS: Partial<
  Record<GamePhase, { label: string; color: string }>
> = {
  lobby: {
    label: 'STEP 1 · ตั้งโต๊ะ (4-8 คน)',
    color: 'text-emerald-800 bg-emerald-100 border-emerald-200',
  },
  dc_word_entry: {
    label: 'STEP 2 · ตั้งคำศัพท์ลับ',
    color: 'text-amber-900 bg-amber-100 border-amber-200',
  },
  dc_card_rounds: {
    label: 'STEP 3 · วางการ์ดจริง 2 รอบ',
    color: 'text-indigo-900 bg-indigo-100 border-indigo-200',
  },
  dc_discussion: {
    label: 'STEP 4 · ถกเถียง & อธิบาย',
    color: 'text-amber-950 bg-amber-200 border-amber-300',
  },
  dc_voting: {
    label: 'STEP 5 · โหวตชี้ตัว Conspirator',
    color: 'text-rose-900 bg-rose-100 border-rose-200',
  },
  dc_scoring: {
    label: 'STEP 6 · สรุปคะแนน Victory Points',
    color: 'text-purple-900 bg-purple-100 border-purple-200',
  },
};

export const DetectiveClubScreen: React.FC<DetectiveClubScreenProps> = ({
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
  const dcRooms = rooms.filter((r) => r.gameId === 'detective-club');

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickJoinCode, setQuickJoinCode] = useState<string>(initialRoomCode);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDisbandModalOpen, setIsDisbandModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [discussionDurationSeconds, setDiscussionDurationSeconds] = useState<number>(90);

  // Common Room Transition Hook
  const {
    transitionProps,
    isCodeInputError,
    clearCodeInputError,
    runCreateRoomTransition,
    runJoinRoomTransition,
    runLeaveRoomTransition,
    runStartGameTransition,
  } = useRoomTransition('detective-club');

  // Custom Hook: Discussion Timer, Chimes, Fanfare
  const { discussionSecondsLeft } = useDetectiveClubGameMaster({
    activeRoom,
    players,
    currentUid: currentUser.uid,
    soundEnabled,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick join if passed an initial code
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
          gameId: 'detective-club',
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

  const isHost = activeRoom?.hostId === currentUser.uid;

  // Create Room with Transition
  const handleCreateRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runCreateRoomTransition(async () => {
      const created = await createTableRoom(
        currentUser.accountName,
        'detective-club',
        `โต๊ะสมาคมนักสืบของ ${currentUser.accountName}`,
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
      setActiveRoom(room);
      setSelectedRoomId(room.id);
      return room;
    });

    setIsLoading(false);
  };

  // Join by 4-Digit Code
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

  // Leave / Close Room with Transition
  const handleLeaveOrCloseRoom = async () => {
    if (!activeRoom) return;
    const targetRoom = activeRoom;
    const hostLeaving = targetRoom.hostId === currentUser.uid;

    await runLeaveRoomTransition(targetRoom.roomCode, async () => {
      clearActiveRoomSession();
      setSelectedRoomId(null);
      setActiveRoom(null);
      setPlayers([]);
      onActiveRoomChange?.(null);
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

  const handleAddBot = async () => {
    if (!activeRoom) return;
    try {
      await addPracticeTablemate(activeRoom.id);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเพิ่มผู้เล่นบอทได้'
      );
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!activeRoom || !isHost) return;
    try {
      await removePlayer(activeRoom.id, playerId);
    } catch {
      // Ignore
    }
  };

  // Start Game with Transition
  const handleStartGame = async () => {
    if (!activeRoom || !isHost || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    await runStartGameTransition(activeRoom.roomCode, async () => {
      if (!players.some((p) => p.id === currentUser.uid)) {
        await joinTableRoom(activeRoom.id, currentUser.accountName);
      }
      await startDetectiveClubGame(activeRoom.id, discussionDurationSeconds);
    });

    setIsLoading(false);
  };

  const handleSubmitSecretWord = async (word: string) => {
    if (!activeRoom) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await submitDetectiveClubSecretWord(activeRoom.id, word);
      showToast('แจกสมุดบันทึกดิจิทัลให้ทุกคนเรียบร้อยแล้ว!');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถตั้งคำลับได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCardPlaced = async (playerId: string) => {
    if (!activeRoom) return;
    setIsLoading(true);
    try {
      await confirmDetectiveClubCardPlaced(activeRoom.id, playerId);
    } catch (err) {
      console.error('Error confirming card placed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceCardRound = async (target: 2 | 'discussion') => {
    if (!activeRoom) return;
    setIsLoading(true);
    try {
      await advanceDetectiveClubCardRound(activeRoom.id, target);
    } catch (err) {
      console.error('Error advancing card round:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceSpeaker = async (nextSpeakerIndex: number) => {
    if (!activeRoom) return;
    try {
      await advanceDetectiveClubSpeaker(activeRoom.id, nextSpeakerIndex);
    } catch (err) {
      console.error('Error advancing speaker:', err);
    }
  };

  const handleStartVoting = async () => {
    if (!activeRoom) return;
    setIsLoading(true);
    try {
      await startDetectiveClubVoting(activeRoom.id);
    } catch (err) {
      console.error('Error starting voting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVote = async (targetId: string) => {
    if (!activeRoom) return;
    setIsLoading(true);
    try {
      await submitDetectiveClubVote(activeRoom.id, currentUser.uid, targetId);
    } catch (err) {
      console.error('Error submitting vote:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRematch = async () => {
    if (!activeRoom || !isHost) return;
    setIsLoading(true);
    try {
      await rematchDetectiveClubGame(activeRoom.id);
    } catch (err) {
      console.error('Error rematching:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/70 via-[#FCFBF7] to-stone-100/50 text-slate-800 w-full max-w-full overflow-x-hidden">
      {/* Common Portal Scene Transition */}
      <GameSceneTransition {...transitionProps} />

      {/* Top Bar Subcomponent */}
      <DetectiveClubTopBar
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
        {/* Incoming Room Invites Banner */}
        <DetectiveClubInvitesBanner
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
              key="detective-hub"
              variant="detective-club"
              emoji="🔍"
              tagText="In-Person Companion · 4–8 คน · สมาคมนักสืบ & ไพ่จริง"
              title="สมาคมนักสืบ (Detective Club)"
              description="เล่นคู่กับไพ่จริงบนโต๊ะ! ผู้ตั้งโจทย์พิมพ์คำลับลงในสมุดลับดิจิทัล นักสืบทุกคนจะได้รับคำลับ ส่วน Conspirator ได้สมุดว่างเปล่า วางการ์ดจริง 2 ใบ ถกเถียงหาเหตุผล และชี้ตัวสายลับที่แอบเนียน"
              createButtonLabel="+ สร้างห้องใหม่ (โฮสต์โต๊ะ 4–8 คน)"
              activeRoomsTitle="โต๊ะ Detective Club ที่เปิดรอผู้เล่น"
              emptyRoomsTitle="ยังไม่มีโต๊ะ Detective Club ที่เปิดอยู่ขณะนี้"
              emptyRoomsSubtitle='กดปุ่ม "+ สร้างห้องใหม่" ด้านบนเพื่อเปิดโต๊ะแรก แล้วชวนเพื่อนนำไพ่จริงมาล้อมวงเล่นด้วยกันได้เลย'
              rooms={dcRooms}
              phaseLabels={DETECTIVE_CLUB_PHASE_LABELS}
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
              key={`dc-room-${activeRoom.id}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
              className="max-w-4xl mx-auto w-full bg-gradient-to-b from-amber-50/80 via-white to-stone-50/50 border border-amber-300 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5"
            >
              {/* Active Room Header Subcomponent */}
              <DetectiveClubActiveRoomHeader
                roomCode={activeRoom.roomCode}
                roomName={activeRoom.roomName}
                hostName={activeRoom.hostName}
                isHost={isHost}
                soundEnabled={soundEnabled}
                onToggleSound={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  thaiGameMaster.setEnabled(next);
                }}
                onTestVoice={() => thaiGameMaster.testDetectiveVoice()}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onLeaveRoom={handleLeaveOrCloseRoom}
              />

              <AnimatePresence mode="wait">
                {activeRoom.status === 'lobby' ? (
                  <motion.div
                    key="dc-lobby-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DetectiveClubLobby
                      currentRoom={activeRoom}
                      players={players}
                      currentUser={currentUser}
                      friends={friends}
                      isHost={isHost}
                      discussionDurationSeconds={discussionDurationSeconds}
                      isLoading={isLoading}
                      onOpenShareModal={() => setIsShareModalOpen(true)}
                      onOpenFriendModal={onOpenFriendModal}
                      onInviteFriend={handleInviteFriendToRoom}
                      onSelectDiscussionDuration={setDiscussionDurationSeconds}
                      onAddBot={handleAddBot}
                      onRemovePlayer={handleRemovePlayer}
                      onToggleReady={handleToggleReady}
                      onStartGame={handleStartGame}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`dc-phase-${activeRoom.status}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                  >
                    <DetectiveClubPhases
                      currentRoom={activeRoom}
                      players={players}
                      currentUid={currentUser.uid}
                      discussionSecondsLeft={discussionSecondsLeft}
                      isLoading={isLoading}
                      onSubmitSecretWord={handleSubmitSecretWord}
                      onConfirmCardPlaced={handleConfirmCardPlaced}
                      onAdvanceCardRound={handleAdvanceCardRound}
                      onAdvanceSpeaker={handleAdvanceSpeaker}
                      onStartVoting={handleStartVoting}
                      onSubmitVote={handleSubmitVote}
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
      {activeRoom && (
        <>
          <ShareRoomModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            roomId={activeRoom.id}
            roomCode={activeRoom.roomCode}
            roomName={activeRoom.roomName || 'สมาคมนักสืบ (Detective Club)'}
          />
          <DisbandRoomConfirmModal
            isOpen={isDisbandModalOpen}
            roomCode={activeRoom.roomCode}
            gameTitle="สมาคมนักสืบ (Detective Club)"
            isLoading={isLoading}
            onConfirmDisband={handleConfirmDisbandAndExit}
            onClose={() => setIsDisbandModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
