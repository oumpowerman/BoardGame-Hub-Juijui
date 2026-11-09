import React from 'react';
import { ArrowLeft, QrCode, Users } from 'lucide-react';
import { FirestoreRoom } from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';

export interface UndercoverTopBarProps {
  currentRoom: FirestoreRoom | null;
  currentUser: UserProfile;
  friendsCount: number;
  pendingFriendRequestsCount: number;
  onBackClick: () => void;
  onOpenFriendModal: () => void;
  onOpenShareModal: () => void;
}

export const UndercoverTopBar: React.FC<UndercoverTopBarProps> = ({
  currentRoom,
  currentUser,
  friendsCount,
  pendingFriendRequestsCount,
  onBackClick,
  onOpenFriendModal,
  onOpenShareModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-violet-200/80 shadow-xs">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Back to Catalog (with host disband protection) */}
        <button
          type="button"
          onClick={onBackClick}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-violet-950 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[42px]"
        >
          <ArrowLeft className="w-4 h-4 text-violet-700" />
          <span>กลับสู่คลังบอร์ดเกม</span>
        </button>

        {/* Center: Game Branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-2xl bg-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
            🕶️
          </span>
          <div className="truncate">
            <div className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              สายลับสลับคำ (Undercover) · Word Spy Party
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:block">
              เล่น 4–10 คน · ผลัดกันบอกคำใบ้ จับผิดสายลับที่ได้คำใกล้เคียง และระวัง Mr. White!
            </div>
          </div>
        </div>

        {/* Right: QR Share, Friends & Account */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {currentRoom && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer min-h-[42px] shadow-2xs"
              title="ชวนเพื่อนด้วย QR Code หรือคัดลอกลิงก์"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">ชวนเพื่อน / QR</span>
              <span className="sm:hidden font-mono text-[11px]">
                #{currentRoom.roomCode}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenFriendModal}
            className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[42px]"
          >
            <Users className="w-4 h-4 text-rose-600" />
            <span className="hidden xs:inline">เพื่อน ({friendsCount})</span>
            <span className="xs:hidden">({friendsCount})</span>
            {pendingFriendRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-extrabold rounded-md">
                +{pendingFriendRequestsCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-xl text-xs">
            <span className="text-slate-500">Account:</span>
            <strong className="text-slate-900 font-bold">
              {currentUser.accountName}
            </strong>
            <span className="font-mono text-[11px] text-violet-800">
              ({currentUser.friendCode})
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
