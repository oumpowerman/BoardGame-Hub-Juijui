import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Layers,
  HelpCircle,
  Eye,
  Dice5,
  Compass,
  PartyPopper,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import { GameCategory, GameCategoryId } from '../types/boardgame';

interface CategoryFilterBarProps {
  categories: GameCategory[];
  selectedCategory: GameCategoryId;
  onSelectCategory: (id: GameCategoryId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalMatchingGames: number;
  wsConnected?: boolean;
  onlineClientsCount?: number;
  activePlayerName?: string;
  activePlayerElo?: number;
}

const CATEGORY_ICONS: Record<GameCategoryId, React.ReactNode> = {
  all: <Layers className="w-3.5 h-3.5 text-rose-500" />,
  'social-deduction': <Eye className="w-4 h-4 text-purple-600" />,
  bluffing: <Dice5 className="w-4 h-4 text-amber-600" />,
  strategy: <Compass className="w-4 h-4 text-sky-600" />,
  party: <PartyPopper className="w-4 h-4 text-pink-600" />,
};

const CATEGORY_BADGE_STYLES: Record<GameCategoryId, string> = {
  all: 'bg-rose-100 border-rose-200',
  'social-deduction': 'bg-purple-100 border-purple-200',
  bluffing: 'bg-amber-100 border-amber-200',
  strategy: 'bg-sky-100 border-sky-200',
  party: 'bg-pink-100 border-pink-200',
};

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalMatchingGames,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subCategories = categories.filter((c) => c.id !== 'all');
  const selectedSubCategory =
    selectedCategory === 'all'
      ? null
      : subCategories.find((c) => c.id === selectedCategory) || null;

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

  return (
    <section aria-label="ตัวกรองหมวดหมู่บอร์ดเกม">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-100">
        {/* Left: Compact All Categories Button + Custom Category Dropdown + Matching Game Count */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 bg-rose-50/70 border border-rose-100/90 rounded-2xl w-full sm:w-auto">
            {/* 1. Quick "All Categories" Toggle Button */}
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                setIsDropdownOpen(false);
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
                selectedCategory === 'all'
                  ? 'bg-white text-rose-950 font-extrabold shadow-xs border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium border border-transparent'
              }`}
            >
              <Layers
                className={`w-3.5 h-3.5 ${
                  selectedCategory === 'all' ? 'text-rose-500' : 'text-slate-400'
                }`}
              />
              <span>ทุกหมวดหมู่</span>
            </button>

            {/* 2. Custom Framer Motion Category Dropdown */}
            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`w-full sm:w-auto inline-flex items-center justify-between gap-2.5 px-3.5 py-2 text-xs sm:text-sm rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
                  selectedSubCategory
                    ? 'bg-white text-rose-950 font-extrabold shadow-xs border border-rose-200'
                    : isDropdownOpen
                    ? 'bg-white/90 text-slate-900 font-bold border border-rose-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium border border-transparent'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {selectedSubCategory ? (
                    <>
                      {CATEGORY_ICONS[selectedSubCategory.id]}
                      <span>{selectedSubCategory.nameTh}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>เลือกหมวดหมู่ ({subCategories.length} หมวด)</span>
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
                    aria-label="เลือกหมวดหมู่บอร์ดเกม"
                    className="absolute left-0 mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-md border border-rose-200/90 rounded-2xl shadow-xl p-2 z-30 space-y-1"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>หมวดหมู่บอร์ดเกม</span>
                      <span>{subCategories.length} หมวด</span>
                    </div>

                    {subCategories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onSelectCategory(cat.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50/90 border border-rose-200 text-rose-950 font-bold shadow-2xs'
                              : 'hover:bg-rose-50/60 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                                CATEGORY_BADGE_STYLES[cat.id] ||
                                'bg-slate-100 border-slate-200'
                              }`}
                            >
                              {CATEGORY_ICONS[cat.id] || (
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-slate-900 truncate">
                                {cat.nameTh}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {cat.description}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0">
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

          <span className="text-xs font-mono tabular-nums font-bold text-rose-700 px-2.5 py-1.5 whitespace-nowrap shrink-0">
            พบ {totalMatchingGames} เกม
          </span>
        </div>

        {/* Right: Clean Single-Line Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <label htmlFor="boardgame-search" className="sr-only">
            ค้นหาบอร์ดเกม
          </label>
          <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="boardgame-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาเกม เช่น หนูขโมยชีส, Insider..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-rose-200/80 rounded-xl text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 min-h-[40px]"
          />
        </div>
      </div>
    </section>
  );
};
