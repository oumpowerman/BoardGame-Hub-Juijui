import React from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  KeyRound,
  Trash2,
  Users,
  UserPlus,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { FirestoreRoom, GamePhase } from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';
import { TransitionGameVariant } from '../transitions/GameSceneTransition';
import { getActiveRoomSession } from '../../utils/activeRoomPersistence';

export interface GameHubScreenProps {
  variant: TransitionGameVariant;
  emoji: string;
  tagText: string;
  title: string;
  description: string;
  createButtonLabel: string;
  activeRoomsTitle: string;
  emptyRoomsTitle: string;
  emptyRoomsSubtitle: string;
  rooms: FirestoreRoom[];
  phaseLabels: Partial<Record<GamePhase, { label: string; color: string }>>;
  currentUid: string;
  friends: UserProfile[];
  quickJoinCode: string;
  isLoading: boolean;
  isCodeInputError: boolean;
  allowAlphanumericCode?: boolean;
  onQuickJoinCodeChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinByCode: (code: string) => void;
  onSelectAndJoinRoom: (room: FirestoreRoom) => void;
  onDeleteRoom: (roomId: string, e: React.MouseEvent) => void;
  onOpenFriendModal: () => void;
}

const HUB_THEMES: Record<
  TransitionGameVariant,
  {
    heroCard: string;
    heroIconBg: string;
    badge: string;
    primaryBtn: string;
    dividerLine: string;
    inputBorder: string;
    inputIcon: string;
    joinBtn: string;
    tableCardBorder: string;
    tableHeaderBorder: string;
    emptyBox: string;
    divideLine: string;
    rowHover: string;
    roomCodeBadge: string;
    enterTableBtn: string;
    friendRow: string;
    addFriendBtn: string;
  }
> = {
  'cheese-thief': {
    heroCard:
      'bg-gradient-to-br from-amber-50 via-white to-orange-50 border-amber-200/90',
    heroIconBg: 'bg-amber-400 text-amber-950',
    badge: 'bg-amber-100/90 text-amber-900 border-amber-200/70',
    primaryBtn: 'bg-amber-400 hover:bg-amber-300 text-amber-950',
    dividerLine: 'bg-amber-200/70',
    inputBorder: 'border-amber-300/90',
    inputIcon: 'text-amber-600',
    joinBtn: 'bg-amber-400 hover:bg-amber-300 text-amber-950',
    tableCardBorder: 'border-amber-200/80',
    tableHeaderBorder: 'border-amber-100',
    emptyBox: 'bg-amber-50/40 border-amber-200',
    divideLine: 'divide-amber-100/80',
    rowHover: 'hover:bg-amber-50/60',
    roomCodeBadge: 'bg-amber-400 text-amber-950',
    enterTableBtn: 'bg-amber-100 hover:bg-amber-200 text-amber-950',
    friendRow: 'bg-amber-50/40 border-amber-200/70',
    addFriendBtn: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  insider: {
    heroCard:
      'bg-gradient-to-br from-rose-50 via-white to-amber-50 border-rose-200/90',
    heroIconBg: 'bg-rose-500 text-white',
    badge: 'bg-rose-100/90 text-rose-900 border-rose-200/80',
    primaryBtn: 'bg-rose-500 hover:bg-rose-600 text-white',
    dividerLine: 'bg-rose-200/70',
    inputBorder: 'border-rose-300/90',
    inputIcon: 'text-rose-500',
    joinBtn: 'bg-rose-500 hover:bg-rose-600 text-white',
    tableCardBorder: 'border-rose-200/80',
    tableHeaderBorder: 'border-rose-100',
    emptyBox: 'bg-rose-50/40 border-rose-200',
    divideLine: 'divide-rose-100',
    rowHover: 'hover:bg-rose-50/50',
    roomCodeBadge: 'bg-rose-500 text-white',
    enterTableBtn: 'bg-rose-50 hover:bg-rose-100 text-rose-800',
    friendRow: 'bg-rose-50/40 border-rose-200/70',
    addFriendBtn: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  undercover: {
    heroCard:
      'bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-violet-200/90',
    heroIconBg: 'bg-violet-500 text-white',
    badge: 'bg-violet-100/90 text-violet-900 border-violet-200/80',
    primaryBtn: 'bg-violet-500 hover:bg-violet-600 text-white',
    dividerLine: 'bg-violet-200/70',
    inputBorder: 'border-violet-300/90',
    inputIcon: 'text-violet-500',
    joinBtn: 'bg-violet-500 hover:bg-violet-600 text-white',
    tableCardBorder: 'border-violet-200/80',
    tableHeaderBorder: 'border-violet-100',
    emptyBox: 'bg-violet-50/40 border-violet-200',
    divideLine: 'divide-violet-100',
    rowHover: 'hover:bg-violet-50/50',
    roomCodeBadge: 'bg-violet-500 text-white',
    enterTableBtn: 'bg-violet-50 hover:bg-violet-100 text-violet-800',
    friendRow: 'bg-violet-50/40 border-violet-200/70',
    addFriendBtn: 'bg-violet-500 hover:bg-violet-600 text-white',
  },
  'detective-club': {
    heroCard:
      'bg-gradient-to-br from-amber-50 via-white to-stone-50 border-amber-300/80',
    heroIconBg: 'bg-amber-500 text-amber-950 shadow-2xs',
    badge: 'bg-amber-100/90 text-amber-950 border-amber-300/80',
    primaryBtn: 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-2xs',
    dividerLine: 'bg-amber-200/70',
    inputBorder: 'border-amber-400/80',
    inputIcon: 'text-amber-700',
    joinBtn: 'bg-amber-400 hover:bg-amber-300 text-amber-950',
    tableCardBorder: 'border-amber-300/70',
    tableHeaderBorder: 'border-amber-200',
    emptyBox: 'bg-amber-50/40 border-amber-200',
    divideLine: 'divide-amber-100/80',
    rowHover: 'hover:bg-amber-50/50',
    roomCodeBadge: 'bg-amber-500 text-amber-950 font-black',
    enterTableBtn: 'bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold',
    friendRow: 'bg-amber-50/40 border-amber-200/70',
    addFriendBtn: 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold',
  },
  avalon: {
    heroCard:
      'bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 border-emerald-500/50 text-slate-100',
    heroIconBg: 'bg-emerald-600 text-white shadow-md',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md',
    dividerLine: 'bg-emerald-800/60',
    inputBorder: 'border-emerald-500/50',
    inputIcon: 'text-emerald-400',
    joinBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    tableCardBorder: 'border-emerald-700/60',
    tableHeaderBorder: 'border-emerald-800/60',
    emptyBox: 'bg-emerald-950/40 border-emerald-700/50',
    divideLine: 'divide-emerald-800/40',
    rowHover: 'hover:bg-emerald-900/40',
    roomCodeBadge: 'bg-emerald-600 text-white font-black',
    enterTableBtn: 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold',
    friendRow: 'bg-emerald-950/40 border-emerald-800/60',
    addFriendBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
  },
  'hues-cues': {
    heroCard:
      'bg-gradient-to-br from-pink-50 via-white to-amber-50 border-pink-300/80',
    heroIconBg: 'bg-pink-500 text-white shadow-2xs',
    badge: 'bg-pink-100/90 text-pink-950 border-pink-300/80',
    primaryBtn: 'bg-pink-600 hover:bg-pink-700 text-white shadow-2xs',
    dividerLine: 'bg-pink-200/70',
    inputBorder: 'border-pink-400/80',
    inputIcon: 'text-pink-600',
    joinBtn: 'bg-pink-600 hover:bg-pink-700 text-white',
    tableCardBorder: 'border-pink-300/70',
    tableHeaderBorder: 'border-pink-200',
    emptyBox: 'bg-pink-50/40 border-pink-200',
    divideLine: 'divide-pink-100/80',
    rowHover: 'hover:bg-pink-50/50',
    roomCodeBadge: 'bg-pink-600 text-white font-black',
    enterTableBtn: 'bg-pink-100 hover:bg-pink-200 text-pink-950 font-bold',
    friendRow: 'bg-pink-50/40 border-pink-200/70',
    addFriendBtn: 'bg-pink-600 hover:bg-pink-700 text-white font-bold',
  },
  'dying-message': {
    heroCard:
      'bg-gradient-to-br from-sky-50 via-[#FFFDF9] to-rose-50 border-sky-200/90',
    heroIconBg: 'bg-sky-500 text-white shadow-2xs',
    badge: 'bg-sky-100/90 text-sky-950 border-sky-300/80',
    primaryBtn: 'bg-rose-500 hover:bg-rose-600 text-white shadow-2xs',
    dividerLine: 'bg-sky-200/70',
    inputBorder: 'border-sky-300/90',
    inputIcon: 'text-sky-600',
    joinBtn: 'bg-sky-500 hover:bg-sky-600 text-white',
    tableCardBorder: 'border-sky-200/80',
    tableHeaderBorder: 'border-sky-100',
    emptyBox: 'bg-sky-50/40 border-sky-200',
    divideLine: 'divide-sky-100/80',
    rowHover: 'hover:bg-sky-50/50',
    roomCodeBadge: 'bg-sky-500 text-white font-black',
    enterTableBtn: 'bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold',
    friendRow: 'bg-sky-50/40 border-sky-200/70',
    addFriendBtn: 'bg-rose-500 hover:bg-rose-600 text-white font-bold',
  },
};

export const GameHubScreen: React.FC<GameHubScreenProps> = ({
  variant,
  emoji,
  tagText,
  title,
  description,
  createButtonLabel,
  activeRoomsTitle,
  emptyRoomsTitle,
  emptyRoomsSubtitle,
  rooms,
  phaseLabels,
  currentUid,
  friends,
  quickJoinCode,
  isLoading,
  isCodeInputError,
  allowAlphanumericCode = false,
  onQuickJoinCodeChange,
  onCreateRoom,
  onJoinByCode,
  onSelectAndJoinRoom,
  onDeleteRoom,
  onOpenFriendModal,
}) => {
  const theme = HUB_THEMES[variant];
  const savedSession = getActiveRoomSession();
  const reconnectingRoom = rooms.find(
    (r) =>
      (savedSession &&
        (r.id === savedSession.roomId || r.roomCode === savedSession.roomCode)) ||
      r.hostId === currentUid ||
      r.ctIpadUid === currentUid
  );

  return (
    <motion.div
      key={`hub-view-${variant}`}
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.99 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-2xl mx-auto w-full space-y-6"
    >
      {/* 0. Instant Reconnect Banner if player has an active or hosted room */}
      {reconnectingRoom && (
        <div className="bg-emerald-950 text-white border-2 border-emerald-400/80 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-emerald-950 text-[11px] font-black font-mono">
                  #{reconnectingRoom.roomCode}
                </span>
                <span className="text-xs font-extrabold text-emerald-300">
                  พบโต๊ะเดิมที่คุณเพิ่งเล่นอยู่!
                </span>
              </div>
              <p className="text-sm font-black text-white truncate mt-0.5">
                {reconnectingRoom.roomName || `โต๊ะของ ${reconnectingRoom.hostName}`}
              </p>
              <p className="text-[11px] text-emerald-200/80">
                กดปุ่มด้านขวาเพื่อกลับเข้าสู่ฉากที่กำลังเล่นอยู่ได้ทันทีโดยไม่ต้องเริ่มใหม่
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectAndJoinRoom(reconnectingRoom)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>กลับเข้าโต๊ะเดิมทันที</span>
          </button>
        </div>
      )}

      {/* 1. Unified Hero & Action Card */}
      <div
        className={`${theme.heroCard} border rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5`}
      >
        <div
          className={`w-16 h-16 mx-auto rounded-3xl ${theme.heroIconBg} flex items-center justify-center text-3xl shadow-xs`}
        >
          {emoji}
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 ${theme.badge} border rounded-full text-xs font-extrabold`}
          >
            <span>{tagText}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-2 max-w-md mx-auto space-y-3">
          {/* Primary Action: Create Room */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onCreateRoom}
            className={`w-full py-4 px-6 ${theme.primaryBtn} disabled:opacity-50 font-black text-sm sm:text-base rounded-2xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[52px]`}
          >
            <Plus className="w-5 h-5" />
            <span>{createButtonLabel}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className={`h-px ${theme.dividerLine} flex-1`} />
            <span className="text-xs font-bold text-slate-400">
              หรือเข้าร่วมด้วยรหัส 4 หลัก
            </span>
            <div className={`h-px ${theme.dividerLine} flex-1`} />
          </div>

          {/* 4-Digit Join Form with Framer Motion Shake on Error */}
          <motion.form
            animate={
              isCodeInputError
                ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.42, ease: 'easeInOut' }}
            onSubmit={(e) => {
              e.preventDefault();
              onJoinByCode(quickJoinCode.trim());
            }}
            className={`flex gap-2 items-center bg-white border-2 rounded-2xl p-1.5 shadow-2xs transition-colors ${
              isCodeInputError
                ? 'border-rose-400 bg-rose-50/30'
                : theme.inputBorder
            }`}
          >
            {isCodeInputError ? (
              <AlertCircle className="w-4 h-4 text-rose-500 ml-2.5 shrink-0" />
            ) : (
              <KeyRound className={`w-4 h-4 ${theme.inputIcon} ml-2.5 shrink-0`} />
            )}
            <input
              type="text"
              inputMode={allowAlphanumericCode ? 'text' : 'numeric'}
              maxLength={4}
              value={quickJoinCode}
              onChange={(e) => {
                const raw = e.target.value;
                const cleaned = allowAlphanumericCode
                  ? raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                  : raw.replace(/[^0-9]/g, '');
                onQuickJoinCodeChange(cleaned);
              }}
              placeholder="กรอกรหัสห้อง 4 หลัก"
              className="flex-1 min-w-0 px-2 py-2 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none bg-transparent uppercase"
            />
            <button
              type="submit"
              disabled={!quickJoinCode.trim() || isLoading}
              className={`px-5 py-2.5 ${theme.joinBtn} disabled:opacity-40 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer min-h-[40px] shrink-0`}
            >
              เข้าห้อง
            </button>
          </motion.form>
        </div>
      </div>

      {/* 2. Active Tables Card */}
      <div
        className={`bg-white border ${theme.tableCardBorder} rounded-3xl p-5 sm:p-6 shadow-xs space-y-4`}
      >
        <div
          className={`flex items-center justify-between pb-2 border-b ${theme.tableHeaderBorder}`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              {activeRoomsTitle} ({rooms.length} ห้อง)
            </h2>
          </div>
          <span className="text-xs text-slate-500">แตะเพื่อเข้าร่วมหรือกลับเข้าเกม</span>
        </div>

        {rooms.length === 0 ? (
          <div
            className={`py-8 px-4 text-center ${theme.emptyBox} border border-dashed rounded-2xl space-y-2`}
          >
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              {emptyRoomsTitle}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {emptyRoomsSubtitle}
            </p>
          </div>
        ) : (
          <div className={`divide-y ${theme.divideLine} -my-1`}>
            {rooms.map((room) => {
              const phaseInfo = phaseLabels[room.status] ||
                phaseLabels.lobby || {
                  label: 'STEP 1 · ห้องรอผู้เล่น',
                  color: 'text-emerald-800 bg-emerald-100 border-emerald-200',
                };
              const isMyPreviousOrHostedRoom =
                room.hostId === currentUid ||
                (savedSession &&
                  (room.id === savedSession.roomId ||
                    room.roomCode === savedSession.roomCode));
              const isPlaying = room.status !== 'lobby';
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectAndJoinRoom(room)}
                  className={`py-3.5 ${theme.rowHover} px-3 -mx-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 ${theme.roomCodeBadge} font-mono font-black text-xs rounded-lg`}
                      >
                        #{room.roomCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${phaseInfo.color}`}
                      >
                        {phaseInfo.label}
                      </span>
                      {isMyPreviousOrHostedRoom && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                          โต๊ะของคุณ
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate mt-1">
                      {room.roomName || `โต๊ะของ ${room.hostName}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      โฮสต์:{' '}
                      <strong className="text-slate-700">{room.hostName}</strong>
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
                        onSelectAndJoinRoom(room);
                      }}
                      className={`px-3 py-1.5 ${
                        isMyPreviousOrHostedRoom || isPlaying
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : theme.enterTableBtn
                      } font-bold text-xs rounded-xl transition-colors cursor-pointer`}
                    >
                      {isMyPreviousOrHostedRoom
                        ? 'กลับเข้าโต๊ะเดิม'
                        : isPlaying
                        ? 'กลับเข้าเกม'
                        : 'เข้าโต๊ะ'}
                    </button>
                    {room.hostId === currentUid && (
                      <button
                        type="button"
                        onClick={(e) => onDeleteRoom(room.id, e)}
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
              className={`px-3.5 py-2 ${theme.addFriendBtn} text-xs font-bold rounded-xl cursor-pointer`}
            >
              ค้นหาและแอดเพื่อนด้วยชื่อ / UID
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {friends.map((friend) => (
              <div
                key={friend.uid}
                className={`p-2.5 ${theme.friendRow} border rounded-xl flex items-center justify-between gap-2`}
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
    </motion.div>
  );
};
