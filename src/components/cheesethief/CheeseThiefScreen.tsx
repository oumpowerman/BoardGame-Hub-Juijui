import React, { useState, useEffect, useRef } from 'react';
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
  Share2,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { InPersonLobby } from '../inperson/InPersonLobby';
import { InPersonPhases } from '../inperson/InPersonPhases';
import { ShareRoomModal } from '../common/ShareRoomModal';
import {
  FirestoreRoom,
  FirestorePlayer,
  GamePhase,
  createTableRoom,
  findRoomByCode,
  joinTableRoom,
  togglePlayerReady,
  toggleFallMouseMode,
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
} from '../../firebase/tableService';
import {
  UserProfile,
  RoomInviteDoc,
  sendRoomInviteToFriend,
  dismissRoomInvite,
} from '../../firebase/userService';
import { tableAudio } from '../../utils/tableAudio';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

interface CheeseThiefScreenProps {
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

  // Gameplay Local UI States
  const [isPeekingRole, setIsPeekingRole] = useState<boolean>(false);
  const [rollingDice, setRollingDice] = useState<boolean>(false);
  const [rolledDicePair, setRolledDicePair] = useState<number[]>([]);
  const [chosenWakeHour, setChosenWakeHour] = useState<number | null>(null);
  const [hourSecondsLeft, setHourSecondsLeft] = useState<number>(10);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string>('');
  const [debateSecondsLeft, setDebateSecondsLeft] = useState<number>(90);
  const [isHostVoiceEnabled, setIsHostVoiceEnabled] = useState<boolean>(true);

  // Stop ongoing narration on unmount
  useEffect(() => {
    return () => {
      thaiGameMaster.cancel();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-join if initialRoomCode is provided (supports both 4-digit codes and room_ IDs)
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      handleJoinByIdOrCode(initialRoomCode.trim());
    }
  }, [initialRoomCode]);

  // Enforce max 1 hosted room per user & clean up any historical duplicates
  useEffect(() => {
    const myHosted = rooms.filter((r) => r.hostId === currentUser.uid);
    if (myHosted.length > 1) {
      const keepId = selectedRoomId || myHosted[0].id;
      cleanupHostPreviousRooms(currentUser.uid, keepId);
    }
  }, [rooms, currentUser.uid, selectedRoomId]);

  // Listen to the selected room & its players in real time
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
    });

    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [selectedRoomId]);

  // Moderator 10-Second Auto-Timer per Night Hour (1:00 to 6:00 AM) + Chimes & Thai Game Master TTS Narration
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'night_phases') {
      setHourSecondsLeft(10);
      return;
    }

    const isHost = activeRoom.hostId === currentUser.uid;
    const currentHour = activeRoom.nightHour;
    setHourSecondsLeft(10);

    // Host device acts as the central Tabletop Game Master speaker
    if (isHost && isHostVoiceEnabled) {
      if (currentHour === 1) {
        thaiGameMaster.speakNightBegins();
        const t = setTimeout(() => {
          thaiGameMaster.speakHourWake(1);
        }, 2600);
        var cleanupOpening = () => clearTimeout(t);
      } else if (currentHour >= 2 && currentHour <= 6) {
        thaiGameMaster.speakHourWake(currentHour);
      }
    } else if (currentHour >= 1 && currentHour <= 6) {
      // Non-host devices or muted mode play gentle sound chime
      tableAudio.playHourChime(currentHour);
    }

    const interval = window.setInterval(() => {
      setHourSecondsLeft((prev) => {
        // At second 4 (giving 6-7s awake, then 3s left to close eyes), command to sleep
        if (prev === 4 && isHost && isHostVoiceEnabled && currentHour >= 1 && currentHour <= 6) {
          thaiGameMaster.speakHourSleep(currentHour);
        }

        if (prev <= 1) {
          window.clearInterval(interval);
          // Auto-advance to the next hour when the 10-second window finishes
          advanceNightHour(activeRoom.id, currentHour + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cleanupOpening) cleanupOpening();
      window.clearInterval(interval);
    };
  }, [activeRoom?.id, activeRoom?.status, activeRoom?.nightHour, activeRoom?.hostId, currentUser.uid, isHostVoiceEnabled]);

  // Follower Phase Speech Announcement (Host Device)
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'follower_phase') return;
    const isHost = activeRoom.hostId === currentUser.uid;
    if (isHost && isHostVoiceEnabled) {
      if (players.length >= 6) {
        thaiGameMaster.speakFollowerThiefSelect();
      }
    }
  }, [activeRoom?.status, activeRoom?.id, activeRoom?.hostId, currentUser.uid, isHostVoiceEnabled, players.length]);

  // Morning Gong & TTS when entering voting phase
  useEffect(() => {
    if (activeRoom?.status === 'voting') {
      const isHost = activeRoom.hostId === currentUser.uid;
      if (isHost && isHostVoiceEnabled) {
        thaiGameMaster.speakMorningWake();
      } else {
        tableAudio.playMorningGong();
      }
    }
  }, [activeRoom?.status, activeRoom?.hostId, currentUser.uid, isHostVoiceEnabled]);

  // Morning Debate Countdown
  useEffect(() => {
    if (activeRoom?.status !== 'voting') {
      setDebateSecondsLeft(90);
      return;
    }
    const timer = setInterval(() => {
      setDebateSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRoom?.status]);

  // Game Over Fanfare
  useEffect(() => {
    if (activeRoom?.status === 'game_over') {
      const myPlayer = players.find((p) => p.id === currentUser.uid);
      const isWinner =
        (activeRoom.winnerTeam === 'fall_mouse' && myPlayer?.role === 'fall_mouse') ||
        (activeRoom.winnerTeam === 'mice' &&
          myPlayer?.role === 'sleepy_mouse' &&
          !myPlayer?.isFollower) ||
        (activeRoom.winnerTeam === 'thief' &&
          (myPlayer?.role === 'cheese_thief' || myPlayer?.isFollower === true));
      tableAudio.playDramaticReveal(Boolean(isWinner));
      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  }, [activeRoom?.status, activeRoom?.winnerTeam]);

  // Create a Room (4-8 players) & immediately enter the waiting lobby
  const handleCreateRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
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
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถสร้างห้องได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing room
  const handleSelectAndJoinRoom = async (room: FirestoreRoom) => {
    setActiveRoom(room);
    setSelectedRoomId(room.id);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await joinTableRoom(room.id, currentUser.accountName);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเข้าร่วมห้องได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveOrCloseRoom = async () => {
    if (!activeRoom) return;
    const targetRoom = activeRoom;
    const isHost = targetRoom.hostId === currentUser.uid;
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
  };

  const handleJoinByIdOrCode = async (target?: string) => {
    const clean = (target || quickJoinCode).trim();
    if (!clean) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (clean.startsWith('room_')) {
        await joinTableRoom(clean, currentUser.accountName);
        setSelectedRoomId(clean);
        setQuickJoinCode('');
      } else if (clean.length === 4) {
        const found = await findRoomByCode(clean);
        if (!found) {
          setErrorMessage(`ไม่พบห้องรหัส "${clean}" กรุณาตรวจสอบรหัสห้องอีกครั้ง`);
          return;
        }
        setActiveRoom(found);
        setSelectedRoomId(found.id);
        await joinTableRoom(found.id, currentUser.accountName);
        setQuickJoinCode('');
      } else {
        setErrorMessage('กรุณากรอกรหัสห้อง 4 หลักให้ครบถ้วน');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเข้าร่วมห้องได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = (codeToJoin?: string) => {
    return handleJoinByIdOrCode(codeToJoin);
  };

  // Invite & Pull an Accepted Friend into the Active Room
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
    if (!activeRoom) return;
    const myPlayer = players.find((p) => p.id === currentUser.uid);
    await togglePlayerReady(activeRoom.id, !myPlayer?.isReady);
  };

  const handleStartGame = async () => {
    if (!activeRoom) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!players.some((p) => p.id === currentUser.uid)) {
        await joinTableRoom(activeRoom.id, currentUser.accountName);
      }
      setRolledDicePair([]);
      setChosenWakeHour(null);
      setSelectedVoteTarget('');
      await startGameAndDealRoles(activeRoom.id);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเริ่มเกมได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Roll Dice in Cup (1 die for 5-8 players, 2 dice for 4 players)
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/60 via-[#FDFBF7] to-rose-50/40 text-slate-800">
      {/* Dedicated Game Screen Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Back to Catalog */}
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[42px]"
          >
            <ArrowLeft className="w-4 h-4 text-amber-700" />
            <span>กลับสู่คลังบอร์ดเกม</span>
          </button>

          {/* Center: Game Screen Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
              🧀
            </span>
            <div className="truncate">
              <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                ชีสหนูอยู่ไหน · หนูขโมยชีส (Cheese Thief)
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                เล่น 4–8 คน · ทอยเต๋าในถ้วย แอบส่องเบาะแสตอนกลางคืน และโหวตจับจอมโจรชีสพร้อมกัน
              </div>
            </div>
          </div>

          {/* Right: QR Share, Friends Modal & Account Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {activeRoom && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer min-h-[42px] shadow-2xs"
                title="ชวนเพื่อนด้วย QR Code หรือคัดลอกลิงก์"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">ชวนเพื่อน / QR</span>
                <span className="sm:hidden font-mono text-[11px]">#{activeRoom.roomCode}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenFriendModal}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[42px]"
            >
              <Users className="w-4 h-4 text-rose-600" />
              <span className="hidden xs:inline">เพื่อน ({friends.length})</span>
              <span className="xs:hidden">({friends.length})</span>
              {pendingFriendRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-extrabold rounded-md">
                  +{pendingFriendRequestsCount}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
              <span className="text-slate-500">Account:</span>
              <strong className="text-slate-900 font-bold">
                {currentUser.accountName}
              </strong>
              <span className="font-mono text-[11px] text-amber-800">
                ({currentUser.friendCode})
              </span>
            </div>
          </div>
        </div>
      </header>

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

      {/* Main Dedicated Full-Screen Game Workspace */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Incoming Room Invites from Friends */}
        {roomInvites.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 via-amber-50 to-rose-50 border border-emerald-300 rounded-2xl space-y-2.5 shadow-xs">
            <div className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>คำเชิญเข้าห้องหนูขโมยชีสจากเพื่อนของคุณ ({roomInvites.length})</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {roomInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-white border border-emerald-200 rounded-xl flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="text-xs">
                    <strong className="text-slate-900">{inv.fromName}</strong>{' '}
                    ชวนคุณเข้าห้อง{' '}
                    <span className="font-mono font-bold text-amber-900">
                      #{inv.roomCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAcceptRoomInvite(inv)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      เข้าร่วมห้องทันที
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissRoomInvite(inv.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {!activeRoom ? (
          /* Single Centralized Control Hub (จุดเดียวจบ) */
          <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* 1. Unified Hero & Action Card */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-200/90 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400 text-amber-950 flex items-center justify-center text-3xl shadow-xs">
                🧀
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/80 text-amber-900 border border-amber-200/60 rounded-full text-xs font-extrabold">
                  <span>ปาร์ตี้บอร์ดเกมสืบสวน</span>
                  <span>·</span>
                  <span>4–8 คน</span>
                  <span>·</span>
                  <span>จบใน 10 นาที</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  ชีสหนูอยู่ไหน (Cheese Thief)
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  วางก้อนชีสกลางโต๊ะ แจกการ์ดบทบาทลับ ทอยเต๋าในถ้วย แอบส่องเบาะแสตอนกลางคืน และโหวตจับจอมโจรชีสพร้อมกัน พร้อมระบบเสียงพากย์ Game Master ภาษาไทย
                </p>
              </div>

              <div className="pt-2 max-w-md mx-auto space-y-3">
                {/* Single Primary Action: Create Room */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleCreateRoom}
                  className="w-full py-4 px-6 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-amber-950 font-black text-sm sm:text-base rounded-2xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <Plus className="w-5 h-5" />
                  <span>+ สร้างห้องใหม่ (โฮสต์โต๊ะ 4–8 คน)</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px bg-amber-200/70 flex-1" />
                  <span className="text-xs font-bold text-slate-400">หรือเข้าร่วมด้วยรหัส 4 หลัก</span>
                  <div className="h-px bg-amber-200/70 flex-1" />
                </div>

                {/* Single 4-Digit Join Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (quickJoinCode.trim().length === 4) {
                      handleJoinByCode(quickJoinCode.trim());
                    }
                  }}
                  className="flex gap-2 items-center bg-white border border-amber-300/80 rounded-2xl p-1.5 shadow-2xs"
                >
                  <KeyRound className="w-4 h-4 text-amber-600 ml-2.5 shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={quickJoinCode}
                    onChange={(e) =>
                      setQuickJoinCode(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    placeholder="กรอกรหัสห้อง 4 หลัก"
                    className="flex-1 min-w-0 px-2 py-2 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={quickJoinCode.length !== 4 || isLoading}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-amber-950 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer min-h-[40px] shrink-0"
                  >
                    เข้าห้อง
                  </button>
                </form>
              </div>
            </div>

            {/* 2. Active Tables Card */}
            <div className="bg-white border border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    โต๊ะหนูขโมยชีสที่เปิดรอผู้เล่น ({cheeseRooms.length} ห้อง)
                  </h2>
                </div>
                <span className="text-xs text-slate-500">แตะเพื่อเข้าร่วมทันที</span>
              </div>

              {cheeseRooms.length === 0 ? (
                <div className="py-8 px-4 text-center bg-amber-50/40 border border-dashed border-amber-200 rounded-2xl space-y-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    ยังไม่มีโต๊ะที่เปิดรอผู้เล่นในขณะนี้
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    กดปุ่ม &ldquo;+ สร้างห้องใหม่&rdquo; ด้านบนเพื่อเปิดโต๊ะแรก แล้วชวนเพื่อนเข้ามาสนุกด้วยกันได้เลย
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-amber-100/80 -my-1">
                  {cheeseRooms.map((room) => {
                    const phaseInfo = PHASE_LABELS[room.status] || PHASE_LABELS.lobby!;
                    return (
                      <div
                        key={room.id}
                        onClick={() => handleSelectAndJoinRoom(room)}
                        className="py-3.5 hover:bg-amber-50/60 px-3 -mx-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 font-mono font-black text-xs rounded-lg">
                              #{room.roomCode}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${phaseInfo.color}`}>
                              {phaseInfo.label}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate mt-1">
                            {room.roomName || `โต๊ะของ ${room.hostName}`}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            โฮสต์: <strong className="text-slate-700">{room.hostName}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                            {room.playerCount || 1}/{room.maxPlayers || 8} คน
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAndJoinRoom(room);
                            }}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            เข้าโต๊ะ
                          </button>
                          {room.hostId === currentUser.uid && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteRoom(room.id, e)}
                              title="ลบห้องนี้"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Friends List Card */}
            <div className="bg-white border border-rose-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-rose-500" />
                  <span>รายชื่อเพื่อนของคุณ ({friends.length})</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenFriendModal}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มเพื่อน</span>
                </button>
              </div>

              {friends.length === 0 ? (
                <div className="p-4 bg-rose-50/40 border border-dashed border-rose-200 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-slate-600">
                    แอดเพื่อนด้วยชื่อ Account หรือรหัสเพื่อนเพื่อดึงมานั่งโต๊ะเดียวกันได้ทันที
                  </p>
                  <button
                    type="button"
                    onClick={onOpenFriendModal}
                    className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ค้นหาและแอดเพื่อนด้วยชื่อ / UID
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.uid}
                      className="p-2.5 bg-amber-50/40 border border-amber-200/70 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {friend.accountName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          #{friend.friendCode}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        พร้อมชวนเข้าโต๊ะ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dedicated Active Room Arena */
          <div className="max-w-4xl mx-auto w-full bg-gradient-to-b from-amber-50/90 via-white to-rose-50/50 border border-amber-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-400 text-amber-950 font-bold text-xl shadow-2xs">
                  🧀
                </span>
                <div>
                  <div className="text-[11px] font-mono font-bold text-amber-800 uppercase">
                    CHEESE THIEF TABLE · รหัสห้อง #{activeRoom.roomCode}
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {activeRoom.roomName || `โต๊ะของ ${activeRoom.hostName}`}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer min-h-[38px]"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>แชร์ห้อง / QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleLeaveOrCloseRoom}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer min-h-[38px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>
                    {activeRoom.hostId === currentUser.uid
                      ? 'ยุบห้อง / ออก'
                      : 'ออกจากห้อง'}
                  </span>
                </button>
              </div>
            </div>

            {/* Game Master Speaker Bar for In-Person Playing */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-amber-400 text-amber-950 font-bold shrink-0">
                  <Radio className={`w-3.5 h-3.5 ${isHostVoiceEnabled ? 'animate-pulse text-amber-950' : 'text-slate-500'}`} />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>ลำโพง Game Master ประจำโต๊ะ:</span>
                    <span className={isHostVoiceEnabled ? 'text-emerald-700 font-bold' : 'text-slate-500 font-bold'}>
                      {isHostVoiceEnabled ? 'เปิดเสียงพากย์ไทย (เครื่องโฮสต์)' : 'ปิดเสียงพากย์ (Mute)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeRoom.hostId === currentUser.uid
                      ? 'คุณคือโฮสต์ · วางเครื่องนี้ไว้กลางโต๊ะเพื่อส่งเสียงนำเล่น "ลืมตา - หลับตา" ให้ทุกคนได้ยิน'
                      : `เสียง Game Master จะเปล่งออกจากเครื่องของ ${activeRoom.hostName} (โฮสต์) เป็นลำโพงกลาง`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeRoom.hostId === currentUser.uid ? (
                  <>
                    <button
                      type="button"
                      onClick={() => thaiGameMaster.testVoice()}
                      className="px-2.5 py-1.5 bg-white hover:bg-amber-100/60 text-amber-950 border border-amber-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      🔊 ทดสอบเสียงพากย์
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isHostVoiceEnabled;
                        setIsHostVoiceEnabled(next);
                        thaiGameMaster.setEnabled(next);
                        showToast(next ? 'เปิดเสียงบรรยาย Game Master แล้ว' : 'ปิดเสียงบรรยาย Game Master แล้ว');
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        isHostVoiceEnabled
                          ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-2xs'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isHostVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{isHostVoiceEnabled ? 'เสียง: เปิด' : 'เสียง: ปิด'}</span>
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                    ฟังเสียงจากเครื่องโฮสต์
                  </span>
                )}
              </div>
            </div>

            {/* Step 1: Lobby */}
            {activeRoom.status === 'lobby' ? (
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
                onJoinTable={handleJoinByCode}
                onCreateTable={handleCreateRoom}
                onToggleReady={handleToggleReady}
                onStartGame={handleStartGame}
                onToggleFallMouse={(enabled) =>
                  toggleFallMouseMode(activeRoom.id, enabled)
                }
                onAddPracticeTablemate={() =>
                  addPracticeTablemate(activeRoom.id)
                }
                onRemovePlayer={(pid) => removePlayer(activeRoom.id, pid)}
                onInviteFriend={handleInviteFriendToRoom}
                onOpenFriendModal={onOpenFriendModal}
                onOpenShareModal={() => setIsShareModalOpen(true)}
              />
            ) : (
              /* Steps 2 to 6: Role Deal -> Dice Cup -> Night 1-6 AM + Follower Phase -> Morning Vote -> Verdict & ELO */
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
                onSelectVoteTarget={setSelectedVoteTarget}
                onCastVote={handleCastVote}
                onPlayAgain={handlePlayAgain}
              />
            )}
          </div>
        )}
      </main>

      {activeRoom && (
        <ShareRoomModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roomId={activeRoom.id}
          roomCode={activeRoom.roomCode}
          roomName={activeRoom.roomName}
        />
      )}
    </div>
  );
};
