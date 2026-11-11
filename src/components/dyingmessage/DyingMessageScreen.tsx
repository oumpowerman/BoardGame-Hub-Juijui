import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
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
  listenToRoom,
  listenToRoomPlayers,
  addPracticeTablemate,
  removePlayer,
  deleteTableRoom,
  addFriendToRoomSeat,
  cleanupHostPreviousRooms,
  leaveOrCloseTableRoom,
  detachPlayerSeatForIpadMode,
  registerDyingMessageIpadBoard,
  updateDyingMessageLobbySettings,
  startDyingMessageGame,
  acknowledgeDyingMessageRole,
  forceAcknowledgeAllDyingMessageRoles,
  selectDyingMessageVictim,
  submitVictimRealEvidenceCard,
  submitKillerFakeEvidenceCards,
  submitDetectiveInspection,
  useForensicDoctorSkill,
  startDyingMessageVoting,
  castDyingMessageVote,
  resolveDyingMessageVoteOnBoard,
  continueToNextDyingMessageNight,
  resetDyingMessageToLobby,
} from '../../firebase/tableService';
import {
  UserProfile,
  RoomInviteDoc,
  sendRoomInviteToFriend,
} from '../../firebase/userService';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';
import {
  saveActiveRoomSession,
  clearActiveRoomSession,
} from '../../utils/activeRoomPersistence';
import { DyingMessageTopBar } from './DyingMessageTopBar';
import { DyingMessageLobby } from './DyingMessageLobby';
import { DyingMessageCentralBoard } from './DyingMessageCentralBoard';
import { DyingMessagePhases } from './DyingMessagePhases';
import { DyingMessageRoleGuideModal } from './DyingMessageRoleGuideModal';
import { useDyingMessageGameMaster } from './useDyingMessageGameMaster';

export interface DyingMessageScreenProps {
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

const PHASE_LABELS: Partial<
  Record<GamePhase, { label: string; color: string }>
> = {
  lobby: {
    label: 'STEP 1 · ตั้งโต๊ะ (4–12 คน)',
    color: 'text-sky-900 bg-sky-100 border-sky-200',
  },
  dm_role_deal: {
    label: 'STEP 2 · แจกบทบาทลับ',
    color: 'text-amber-900 bg-amber-100 border-amber-200',
  },
  dm_night_kill: {
    label: 'STEP 3 · คืนเกิดเหตุ',
    color: 'text-indigo-900 bg-indigo-100 border-indigo-200',
  },
  dm_victim_clue: {
    label: 'STEP 4 · ทิ้งเบาะแสมรณะ',
    color: 'text-purple-900 bg-purple-100 border-purple-200',
  },
  dm_special_roles: {
    label: 'STEP 4 · สกิลสายสืบ',
    color: 'text-sky-900 bg-sky-100 border-sky-200',
  },
  dm_day_discussion: {
    label: 'STEP 5 · สืบสวนหลักฐาน',
    color: 'text-emerald-900 bg-emerald-100 border-emerald-200',
  },
  dm_voting: {
    label: 'STEP 6 · โหวตชี้ตัวคนร้าย',
    color: 'text-rose-900 bg-rose-100 border-rose-200',
  },
  dm_round_verdict: {
    label: 'STEP 6 · ผลโหวตประจำวัน',
    color: 'text-orange-900 bg-orange-100 border-orange-200',
  },
  dm_game_over: {
    label: 'STEP 7 · ปิดคดี & เฉลย',
    color: 'text-amber-950 bg-amber-200 border-amber-300',
  },
};

export const DyingMessageScreen: React.FC<DyingMessageScreenProps> = ({
  currentUser,
  friends,
  pendingFriendRequestsCount,
  rooms,
  initialRoomCode = '',
  onBackToCatalog,
  onOpenFriendModal,
  onActiveRoomChange,
}) => {
  const dyingMessageRooms = rooms.filter((r) => r.gameId === 'dying-message');

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickJoinCode, setQuickJoinCode] = useState<string>(initialRoomCode);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDisbandModalOpen, setIsDisbandModalOpen] = useState<boolean>(false);
  const [isRoleGuideOpen, setIsRoleGuideOpen] = useState<boolean>(false);
  const [isIpadBoardView, setIsIpadBoardView] = useState<boolean>(false);

  const {
    transitionProps,
    isCodeInputError,
    clearCodeInputError,
    runCreateRoomTransition,
    runJoinRoomTransition,
    runLeaveRoomTransition,
    runStartGameTransition,
  } = useRoomTransition('dying-message');

  const { isVoiceEnabled, setIsVoiceEnabled, debateSecondsLeft } =
    useDyingMessageGameMaster({
      activeRoom,
      players,
      currentUid: currentUser.uid,
      isIpadBoardView,
    });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-join from URL or initialRoomCode (including ?mode=board for iPad Central Board)
  useEffect(() => {
    const params =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    const isBoardMode = params?.get('mode') === 'board';
    const roomFromUrl = params?.get('room') || params?.get('code') || '';
    const targetCode = (initialRoomCode || roomFromUrl).trim();

    if (isBoardMode) {
      setIsIpadBoardView(true);
    }

    if (targetCode) {
      handleJoinByIdOrCode(targetCode, isBoardMode);
    }
  }, [initialRoomCode]);

  // Clean up stale lobby rooms hosted by current user
  useEffect(() => {
    const myHosted = rooms.filter(
      (r) => r.hostId === currentUser.uid && r.status === 'lobby'
    );
    if (myHosted.length > 1) {
      const keepId = selectedRoomId || myHosted[0].id;
      cleanupHostPreviousRooms(currentUser.uid, keepId);
    }
  }, [rooms, currentUser.uid, selectedRoomId]);

  // Real-time room & players listener
  useEffect(() => {
    if (!selectedRoomId) {
      setActiveRoom(null);
      setPlayers([]);
      onActiveRoomChange?.(null);
      return;
    }

    const unsubRoom = listenToRoom(selectedRoomId, (roomData) => {
      if (!roomData) {
        clearActiveRoomSession();
        setSelectedRoomId(null);
        setActiveRoom(null);
        setPlayers([]);
        onActiveRoomChange?.(null);
        return;
      }
      setActiveRoom(roomData);
      onActiveRoomChange?.(roomData);
      saveActiveRoomSession({
        roomId: roomData.id,
        roomCode: roomData.roomCode,
        gameId: 'dying-message',
        isIpadBoard: isIpadBoardView,
      });
    });

    const unsubPlayers = listenToRoomPlayers(selectedRoomId, (playersList) => {
      setPlayers(playersList);
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [selectedRoomId, isIpadBoardView]);

  const handleCreateRoom = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const created = await runCreateRoomTransition(() =>
        createTableRoom(
          currentUser.accountName,
          'dying-message',
          `โต๊ะเบาะแสมรณะของ ${currentUser.accountName}`,
          10
        )
      );
      if (created) {
        setSelectedRoomId(created.id);
        showToast(`เปิดโต๊ะเบาะแสมรณะ #${created.roomCode} สำเร็จ!`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByIdOrCode = async (
    codeOrId: string,
    asIpadBoard: boolean = false
  ) => {
    const clean = codeOrId.trim();
    if (!clean) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const joined = await runJoinRoomTransition(clean, async () => {
        let targetRoom: FirestoreRoom | null = null;
        if (clean.length === 4 && /^\d{4}$/.test(clean)) {
          targetRoom = await findRoomByCode(clean);
        } else {
          targetRoom = rooms.find((r) => r.id === clean) || null;
        }
        if (!targetRoom) {
          throw new Error(`ไม่พบห้องรหัส #${clean}`);
        }

        if (asIpadBoard) {
          await registerDyingMessageIpadBoard(targetRoom.id, true);
          await detachPlayerSeatForIpadMode(targetRoom.id);
        } else {
          await joinTableRoom(
            targetRoom.id,
            currentUser.accountName,
            currentUser.avatarUrl
          );
        }
        return targetRoom;
      });

      if (joined) {
        setSelectedRoomId(joined.id);
        if (asIpadBoard) {
          setIsIpadBoardView(true);
          showToast(
            `เชื่อมต่อจอ iPad กระดานกลางกับห้อง #${joined.roomCode} สำเร็จ! (ถอดเก้าอี้ผู้เล่นออกอัตโนมัติแล้ว)`
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIpadView = async () => {
    if (!activeRoom) return;
    const nextState = !isIpadBoardView;
    setIsIpadBoardView(nextState);
    if (nextState) {
      await registerDyingMessageIpadBoard(activeRoom.id, true);
      await detachPlayerSeatForIpadMode(activeRoom.id);
      showToast(
        'เปิดโหมดจอ iPad กระดานกลางแล้ว · ถอดเก้าอี้ผู้เล่นของเครื่องนี้ออกอัตโนมัติ'
      );
    } else {
      if (activeRoom.status === 'lobby') {
        await joinTableRoom(
          activeRoom.id,
          currentUser.accountName,
          currentUser.avatarUrl
        );
      }
    }
  };

  const handleLeaveOrCloseRoom = async () => {
    if (!activeRoom) return;
    if (activeRoom.hostId === currentUser.uid) {
      setIsDisbandModalOpen(true);
      return;
    }
    await runLeaveRoomTransition(activeRoom.roomCode, async () => {
      clearActiveRoomSession();
      await leaveOrCloseTableRoom(activeRoom.id, activeRoom.hostId);
      setSelectedRoomId(null);
    });
  };

  const handleConfirmDisbandRoom = async () => {
    if (!activeRoom) return;
    setIsDisbandModalOpen(false);
    await runLeaveRoomTransition(activeRoom.roomCode, async () => {
      clearActiveRoomSession();
      await deleteTableRoom(activeRoom.id);
      setSelectedRoomId(null);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-slate-800">
      <GameSceneTransition {...transitionProps} />

      <DyingMessageTopBar
        currentUser={currentUser}
        friendsCount={friends.length}
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        activeRoom={activeRoom}
        isIpadBoardView={isIpadBoardView}
        isVoiceEnabled={isVoiceEnabled}
        onBackToCatalog={onBackToCatalog}
        onOpenFriendModal={onOpenFriendModal}
        onOpenRoleGuide={() => setIsRoleGuideOpen(true)}
        onToggleVoice={() => {
          const next = !isVoiceEnabled;
          setIsVoiceEnabled(next);
          thaiGameMaster.setEnabled(next);
        }}
        onToggleIpadView={handleToggleIpadView}
      />

      {/* Toast & Error Alerts */}
      <AnimatePresence>
        {(toastMessage || errorMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-[1200px] w-full mx-auto px-4 pt-4"
          >
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs ${
                errorMessage
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {errorMessage ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{errorMessage || toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setToastMessage(null);
                }}
                className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-3 sm:px-6 py-6">
        {!activeRoom ? (
          <GameHubScreen
            variant="dying-message"
            emoji="🔎"
            tagText="DYING MESSAGE · เบาะแสมรณะ (HEADS-UP TABLETOP)"
            title="เบาะแสมรณะ (Dying Message)"
            description="บอร์ดเกมปาร์ตี้สืบสวนและละลายพฤติกรรม! ผู้ตายทิ้งการ์ดเบาะแสจริง 1 ใบที่สื่อถึงตัวจริงหรืออวตารของฆาตกร ส่วนฆาตกรแอบใส่การ์ดปลอม 2 ใบ รองรับการวาง iPad เป็นกระดานกลางเพื่อลดการก้มมองจอมือถือและพูดคุยจับพิรุธกันสดๆ ในวง!"
            createButtonLabel="เปิดโต๊ะเบาะแสมรณะใหม่"
            activeRoomsTitle="โต๊ะสืบคดีที่เปิดอยู่ในขณะนี้"
            emptyRoomsTitle="ยังไม่มีโต๊ะเบาะแสมรณะที่เปิดอยู่"
            emptyRoomsSubtitle="กดปุ่มเปิดโต๊ะใหม่ด้านบน แล้วสแกนเชื่อม iPad กระดานกลางหรือชวนเพื่อนเข้าวงได้เลย!"
            rooms={dyingMessageRooms}
            phaseLabels={PHASE_LABELS}
            currentUid={currentUser.uid}
            friends={friends}
            quickJoinCode={quickJoinCode}
            isLoading={isLoading}
            isCodeInputError={isCodeInputError}
            onQuickJoinCodeChange={(val) => {
              setQuickJoinCode(val);
              if (isCodeInputError) clearCodeInputError();
            }}
            onCreateRoom={handleCreateRoom}
            onJoinByCode={(code) => handleJoinByIdOrCode(code, false)}
            onSelectAndJoinRoom={(room) => handleJoinByIdOrCode(room.id, false)}
            onDeleteRoom={async (roomId, e) => {
              e.stopPropagation();
              await deleteTableRoom(roomId);
            }}
            onOpenFriendModal={onOpenFriendModal}
          />
        ) : activeRoom.status === 'lobby' && !isIpadBoardView ? (
          <DyingMessageLobby
            room={activeRoom}
            players={players}
            currentUser={currentUser}
            friends={friends}
            isLoading={isLoading}
            onUpdateSettings={(settings) =>
              updateDyingMessageLobbySettings(activeRoom.id, settings)
            }
            onAddBot={() => addPracticeTablemate(activeRoom.id)}
            onRemovePlayer={(pid) => removePlayer(activeRoom.id, pid)}
            onPullFriendToSeat={async (friend) => {
              await addFriendToRoomSeat(activeRoom.id, friend);
              await sendRoomInviteToFriend(activeRoom, currentUser, friend.uid);
              showToast(`ดึง "${friend.accountName}" เข้ามานั่งในโต๊ะแล้ว!`);
            }}
            onToggleIpadConnected={async (connected) => {
              await registerDyingMessageIpadBoard(activeRoom.id, connected);
              showToast(
                connected
                  ? 'เปิดโหมดเชื่อมจอ iPad แล้ว — ข้อมูลกองกลางจะซ่อนจากมือถืออัตโนมัติ'
                  : 'ปิดโหมดเชื่อมจอ iPad — แสดงการ์ดหลักฐานบนมือถือตามปกติ'
              );
            }}
            onSwitchToIpadView={handleToggleIpadView}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onLeaveOrCloseRoom={handleLeaveOrCloseRoom}
            onStartGame={() =>
              runStartGameTransition(activeRoom.roomCode, () =>
                startDyingMessageGame(activeRoom.id)
              )
            }
          />
        ) : isIpadBoardView ? (
          <DyingMessageCentralBoard
            room={activeRoom}
            players={players}
            isVoiceEnabled={isVoiceEnabled}
            debateSecondsLeft={debateSecondsLeft}
            isLoading={isLoading}
            onToggleVoice={() => {
              const next = !isVoiceEnabled;
              setIsVoiceEnabled(next);
              thaiGameMaster.setEnabled(next);
            }}
            onSwitchToPhoneView={() => setIsIpadBoardView(false)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onStartVoting={() => startDyingMessageVoting(activeRoom.id)}
            onResolveAccusationOnBoard={(suspectId) =>
              resolveDyingMessageVoteOnBoard(activeRoom.id, suspectId)
            }
            onContinueNextNight={() =>
              continueToNextDyingMessageNight(activeRoom.id)
            }
            onPlayAgain={() => resetDyingMessageToLobby(activeRoom.id)}
          />
        ) : (
          <DyingMessagePhases
            room={activeRoom}
            players={players}
            currentUid={currentUser.uid}
            debateSecondsLeft={debateSecondsLeft}
            isLoading={isLoading}
            onAcknowledgeRole={() => acknowledgeDyingMessageRole(activeRoom.id)}
            onSelectVictim={(victimId) =>
              selectDyingMessageVictim(activeRoom.id, victimId)
            }
            onSubmitVictimRealClue={(cardId) =>
              submitVictimRealEvidenceCard(
                activeRoom.id,
                currentUser.uid,
                cardId
              )
            }
            onSubmitKillerFakeClues={(cardIds) =>
              submitKillerFakeEvidenceCards(
                activeRoom.id,
                currentUser.uid,
                cardIds
              )
            }
            onSubmitDetectiveInspect={(targetId) =>
              submitDetectiveInspection(
                activeRoom.id,
                currentUser.uid,
                targetId
              )
            }
            onUseDoctorSkill={() => useForensicDoctorSkill(activeRoom.id)}
            onStartVoting={() => startDyingMessageVoting(activeRoom.id)}
            onCastVote={(targetId) =>
              castDyingMessageVote(activeRoom.id, targetId)
            }
            onContinueNextNight={() =>
              continueToNextDyingMessageNight(activeRoom.id)
            }
            onPlayAgain={() => resetDyingMessageToLobby(activeRoom.id)}
          />
        )}
      </main>

      {/* Modals (All rendered via BaseModal & React.createPortal) */}
      <DyingMessageRoleGuideModal
        isOpen={isRoleGuideOpen}
        onClose={() => setIsRoleGuideOpen(false)}
      />

      {activeRoom && (
        <ShareRoomModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roomId={activeRoom.id}
          roomCode={activeRoom.roomCode}
          roomName={activeRoom.roomName}
        />
      )}

      <DisbandRoomConfirmModal
        isOpen={isDisbandModalOpen}
        roomCode={activeRoom?.roomCode || ''}
        gameTitle="เบาะแสมรณะ (Dying Message)"
        isLoading={isLoading}
        onClose={() => setIsDisbandModalOpen(false)}
        onConfirmDisband={handleConfirmDisbandRoom}
      />
    </div>
  );
};
