import React, { useState } from 'react';
import { ArrowLeft, Users, ShieldAlert, Sparkles, LogOut } from 'lucide-react';
import { BaseModal } from '../BaseModal';
import { UserProfile } from '../../firebase/userService';

export interface AvalonTopBarProps {
  currentUser: UserProfile;
  friendsCount: number;
  pendingFriendRequestsCount: number;
  roomCode?: string;
  isHost?: boolean;
  onBackToCatalog: () => void;
  onOpenFriendModal: () => void;
  onDisbandRoom?: () => Promise<void>;
}

export const AvalonTopBar: React.FC<AvalonTopBarProps> = ({
  currentUser,
  friendsCount,
  pendingFriendRequestsCount,
  roomCode,
  isHost,
  onBackToCatalog,
  onOpenFriendModal,
  onDisbandRoom,
}) => {
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [isDisbanding, setIsDisbanding] = useState(false);

  const handleBackClick = () => {
    if (roomCode && isHost) {
      setShowDisbandConfirm(true);
    } else {
      onBackToCatalog();
    }
  };

  const handleConfirmDisband = async () => {
    if (!onDisbandRoom) return;
    try {
      setIsDisbanding(true);
      await onDisbandRoom();
      setShowDisbandConfirm(false);
      onBackToCatalog();
    } catch {
      // Handled in parent
    } finally {
      setIsDisbanding(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
          {/* Left: Back button & Game Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-700" />
              <span>คลังเกม</span>
            </button>

            <div className="inline-flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
                ⚔️
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                  Avalon: ศึกอัศวินโต๊ะกลม
                </h1>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  DIGITAL COMPANION
                </span>
              </div>
            </div>
          </div>

          {/* Right: Friends & Account Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFriendModal}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>เพื่อน ({friendsCount})</span>
              {pendingFriendRequestsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100/80 border border-emerald-300 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>{currentUser.accountName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Disband Room Safeguard Modal */}
      <BaseModal
        isOpen={showDisbandConfirm}
        onClose={() => setShowDisbandConfirm(false)}
        title="ยืนยันการยุบห้องและออกจากโต๊ะ"
        icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
        subtitle="HOST DISBAND SAFEGUARD"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            คุณเป็น <strong className="text-emerald-900">หัวหน้าโต๊ะ (Host)</strong> ของห้อง{' '}
            <strong className="text-slate-900">#{roomCode}</strong> หากคุณออกจากโต๊ะขณะนี้
            ห้องจะถูกปิดและผู้เล่นทุกคนในโต๊ะจะถูกยุบห้องทันที
          </p>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <strong>⚠️ คำเตือน:</strong>
            <p>ความก้าวหน้าของเกมที่กำลังดำเนินอยู่จะสิ้นสุดลงทันที</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isDisbanding}
              onClick={() => setShowDisbandConfirm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ยกเลิก · อยู่ในห้องต่อ
            </button>
            <button
              type="button"
              disabled={isDisbanding}
              onClick={handleConfirmDisband}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isDisbanding ? 'กำลังยุบห้อง...' : 'ยืนยันยุบห้อง'}</span>
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};
