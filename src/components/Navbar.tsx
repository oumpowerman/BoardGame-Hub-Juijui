import React from 'react';
import { motion } from 'motion/react';
import {
  Gamepad2,
  Trophy,
  MessageSquare,
  Sparkles,
  Dices,
  Users,
  LogOut,
  Database,
} from 'lucide-react';
import { UserProfile } from '../firebase/userService';

export type ActiveSection =
  | 'catalog'
  | 'cheese-thief-screen'
  | 'insider-screen'
  | 'undercover-screen'
  | 'sub-forums'
  | 'leaderboard'
  | 'architecture';

interface NavbarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onEnterCheeseThiefScreen: () => void;
  onEnterInsiderScreen?: () => void;
  onEnterUndercoverScreen?: () => void;
  onOpenFriendModal: () => void;
  onSignOut: () => void;
  currentUser: UserProfile;
  friendsCount: number;
  pendingRequestsCount: number;
  liveRoomsCount?: number;
  liveInsiderRoomsCount?: number;
  liveUndercoverRoomsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onSelectSection,
  onEnterCheeseThiefScreen,
  onOpenFriendModal,
  onSignOut,
  currentUser,
  friendsCount,
  pendingRequestsCount,
  liveRoomsCount = 0,
  liveInsiderRoomsCount = 0,
  liveUndercoverRoomsCount = 0,
}) => {
  const navItems: {
    id: ActiveSection;
    label: string;
    badge?: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'catalog',
      label: 'คลังบอร์ดเกม',
      icon: <Gamepad2 className="w-4 h-4 text-pink-500" />,
    },
    {
      id: 'cheese-thief-screen',
      label: 'โต๊ะหนูขโมยชีส',
      badge: `${liveRoomsCount}`,
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'insider-screen',
      label: 'โต๊ะเล่น Insider',
      badge: `${liveInsiderRoomsCount}`,
      icon: <Sparkles className="w-4 h-4 text-rose-600" />,
    },
    {
      id: 'undercover-screen',
      label: 'โต๊ะ Undercover',
      badge: `${liveUndercoverRoomsCount}`,
      icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
    },
    {
      id: 'leaderboard',
      label: 'ตารางอันดับผู้เล่น',
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'sub-forums',
      label: 'คอมมูนิตี้พูดคุย',
      icon: <MessageSquare className="w-4 h-4 text-sky-500" />,
    },
    {
      id: 'architecture',
      label: 'ข้อมูลระบบเกม',
      icon: <Database className="w-4 h-4 text-teal-600" />,
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-rose-100/80 shadow-xs">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-1.5 sm:gap-6 px-3 sm:px-6 py-2 sm:py-3">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectSection('catalog');
          }}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg font-bold tracking-tight text-slate-800 hover:text-amber-700 transition-colors whitespace-nowrap shrink min-w-0"
        >
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-200 via-rose-100 to-pink-100 border border-amber-300/80 flex items-center justify-center shadow-xs shrink-0">
            <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
          </span>
          <span className="font-display font-extrabold bg-gradient-to-r from-amber-700 via-rose-600 to-pink-600 bg-clip-text text-transparent truncate text-sm sm:text-base md:text-lg">
            <span className="inline sm:hidden">Tabletop</span>
            <span className="hidden sm:inline">TabletopNexus</span>
          </span>
        </a>

        {/* Zone 2: Navigation Items with Smooth Framer Motion Highlight (Desktop) */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden lg:flex items-center gap-1.5 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                  isActive
                    ? 'text-amber-950 font-bold'
                    : 'text-slate-600 hover:bg-amber-50/70 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-amber-100/90 border border-amber-300 shadow-xs"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="font-mono text-xs font-extrabold text-amber-900">
                      ({item.badge})
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Account, Friends & Enter Cheese Thief Action */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenFriendModal}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] sm:min-h-[42px]"
            title={`รายชื่อเพื่อน (${friendsCount})`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
            <span className="hidden xs:inline">เพื่อน</span>
            <span className="font-mono text-[11px] sm:text-xs">({friendsCount})</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-extrabold rounded-md">
                +{pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            data-start="true"
            onClick={onEnterCheeseThiefScreen}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 border border-amber-400 rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] sm:min-h-[42px]"
          >
            <span className="shrink-0">🧀</span>
            <span>เข้าเล่น</span>
            <span className="hidden md:inline">หนูขโมยชีส</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title={`ออกจากระบบ / สลับบัญชี (${currentUser.accountName})`}
            className="inline-flex items-center justify-center p-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline ml-1">{currentUser.accountName}</span>
          </button>
        </div>
      </div>

      {/* Tablet & Mobile responsive navigation strip */}
      <nav
        aria-label="เมนูมือถือ"
        className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 sm:py-2 border-t border-rose-100/80 bg-amber-50/50 w-full max-w-full overflow-x-auto no-scrollbar scroll-smooth flex-nowrap"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                isActive
                  ? 'bg-white border border-amber-300 text-amber-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="font-mono text-[11px] font-extrabold text-amber-800">
                  ({item.badge})
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
