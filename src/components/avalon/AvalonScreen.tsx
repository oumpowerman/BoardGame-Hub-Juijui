import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users, Sparkles, KeyRound } from 'lucide-react';
import {
  createTableRoom,
  joinTableRoom,
  listenToRoom,
  listenToRoomPlayers,
  addPracticeTablemate,
  removePlayer,
  leaveOrCloseTableRoom,
  deleteTableRoom,
  FirestoreRoom,
  FirestorePlayer,
  PlayerRoleCard,
} from '../../firebase/tableService';
import {
  updateAvalonLobbySettings,
  setPlayerAvalonRole,
  startAvalonGame,
  confirmRoleRevealedAndStartTeamSelection,
  proposeAvalonTeam,
  submitAvalonTeamVote,
  submitAvalonQuestVote,
  submitAvalonAssassination,
  rematchAvalonGame,
  AvalonSettingsPayload,
} from '../../firebase/table/avalonService';
import { UserProfile, RoomInviteDoc } from '../../firebase/userService';
import { useAvalonGameMaster } from './useAvalonGameMaster';
import { AvalonTopBar } from './AvalonTopBar';
import { AvalonActiveRoomHeader } from './AvalonActiveRoomHeader';
import { AvalonInvitesBanner } from './AvalonInvitesBanner';
import { AvalonLobby } from './AvalonLobby';
import { AvalonPhases } from './AvalonPhases';
import { AvalonCreationTransitionOverlay } from './AvalonCreationTransitionOverlay';

interface AvalonScreenProps {
  onBackToCatalog: () => void;
  initialRoomCode?: string;
  currentUser?: UserProfile | null;
  friends?: UserProfile[];
  pendingFriendRequestsCount?: number;
  roomInvites?: RoomInviteDoc[];
  onOpenFriendModal?: () => void;
}

export const AvalonScreen: React.FC<AvalonScreenProps> = ({
  onBackToCatalog,
  initialRoomCode = '',
  currentUser,
  friends = [],
  pendingFriendRequestsCount = 0,
  roomInvites = [],
  onOpenFriendModal = () => {},
}) => {
  // Real authenticated player credentials
  const currentUserId = currentUser?.uid || 'guest_user';
  const [currentUserName, setCurrentUserName] = useState<string>(
    currentUser?.accountName || 'อัศวินโต๊ะกลม'
  );

  useEffect(() => {
    if (currentUser?.accountName) {
      setCurrentUserName(currentUser.accountName);
    }
  }, [currentUser?.accountName]);

  // Room state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState<string>(initialRoomCode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sound & Audio effects Hook
  const isGameOver = room?.status === 'avalon_scoring';
  const {
    soundEnabled,
    setSoundEnabled,
    playChime,
    playCardFlipSound,
    playSuspenseTick,
    playCardSuccessSound,
    playCardFailSound,
    playVoteCastSound,
  } = useAvalonGameMaster(isGameOver);

  // Handle auto-join from URL parameter if code provided
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.length === 4 && !activeRoomId) {
      handleJoinRoom(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Subscribe to room doc changes
  useEffect(() => {
    if (!activeRoomId) {
      setRoom(null);
      return;
    }
    const unsub = listenToRoom(activeRoomId, (updatedRoom: FirestoreRoom | null) => {
      if (!updatedRoom) {
        // Room disbanded or deleted
        setActiveRoomId(null);
        setRoom(null);
        setPlayers([]);
        return;
      }
      setRoom(updatedRoom);
    });
    return () => unsub();
  }, [activeRoomId]);

  // Subscribe to players collection changes
  useEffect(() => {
    if (!activeRoomId) {
      setPlayers([]);
      return;
    }
    const unsub = listenToRoomPlayers(activeRoomId, (updatedPlayers: FirestorePlayer[]) => {
      setPlayers(updatedPlayers);
    });
    return () => unsub();
  }, [activeRoomId]);

  // Create room handler with smooth transition & seal timing
  const handleCreateRoom = async () => {
    setErrorMsg('');
    setIsLoading(true);
    setIsCreatingRoom(true);
    playCardFlipSound();

    // Ensure magical seal animation plays smoothly for at least 850ms
    const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 850));

    try {
      const [newRoom] = await Promise.all([
        createTableRoom(currentUserName, 'avalon'),
        minDelayPromise,
      ]);
      setActiveRoomId(newRoom.id);
      playChime();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถสร้างห้องได้';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
      setIsCreatingRoom(false);
    }
  };

  // Join room handler
  const handleJoinRoom = async (codeToJoin?: string) => {
    const targetCode = (codeToJoin || joinCodeInput).trim();
    if (targetCode.length !== 4) {
      setErrorMsg('กรุณากรอกรหัสห้อง 4 หลัก');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const joined = await joinTableRoom(targetCode, currentUserName);
      setActiveRoomId(joined.id);
      playChime();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถเข้าร่วมห้องได้';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Leave / Disband room handler
  const handleLeaveRoom = async () => {
    if (!activeRoomId) return;
    try {
      const isHost = room?.hostId === currentUserId;
      if (isHost) {
        await deleteTableRoom(activeRoomId);
      } else {
        await leaveOrCloseTableRoom(activeRoomId, room?.hostId || '');
      }
    } catch (err) {
      console.error('Failed to leave room:', err);
    } finally {
      setActiveRoomId(null);
      setRoom(null);
      setPlayers([]);
    }
  };

  // Add bot handler
  const handleAddBot = async () => {
    if (!activeRoomId || !isHost) return;
    setIsLoading(true);
    try {
      await addPracticeTablemate(activeRoomId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถเพิ่มบอทได้';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove player / bot handler
  const handleRemovePlayer = async (playerId: string) => {
    if (!activeRoomId || !isHost) return;
    try {
      await removePlayer(activeRoomId, playerId);
    } catch (err) {
      console.error('Failed to remove player:', err);
    }
  };

  // Host setting update
  const handleUpdateSettings = async (settings: AvalonSettingsPayload) => {
    if (!activeRoomId || !isHost) return;
    await updateAvalonLobbySettings(activeRoomId, settings);
  };

  // Manual role selection by player
  const handleSelectManualRole = async (role: PlayerRoleCard) => {
    if (!activeRoomId) return;
    await setPlayerAvalonRole(activeRoomId, currentUserId, role);
  };

  // Start Avalon game
  const handleStartGame = async () => {
    if (!activeRoomId || !isHost) return;
    setIsLoading(true);
    try {
      await startAvalonGame(activeRoomId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถเริ่มเกมได้';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isHost = room?.hostId === currentUserId;

  const userProfile: UserProfile = currentUser || {
    uid: currentUserId,
    accountName: currentUserName,
    friendCode: 'AVALON',
    friends: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-emerald-50/30 to-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Bar Navigation */}
      <AvalonTopBar
        currentUser={userProfile}
        friendsCount={friends.length}
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        roomCode={room?.roomCode}
        isHost={isHost}
        onBackToCatalog={onBackToCatalog}
        onOpenFriendModal={onOpenFriendModal}
        onDisbandRoom={handleLeaveRoom}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Invites Banner */}
        <AvalonInvitesBanner
          invites={roomInvites}
          onAcceptInvite={(invite) => handleJoinRoom(invite.roomCode)}
        />

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-center justify-between shadow-xs"
          >
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg('')}
              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold cursor-pointer transition"
            >
              ปิด
            </button>
          </motion.div>
        )}

        {/* TRANSITION & VIEW SWITCHING */}
        <AnimatePresence mode="wait">
          {/* SCREEN STATE 1: LOBBY SELECTION / CREATION FORM */}
          {!room && (
            <motion.div
              key="landing-selection-form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6"
            >
              {/* Left Column: Game Presentation & Hero */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="md:col-span-6 flex flex-col gap-4"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-xs font-bold w-fit shadow-2xs">
                  <Crown className="w-4 h-4 text-emerald-700" />
                  <span>เล่นสดที่โต๊ะ + มีแอพช่วยดำเนินเกม</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Avalon: <span className="text-emerald-700">ศึกอัศวินโต๊ะกลม</span>
                </h1>
                <p className="text-slate-600 text-sm leading-relaxed">
                  เกมซ่อนบทบาทระดับตำนาน เล่นด้วยการ์ดจริงและพูดคุยต่อหน้ากัน 
                  โดยให้ระบบดิจิทัลช่วยแจกบทบาท แอบส่องนิมิต โหวตเลือกทีม 
                  และบันทึกคะแนน ELO อย่างแม่นยำ!
                </p>

                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="p-3 bg-white/95 border border-emerald-200/90 rounded-2xl text-center shadow-xs">
                    <span className="text-xs text-slate-500 font-medium block">ผู้เล่น</span>
                    <span className="text-base sm:text-lg font-black text-emerald-800">5 – 10 คน</span>
                  </div>
                  <div className="p-3 bg-white/95 border border-emerald-200/90 rounded-2xl text-center shadow-xs">
                    <span className="text-xs text-slate-500 font-medium block">เวลาต่อรอบ</span>
                    <span className="text-base sm:text-lg font-black text-emerald-800">15-30 นาที</span>
                  </div>
                  <div className="p-3 bg-white/95 border border-emerald-200/90 rounded-2xl text-center shadow-xs">
                    <span className="text-xs text-slate-500 font-medium block">ประเภท</span>
                    <span className="text-base sm:text-lg font-black text-emerald-800">บลัฟฟ์ & สืบสวน</span>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Player Name, Create & Join Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="md:col-span-6 bg-white/95 border border-emerald-200/90 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-sm flex flex-col gap-6"
              >
                {/* Display Name Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" /> ชื่อผู้เล่นที่โต๊ะ
                  </label>
                  <input
                    type="text"
                    maxLength={25}
                    value={currentUserName}
                    onChange={(e) => setCurrentUserName(e.target.value)}
                    placeholder="กรอกชื่อของคุณ"
                    className="w-full px-4 py-3 bg-slate-50/80 border border-emerald-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition text-sm font-medium"
                  />
                </div>

                {/* Action Buttons: Create or Join */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreateRoom}
                    disabled={isLoading || isCreatingRoom}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span>เปิดโต๊ะใหม่ (Host)</span>
                  </motion.button>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="รหัส 4 หลัก"
                        className="w-full px-3 py-2 bg-slate-50/80 border border-emerald-200 rounded-xl text-center text-slate-900 font-mono tracking-widest text-lg focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition font-bold"
                      />
                      <button
                        onClick={() => handleJoinRoom()}
                        disabled={isLoading || joinCodeInput.length !== 4}
                        className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <KeyRound className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 text-center font-medium">
                      กรอกรหัส 4 หลักเพื่อเข้าโต๊ะเพื่อน
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* SCREEN STATE 2: ACTIVE ROOM (LOBBY OR GAME PHASES) */}
          {room && (
            <motion.div
              key={`active-room-view-${room.id}`}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="flex flex-col gap-6"
            >
              {/* Room Header */}
              <AvalonActiveRoomHeader
                currentRoom={room}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                onLeaveRoom={handleLeaveRoom}
                onOpenInviteModal={onOpenFriendModal}
              />

              {room.status === 'lobby' ? (
                <AvalonLobby
                  currentRoom={room}
                  players={players}
                  currentUid={currentUserId}
                  isLoading={isLoading}
                  onUpdateSettings={handleUpdateSettings}
                  onAddBot={handleAddBot}
                  onRemovePlayer={handleRemovePlayer}
                  onStartGame={handleStartGame}
                  onOpenInviteModal={onOpenFriendModal}
                  onPlayFlipSound={playCardFlipSound}
                />
              ) : (
                <AvalonPhases
                  currentRoom={room}
                  players={players}
                  currentUid={currentUserId}
                  isLoading={isLoading}
                  onSelectManualRole={handleSelectManualRole}
                  onConfirmRoleRevealed={() =>
                    confirmRoleRevealedAndStartTeamSelection(room.id)
                  }
                  onProposeTeam={(ids) => proposeAvalonTeam(room.id, ids)}
                  onSubmitTeamVote={(choice) =>
                    submitAvalonTeamVote(room.id, currentUserId, choice)
                  }
                  onSubmitQuestVote={(choice) =>
                    submitAvalonQuestVote(room.id, currentUserId, choice)
                  }
                  onSubmitAssassination={(targetId) =>
                    submitAvalonAssassination(room.id, targetId)
                  }
                  onRematch={() => rematchAvalonGame(room.id)}
                  onPlayCardFlipSound={playCardFlipSound}
                  onPlaySuspenseTick={playSuspenseTick}
                  onPlayCardSuccessSound={playCardSuccessSound}
                  onPlayCardFailSound={playCardFailSound}
                  onPlayVoteCastSound={playVoteCastSound}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Arthurian Seal Creation Transition Overlay Portal */}
        <AvalonCreationTransitionOverlay isOpen={isCreatingRoom} />
      </main>
    </div>
  );
};

export default AvalonScreen;
