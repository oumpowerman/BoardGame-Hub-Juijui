import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Users,
  Play,
  Volume2,
  VolumeX,
  Tablet,
  Smartphone,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Bot,
  Trash2,
  UserPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, RoomInviteDoc } from '../../firebase/userService';
import {
  createTableRoom,
  findRoomByCode,
  joinTableRoom,
  listenToRoom,
  listenToRoomPlayers,
  leaveOrCloseTableRoom,
  addPracticeTablemate,
  removePlayer,
  addFriendToRoomSeat,
  FirestoreRoom,
  FirestorePlayer,
  registerHuesCuesIpadBoard,
  startHuesCuesRound,
  selectHuesCuesTargetColor,
  submitHuesCuesClue1,
  placeHuesCuesGuess,
  advanceToHuesCuesClue2,
  submitHuesCuesClue2,
  calculateHuesCuesScores,
} from '../../firebase/tableService';
import { useHuesCuesGameMaster } from '../../hooks/useHuesCuesGameMaster';
import { GameSceneTransition } from '../transitions/GameSceneTransition';
import { useRoomTransition } from '../../hooks/useRoomTransition';
import { HuesCuesCentralBoard } from './HuesCuesCentralBoard';
import { HuesCuesPlayerControls } from './HuesCuesPlayerControls';

interface HuesCuesScreenProps {
  currentUser: UserProfile;
  onBackToCatalog: () => void;
  initialRoomId?: string;
  initialBoardMode?: boolean;
  rooms?: FirestoreRoom[];
  friends?: UserProfile[];
  roomInvites?: RoomInviteDoc[];
  onOpenFriendModal?: () => void;
  onInviteFriendToRoom?: (room: FirestoreRoom, friend: UserProfile) => void;
}

export const HuesCuesScreen: React.FC<HuesCuesScreenProps> = ({
  currentUser,
  onBackToCatalog,
  initialRoomId = '',
  initialBoardMode = false,
  rooms = [],
  friends = [],
  onOpenFriendModal,
  onInviteFriendToRoom,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [room, setRoom] = useState<FirestoreRoom | null>(null);
  const [players, setPlayers] = useState<FirestorePlayer[]>([]);
  const [inputCode, setInputCode] = useState<string>(initialRoomId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isIpadBoardView, setIsIpadBoardView] = useState<boolean>(initialBoardMode);
  const [copiedLinkType, setCopiedLinkType] = useState<'ipad' | 'player' | null>(
    null
  );

  // Dedicated Room Scene Transition for Hues & Cues
  const {
    transitionProps,
    isCodeInputError,
    clearCodeInputError,
    runCreateRoomTransition,
    runJoinRoomTransition,
    runLeaveRoomTransition,
    runStartGameTransition,
  } = useRoomTransition('hues-cues');

  useHuesCuesGameMaster(
    room?.status || 'lobby',
    room?.hcClueGiverName,
    room?.hcClue1,
    room?.hcClue2,
    isMuted
  );

  // Check URL query parameters for ?mode=board and ?room=XXXX
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const roomParam = params.get('room') || params.get('code') || initialRoomId;
    const isBoard = modeParam === 'board' || initialBoardMode;

    if (isBoard) {
      setIsIpadBoardView(true);
    }

    if (roomParam && !activeRoomId) {
      handleAutoConnectByCodeOrId(roomParam.trim(), isBoard);
    }
  }, [initialRoomId, initialBoardMode]);

  const handleAutoConnectByCodeOrId = async (
    codeOrId: string,
    asBoard: boolean
  ) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      let targetRoomId = codeOrId;
      if (codeOrId.length === 4 && /^\d{4}$/.test(codeOrId)) {
        const found = await findRoomByCode(codeOrId);
        if (!found) {
          setErrorMsg(`ไม่พบห้องรหัส #${codeOrId}`);
          setIsLoading(false);
          return;
        }
        targetRoomId = found.id;
      }

      if (asBoard) {
        // Connect as Central iPad Board without taking a player seat
        await registerHuesCuesIpadBoard(targetRoomId, true);
        setActiveRoomId(targetRoomId);
      } else {
        // Connect as a Player on Phone
        await joinTableRoom(
          targetRoomId,
          currentUser.accountName,
          currentUser.avatarUrl
        );
        setActiveRoomId(targetRoomId);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อห้องได้'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time listener for Room Document
  useEffect(() => {
    if (!activeRoomId) {
      setRoom(null);
      return;
    }
    const unsub = listenToRoom(activeRoomId, (updatedRoom) => {
      if (!updatedRoom) {
        setActiveRoomId('');
        setRoom(null);
        setPlayers([]);
        return;
      }
      setRoom(updatedRoom);
    });
    return () => unsub();
  }, [activeRoomId]);

  // Real-time listener for Room Players
  useEffect(() => {
    if (!activeRoomId) {
      setPlayers([]);
      return;
    }
    const unsub = listenToRoomPlayers(activeRoomId, (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
    return () => unsub();
  }, [activeRoomId]);

  // Create Room (Host Phone) with Transition Curtain
  const handleCreateRoom = async () => {
    setErrorMsg('');
    clearCodeInputError();
    setIsLoading(true);

    const created = await runCreateRoomTransition(async () => {
      const roomDoc = await createTableRoom(
        currentUser.accountName,
        'hues-cues',
        `โต๊ะทายสี Hues & Cues ของ ${currentUser.accountName}`,
        10
      );
      return roomDoc;
    });

    if (created) {
      setIsIpadBoardView(false);
      setActiveRoomId(created.id);
    }
    setIsLoading(false);
  };

  // Join Room by 4-Digit Code with Transition Curtain
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) return;

    await runJoinRoomTransition(clean, async () => {
      let targetRoomId = clean;
      let roomCode = clean;
      if (clean.length === 4 && /^\d{4}$/.test(clean)) {
        const found = await findRoomByCode(clean);
        if (!found) {
          throw new Error(`ไม่พบห้องรหัส #${clean} ในระบบ`);
        }
        targetRoomId = found.id;
        roomCode = found.roomCode;
      }

      if (isIpadBoardView) {
        await registerHuesCuesIpadBoard(targetRoomId, true);
      } else {
        await joinTableRoom(
          targetRoomId,
          currentUser.accountName,
          currentUser.avatarUrl
        );
      }
      setActiveRoomId(targetRoomId);
      return { roomCode, id: targetRoomId };
    });
  };

  // Leave or Close Room with Transition Curtain
  const handleLeaveRoom = async () => {
    if (!activeRoomId || !room) {
      setActiveRoomId('');
      return;
    }
    await runLeaveRoomTransition(room.roomCode, async () => {
      if (isIpadBoardView && room.hostId !== currentUser.uid) {
        setActiveRoomId('');
        return;
      }
      try {
        await leaveOrCloseTableRoom(activeRoomId, room.hostId);
      } finally {
        setActiveRoomId('');
      }
    });
  };

  // Start Game (Host) with Transition Curtain
  const handleStartGame = async () => {
    if (!activeRoomId || !room) return;
    setIsLoading(true);
    await runStartGameTransition(room.roomCode, async () => {
      await startHuesCuesRound(activeRoomId);
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    });
    setIsLoading(false);
  };

  // Bidirectional Tile Selection (From Phone OR From Central iPad)
  const handleSelectTile = async (
    tileId: string,
    targetPlayerUid?: string,
    source: 'phone' | 'ipad' = 'phone'
  ) => {
    if (!activeRoomId || !room) return;
    const uidToMove = targetPlayerUid || currentUser.uid;
    const targetPlayer = players.find((p) => p.id === uidToMove);
    const pName = targetPlayer?.name || currentUser.accountName;
    const pAvatar = targetPlayer?.avatarUrl || currentUser.avatarUrl || '';

    await placeHuesCuesGuess(
      activeRoomId,
      uidToMove,
      pName,
      pAvatar,
      tileId,
      source
    );
  };

  const liveHuesRooms = rooms.filter((r) => r.gameId === 'hues-cues');

  // Shareable URLs for QR Codes
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
  const ipadBoardUrl = room
    ? `${origin}/?game=hues-cues&room=${room.roomCode}&mode=board`
    : '';
  const playerJoinUrl = room
    ? `${origin}/?game=hues-cues&room=${room.roomCode}`
    : '';

  const handleCopyUrl = (url: string, type: 'ipad' | 'player') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLinkType(type);
      setTimeout(() => setCopiedLinkType(null), 2200);
    }
  };

  // ============================================================================
  // VIEW 1: ENTRY LOBBY (CREATE ROOM ON HOST PHONE OR JOIN WITH 4-DIGIT CODE)
  // ============================================================================
  if (!activeRoomId || !room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Real-time Room Action Transition Portal */}
        <GameSceneTransition {...transitionProps} />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-amber-50 text-slate-700 font-bold text-xs rounded-xl border border-amber-200 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่คลังบอร์ดเกม</span>
          </button>
          <span className="text-xs font-bold text-pink-800 font-mono">
            Hues & Cues · Multi-Device Sync
          </span>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-xl border border-amber-200/90 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <p className="text-xs font-mono font-bold text-pink-600 uppercase tracking-wider">
              PARTY COLOR DEDUCTION · 3–10 PLAYERS
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              ทายสีจากคำใบ้ (Hues and Cues)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              1. โฮสต์กดสร้างห้องบนโทรศัพท์มือถือ · 2. เพื่อน ๆ เข้าร่วมด้วยรหัส 4 หลัก ·
              3. ใช้ iPad สแกน QR Code เพื่อเปิดเป็นกระดานสีกลาง 480 ช่อง
              แล้วซิงค์ตำแหน่งหมากทายสีระหว่างมือถือและ iPad แบบเรียลไทม์!
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 text-center">
              {errorMsg}
            </div>
          )}

          {/* Create or Join Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Step 1: Host Phone Creates Room */}
            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>สำหรับโฮสต์ (สร้างห้องบนโทรศัพท์)</span>
                </div>
                <p className="text-xs text-slate-600">
                  สร้างห้องรหัส 4 หลักพร้อมรับ QR Code สำหรับให้ iPad สแกนเป็นกระดานกลาง
                </p>
              </div>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleCreateRoom}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-amber-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isLoading ? 'กำลังสร้างห้อง...' : 'สร้างห้องใหม่ (รหัส 4 หลัก)'}</span>
              </button>
            </div>

            {/* Step 2: Join Room by 4-Digit Code */}
            <form
              onSubmit={handleJoinByCode}
              className="p-5 bg-pink-50/60 border border-pink-200 rounded-2xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1">
                <div className="text-xs font-black text-pink-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-pink-600" />
                  <span>เข้าร่วมห้องด้วยรหัส 4 หลัก</span>
                </div>
                <p className="text-xs text-slate-600">
                  กรอกรหัสห้อง 4 หลักจากโทรศัพท์ของโฮสต์เพื่อเข้าโต๊ะ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="รหัส 4 หลัก เช่น 4829"
                  className="flex-1 px-3.5 py-3 bg-white border border-pink-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || inputCode.trim().length !== 4}
                  className="px-4 py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  เข้าห้อง
                </button>
              </div>
            </form>
          </div>

          {/* Active Live Rooms List */}
          {liveHuesRooms.length > 0 && (
            <div className="pt-4 border-t border-amber-100 space-y-3">
              <h2 className="text-xs font-extrabold text-slate-700">
                ห้อง Hues & Cues ที่กำลังเปิดอยู่ ({liveHuesRooms.length} ห้อง)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {liveHuesRooms.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-white border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        #{r.roomCode} · {r.roomName || `โต๊ะของ ${r.hostName}`}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ผู้เล่น {r.playerCount || 1} คน ·{' '}
                        {r.hcIpadConnected ? 'iPad เชื่อมต่อแล้ว' : 'รอสแกน iPad'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await runJoinRoomTransition(r.roomCode, async () => {
                            await joinTableRoom(
                              r.id,
                              currentUser.accountName,
                              currentUser.avatarUrl
                            );
                            setActiveRoomId(r.id);
                            return { roomCode: r.roomCode, id: r.id };
                          });
                        }}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        เข้าเล่น (มือถือ)
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await runJoinRoomTransition(r.roomCode, async () => {
                            await registerHuesCuesIpadBoard(r.id, true);
                            setIsIpadBoardView(true);
                            setActiveRoomId(r.id);
                            return { roomCode: r.roomCode, id: r.id };
                          });
                        }}
                        className="px-2.5 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold text-xs rounded-xl cursor-pointer"
                        title="เปิดเป็นกระดาน iPad"
                      >
                        จอ iPad
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isHost = room.hostId === currentUser.uid;
  const ipadReady = Boolean(room.hcIpadConnected);
  const canStartGame = ipadReady && players.length >= 1;

  // ============================================================================
  // VIEW 2: WAITING ROOM LOBBY (REQUIRES IPAD QR SCAN BEFORE STARTING GAME)
  // ============================================================================
  if (room.status === 'lobby') {
    const ipadQrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
      ipadBoardUrl
    )}`;
    const playerQrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(
      playerJoinUrl
    )}`;

    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Real-time Room Action Transition Portal */}
        <GameSceneTransition {...transitionProps} />
        {/* Top Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/95 px-4 py-3 rounded-2xl border border-amber-200 shadow-2xs">
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isHost ? 'ยุบห้อง / ออก' : 'ออกจากห้อง'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextMode = !isIpadBoardView;
                setIsIpadBoardView(nextMode);
                if (nextMode) {
                  registerHuesCuesIpadBoard(room.id, true);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isIpadBoardView
                  ? 'bg-pink-600 text-white border-pink-600'
                  : 'bg-pink-50 text-pink-900 border-pink-200 hover:bg-pink-100'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>
                {isIpadBoardView
                  ? 'เครื่องนี้คือกระดานกลาง iPad'
                  : 'สลับเครื่องนี้เป็นกระดาน iPad'}
              </span>
            </button>
          </div>
        </div>

        {/* Room Code & Readiness Header */}
        <div className="p-6 bg-gradient-to-br from-amber-400 via-amber-300 to-pink-200 text-slate-900 rounded-3xl text-center shadow-sm space-y-2">
          <p className="text-xs font-mono font-black uppercase tracking-wider text-amber-950">
            STEP 1 · ห้องเตรียมความพร้อม HUES AND CUES
          </p>
          <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest select-all">
            #{room.roomCode}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 max-w-xl mx-auto">
            {isIpadBoardView
              ? 'หน้าจอนี้ถูกตั้งค่าเป็น "กระดานสีกลาง iPad" เรียบร้อยแล้ว! รอโฮสต์กดเริ่มเกมบนโทรศัพท์'
              : 'ให้เพื่อนเข้าห้องด้วยรหัส 4 หลัก และนำ iPad มาสแกน QR Code ด้านล่างเพื่อใช้เป็นกระดานกลางก่อนเริ่มเกม'}
          </p>
        </div>

        {/* Two-Column Setup: [1] iPad Board QR Handshake & [2] Player Join & Seats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Column 1: Dedicated iPad Central Board QR Code Gate */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border-2 flex flex-col justify-between space-y-4 bg-white shadow-sm ${
              ipadReady ? 'border-emerald-400' : 'border-pink-400'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Tablet className="w-5 h-5 text-pink-600" />
                  <span>1. สแกน QR Code สำหรับ iPad กระดานกลาง</span>
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    ipadReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {ipadReady ? 'เชื่อมต่อ iPad แล้ว' : 'รอสแกนจาก iPad'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                นำ <strong>iPad หรือแท็บเล็ต</strong> ที่วางกลางโต๊ะมาสแกน QR Code นี้
                ระบบจะเปิดหน้ากระดานสี 480 ช่องแบบเต็มจอและปลดล็อกปุ่มเริ่มเกมให้โฮสต์ทันที
              </p>

              {/* QR Image Box */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <img
                  src={ipadQrImgUrl}
                  alt="QR Code สำหรับเชื่อมต่อไปยังกระดานกลาง iPad"
                  referrerPolicy="no-referrer"
                  className="w-44 h-44 rounded-xl border border-white shadow-sm bg-white p-1.5"
                />
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(ipadBoardUrl, 'ipad')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {copiedLinkType === 'ipad' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>คัดลอกลิงก์กระดาน iPad แล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกลิงก์สำหรับ iPad</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Host Testing Bypass or Status Confirmation */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
              {ipadReady ? (
                <div className="text-xs font-extrabold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>กระดานกลาง iPad พร้อมใช้งานแล้ว!</span>
                </div>
              ) : (
                <span className="text-xs text-rose-600 font-bold">
                  * ต้องเชื่อมต่อ iPad ก่อนจึงจะกดเริ่มเกมได้
                </span>
              )}

              {isHost && (
                <button
                  type="button"
                  onClick={() => registerHuesCuesIpadBoard(room.id, !ipadReady)}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {ipadReady
                    ? 'ยกเลิกสถานะเชื่อมต่อ iPad'
                    : 'จำลองเชื่อมต่อ iPad (ทดสอบเครื่องเดียว)'}
                </button>
              )}
            </div>
          </div>

          {/* Column 2: Players Seated & Friend Invites */}
          <div className="p-5 sm:p-6 rounded-3xl border border-amber-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                  <span>2. ผู้เล่นในโต๊ะ ({players.length}/10 คน)</span>
                </span>
                {isHost && players.length < 10 && (
                  <button
                    type="button"
                    onClick={() => addPracticeTablemate(room.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>+ เพิ่มบอทซ้อมเล่น</span>
                  </button>
                )}
              </div>

              {/* Player Join QR & Copy Link */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center gap-3">
                <img
                  src={playerQrImgUrl}
                  alt="QR Code สำหรับผู้เล่นสแกนเข้าห้อง"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg border border-amber-200 bg-white p-1 shrink-0"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">
                    ชวนเพื่อนเข้าห้องด้วยมือถือ (#{room.roomCode})
                  </div>
                  <p className="text-[11px] text-slate-500">
                    สแกนเพื่อเข้าเป็นตัวผู้เล่นสำหรับกดเลือกสีบนมือถือของตัวเอง
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(playerJoinUrl, 'player')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-amber-950 cursor-pointer"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>
                        {copiedLinkType === 'player'
                          ? 'คัดลอกลิงก์ผู้เล่นแล้ว!'
                          : 'คัดลอกลิงก์ชวนเพื่อน'}
                      </span>
                    </button>
                    {onOpenFriendModal && (
                      <button
                        type="button"
                        onClick={onOpenFriendModal}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-900 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>รายชื่อเพื่อน</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Pull Friends Directly */}
              {friends.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-600 block">
                    ดึงเพื่อนเข้าโต๊ะทันที:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {friends.map((f) => {
                      const seated = players.some((p) => p.id === f.uid);
                      return (
                        <button
                          key={f.uid}
                          type="button"
                          disabled={seated}
                          onClick={async () => {
                            await addFriendToRoomSeat(room.id, f);
                            if (onInviteFriendToRoom) {
                              onInviteFriendToRoom(room, f);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            seated
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                              : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-200 cursor-pointer'
                          }`}
                        >
                          {f.accountName} {seated ? '✓' : '+ ดึงเข้าโต๊ะ'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seated Players List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-amber-300 text-amber-950 font-bold text-xs flex items-center justify-center shrink-0">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {p.name} {p.isHost && '👑'}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          พร้อมเล่นบนมือถือ
                        </div>
                      </div>
                    </div>
                    {isHost && !p.isHost && (
                      <button
                        type="button"
                        onClick={() => removePlayer(room.id, p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="นำออกจากโต๊ะ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Host Start Game Button (Locked until iPad is Connected!) */}
            <div className="pt-3 border-t border-amber-100">
              {isHost ? (
                <button
                  type="button"
                  disabled={!canStartGame || isLoading}
                  onClick={handleStartGame}
                  className={`w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition-all inline-flex items-center justify-center gap-2 ${
                    canStartGame
                      ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 cursor-pointer'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {!ipadReady
                      ? 'รอสแกน QR เชื่อมต่อกระดาน iPad ก่อนเริ่มเกม...'
                      : 'กระดาน iPad พร้อมแล้ว — เริ่มเกม Hues & Cues เลย!'}
                  </span>
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-900">
                  {!ipadReady
                    ? 'กำลังรอสแกนเชื่อมต่อกระดานกลาง iPad...'
                    : 'กระดาน iPad พร้อมแล้ว! รอโฮสต์กดเริ่มเกม...'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 3: ACTIVE GAMEPLAY (CENTRAL IPAD BOARD <-> PLAYER PHONE TWO-WAY SYNC)
  // ============================================================================
  const guessesMap = room.hcGuesses || {};
  const myGuess = guessesMap[currentUser.uid];
  const isClueGiver = !isIpadBoardView && room.hcClueGiverId === currentUser.uid;
  const canInteractWithGrid =
    room.status === 'hc_guess_1' || room.status === 'hc_guess_2';

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Real-time Room Action Transition Portal */}
      <GameSceneTransition {...transitionProps} />
      {/* Top Status & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ออกจากโต๊ะ</span>
          </button>
          <span className="text-xs font-mono font-extrabold text-slate-800">
            ห้อง #{room.roomCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch between Phone Controller View and Central iPad View */}
          <button
            type="button"
            onClick={() => setIsIpadBoardView((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isIpadBoardView
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {isIpadBoardView ? (
              <>
                <Tablet className="w-3.5 h-3.5" />
                <span>โหมดกระดานกลาง iPad (สลับเป็นมือถือ)</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>โหมดมือถือผู้เล่น (สลับดูจอ iPad)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
            title={isMuted ? 'เปิดเสียงบรรยายไทย' : 'ปิดเสียงบรรยายไทย'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: On iPad, Board takes primary full focus. On Phone, Remote & Controls stack nicely */}
      <div
        className={
          isIpadBoardView
            ? 'grid grid-cols-1 xl:grid-cols-12 gap-5 items-start'
            : 'grid grid-cols-1 md:grid-cols-2 gap-5 items-start max-w-4xl mx-auto'
        }
      >
        {/* Central iPad 480-Color Board OR Mobile Companion Remote */}
        <div className={isIpadBoardView ? 'xl:col-span-9' : 'w-full'}>
          <HuesCuesCentralBoard
            onSelectTile={handleSelectTile}
            guesses={guessesMap}
            players={players}
            clueGiverId={room.hcClueGiverId}
            myUid={currentUser.uid}
            mySelectedTileId={myGuess?.tileId}
            secretTileId={room.hcSecretTileId}
            showSecret={room.status === 'hc_scoring'}
            isClueGiver={isClueGiver}
            isIpadMode={isIpadBoardView}
            canInteract={canInteractWithGrid}
          />
        </div>

        {/* Clue Controls & Live Scoreboard */}
        <div className={isIpadBoardView ? 'xl:col-span-3' : 'w-full'}>
          <HuesCuesPlayerControls
            room={room}
            players={players}
            myUid={currentUser.uid}
            isIpadMode={isIpadBoardView}
            onSelectTargetColor={(tileId) =>
              selectHuesCuesTargetColor(room.id, tileId)
            }
            onSubmitClue1={(c1) => submitHuesCuesClue1(room.id, c1)}
            onAdvanceToClue2={() => advanceToHuesCuesClue2(room.id)}
            onSubmitClue2={(c2) => submitHuesCuesClue2(room.id, c2)}
            onCalculateScores={() => calculateHuesCuesScores(room.id)}
            onStartNewRound={handleStartGame}
          />
        </div>
      </div>
    </div>
  );
};
