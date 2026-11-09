import React from 'react';
import {
  QrCode,
  UserPlus,
  Users,
  Shield,
  Sparkles,
  Wand2,
  Bot,
  Crown,
  Trash2,
  Play,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';
import {
  UNDERCOVER_CATEGORIES,
  UndercoverWordCategoryId,
  UndercoverWordPair,
} from '../../data/undercoverWords';

export interface UndercoverLobbyProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUser: UserProfile;
  friends: UserProfile[];
  isHost: boolean;
  enableMrWhite: boolean;
  selectedCategory: UndercoverWordCategoryId;
  clueTimerSeconds: number;
  aiCustomTopic: string;
  isGeneratingAiWords: boolean;
  aiGeneratedPair: UndercoverWordPair | null;
  isLoading: boolean;
  onOpenShareModal: () => void;
  onOpenFriendModal: () => void;
  onInviteFriend: (friend: UserProfile) => void;
  onToggleMrWhite: (enabled: boolean) => void;
  onSelectCategory: (category: UndercoverWordCategoryId) => void;
  onSelectClueTimer: (seconds: number) => void;
  onAiCustomTopicChange: (topic: string) => void;
  onGenerateAiWords: () => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
}

export const UndercoverLobby: React.FC<UndercoverLobbyProps> = ({
  currentRoom,
  players,
  currentUser,
  friends,
  isHost,
  enableMrWhite,
  selectedCategory,
  clueTimerSeconds,
  aiCustomTopic,
  isGeneratingAiWords,
  aiGeneratedPair,
  isLoading,
  onOpenShareModal,
  onOpenFriendModal,
  onInviteFriend,
  onToggleMrWhite,
  onSelectCategory,
  onSelectClueTimer,
  onAiCustomTopicChange,
  onGenerateAiWords,
  onAddBot,
  onRemovePlayer,
  onToggleReady,
  onStartGame,
}) => {
  const myPlayer = players.find((p) => p.id === currentUser.uid);

  return (
    <div className="space-y-5">
      {/* Room Code Announcement Banner */}
      <div className="p-5 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 text-white rounded-3xl text-center shadow-sm space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-100 block">
          STEP 1 · ห้องรอผู้เล่นสายลับสลับคำ (UNDERCOVER WAITING ROOM)
        </span>
        <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-white select-all py-1">
          #{currentRoom.roomCode}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-violet-700 hover:bg-violet-50 text-xs font-extrabold rounded-xl transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code & ลิงก์ชวนเพื่อน</span>
          </button>
          <button
            type="button"
            onClick={onOpenFriendModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-900/30 hover:bg-violet-900/50 text-white border border-white/30 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[36px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ ค้นหา / รับแอดเพื่อนเพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Invite Accepted Friends Strip */}
      <div className="p-4 bg-violet-50/60 border border-violet-200/80 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-violet-950 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-violet-600" />
            <span>ดึงเพื่อนที่แอดแล้วเข้าห้องนี้ ({friends.length} คน)</span>
          </span>
          <button
            type="button"
            onClick={onOpenFriendModal}
            className="text-xs font-bold text-violet-700 hover:underline cursor-pointer"
          >
            จัดการรายชื่อเพื่อน →
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/90 rounded-xl border border-violet-200/60 text-xs text-slate-600">
            <span>
              แอดเพื่อนด้วยชื่อ Account หรือรหัสเพื่อนเพื่อดึงมานั่งโต๊ะเดียวกันได้ทันที
            </span>
            <button
              type="button"
              onClick={onOpenFriendModal}
              className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-lg cursor-pointer shrink-0"
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
                  className="px-3 py-2 bg-white border border-violet-200 rounded-xl flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-900">
                    {friend.accountName}
                  </span>
                  {alreadySeated ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      อยู่ในห้องแล้ว
                    </span>
                  ) : (
                    players.length < 10 && (
                      <button
                        type="button"
                        onClick={() => onInviteFriend(friend)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-bold rounded-lg cursor-pointer"
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

      {/* Lobby Settings (Light Pastel Card) */}
      <div className="bg-white border border-violet-200 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-violet-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-600" />
            <span>การตั้งค่ากติกา & คลังคำศัพท์คู่เปรียบเทียบ</span>
          </h3>
          {!isHost && (
            <span className="text-xs text-slate-500">
              (เฉพาะโฮสต์ที่ปรับแต่งได้)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Rule 1: Toggle Mr. White */}
          <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>บทบาท Mr. White</span>
              <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
                {enableMrWhite ? 'เปิดใช้งาน' : 'ปิด'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              มีผู้เล่น 1 คนที่ไม่รู้คำลับ และสามารถทายคำของพลเมืองเพื่อขโมยชัยชนะได้
            </p>
            {isHost && (
              <button
                type="button"
                onClick={() => onToggleMrWhite(!enableMrWhite)}
                className={`w-full py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer border ${
                  enableMrWhite
                    ? 'bg-amber-300 border-amber-400 text-amber-950'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                {enableMrWhite
                  ? '✓ มี Mr. White ในเกม'
                  : '✕ ไม่มี Mr. White'}
              </button>
            )}
          </div>

          {/* Rule 2: Word Category Selection */}
          <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-800">
              หมวดหมู่คำคู่เปรียบเทียบ
            </div>
            <p className="text-[11px] text-slate-600">
              เลือกหมวดหมู่คำภาษาไทยในชีวิตประจำวัน
            </p>
            {isHost ? (
              <select
                value={selectedCategory}
                onChange={(e) =>
                  onSelectCategory(e.target.value as UndercoverWordCategoryId)
                }
                className="w-full py-2 px-3 bg-white border border-violet-300 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {UNDERCOVER_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-bold text-violet-800 bg-white px-3 py-2 rounded-xl border border-violet-200">
                {UNDERCOVER_CATEGORIES.find((c) => c.id === selectedCategory)
                  ?.label || 'ทุกหมวดหมู่'}
              </div>
            )}
          </div>

          {/* Rule 3: Clue Round Timer Duration */}
          <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-800">
              เวลาบอกคำใบ้ต่อคน
            </div>
            <p className="text-[11px] text-slate-600">
              เวลานับถอยหลังต่อเทิร์นการพูดใบ้
            </p>
            {isHost ? (
              <div className="flex items-center gap-1.5">
                {[30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onSelectClueTimer(sec)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-extrabold border transition-colors cursor-pointer ${
                      clueTimerSeconds === sec
                        ? 'bg-violet-500 border-violet-600 text-white'
                        : 'bg-white border-violet-200 text-slate-700 hover:bg-violet-50'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono font-bold text-violet-900 bg-white px-3 py-2 rounded-xl border border-violet-200">
                {clueTimerSeconds} วินาที
              </div>
            )}
          </div>
        </div>

        {/* Gemini AI Word Generator Sub-panel */}
        {isHost && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-amber-50 border border-violet-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-violet-900">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>สร้างคำคู่ภาษาไทยสดใหม่ด้วย Gemini 3.8 Flash</span>
              </div>
              {aiGeneratedPair && (
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                  ✓ เตรียมคำคู่ AI เรียบร้อย
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={aiCustomTopic}
                onChange={(e) => onAiCustomTopicChange(e.target.value)}
                placeholder="ระบุธีมที่ต้องการ (เช่น สตรีทฟู้ดเยาวราช, คาเฟ่, ซีรีส์) หรือปล่อยว่าง..."
                className="w-full sm:flex-1 px-3.5 py-2 bg-white border border-violet-200 focus:border-violet-400 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
              />
              <button
                type="button"
                disabled={isGeneratingAiWords}
                onClick={onGenerateAiWords}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>
                  {isGeneratingAiWords
                    ? 'กำลังคิดคำคู่...'
                    : 'สร้างคำคู่สดด้วย AI'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Player Seats Grid */}
      <div className="bg-white border border-violet-200 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              ผู้เล่นที่นั่งอยู่ในโต๊ะ ({players.length}/10 คน · ขั้นต่ำ 4 คน)
            </h3>
            <p className="text-[11px] text-slate-500">
              เมื่อเริ่มเกม ระบบจะสุ่มคำลับให้พลเมืองและสายลับพร้อมลำดับการพูดใบ้โดยอัตโนมัติ
            </p>
          </div>

          {isHost && players.length < 10 && (
            <button
              type="button"
              onClick={onAddBot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs font-bold text-amber-950 cursor-pointer transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>+ เพิ่มบอทซ้อมมือ</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {players.map((p, idx) => {
            const isMe = p.id === currentUser.uid;
            const isBotSeat =
              p.id.startsWith('bot_') || p.id.startsWith('mate_');

            return (
              <div
                key={p.id}
                className="p-3 bg-violet-50/40 border border-violet-200/80 rounded-2xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-violet-500 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex items-center gap-1">
                      <span>{p.name}</span>
                      {p.isHost && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isMe
                        ? 'คุณ'
                        : isBotSeat
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
                  {isHost && !p.isHost && (
                    <button
                      type="button"
                      onClick={() => onRemovePlayer(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="นำออกจากโต๊ะ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-violet-100">
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

          {isHost && (
            <button
              type="button"
              disabled={players.length < 4 || isLoading}
              onClick={onStartGame}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all min-h-[46px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {players.length < 4
                  ? `ต้องมีผู้เล่นอย่างน้อย 4 คน (ขาดอีก ${
                      4 - players.length
                    } คน)`
                  : `เริ่มเกม Undercover (${players.length} คน) → แจกการ์ดคำลับ!`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
