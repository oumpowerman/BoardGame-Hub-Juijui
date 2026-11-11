import React, { useState, useMemo } from 'react';
import { BaseModal } from '../BaseModal';
import {
  DyingMessageEvidenceCategory,
  DyingMessageEvidenceCard,
  DYING_MESSAGE_ALL_CARDS,
  DYING_MESSAGE_CATEGORIES,
} from '../../data/dyingmessage';
import { Search, Sparkles, Filter, Layers, X } from 'lucide-react';

interface DyingMessageDeckExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DyingMessageDeckExplorerModal: React.FC<
  DyingMessageDeckExplorerModalProps
> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] =
    useState<DyingMessageEvidenceCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCards = useMemo(() => {
    let list =
      selectedCategory === 'all'
        ? DYING_MESSAGE_ALL_CARDS
        : DYING_MESSAGE_ALL_CARDS.filter((c) => c.category === selectedCategory);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.titleTh.toLowerCase().includes(q) ||
          c.subtitleTh.toLowerCase().includes(q) ||
          c.hintPrompt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="คลังการ์ดเบาะแสมรณะ (Dying Message Deck)"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Top Overview & Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-pink-50 border border-sky-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              🗂️
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>คลังการ์ดหลักฐานสืบคดี</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 font-mono font-bold">
                  {DYING_MESSAGE_ALL_CARDS.length} ใบ (4 หมวดหมู่)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เชื่อมโยงมิติคนจริง เสื้อผ้า ภาษากาย ของใช้รอบตัว และอวตารดิจิทัลในห้อง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-sky-200/80 shrink-0 font-medium">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>แสดงผล {filteredCards.length} / {DYING_MESSAGE_ALL_CARDS.length} ใบ</span>
          </div>
        </div>

        {/* Filter Bar & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
            {DYING_MESSAGE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-xs scale-[1.02]'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.nameTh.split(' ')[0]}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-sky-400 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.cardCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อการ์ด / คำใบ้..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 100 Cards Grid Display */}
        <div className="max-h-[58vh] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
          {filteredCards.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-bold text-slate-700">
                ไม่พบการ์ดเบาะแสที่ตรงกับคำค้นหา
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-sky-600 hover:underline font-bold"
              >
                ล้างการค้นหาทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCards.map((card, idx) => (
                <div
                  key={card.id}
                  className={`p-3.5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between space-y-2 ${card.pastelBg} ${card.pastelBorder}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl shrink-0 p-1 bg-white/70 rounded-xl shadow-2xs">
                        {card.emoji}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {card.categoryLabel}
                      </div>
                      <h4
                        className={`text-sm font-extrabold tracking-tight mt-0.5 leading-snug ${card.pastelText}`}
                      >
                        {card.titleTh}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {card.subtitleTh}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 text-[11px] text-slate-600 leading-relaxed bg-white/50 p-2 rounded-xl">
                    <span className="font-bold text-slate-700 mr-1">คำใบ้:</span>
                    <span>{card.hintPrompt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            เคล็ดลับ: ในแต่ละรอบ ระบบจะสุ่ม 5 ใบให้ผู้ตายเลือก และ 5 ใบให้ฆาตกรเลือก
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
