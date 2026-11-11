import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Gamepad2,
  Trophy,
  Dices,
  Users,
  LogOut,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../firebase/userService';

export type ActiveSection =
  | 'catalog'
  | 'cheese-thief-screen'
  | 'insider-screen'
  | 'undercover-screen'
  | 'detective-club-screen'
  | 'avalon-screen'
  | 'hues-cues-screen'
  | 'dying-message-screen'
  | 'sub-forums'
  | 'leaderboard'
  | 'architecture';

interface NavbarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onEnterCheeseThiefScreen: () => void;
  onEnterInsiderScreen?: () => void;
  onEnterUndercoverScreen?: () => void;
  onEnterDetectiveClubScreen?: () => void;
  onEnterAvalonScreen?: () => void;
  onEnterHuesCuesScreen?: () => void;
  onEnterDyingMessageScreen?: () => void;
  onOpenFriendModal: () => void;
  onSignOut: () => void;
  currentUser: UserProfile;
  friendsCount: number;
  pendingRequestsCount: number;
  liveRoomsCount?: number;
  liveInsiderRoomsCount?: number;
  liveUndercoverRoomsCount?: number;
  liveDetectiveClubRoomsCount?: number;
  liveAvalonRoomsCount?: number;
  liveHuesCuesRoomsCount?: number;
  liveDyingMessageRoomsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onSelectSection,
  onEnterCheeseThiefScreen,
  onEnterInsiderScreen,
  onEnterUndercoverScreen,
  onEnterDetectiveClubScreen,
  onEnterAvalonScreen,
  onEnterHuesCuesScreen,
  onEnterDyingMessageScreen,
  onOpenFriendModal,
  onSignOut,
  currentUser,
  friendsCount,
  pendingRequestsCount,
  liveRoomsCount = 0,
  liveInsiderRoomsCount = 0,
  liveUndercoverRoomsCount = 0,
  liveDetectiveClubRoomsCount = 0,
  liveAvalonRoomsCount = 0,
  liveHuesCuesRoomsCount = 0,
  liveDyingMessageRoomsCount = 0,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalLiveRooms =
    liveRoomsCount +
    liveInsiderRoomsCount +
    liveUndercoverRoomsCount +
    liveDetectiveClubRoomsCount +
    liveAvalonRoomsCount +
    liveHuesCuesRoomsCount +
    liveDyingMessageRoomsCount;

  const isCurrentGameActive =
    activeSection === 'cheese-thief-screen' ||
    activeSection === 'insider-screen' ||
    activeSection === 'undercover-screen' ||
    activeSection === 'detective-club-screen' ||
    activeSection === 'avalon-screen' ||
    activeSection === 'hues-cues-screen' ||
    activeSection === 'dying-message-screen';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSelectGame = (
    type:
      | 'cheese-thief'
      | 'insider'
      | 'undercover'
      | 'detective-club'
      | 'avalon'
      | 'hues-cues'
      | 'dying-message'
  ) => {
    setIsDropdownOpen(false);
    if (type === 'cheese-thief') {
      onEnterCheeseThiefScreen();
    } else if (type === 'insider' && onEnterInsiderScreen) {
      onEnterInsiderScreen();
    } else if (type === 'undercover' && onEnterUndercoverScreen) {
      onEnterUndercoverScreen();
    } else if (type === 'detective-club' && onEnterDetectiveClubScreen) {
      onEnterDetectiveClubScreen();
    } else if (type === 'avalon' && onEnterAvalonScreen) {
      onEnterAvalonScreen();
    } else if (type === 'hues-cues' && onEnterHuesCuesScreen) {
      onEnterHuesCuesScreen();
    } else if (type === 'dying-message' && onEnterDyingMessageScreen) {
      onEnterDyingMessageScreen();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full max-w-full bg-white/95 backdrop-blur-md border-b border-rose-100/80 shadow-xs">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-2.5 sm:py-3">
          {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setIsDropdownOpen(false);
            onSelectSection('catalog');
          }}
          className="inline-flex items-center gap-2 text-sm sm:text-lg font-bold tracking-tight text-slate-800 hover:text-amber-700 transition-colors whitespace-nowrap shrink-0"
        >
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-200 via-rose-100 to-pink-100 border border-amber-300/80 flex items-center justify-center shadow-xs shrink-0">
            <Dices className="w-4 h-4 text-amber-700" />
          </span>
          <span className="font-display font-extrabold bg-gradient-to-r from-amber-700 via-rose-600 to-pink-600 bg-clip-text text-transparent text-sm sm:text-base md:text-lg">
            <span className="inline sm:hidden">Tabletop</span>
            <span className="hidden sm:inline">TabletopNexus</span>
          </span>
        </a>

        {/* Zone 2: Streamlined 3-Item Navigation (Desktop) */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden md:flex items-center gap-1.5 text-sm font-medium"
        >
          {/* Tab 1: คลังบอร์ดเกม */}
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              onSelectSection('catalog');
            }}
            className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
              activeSection === 'catalog'
                ? 'text-amber-950 font-bold'
                : 'text-slate-600 hover:bg-amber-50/70 hover:text-slate-900'
            }`}
          >
            {activeSection === 'catalog' && (
              <motion.span
                layoutId="navbar-active-pill"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-amber-100/90 border border-amber-300 shadow-xs"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-pink-500" />
              <span>คลังบอร์ดเกม</span>
            </span>
          </button>

          {/* Tab 2: โต๊ะเล่นสด (Consolidated Dropdown for all 3 Games) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                isCurrentGameActive || isDropdownOpen
                  ? 'text-amber-950 font-bold bg-amber-100/90 border border-amber-300 shadow-xs'
                  : 'text-slate-600 hover:bg-amber-50/70 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>โต๊ะเล่นสด</span>
              <span className="font-mono text-xs font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded-md">
                {totalLiveRooms}
              </span>
              <motion.span
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center justify-center text-slate-500"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>

            {/* Dropdown Popover Panel */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl p-2 shadow-xl border border-amber-200/90 z-50 space-y-1"
                >
                  <div className="px-3 py-1.5 border-b border-amber-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>เลือกห้องเล่นเกมสด</span>
                    <span className="text-amber-800">
                      รวม {totalLiveRooms} ห้องเปิดอยู่
                    </span>
                  </div>

                  {/* Game 1: Cheese Thief */}
                  <button
                    type="button"
                    onClick={() => handleSelectGame('cheese-thief')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        🧀
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>หนูขโมยชีส</span>
                          <span className="text-[10px] text-amber-800 font-mono font-bold">
                            (4–8 คน)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          ทอยเต๋าในถ้วย & แอบส่องชีสตอนกลางคืน
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      {liveRoomsCount} ห้อง
                    </span>
                  </button>

                  {/* Game 2: Insider */}
                  <button
                    type="button"
                    onClick={() => handleSelectGame('insider')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        🕵️
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>จอมบงการคำใบ้</span>
                          <span className="text-[10px] text-rose-700 font-mono font-bold">
                            (4–8 คน)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          ถาม-ตอบทายคำลับ & จับผิดจอมบงการ
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 border border-rose-200 shrink-0">
                      {liveInsiderRoomsCount} ห้อง
                    </span>
                  </button>

                  {/* Game 3: Undercover */}
                  <button
                    type="button"
                    onClick={() => handleSelectGame('undercover')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-violet-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        🕶️
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>สายลับสลับคำ</span>
                          <span className="text-[10px] text-violet-700 font-mono font-bold">
                            (4–10 คน)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          บอกคำใบ้ จับโกหกสายลับ & Mr. White
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-violet-100 text-violet-900 border border-violet-200 shrink-0">
                      {liveUndercoverRoomsCount} ห้อง
                    </span>
                  </button>

                  {/* Game 4: Detective Club */}
                  <button
                    type="button"
                    onClick={() => handleSelectGame('detective-club')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        🔍
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>สมาคมนักสืบ (Detective Club)</span>
                          <span className="text-[10px] text-amber-800 font-mono font-bold">
                            (4–8 คน)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          เล่นคู่กับไพ่จริง & แจกสมุดบันทึกลับดิจิทัล
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                      {liveDetectiveClubRoomsCount} ห้อง
                    </span>
                  </button>

                  {/* Game 5: Avalon */}
                  <button
                    type="button"
                    onClick={() => handleSelectGame('avalon')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        👑
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>Avalon: ศึกอัศวินโต๊ะกลม</span>
                          <span className="text-[10px] text-emerald-700 font-mono font-bold">
                            (5–10 คน)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          เล่นสดที่โต๊ะ & แอบส่องนิมิตโหวตทำภารกิจ
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
                      {liveAvalonRoomsCount} ห้อง
                    </span>
                  </button>

                  {/* Game 6: Hues and Cues */}
                  <button
                    type="button"
                    onClick={() => handleSelectGame('hues-cues')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-pink-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        🎨
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>ทายสีจากคำใบ้ (Hues & Cues)</span>
                          <span className="text-[10px] text-pink-700 font-mono font-bold">
                            (3–10 คน)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          ใช้ iPad เป็นกระดานสีกลาง & ลากหมากทายสี
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-pink-100 text-pink-900 border border-pink-200 shrink-0">
                      {liveHuesCuesRoomsCount || 0} ห้อง
                    </span>
                  </button>

                  {/* Game 7: Dying Message */}
                  <button
                    type="button"
                    onClick={() => handleSelectGame('dying-message')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50/80 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        🔎
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>เบาะแสมรณะ (Dying Message)</span>
                          <span className="text-[10px] text-sky-700 font-mono font-bold">
                            (4–12 คน)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          เชื่อม iPad กลางโต๊ะ · ทิ้งเบาะแสตัวจริง & อวตาร
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-900 border border-sky-200 shrink-0">
                      {liveDyingMessageRoomsCount || 0} ห้อง
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tab 3: ตารางอันดับผู้เล่น */}
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              onSelectSection('leaderboard');
            }}
            className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
              activeSection === 'leaderboard'
                ? 'text-amber-950 font-bold'
                : 'text-slate-600 hover:bg-amber-50/70 hover:text-slate-900'
            }`}
          >
            {activeSection === 'leaderboard' && (
              <motion.span
                layoutId="navbar-active-pill"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-amber-100/90 border border-amber-300 shadow-xs"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>ตารางอันดับ</span>
            </span>
          </button>
        </nav>

        {/* Zone 3: Combined Account/Friends & Sign Out */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Combined User Profile & Friends Pill Badge */}
          <button
            type="button"
            onClick={onOpenFriendModal}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/90 border border-amber-200/90 rounded-2xl transition-all cursor-pointer shadow-2xs shrink-0"
            title={`โปรไฟล์ & เพื่อน: ${currentUser.accountName} (${friendsCount} คน)`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-200 border border-amber-300 flex items-center justify-center font-bold text-amber-950 text-xs overflow-hidden shadow-2xs shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.accountName}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.accountName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-amber-950 truncate max-w-[100px]">
                {currentUser.accountName}
              </span>
              <span className="text-[10px] font-bold text-rose-800 inline-flex items-center gap-1">
                <Users className="w-3 h-3 text-rose-600 inline" />
                <span>เพื่อน ({friendsCount})</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1 bg-rose-600 text-white text-[9px] font-extrabold rounded">
                    +{pendingRequestsCount}
                  </span>
                )}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title={`ออกจากระบบ / สลับบัญชี (${currentUser.accountName})`}
            className="inline-flex items-center justify-center p-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline ml-1 font-bold">
              {currentUser.accountName}
            </span>
          </button>
        </div>
      </div>

      {/* Tablet & Mobile Clean 3-Item Navigation Strip */}
      <nav
        aria-label="เมนูมือถือ"
        className="flex md:hidden items-center justify-around gap-1 px-3 py-1.5 border-t border-rose-100/80 bg-amber-50/50 w-full max-w-full"
      >
        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(false);
            onSelectSection('catalog');
          }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeSection === 'catalog'
              ? 'bg-white border border-amber-300 text-amber-950 shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5 text-pink-500" />
          <span>คลังเกม</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            isCurrentGameActive || isDropdownOpen
              ? 'bg-white border border-amber-300 text-amber-950 shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>โต๊ะสด ({totalLiveRooms})</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(false);
            onSelectSection('leaderboard');
          }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
            activeSection === 'leaderboard'
              ? 'bg-white border border-amber-300 text-amber-950 shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>ตารางอันดับ</span>
        </button>
      </nav>
      </header>
      <div className="h-24 sm:h-28" aria-hidden="true" />

      {/* Mobile Popover Modal when triggered from mobile bar (Rendered at Root Viewport Level) */}
      <AnimatePresence>
        {isDropdownOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl border border-amber-200 space-y-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <span className="text-xs font-extrabold text-slate-800">
                  เลือกห้องเล่นเกมสด ({totalLiveRooms} ห้อง)
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSelectGame('cheese-thief')}
                className="w-full text-left p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧀</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      หนูขโมยชีส (Cheese Thief)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      4–8 คน · บลัฟฟ์ & ทอยเต๋า
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-amber-400 text-amber-950">
                  {liveRoomsCount} ห้อง
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGame('insider')}
                className="w-full text-left p-3 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🕵️</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      จอมบงการคำใบ้ (Insider)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      4–8 คน · ทายคำ & จับบงการ
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-rose-500 text-white">
                  {liveInsiderRoomsCount} ห้อง
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGame('undercover')}
                className="w-full text-left p-3 rounded-2xl bg-violet-50/60 border border-violet-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🕶️</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      สายลับสลับคำ (Undercover)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      4–10 คน · คำคู่ AI & Mr. White
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-violet-500 text-white">
                  {liveUndercoverRoomsCount} ห้อง
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGame('detective-club')}
                className="w-full text-left p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      สมาคมนักสืบ (Detective Club)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      4–8 คน · เล่นคู่กับไพ่จริง & แจกสมุดลับ
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-amber-400 text-amber-950">
                  {liveDetectiveClubRoomsCount} ห้อง
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGame('avalon')}
                className="w-full text-left p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      Avalon: ศึกอัศวินโต๊ะกลม
                    </div>
                    <div className="text-[11px] text-slate-500">
                      5–10 คน · เล่นสดที่โต๊ะ & มีแอพช่วยดำเนินเกม
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-emerald-600 text-white">
                  {liveAvalonRoomsCount} ห้อง
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGame('hues-cues')}
                className="w-full text-left p-3 rounded-2xl bg-pink-50/60 border border-pink-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎨</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      ทายสีจากคำใบ้ (Hues & Cues)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      3–10 คน · iPad กระดานกลาง & ลากหมากทาย
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-pink-500 text-white">
                  {liveHuesCuesRoomsCount || 0} ห้อง
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGame('dying-message')}
                className="w-full text-left p-3 rounded-2xl bg-sky-50/60 border border-sky-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔎</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      เบาะแสมรณะ (Dying Message)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      4–12 คน · เชื่อม iPad กลางโต๊ะ & สืบตัวจริง
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-sky-500 text-white">
                  {liveDyingMessageRoomsCount || 0} ห้อง
                </span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
