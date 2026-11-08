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
} from 'lucide-react';
import { InsiderPhases } from './InsiderPhases';
import { ShareRoomModal } from '../common/ShareRoomModal';
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
} from '../../firebase/tableService';
import {
  UserProfile,
  RoomInviteDoc,
  sendRoomInviteToFriend,
  dismissRoomInvite,
} from '../../firebase/userService';
import {
  ALL_INSIDER_CATEGORY_OPTIONS,
  InsiderWordCategoryId,
} from '../../data/insiderWords';
import { tableAudio } from '../../utils/tableAudio';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

interface InsiderScreenProps {
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

  // Gameplay Local UI States
  const [isPeekingRole, setIsPeekingRole] = useState<boolean>(false);
  const [insiderRevealCountdown, setInsiderRevealCountdown] = useState<number | null>(null);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState<number>(180);
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState<number>(120);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string>('');
  const [isHostVoiceEnabled, setIsHostVoiceEnabled] = useState<boolean>(true);
  const [customLobbyWord, setCustomLobbyWord] = useState<string>('');

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

  // Auto-join if initialRoomCode is provided
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

  // STEP 3: Night Secret Word Reveal + Insider 6-Second Peek Countdown + GM TTS
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'word_reveal') {
      setInsiderRevealCountdown(null);
      return;
    }

    const isHost = activeRoom.hostId === currentUser.uid;

    if (!activeRoom.insiderEyesOpen) {
      setInsiderRevealCountdown(null);
      if (isHost && isHostVoiceEnabled) {
        thaiGameMaster.speakInsiderMasterWordCheck();
      } else {
        tableAudio.playHourChime(1);
      }
      return;
    }

    // When insiderEyesOpen becomes true: announce Insider wake & count down 6 seconds
    setInsiderRevealCountdown(6);
    if (isHost && isHostVoiceEnabled) {
      thaiGameMaster.speakInsiderWakeToPeekWord();
    } else {
      tableAudio.playHourChime(3);
    }

    const interval = window.setInterval(() => {
      setInsiderRevealCountdown((prev) => {
        const current = prev ?? 6;
        if (current === 2 && isHost && isHostVoiceEnabled) {
          thaiGameMaster.speakInsiderCloseEyes();
        }
        if (current <= 1) {
          window.clearInterval(interval);
          if (isHost) {
            startInsiderQuizPhase(activeRoom.id);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.insiderEyesOpen,
    activeRoom?.hostId,
    currentUser.uid,
    isHostVoiceEnabled,
  ]);

  // STEP 4: Question / Quiz Phase Sand Timer Countdown + GM Voice
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'question_phase') {
      return;
    }

    const duration = activeRoom.quizDurationSeconds || 180;
    setQuizSecondsLeft(duration);

    const isHost = activeRoom.hostId === currentUser.uid;
    if (isHost && isHostVoiceEnabled) {
      thaiGameMaster.speakInsiderQuizStart();
    } else {
      tableAudio.playMorningGong();
    }

    const interval = window.setInterval(() => {
      setQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (isHost) {
            triggerInsiderQuizTimeout(activeRoom.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.quizDurationSeconds,
    activeRoom?.hostId,
    currentUser.uid,
    isHostVoiceEnabled,
  ]);

  // Play chime when Master sends a quick Yes/No/Unsure signal
  useEffect(() => {
    if (
      activeRoom?.status === 'question_phase' &&
      activeRoom.masterSignalCount &&
      activeRoom.masterSignalCount > 0
    ) {
      tableAudio.playHourChime(2);
    }
  }, [activeRoom?.masterSignalCount, activeRoom?.status]);

  // STEP 5A: Flipped Sand Timer Discussion & Guesser Judgment Vote
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'discussion_guesser_vote') {
      return;
    }

    const discussDuration = activeRoom.elapsedQuizSeconds || 120;
    setDiscussionSecondsLeft(discussDuration);

    const isHost = activeRoom.hostId === currentUser.uid;
    if (isHost && isHostVoiceEnabled) {
      thaiGameMaster.speakInsiderWordGuessed(
        activeRoom.guesserPlayerName || 'ผู้เล่น'
      );
    } else {
      tableAudio.playMorningGong();
    }

    const timer = window.setInterval(() => {
      setDiscussionSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.elapsedQuizSeconds,
    activeRoom?.guesserPlayerName,
    activeRoom?.hostId,
    currentUser.uid,
    isHostVoiceEnabled,
  ]);

  // STEP 5B: Stage 2 General Vote Voice Announcement
  useEffect(() => {
    if (activeRoom?.status === 'general_vote') {
      const isHost = activeRoom.hostId === currentUser.uid;
      if (isHost && isHostVoiceEnabled) {
        thaiGameMaster.speakInsiderGeneralVote();
      } else {
        tableAudio.playMorningGong();
      }
    }
  }, [activeRoom?.status, activeRoom?.hostId, currentUser.uid, isHostVoiceEnabled]);

  // STEP 6: Game Over Fanfare & Verdict Announcement
  useEffect(() => {
    if (activeRoom?.status === 'game_over') {
      const isHost = activeRoom.hostId === currentUser.uid;
      if (activeRoom.winnerTeam === 'nobody') {
        if (isHost && isHostVoiceEnabled) {
          thaiGameMaster.speakInsiderTimeoutLoss();
        }
        tableAudio.playDramaticReveal(false);
        return;
      }

      const myPlayer = players.find((p) => p.id === currentUser.uid);
      const isWinner =
        (activeRoom.winnerTeam === 'insider' &&
          myPlayer?.role === 'insider_traitor') ||
        (activeRoom.winnerTeam === 'commons' &&
          (myPlayer?.role === 'insider_common' ||
            myPlayer?.role === 'insider_master'));

      tableAudio.playDramaticReveal(Boolean(isWinner));
      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  }, [
    activeRoom?.status,
    activeRoom?.winnerTeam,
    activeRoom?.hostId,
    currentUser.uid,
    isHostVoiceEnabled,
  ]);

  // Create an Insider Room (4-8 players) & immediately enter the waiting lobby
  const handleCreateRoom = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
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
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถสร้างห้องได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          setErrorMessage(
            `ไม่พบห้องรหัส "${clean}" กรุณาตรวจสอบรหัสห้องอีกครั้ง`
          );
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
    if (!activeRoom) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
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
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเริ่มเกมได้'
      );
    } finally {
      setIsLoading(false);
    }
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

  const myPlayer = players.find((p) => p.id === currentUser.uid);
  const canStartGame = players.length >= 4 && players.length <= 8;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/70 via-[#FDFBF7] to-amber-50/40 text-slate-800 w-full max-w-full overflow-x-hidden">
      {/* Dedicated Insider Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-rose-200/80 shadow-xs">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[42px]"
          >
            <ArrowLeft className="w-4 h-4 text-rose-700" />
            <span>กลับสู่คลังบอร์ดเกม</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
              🕵️
            </span>
            <div className="truncate">
              <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                จอมบงการคำใบ้ (Insider) · Oink Games Edition
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                เล่น 4–8 คน · ถามคำถาม ใช่/ไม่ใช่ ทายคำลับให้ทันเวลา และจับผิดจอมบงการที่แอบรู้คำตอบ!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {activeRoom && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer min-h-[42px] shadow-2xs"
                title="ชวนเพื่อนด้วย QR Code หรือคัดลอกลิงก์"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">ชวนเพื่อน / QR</span>
                <span className="sm:hidden font-mono text-[11px]">
                  #{activeRoom.roomCode}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenFriendModal}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[42px]"
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span className="hidden xs:inline">เพื่อน ({friends.length})</span>
              <span className="xs:hidden">({friends.length})</span>
              {pendingFriendRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-extrabold rounded-md">
                  +{pendingFriendRequestsCount}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs">
              <span className="text-slate-500">Account:</span>
              <strong className="text-slate-900 font-bold">
                {currentUser.accountName}
              </strong>
              <span className="font-mono text-[11px] text-rose-800">
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Incoming Room Invites */}
        {roomInvites.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border border-rose-300 rounded-2xl space-y-2.5 shadow-xs">
            <div className="text-xs sm:text-sm font-extrabold text-rose-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-600" />
              <span>คำเชิญเข้าโต๊ะเกมจากเพื่อนของคุณ ({roomInvites.length})</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {roomInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-white border border-rose-200 rounded-xl flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="text-xs">
                    <strong className="text-slate-900">{inv.fromName}</strong>{' '}
                    ชวนคุณเข้าห้อง{' '}
                    <span className="font-mono font-bold text-rose-800">
                      #{inv.roomCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAcceptRoomInvite(inv)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
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
            <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-600 text-white flex items-center justify-center text-3xl shadow-xs">
                🕵️
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-900 border border-rose-200/80 rounded-full text-xs font-extrabold">
                  <span>Oink Games Edition</span>
                  <span>·</span>
                  <span>4–8 คน</span>
                  <span>·</span>
                  <span>สืบสวนทายคำลับ</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  จอมบงการคำใบ้ (Insider)
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  ช่วยกันถามคำถาม &ldquo;ใช่ / ไม่ใช่&rdquo; กับผู้คุมคำใบ้ (Master) เพื่อทายคำศัพท์ลับให้ทันเวลา และจับผิดจอมบงการ (Insider) ที่แอบรู้คำตอบแต่แรก!
                </p>
              </div>

              <div className="pt-2 max-w-md mx-auto space-y-3">
                {/* Single Primary Action: Create Room */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleCreateRoom}
                  className="w-full py-4 px-6 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm sm:text-base rounded-2xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <Plus className="w-5 h-5" />
                  <span>+ สร้างห้องใหม่ (โฮสต์โต๊ะ 4–8 คน)</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px bg-rose-200/70 flex-1" />
                  <span className="text-xs font-bold text-slate-400">หรือเข้าร่วมด้วยรหัส 4 หลัก</span>
                  <div className="h-px bg-rose-200/70 flex-1" />
                </div>

                {/* Single 4-Digit Join Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (quickJoinCode.trim().length === 4) {
                      handleJoinByIdOrCode(quickJoinCode.trim());
                    }
                  }}
                  className="flex gap-2 items-center bg-white border border-rose-300 rounded-2xl p-1.5 shadow-2xs"
                >
                  <KeyRound className="w-4 h-4 text-rose-500 ml-2.5 shrink-0" />
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
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer min-h-[40px] shrink-0"
                  >
                    เข้าห้อง
                  </button>
                </form>
              </div>
            </div>

            {/* 2. Active Tables Card */}
            <div className="bg-white border border-rose-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    โต๊ะ Insider ที่เปิดรอผู้เล่น ({insiderRooms.length} ห้อง)
                  </h2>
                </div>
                <span className="text-xs text-slate-500">แตะเพื่อเข้าร่วมทันที</span>
              </div>

              {insiderRooms.length === 0 ? (
                <div className="py-8 px-4 text-center bg-rose-50/40 border border-dashed border-rose-200 rounded-2xl space-y-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    ยังไม่มีโต๊ะ Insider ที่เปิดอยู่ขณะนี้
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    กดปุ่ม &ldquo;+ สร้างห้องใหม่&rdquo; ด้านบนเพื่อเปิดโต๊ะแรก แล้วชวนเพื่อนเข้ามาทายคำศัพท์ลับกันเลย
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-rose-100 -my-1">
                  {insiderRooms.map((room) => {
                    const phaseInfo =
                      INSIDER_PHASE_LABELS[room.status] ||
                      INSIDER_PHASE_LABELS.lobby!;
                    return (
                      <div
                        key={room.id}
                        onClick={() => handleSelectAndJoinRoom(room)}
                        className="py-3.5 hover:bg-rose-50/50 px-3 -mx-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-rose-600 text-white font-mono font-black text-xs rounded-lg">
                              #{room.roomCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${phaseInfo.color}`}
                            >
                              {phaseInfo.label}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate mt-1">
                            {room.roomName || `โต๊ะของ ${room.hostName}`}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            โฮสต์:{' '}
                            <strong className="text-slate-700">
                              {room.hostName}
                            </strong>
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
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ค้นหาและแอดเพื่อน
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.uid}
                      className="p-2.5 bg-rose-50/40 border border-rose-200/70 rounded-xl flex items-center justify-between gap-2"
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
          <div className="max-w-4xl mx-auto w-full bg-gradient-to-b from-rose-50/80 via-white to-amber-50/40 border border-rose-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
            {/* Active Room Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-200/70">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-rose-600 text-white font-bold text-xl shadow-2xs">
                  🕵️
                </span>
                <div>
                  <div className="text-[11px] font-mono font-bold text-rose-700 uppercase">
                    INSIDER TABLE · รหัสห้อง #{activeRoom.roomCode}
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer min-h-[38px]"
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

            {/* Game Master Speaker Bar */}
            <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-rose-600 text-white font-bold shrink-0">
                  <Radio
                    className={`w-3.5 h-3.5 ${
                      isHostVoiceEnabled ? 'animate-pulse text-white' : 'text-rose-200'
                    }`}
                  />
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>ลำโพง Game Master (Insider):</span>
                    <span
                      className={
                        isHostVoiceEnabled
                          ? 'text-emerald-700 font-bold'
                          : 'text-slate-500 font-bold'
                      }
                    >
                      {isHostVoiceEnabled
                        ? 'เปิดเสียงพากย์ไทย (เครื่องโฮสต์)'
                        : 'ปิดเสียงพากย์ (Mute)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeRoom.hostId === currentUser.uid
                      ? 'คุณคือโฮสต์ · เครื่องนี้จะพากย์เสียงสั่ง "ทุกคนหลับตา - อินไซเดอร์ลืมตาดูคำลับ" ให้ทั้งโต๊ะ'
                      : `เสียง Game Master จะเปล่งออกจากเครื่องของ ${activeRoom.hostName} (โฮสต์)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeRoom.hostId === currentUser.uid ? (
                  <>
                    <button
                      type="button"
                      onClick={() => thaiGameMaster.testInsiderVoice()}
                      className="px-2.5 py-1.5 bg-white hover:bg-rose-100/60 text-rose-950 border border-rose-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      🔊 ทดสอบเสียงพากย์
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isHostVoiceEnabled;
                        setIsHostVoiceEnabled(next);
                        thaiGameMaster.setEnabled(next);
                        showToast(
                          next
                            ? 'เปิดเสียงบรรยาย Game Master แล้ว'
                            : 'ปิดเสียงบรรยาย Game Master แล้ว'
                        );
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        isHostVoiceEnabled
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isHostVoiceEnabled ? (
                        <Volume2 className="w-3.5 h-3.5" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isHostVoiceEnabled ? 'เสียง: เปิด' : 'เสียง: ปิด'}
                      </span>
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                    ฟังเสียงจากเครื่องโฮสต์
                  </span>
                )}
              </div>
            </div>

            {/* STEP 1: INSIDER LOBBY */}
            {activeRoom.status === 'lobby' ? (
              <div className="space-y-5">
                {/* Room Code & Quick Invite Banner */}
                <div className="p-5 bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white rounded-3xl text-center shadow-sm space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-100 block">
                    STEP 1 · ห้องรอผู้เล่นจอมบงการคำใบ้ (INSIDER WAITING ROOM)
                  </span>
                  <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-white select-all py-1">
                    #{activeRoom.roomCode}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-extrabold rounded-xl transition-all shadow-2xs cursor-pointer min-h-[36px]"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Code & ลิงก์ชวนเพื่อน</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenFriendModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 text-white border border-white/30 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[36px]"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ ค้นหา / รับแอดเพื่อนเพิ่ม</span>
                    </button>
                  </div>
                </div>

                {/* Invite Accepted Friends Strip inside Lobby */}
                <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-rose-600" />
                      <span>
                        ดึงเพื่อนที่แอดแล้วเข้าห้องนี้ ({friends.length} คนในรายชื่อเพื่อน)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={onOpenFriendModal}
                      className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                    >
                      จัดการรายชื่อเพื่อน →
                    </button>
                  </div>

                  {friends.length === 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/90 rounded-xl border border-rose-200/60 text-xs text-slate-600">
                      <span>
                        แอดเพื่อนด้วยชื่อ Account หรือรหัสเพื่อนเพื่อดึงมานั่งโต๊ะเดียวกันได้ทันที
                      </span>
                      <button
                        type="button"
                        onClick={onOpenFriendModal}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer shrink-0"
                      >
                        + ไปหน้าเพิ่มเพื่อน
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {friends.map((friend) => {
                        const alreadySeated = players.some(
                          (p) => p.id === friend.uid
                        );
                        return (
                          <div
                            key={friend.uid}
                            className="px-3 py-2 bg-white border border-rose-200 rounded-xl flex items-center gap-2.5 shadow-2xs"
                          >
                            <span className="text-xs font-bold text-slate-900">
                              {friend.accountName}
                            </span>
                            {alreadySeated ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                อยู่ในห้องแล้ว
                              </span>
                            ) : (
                              players.length < 8 && (
                                <button
                                  type="button"
                                  onClick={() => handleInviteFriendToRoom(friend)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                                >
                                  <span>+ ดึงเข้าห้อง</span>
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Insider Game Settings: Word Category, Timer Duration, Optional Custom Word */}
                <div className="p-4 sm:p-5 bg-white border border-rose-200 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      <span>ตั้งค่ากติกาและหมวดหมู่คำศัพท์ลับ (4–8 คน)</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      Master 1 · Insider 1 · พลเมือง {Math.max(2, players.length - 2)}
                    </span>
                  </div>

                  {/* Word Category Pills */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      1. เลือกหมวดหมู่คำศัพท์ภาษาไทย:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_INSIDER_CATEGORY_OPTIONS.map((cat) => {
                        const isSelected =
                          (activeRoom.wordCategory || 'all') === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                              updateInsiderLobbySettings(
                                activeRoom.id,
                                cat.id as InsiderWordCategoryId,
                                activeRoom.quizDurationSeconds || 180
                              )
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                : 'bg-rose-50/40 hover:bg-rose-50 text-slate-700 border-rose-200/70'
                            }`}
                          >
                            <span>{cat.emoji}</span>
                            <span className="truncate">{cat.labelTh}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sand Timer Duration & Optional Custom Word */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-rose-100">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Hourglass className="w-3.5 h-3.5 text-rose-600" />
                        <span>2. เวลาของนาฬิกาทรายช่วงถาม-ตอบ:</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { sec: 180, label: '3 นาที (มาตรฐาน)' },
                          { sec: 300, label: '5 นาที (คุยสบายๆ)' },
                        ].map((opt) => {
                          const active =
                            (activeRoom.quizDurationSeconds || 180) === opt.sec;
                          return (
                            <button
                              key={opt.sec}
                              type="button"
                              onClick={() =>
                                updateInsiderLobbySettings(
                                  activeRoom.id,
                                  activeRoom.wordCategory || 'all',
                                  opt.sec
                                )
                              }
                              className={`py-2 px-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                                active
                                  ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        3. พิมพ์คำศัพท์ลับเองล่วงหน้า (เว้นว่างเพื่อสุ่มอัตโนมัติ):
                      </label>
                      <input
                        type="text"
                        maxLength={50}
                        value={customLobbyWord}
                        onChange={(e) => setCustomLobbyWord(e.target.value)}
                        placeholder="เว้นว่างไว้เพื่อสุ่มจากหมวดหมู่ (หรือ Master เปลี่ยนคำในเกมได้)"
                        className="w-full px-3 py-2 text-xs font-bold bg-rose-50/40 border border-rose-200 rounded-xl text-slate-900 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Players Seat List */}
                <div className="p-4 sm:p-5 bg-white border border-rose-200 rounded-3xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        ผู้เล่นที่นั่งอยู่ในโต๊ะ ({players.length}/8 คน · ขั้นต่ำ 4 คน)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        ระบบจะสุ่มการ์ด Master 1 ใบ, Insider 1 ใบ และพลเมืองทั่วไปให้ผู้เล่นทุกคนเมื่อกดเริ่มเกม
                      </p>
                    </div>

                    {players.length < 8 && (
                      <button
                        type="button"
                        onClick={() => addPracticeTablemate(activeRoom.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-xl border border-amber-300 transition-colors cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>+ เพิ่มบอทซ้อมมือ</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {players.map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-3 bg-rose-50/40 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex items-center gap-1">
                              <span>{p.name}</span>
                              {p.id === activeRoom.hostId && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {p.id === currentUser.uid
                                ? 'คุณ'
                                : p.id.startsWith('mate_')
                                ? 'บอทซ้อมมือ'
                                : 'ผู้เล่นออนไลน์'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              p.isReady
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.isReady ? 'พร้อมแล้ว' : 'รอเตรียมพร้อม'}
                          </span>
                          {p.id !== currentUser.uid && (
                            <button
                              type="button"
                              onClick={() => removePlayer(activeRoom.id, p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="นำออกจากโต๊ะ"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ready & Start Game Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rose-100">
                    <button
                      type="button"
                      onClick={handleToggleReady}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                        myPlayer?.isReady
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {myPlayer?.isReady
                        ? '✓ คุณกดพร้อมแล้ว'
                        : 'กดยืนยันความพร้อม'}
                    </button>

                    <button
                      type="button"
                      disabled={!canStartGame || isLoading}
                      onClick={handleStartInsiderGame}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer min-h-[46px]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>
                        {canStartGame
                          ? `เริ่มเกม Insider (${players.length} คน) → แจกการ์ดบทบาท`
                          : `ต้องมีผู้เล่นอย่างน้อย 4 คน (ขาดอีก ${Math.max(
                              0,
                              4 - players.length
                            )} คน)`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* STEPS 2 TO 6: INSIDER PHASES */
              <InsiderPhases
                currentRoom={activeRoom}
                players={players}
                currentUid={currentUser.uid}
                isPeekingRole={isPeekingRole}
                insiderRevealCountdown={insiderRevealCountdown}
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
