import React, { useState } from 'react';
import {
  Users,
  KeyRound,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Play,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Send,
  Dices,
  ShieldAlert,
  QrCode,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';

interface InPersonLobbyProps {
  currentRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
  playerName: string;
  roomCodeInput: string;
  isLoading: boolean;
  friends?: UserProfile[];
  inlineErrorMessage?: string | null;
  onPlayerNameChange: (name: string) => void;
  onRoomCodeChange: (code: string) => void;
  onJoinTable: (code?: string) => void;
  onCreateTable: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onToggleFallMouse?: (enabled: boolean) => void;
  onAddPracticeTablemate?: () => void;
  onRemovePlayer?: (playerId: string) => void;
  onInviteFriend?: (friend: UserProfile) => void;
  onOpenFriendModal?: () => void;
  onOpenShareModal?: () => void;
}

const STEP_LIST = [
  { step: 1, label: 'ตั้งโต๊ะ (4-8 คน)' },
  { step: 2, label: 'แจกการ์ดบทบาท' },
  { step: 3, label: 'ทอยเต๋าในถ้วย' },
  { step: 4, label: 'กลางคืน & ลูกน้อง' },
  { step: 5, label: 'ถกเถียง & โหวต' },
  { step: 6, label: 'เปิดการ์ด & ชนะ' },
];

export const InPersonLobby: React.FC<InPersonLobbyProps> = ({
  currentRoom,
  players,
  currentUid,
  playerName,
  roomCodeInput,
  isLoading,
  friends = [],
  inlineErrorMessage,
  onRoomCodeChange,
  onJoinTable,
  onCreateTable,
  onToggleReady,
  onStartGame,
  onToggleFallMouse,
  onAddPracticeTablemate,
  onRemovePlayer,
  onInviteFriend,
  onOpenFriendModal,
  onOpenShareModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const myPlayer = players.find((p) => p.id === currentUid);
  const isHost = currentRoom?.hostId === currentUid;

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.roomCode);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getPlayerCountRuleDescription = (count: number) => {
    const effectiveCount = Math.max(4, count);
    if (effectiveCount === 4) {
      return {
        badge: 'โหมดพิเศษ 4 คน (ใช้เต๋าคนละ 2 ลูก)',
        detail:
          'ทุกคนใช้เต๋า 2 ลูก (หนูขี้เซาเลือกตื่น 1 ลูก / จอมโจรตื่นได้ทั้งสองชั่วโมง) · ไม่มีลูกน้อง และตื่นมาคนเดียวห้ามส่องถ้วยเต๋า',
      };
    }
    if (effectiveCount === 5) {
      return {
        badge: 'กติกา 5 คน (ลูกน้องพยาน)',
        detail:
          'หนูขี้เซาที่ตื่นมาคนเดียวส่องถ้วยเต๋าคนอื่นได้ 1 คน · หนูที่ลืมตามาเห็นตอนจอมโจรขโมยชีสจะย้ายข้างกลายเป็นลูกน้อง (Follower) ทันที!',
      };
    }
    if (effectiveCount === 6) {
      return {
        badge: 'กติกา 6 คน (จอมโจรเลือกลูกน้อง 1 คน)',
        detail:
          'หนูขี้เซาที่ตื่นคนเดียวส่องถ้วยเต๋าได้ 1 คน · ช่วงท้ายคืนจอมโจรชีสจะเลือกจิ้มผู้เล่น 1 คนเป็นลูกน้องช่วยปั้นแพะ',
      };
    }
    if (effectiveCount === 7) {
      return {
        badge: 'กติกา 7 คน (ลูกน้อง 2 คน ไม่รู้ตัวจอมโจร)',
        detail:
          'จอมโจรชีสเลือกลูกน้อง 2 คนให้ลืมตามารู้จักกันเอง แต่ลูกน้องทั้งสองจะไม่รู้ว่าใครคือจอมโจรชีสตัวจริง!',
      };
    }
    return {
      badge: 'กติกา 8 คน (ลูกน้อง 2 คน รู้จักจอมโจร)',
      detail:
        'จอมโจรชีสเลือกลูกน้อง 2 คน ลูกน้องตื่นมารู้จักกันเองและรู้ว่าใครคือจอมโจรชีสเพื่อช่วยกันปั่นหัวทั้งโต๊ะ!',
    };
  };

  // SCREEN 1: Enter 4-digit room code or create new table
  if (!currentRoom) {
    return (
      <div className="space-y-5 py-1">
        {/* Active Account Display */}
        <div className="p-4 bg-white/95 border border-amber-200/80 rounded-2xl shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">
              เข้าเล่นในชื่อ Account:
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {playerName}
            </span>
          </div>
          {onOpenFriendModal && (
            <button
              type="button"
              onClick={onOpenFriendModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-rose-600" />
              <span>จัดการเพื่อน ({friends.length})</span>
            </button>
          )}
        </div>

        {/* Host a New Table (Primary Action) */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl shadow-xs text-center space-y-3">
          <div className="font-extrabold text-slate-900 text-base">
            ตั้งโต๊ะเล่น &ldquo;ชีสหนูอยู่ไหน (Cheese Thief)&rdquo; (4–8 คน · จบใน 10 นาที)
          </div>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            วางก้อนชีสกลางโต๊ะ แจกการ์ดบทบาท (จอมโจรชีส 1 ใบ + หนูขี้เซา) ทอยเต๋าในถ้วย แอบส่องเบาะแสตอนกลางคืน แล้วโหวตจับจอมโจรพร้อมกัน!
          </p>
          <button
            type="button"
            disabled={isLoading}
            onClick={onCreateTable}
            className="w-full py-3.5 px-5 font-extrabold text-sm bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-2xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ สร้างห้องหนูขโมยชีสใหม่ (4–8 คน)</span>
          </button>
        </div>

        {/* Enter 4-Digit Code to Join Friend's Table */}
        <div className="p-4 sm:p-5 bg-white border border-rose-200/90 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
            <KeyRound className="w-4 h-4 text-rose-500 shrink-0" />
            <span>หรือเข้าร่วมห้องของเพื่อนด้วยรหัส 4 หลัก</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = roomCodeInput.trim();
              if (trimmed.length === 4) {
                onJoinTable(trimmed);
              }
            }}
            className="flex flex-col sm:flex-row gap-2.5 items-stretch"
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={roomCodeInput}
              onChange={(e) =>
                onRoomCodeChange(e.target.value.replace(/[^0-9]/g, ''))
              }
              placeholder="กรอกรหัสห้อง 4 หลัก"
              className="w-full sm:flex-1 min-w-0 px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-2xl text-center text-xl font-mono font-extrabold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[48px]"
            />
            <button
              type="submit"
              disabled={isLoading || roomCodeInput.length !== 4}
              className="w-full sm:w-auto px-6 py-3 font-extrabold text-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>เข้าห้อง</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Inline Error Message directly inside the card */}
          {inlineErrorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{inlineErrorMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const ruleInfo = getPlayerCountRuleDescription(players.length);

  // SCREEN 2: Step 1 Lobby Waiting Room (4-8 Players)
  return (
    <div className="space-y-5">
      {/* 6-Step Progress Bar */}
      <div className="grid grid-cols-6 gap-1.5 p-2 bg-white/90 border border-amber-200/80 rounded-2xl">
        {STEP_LIST.map((item) => {
          const isCurrent = item.step === 1;
          return (
            <div
              key={item.step}
              className={`py-1.5 px-1 rounded-xl text-center transition-all ${
                isCurrent
                  ? 'bg-amber-400 text-amber-950 font-extrabold shadow-2xs'
                  : 'bg-slate-50 text-slate-400 font-medium'
              }`}
            >
              <div className="text-[10px] font-mono">STEP {item.step}</div>
              <div className="text-[10px] truncate">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Room Code Banner */}
      <div className="p-5 bg-gradient-to-br from-amber-300/90 via-amber-200 to-rose-200/90 border border-amber-300 rounded-3xl text-center shadow-sm space-y-1.5">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-950 block">
          STEP 1 · ตั้งโต๊ะเตรียมอุปกรณ์ (การ์ดตัวละคร · ถ้วยเต๋า · ชีสกลางโต๊ะ)
        </span>
        <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-slate-950 select-all py-1">
          #{currentRoom.roomCode}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-extrabold rounded-xl transition-all shadow-2xs cursor-pointer min-h-[36px]"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code & ลิงก์ชวนเพื่อน</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer min-h-[36px]"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">คัดลอกรหัสห้องแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>คัดลอกรหัส #{currentRoom.roomCode}</span>
              </>
            )}
          </button>

          {onOpenFriendModal && (
            <button
              type="button"
              onClick={onOpenFriendModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer min-h-[36px]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ ค้นหา / รับแอดเพื่อนเพิ่ม</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Rule Summary Based on Seated Player Count + Fall Mouse Toggle */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-lg">
            <Dices className="w-3.5 h-3.5 text-amber-800" />
            <span>{ruleInfo.badge}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-600">
            การ์ดในกอง: จอมโจรชีส 1 ใบ + หนูขี้เซา{' '}
            {currentRoom.enableFallMouse && players.length >= 6
              ? `${Math.max(3, players.length) - 2} ใบ + Fall Mouse 1 ใบ`
              : `${Math.max(4, players.length) - 1} ใบ`}
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">{ruleInfo.detail}</p>

        {/* Fall Mouse Special Mode Toggle (Available for 6-8 players) */}
        <div className="pt-2 border-t border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs">
            <span className="font-bold text-rose-900 inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>โหมดพิเศษ: การ์ด Fall Mouse (สำหรับ 6–8 คน)</span>
            </span>
            <p className="text-[11px] text-slate-500">
              แทนที่หนูขี้เซา 1 ตัวด้วย Fall Mouse ซึ่งจะชนะเดี่ยวทันทีหากหลอกให้ทุกคนโหวตตัวเองมากที่สุด!
            </p>
          </div>
          {isHost && onToggleFallMouse ? (
            <button
              type="button"
              disabled={players.length < 6}
              onClick={() => onToggleFallMouse(!currentRoom.enableFallMouse)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                players.length < 6
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : currentRoom.enableFallMouse
                  ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                  : 'bg-white border-rose-200 text-rose-800 hover:bg-rose-50'
              }`}
            >
              {players.length < 6
                ? 'ต้องมี 6–8 คนจึงเปิดได้'
                : currentRoom.enableFallMouse
                ? '✓ เปิดใช้ Fall Mouse แล้ว'
                : 'เปิดใช้การ์ด Fall Mouse'}
            </button>
          ) : (
            <span className="text-xs font-bold text-rose-800">
              {currentRoom.enableFallMouse && players.length >= 6
                ? 'เปิดใช้งาน Fall Mouse'
                : 'โหมดปกติ'}
            </span>
          )}
        </div>
      </div>

      {/* Invite Accepted Friends Strip */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>ดึงเพื่อนที่แอดแล้วเข้าห้องนี้ ({friends.length} คนในรายชื่อเพื่อน)</span>
          </span>
          {onOpenFriendModal && (
            <button
              type="button"
              onClick={onOpenFriendModal}
              className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              จัดการรายชื่อเพื่อน →
            </button>
          )}
        </div>

        {friends.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/90 rounded-xl border border-emerald-200/60 text-xs text-slate-600">
            <span>
              ต้องเพิ่มเพื่อนกันก่อนจึงจะดึงเพื่อนเข้าห้องเล่นด้วยกันได้
            </span>
            {onOpenFriendModal && (
              <button
                type="button"
                onClick={onOpenFriendModal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shrink-0"
              >
                + ไปหน้าเพิ่มเพื่อน
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {friends.map((friend) => {
              const alreadySeated = players.some((p) => p.id === friend.uid);
              return (
                <div
                  key={friend.uid}
                  className="px-3 py-2 bg-white border border-emerald-200 rounded-xl flex items-center gap-2.5 shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-900">
                    {friend.accountName}
                  </span>
                  {alreadySeated ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      อยู่ในห้องแล้ว
                    </span>
                  ) : (
                    onInviteFriend &&
                    players.length < 8 && (
                      <button
                        type="button"
                        onClick={() => onInviteFriend(friend)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>ดึงเข้าห้อง</span>
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seated Players Grid (4 to 8 Players) */}
      <div className="p-4 sm:p-5 bg-white border border-amber-100 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-100">
          <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-600" />
            <span>ที่นั่งรอบก้อนชีส ({players.length}/8 คน · เล่นได้ 4–8 คน)</span>
          </span>

          {isHost && players.length < 8 && onAddPracticeTablemate && (
            <button
              type="button"
              onClick={onAddPracticeTablemate}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer min-h-[34px]"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-700" />
              <span>+ เติมบอท 1 ที่นั่ง ({players.length}/8)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {players.map((p, idx) => (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
                p.id === currentUid
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-6 h-6 rounded-full bg-white border flex items-center justify-center font-mono text-xs text-slate-600 shrink-0">
                  #{idx + 1}
                </span>
                <span className="truncate">
                  {p.name} {p.id === currentUid && '(คุณ)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {p.isHost && (
                  <span className="px-2 py-0.5 text-[10px] bg-amber-200 text-amber-900 rounded-md font-bold">
                    โฮสต์
                  </span>
                )}
                {p.isReady ? (
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-md font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> พร้อม
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded-md">
                    รอพร้อม
                  </span>
                )}
                {isHost && p.id !== currentUid && onRemovePlayer && (
                  <button
                    type="button"
                    onClick={() => onRemovePlayer(p.id)}
                    title="นำออกจากโต๊ะ"
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lobby Step Progression Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          type="button"
          onClick={onToggleReady}
          className={`py-3 px-4 font-bold text-sm rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] ${
            myPlayer?.isReady
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{myPlayer?.isReady ? 'สถานะ: พร้อมแล้ว' : 'กดพร้อมเล่น'}</span>
        </button>

        {isHost && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onStartGame}
            className="flex-1 py-3.5 px-4 font-extrabold text-sm bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-amber-950 rounded-2xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {players.length < 4
                ? `เริ่มเกมทันที (ระบบจะเติมบอทให้ครบ 4 คนอัตโนมัติ)`
                : `เริ่มเกมและสับแจกการ์ด (${players.length} คน) →`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
