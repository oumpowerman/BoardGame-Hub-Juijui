import React from 'react';
import {
  ArrowLeft,
  Users,
  Volume2,
  VolumeX,
  Tablet,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import { FirestoreRoom } from '../../firebase/tableService';
import { UserProfile } from '../../firebase/userService';

interface DyingMessageTopBarProps {
  currentUser: UserProfile;
  friendsCount: number;
  pendingFriendRequestsCount: number;
  activeRoom: FirestoreRoom | null;
  isIpadBoardView: boolean;
  isVoiceEnabled: boolean;
  onBackToCatalog: () => void;
  onOpenFriendModal: () => void;
  onOpenRoleGuide: () => void;
  onToggleVoice: () => void;
  onToggleIpadView: () => void;
}

export const DyingMessageTopBar: React.FC<DyingMessageTopBarProps> = ({
  currentUser,
  friendsCount,
  pendingFriendRequestsCount,
  activeRoom,
  isIpadBoardView,
  isVoiceEnabled,
  onBackToCatalog,
  onOpenFriendModal,
  onOpenRoleGuide,
  onToggleVoice,
  onToggleIpadView,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-sky-200/80 shadow-xs">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Back to Catalog & Game Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[38px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">คลังบอร์ดเกม</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-base shrink-0">
              🔎
            </span>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                เบาะแสมรณะ (Dying Message)
              </h1>
              <p className="text-[10px] text-sky-700 font-semibold truncate hidden sm:block">
                Heads-Up Tabletop · อ้างอิงตัวจริง & อวตารในวง
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role Guide, Voice, iPad Mode Switch, Friends */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenRoleGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer min-h-[38px]"
            title="คู่มือกติกาและบทบาทพิเศษ"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">กติกา & บทบาท</span>
          </button>

          {activeRoom && (
            <>
              <button
                type="button"
                onClick={onToggleIpadView}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer min-h-[38px] ${
                  isIpadBoardView
                    ? 'bg-sky-600 text-white border-sky-700'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
                }`}
                title="สลับมุมมองระหว่างจอ iPad กระดานกลาง และ มือถือผู้เล่น"
              >
                {isIpadBoardView ? (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">สลับเป็นจอมือถือ</span>
                  </>
                ) : (
                  <>
                    <Tablet className="w-3.5 h-3.5 text-sky-600" />
                    <span className="hidden sm:inline">เปิดจอ iPad กลางโต๊ะ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onToggleVoice}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer min-h-[38px] ${
                  isVoiceEnabled
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                title="เปิด/ปิดเสียงพากย์ภาษาไทย"
              >
                {isVoiceEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden lg:inline">
                  {isVoiceEnabled ? 'เสียงพากย์: เปิด' : 'ปิดเสียง'}
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenFriendModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-bold transition-colors cursor-pointer min-h-[38px]"
            title={`เพื่อนของคุณ (${currentUser.accountName})`}
          >
            <Users className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">เพื่อน ({friendsCount})</span>
            {pendingFriendRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-md text-[10px] font-extrabold">
                +{pendingFriendRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
