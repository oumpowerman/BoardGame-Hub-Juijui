import React from 'react';
import {
  Search,
  Wifi,
  Users,
  Award,
  Layers,
  HelpCircle,
  Eye,
  Dice5,
  Compass,
  PartyPopper,
} from 'lucide-react';
import { GameCategory, GameCategoryId } from '../types/boardgame';

interface CategoryFilterBarProps {
  categories: GameCategory[];
  selectedCategory: GameCategoryId;
  onSelectCategory: (id: GameCategoryId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalMatchingGames: number;
  wsConnected: boolean;
  onlineClientsCount: number;
  activePlayerName: string;
  activePlayerElo: number;
}

const CATEGORY_ICONS: Record<GameCategoryId, React.ReactNode> = {
  all: <Layers className="w-3.5 h-3.5 text-rose-500" />,
  'social-deduction': <Eye className="w-3.5 h-3.5 text-purple-500" />,
  bluffing: <Dice5 className="w-3.5 h-3.5 text-amber-500" />,
  strategy: <Compass className="w-3.5 h-3.5 text-sky-500" />,
  party: <PartyPopper className="w-3.5 h-3.5 text-pink-500" />,
};

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalMatchingGames,
  wsConnected,
  onlineClientsCount,
  activePlayerName,
  activePlayerElo,
}) => {
  const activeCatObj = categories.find((c) => c.id === selectedCategory) || categories[0];

  return (
    <section aria-label="ตัวกรองหมวดหมู่บอร์ดเกม" className="space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 border-b border-rose-100">
        {/* Segmented Category Filter Controls with Colorful Pastel Icons */}
        <div
          role="tablist"
          aria-label="หมวดหมู่บอร์ดเกม"
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-rose-50/70 border border-rose-100/90 rounded-2xl"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-rose-950 font-bold shadow-xs border border-rose-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {CATEGORY_ICONS[cat.id] || <HelpCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span>{cat.nameTh}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input + Real-time WebSocket Connection Telemetry */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          <div className="relative flex-1 sm:w-64">
            <label htmlFor="boardgame-search" className="sr-only">
              ค้นหาบอร์ดเกม
            </label>
            <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="boardgame-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาเกม เช่น หนูขโมยชีส, Avalon..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-rose-200/80 rounded-xl text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-slate-600 px-3 py-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl whitespace-nowrap shrink-0">
            <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
            <span className="font-medium text-emerald-800">{wsConnected ? 'เซิร์ฟเวอร์ออนไลน์' : 'กำลังเชื่อมต่อ...'}</span>
            <span aria-hidden="true" className="text-emerald-300">·</span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-700">
              <Users className="w-3 h-3 text-emerald-600" />
              <span>ออนไลน์ {onlineClientsCount} คน</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Contextual Description & Active Profile Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-500">
        <p className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
            {CATEGORY_ICONS[activeCatObj.id]}
            <span>{activeCatObj.nameTh}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{activeCatObj.description}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums font-bold text-rose-600">
            {totalMatchingGames} เกม
          </span>
        </p>

        <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono tabular-nums bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-xl">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-800 font-sans font-medium">{activePlayerName}</span>
          <span>·</span>
          <span className="text-amber-700 font-bold">{activePlayerElo} ELO</span>
        </div>
      </div>
    </section>
  );
};
