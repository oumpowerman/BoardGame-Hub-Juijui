import React from 'react';
import {
  QrCode,
  UserPlus,
  Users,
  Shield,
  Bot,
  Crown,
  Trash2,
  Play,
  BookOpen,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';

export interface DetectiveClubLobbyProps {
  currentRoom: FirestoreRoom;
  players: FirestorePlayer[];
  currentUser: UserProfile;
  friends: UserProfile[];
  isHost: boolean;
  discussionDurationSeconds: number;
  isLoading: boolean;
  onOpenShareModal: () => void;
  onOpenFriendModal: () => void;
  onInviteFriend: (friend: UserProfile) => void;
  onSelectDiscussionDuration: (seconds: number) => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
}

export const DetectiveClubLobby: React.FC<DetectiveClubLobbyProps> = ({
  currentRoom,
  players,
  currentUser,
  friends,
  isHost,
  discussionDurationSeconds,
  isLoading,
  onOpenShareModal,
  onOpenFriendModal,
  onInviteFriend,
  onSelectDiscussionDuration,
  onAddBot,
  onRemovePlayer,
  onToggleReady,
  onStartGame,
}) => {
  const myPlayer = players.find((p) => p.id === currentUser.uid);

  return (
    <div className="space-y-5">
      {/* Room Code Announcement Banner */}
      <div className="p-5 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 text-amber-950 rounded-3xl text-center shadow-sm space-y-2">
        <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-900 block">
          STEP 1 · ห้องรอผู้เล่นสมาคมนักสืบ (DETECTIVE CLUB WAITING ROOM)
        </span>
        <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest select-all py-1">
          #{currentRoom.roomCode}
        </div>
        <p className="text-xs text-amber-900 font-semibold max-w-md mx-auto">
          🃏 เตรียมชุดไพ่จริง (Physical Cards) วางไว้กลางโต๊ะเพื่อใช้เล่นคู่กับแอปนี้
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-amber-950 hover:bg-amber-50 text-xs font-extrabold rounded-xl transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code & ลิงก์ชวนเพื่อน</span>
          </button>
          <button
            type="button"
            onClick={onOpenFriendModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-950/20 hover:bg-amber-950/30 text-amber-950 border border-amber-950/20 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[36px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ ค้นหา / รับแอดเพื่อนเพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Invite Friends Strip */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-700" />
            <span>ดึงเพื่อนที่แอดแล้วเข้าห้องนี้ ({friends.length} คน)</span>
          </span>
          <button
            type="button"
            onClick={onOpenFriendModal}
            className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
          >
            จัดการรายชื่อเพื่อน →
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/90 rounded-xl border border-amber-200/60 text-xs text-slate-600">
            <span>
              แอดเพื่อนด้วยชื่อ Account หรือรหัสเพื่อนเพื่อดึงมานั่งโต๊ะเดียวกันได้ทันที
            </span>
            <button
              type="button"
              onClick={onOpenFriendModal}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-lg cursor-pointer shrink-0"
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
                  className="px-3 py-2 bg-white border border-amber-200 rounded-xl flex items-center gap-2.5 shadow-2xs"
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
                        onClick={() => onInviteFriend(friend)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 text-[11px] font-bold rounded-lg cursor-pointer"
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

      {/* Lobby Settings Card */}
      <div className="bg-white border border-amber-200 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>กติกาการเล่นคู่กับไพ่จริง (In-Person Companion Rules)</span>
          </h3>
          {!isHost && (
            <span className="text-xs text-slate-500">
              (เฉพาะโฮสต์ที่ปรับแต่งได้)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Rule 1: Secret Notebook Concept */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>ระบบแจกสมุดบันทึกลับดิจิทัล</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              ผู้ตั้งโจทย์จะพิมพ์คำลับในมือถือ จากนั้นระบบจะส่งคำลับไปที่เครื่องของนักสืบทุกคนอัตโนมัติ โดยมีผู้สมรู้ร่วมคิด (Conspirator) 1 คนที่ได้สมุดว่างเปล่า! ไม่ต้องพกสมุดโน้ตจริงและดินสอ
            </p>
          </div>

          {/* Rule 2: Discussion Timer Duration */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-800">
              เวลาถกเถียง & อธิบายการ์ด
            </div>
            <p className="text-[11px] text-slate-600">
              เวลานับถอยหลังช่วงให้ทุกคนอธิบายเหตุผลว่าการ์ด 2 ใบเชื่อมโยงกับคำลับอย่างไร
            </p>
            {isHost ? (
              <div className="flex items-center gap-1.5">
                {[60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onSelectDiscussionDuration(sec)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-extrabold border transition-colors cursor-pointer ${
                      discussionDurationSeconds === sec
                        ? 'bg-amber-400 border-amber-500 text-amber-950 font-black'
                        : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono font-bold text-amber-950 bg-white px-3 py-2 rounded-xl border border-amber-200">
                {discussionDurationSeconds} วินาที
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player Seats Grid */}
      <div className="bg-white border border-amber-200 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              ผู้เล่นที่นั่งอยู่ในโต๊ะ ({players.length}/8 คน · ขั้นต่ำ 4 คน)
            </h3>
            <p className="text-[11px] text-slate-500">
              ทุกคนจะผลัดกันเป็นผู้ตั้งโจทย์ (Active Player) โดยในแต่ละรอบจะมี Conspirator แอบแฝง 1 คน
            </p>
          </div>

          {isHost && players.length < 8 && (
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
                className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 font-mono font-bold text-xs flex items-center justify-center shrink-0">
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-100">
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
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-amber-950 font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all min-h-[46px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {players.length < 4
                  ? `ต้องมีผู้เล่นอย่างน้อย 4 คน (ขาดอีก ${
                      4 - players.length
                    } คน)`
                  : `เริ่มเกมสมาคมนักสืบ (${players.length} คน) → สุ่มแจกบทบาท!`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
