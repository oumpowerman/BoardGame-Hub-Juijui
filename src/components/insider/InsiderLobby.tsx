import React from 'react';
import {
  QrCode,
  UserPlus,
  Users,
  Sparkles,
  Hourglass,
  Bot,
  Crown,
  X,
  Play,
} from 'lucide-react';
import {
  FirestoreRoom,
  FirestorePlayer,
} from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';
import {
  ALL_INSIDER_CATEGORY_OPTIONS,
  InsiderWordCategoryId,
} from '../../data/insiderWords';

interface InsiderLobbyProps {
  activeRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUser: UserProfile;
  friends: UserProfile[];
  customLobbyWord: string;
  isLoading: boolean;
  onCustomLobbyWordChange: (val: string) => void;
  onOpenShareModal: () => void;
  onOpenFriendModal: () => void;
  onInviteFriendToRoom: (friend: UserProfile) => void;
  onUpdateLobbySettings: (
    category: InsiderWordCategoryId,
    durationSec: number
  ) => void;
  onAddPracticeBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
}

export const InsiderLobby: React.FC<InsiderLobbyProps> = ({
  activeRoom,
  players,
  currentUser,
  friends,
  customLobbyWord,
  isLoading,
  onCustomLobbyWordChange,
  onOpenShareModal,
  onOpenFriendModal,
  onInviteFriendToRoom,
  onUpdateLobbySettings,
  onAddPracticeBot,
  onRemovePlayer,
  onToggleReady,
  onStartGame,
}) => {
  const myPlayer = players.find((p) => p.id === currentUser.uid);
  const canStartGame = players.length >= 4 && players.length <= 8;

  return (
    <div className="space-y-5">
      {/* Room Code & Quick Invite Banner */}
      <div className="p-5 bg-gradient-to-br from-rose-500 via-rose-400 to-amber-400 text-white rounded-3xl text-center shadow-sm space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-50 block">
          STEP 1 · ห้องรอผู้เล่นจอมบงการคำใบ้ (INSIDER WAITING ROOM)
        </span>
        <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-white select-all py-1">
          #{activeRoom.roomCode}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-extrabold rounded-xl transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code & ลิงก์ชวนเพื่อน</span>
          </button>

          <button
            type="button"
            onClick={onOpenFriendModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-900/30 hover:bg-rose-900/50 text-white border border-white/30 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[36px]"
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
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg cursor-pointer shrink-0"
            >
              + ไปหน้าเพิ่มเพื่อน
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {friends.map((friend) => {
              const alreadySeated = players.some((p) => p.id === friend.uid);
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
                        onClick={() => onInviteFriendToRoom(friend)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg cursor-pointer"
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
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>ตั้งค่ากติกาและหมวดหมู่คำศัพท์ลับ (4–8 คน)</span>
          </h3>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            Master 1 · Insider 1 · พลเมือง {Math.max(2, players.length - 2)}
          </span>
        </div>

        {/* Word Category Buttons */}
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
                    onUpdateLobbySettings(
                      cat.id as InsiderWordCategoryId,
                      activeRoom.quizDurationSeconds || 180
                    )
                  }
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
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
              <Hourglass className="w-3.5 h-3.5 text-rose-500" />
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
                      onUpdateLobbySettings(
                        activeRoom.wordCategory || 'all',
                        opt.sec
                      )
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                      active
                        ? 'bg-amber-300 text-amber-950 border-amber-400 shadow-2xs'
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
              onChange={(e) => onCustomLobbyWordChange(e.target.value)}
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
              onClick={onAddPracticeBot}
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
                <span className="w-8 h-8 rounded-xl bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
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
                      : p.id.startsWith('mate_') || p.id.startsWith('bot_')
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
                    onClick={() => onRemovePlayer(p.id)}
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
            onClick={onToggleReady}
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
            onClick={onStartGame}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer min-h-[46px]"
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
  );
};
