import React, { useState } from 'react';
import {
  Search,
  Trophy,
  Medal,
  Flame,
  Award,
  Gamepad2,
  TrendingUp,
} from 'lucide-react';
import { BoardGame, PlayerRankingEntry } from '../types/boardgame';
import { filterAndSortLeaderboard } from '../utils/gameLogic';

interface LeaderboardSectionProps {
  leaderboard: PlayerRankingEntry[];
  games: BoardGame[];
  onPlayGameForRank: (gameSlug: BoardGame['slug']) => void;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  leaderboard,
  games,
  onPlayGameForRank,
}) => {
  const [gameFilter, setGameFilter] = useState<'all' | BoardGame['slug']>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
            onClick={() => onPlayGameForRank('cheese-thief')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-400 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-900" />
            <span>เข้าเล่นหนูขโมยชีสเพื่อเก็บคะแนนอันดับ</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-rose-50/70 border border-rose-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setGameFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              gameFilter === 'all'
                ? 'bg-white text-amber-950 font-bold shadow-xs border border-amber-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            คะแนนรวมทุกเกม (Overall)
          </button>
          {games.map((g) => (
            <button
              key={g.slug}
              type="button"
              onClick={() => setGameFilter(g.slug)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                gameFilter === g.slug
                  ? 'bg-white text-amber-950 font-bold shadow-xs border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g.titleTh}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <label htmlFor="leaderboard-search" className="sr-only">
            ค้นหาชื่อผู้เล่นในตารางอันดับ
          </label>
          <Search className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="leaderboard-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อผู้เล่น หรือฉายา..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-rose-200 rounded-xl text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-amber-400"
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
                  <td colSpan={7} className="py-10 px-4 text-center text-slate-500 space-y-3">
                    <div className="font-bold text-slate-800">
                      ยังไม่มีประวัติการแข่งขันในฤดูกาลนี้
                    </div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      เมื่อเล่นเกมหนูขโมยชีสจนจบแมตช์ คะแนน ELO และสถิติการชนะจะถูกอัปเดตขึ้นสู่ตารางอันดับโดยอัตโนมัติ
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={() => onPlayGameForRank('cheese-thief')}
                        className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-xl transition-colors cursor-pointer"
                      >
                        🧀 เข้าเล่นหนูขโมยชีสเพื่อประเดิมอันดับแรก
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
                        {isCurrentUser && <Award className="w-4 h-4 text-amber-600" />}
                        <span>{entry.playerName}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-normal">{entry.rankTitle}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{entry.signatureGameTitle}</div>
                      <div className="text-slate-400">บทบาท: {entry.signatureRole}</div>
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
