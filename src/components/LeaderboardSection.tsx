import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Trophy,
  Medal,
  Flame,
  Award,
  Gamepad2,
  TrendingUp,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import { BoardGame, PlayerRankingEntry } from '../types/boardgame';
import { filterAndSortLeaderboard } from '../utils/gameLogic';

interface LeaderboardSectionProps {
  leaderboard: PlayerRankingEntry[];
  games: BoardGame[];
  onPlayGameForRank: (gameSlug: BoardGame['slug']) => void;
}

const GAME_META_BADGES: Record<
  string,
  { emoji: string; accentClass: string; badgeBg: string; shortLabel: string }
> = {
  'cheese-thief': {
    emoji: '🧀',
    accentClass: 'text-amber-900',
    badgeBg: 'bg-amber-100 border-amber-300',
    shortLabel: 'หนูขโมยชีส (Cheese Thief)',
  },
  insider: {
    emoji: '🕵️',
    accentClass: 'text-rose-900',
    badgeBg: 'bg-rose-100 border-rose-300',
    shortLabel: 'จอมบงการคำใบ้ (Insider)',
  },
  undercover: {
    emoji: '🕶️',
    accentClass: 'text-indigo-900',
    badgeBg: 'bg-indigo-100 border-indigo-300',
    shortLabel: 'สายลับสลับคำ (Undercover)',
  },
  'detective-club': {
    emoji: '🔍',
    accentClass: 'text-amber-950',
    badgeBg: 'bg-amber-200/80 border-amber-400',
    shortLabel: 'สมาคมนักสืบ (Detective Club)',
  },
};

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  leaderboard,
  games,
  onPlayGameForRank,
}) => {
  const [gameFilter, setGameFilter] = useState<'all' | BoardGame['slug']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter only the 4 playable live games that record rankings
  const playableGames = games.filter((g) => g.playableOnline);

  const selectedGameObj =
    gameFilter === 'all'
      ? null
      : playableGames.find((g) => g.slug === gameFilter) || null;

  const activeCtaSlug: BoardGame['slug'] =
    gameFilter === 'all' ? 'cheese-thief' : gameFilter;
  const activeCtaMeta =
    GAME_META_BADGES[activeCtaSlug] || GAME_META_BADGES['cheese-thief'];

  // Close dropdown when clicking outside
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

  const rows = filterAndSortLeaderboard(leaderboard, gameFilter, searchQuery);

  const getRankBadge = (idx: number) => {
    if (idx === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-amber-800 font-extrabold bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg text-xs shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>#1</span>
        </span>
      );
    }
    if (idx === 1) {
      return (
        <span className="inline-flex items-center gap-1 text-slate-700 font-bold bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-lg text-xs shadow-2xs">
          <Medal className="w-3.5 h-3.5 text-slate-400 fill-slate-300" />
          <span>#2</span>
        </span>
      );
    }
    if (idx === 2) {
      return (
        <span className="inline-flex items-center gap-1 text-amber-900 font-bold bg-orange-100 border border-orange-300 px-2.5 py-0.5 rounded-lg text-xs shadow-2xs">
          <Medal className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>#3</span>
        </span>
      );
    }
    return (
      <span className="font-mono tabular-nums font-bold text-slate-500 pl-2">
        #{idx + 1}
      </span>
    );
  };

  return (
    <section aria-label="ตารางจัดอันดับผู้เล่น" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Master Leaderboard</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            ระบบจัดอันดับผู้เล่น (ELO & Hall of Fame)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            จัดอันดับคะแนน ELO ทั้งแบบรวมทุกบอร์ดเกมและแยกตามรายเกม อัปเดตคะแนนทันทีเมื่อจบแมตช์บนโต๊ะสด
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onPlayGameForRank(activeCtaSlug)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-400 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs min-h-[40px]"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-900" />
            <span>
              เข้าเล่น {activeCtaMeta.shortLabel} เพื่อเก็บคะแนนอันดับ
            </span>
          </button>
        </div>
      </div>

      {/* Streamlined Single-Line Filter Bar: Overall Button + 4-Game Custom Dropdown + Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 bg-rose-50/70 border border-rose-100 rounded-2xl w-full sm:w-auto">
          {/* 1. Overall Ranking Button (One-Click Toggle) */}
          <button
            type="button"
            onClick={() => {
              setGameFilter('all');
              setIsDropdownOpen(false);
            }}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              gameFilter === 'all'
                ? 'bg-white text-amber-950 font-extrabold shadow-xs border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium border border-transparent'
            }`}
          >
            <Trophy
              className={`w-3.5 h-3.5 ${
                gameFilter === 'all' ? 'text-amber-500' : 'text-slate-400'
              }`}
            />
            <span>คะแนนรวมทุกเกม (Overall)</span>
          </button>

          {/* 2. Custom Dropdown for the 4 Playable Live Games */}
          <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`w-full sm:w-auto inline-flex items-center justify-between gap-2.5 px-3.5 py-2 text-xs rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
                selectedGameObj
                  ? 'bg-white text-amber-950 font-extrabold shadow-xs border border-amber-300'
                  : isDropdownOpen
                  ? 'bg-white/90 text-slate-900 font-bold border border-rose-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium border border-transparent'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {selectedGameObj ? (
                  <>
                    <span>
                      {GAME_META_BADGES[selectedGameObj.slug]?.emoji || '🎲'}
                    </span>
                    <span>
                      {GAME_META_BADGES[selectedGameObj.slug]?.shortLabel ||
                        selectedGameObj.titleTh}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>เลือกดูอันดับรายเกม ({playableGames.length} เกม)</span>
                  </>
                )}
              </span>

              <motion.span
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="inline-flex items-center"
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </motion.span>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  role="listbox"
                  aria-label="เลือกบอร์ดเกมเพื่อดูตารางอันดับ"
                  className="absolute left-0 mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-md border border-rose-200/90 rounded-2xl shadow-xl p-2 z-30 space-y-1"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>เลือกตารางอันดับรายเกม</span>
                    <span>{playableGames.length} เกมสด</span>
                  </div>

                  {playableGames.map((g) => {
                    const isSelected = gameFilter === g.slug;
                    const meta = GAME_META_BADGES[g.slug] || {
                      emoji: '🎲',
                      accentClass: 'text-slate-800',
                      badgeBg: 'bg-slate-100 border-slate-200',
                      shortLabel: g.titleTh,
                    };

                    return (
                      <button
                        key={g.slug}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setGameFilter(g.slug);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/90 border border-amber-300 text-amber-950 font-bold shadow-2xs'
                            : 'hover:bg-rose-50/70 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center text-base shrink-0 ${meta.badgeBg}`}
                          >
                            {meta.emoji}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-slate-900 truncate">
                              {meta.shortLabel}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {g.categoryLabel} · {g.minPlayers}–{g.maxPlayers} คน
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-amber-400/30 text-amber-800 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. Player Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <label htmlFor="leaderboard-search" className="sr-only">
            ค้นหาชื่อผู้เล่นในตารางอันดับ
          </label>
          <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="leaderboard-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อผู้เล่น หรือฉายา..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-rose-200 rounded-xl text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-amber-400 min-h-[40px]"
          />
        </div>
      </div>

      {/* High-Density Data Table with Tabular Numerals & Pastel Rows */}
      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rose-100 bg-rose-50/50 text-xs font-bold text-slate-700">
                <th className="py-3.5 px-4 w-20">อันดับ</th>
                <th className="py-3.5 px-4">ผู้เล่น & ระดับฉายา</th>
                <th className="py-3.5 px-4">เกมถนัด & บทบาทหลัก</th>
                <th className="py-3.5 px-4 text-right">จำนวนแมตช์</th>
                <th className="py-3.5 px-4 text-right">อัตราชนะ</th>
                <th className="py-3.5 px-4 text-right">ชนะต่อเนื่อง</th>
                <th className="py-3.5 px-4 text-right">คะแนน ELO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 text-sm">
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 px-4 text-center text-slate-500 space-y-3"
                  >
                    <div className="font-bold text-slate-800">
                      ยังไม่มีประวัติการแข่งขันในหมวดนี้
                    </div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      เมื่อเล่นเกมบนโต๊ะสดจนจบแมตช์ คะแนน ELO และสถิติการชนะจะถูกอัปเดตขึ้นสู่ตารางอันดับโดยอัตโนมัติ
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => onPlayGameForRank(activeCtaSlug)}
                        className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-xl transition-colors cursor-pointer"
                      >
                        {activeCtaMeta.emoji} เข้าเล่น {activeCtaMeta.shortLabel}{' '}
                        เพื่อประเดิมอันดับแรก
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((entry, idx) => {
                const isCurrentUser = entry.playerName.includes('(คุณ)');
                const stat =
                  gameFilter === 'all'
                    ? {
                        elo: entry.overallElo,
                        matches: entry.totalMatches,
                        wins: entry.wins,
                        winRate: entry.winRate,
                      }
                    : entry.gameStats[gameFilter];

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isCurrentUser
                        ? 'bg-amber-100/50 hover:bg-amber-100/70 font-semibold'
                        : 'hover:bg-rose-50/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {getRankBadge(idx)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {isCurrentUser && (
                          <Award className="w-4 h-4 text-amber-600" />
                        )}
                        <span>{entry.playerName}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-normal">
                        {entry.rankTitle}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">
                        {entry.signatureGameTitle}
                      </div>
                      <div className="text-slate-400">
                        บทบาท: {entry.signatureRole}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {stat.matches} เกม ({stat.wins} ชนะ)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">
                      <span className="inline-flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        {stat.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      <span className="inline-flex items-center gap-1 font-semibold text-orange-700">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
                        {entry.streak} แมตช์
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-extrabold text-amber-700 text-base">
                      {stat.elo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
