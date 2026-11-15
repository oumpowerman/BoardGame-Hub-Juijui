import React from 'react';
import { BookOpen, History, Crown, Shuffle } from 'lucide-react';
import { BaseModal } from '../BaseModal';
import {
  CardRank,
  DEFAULT_DORAEMON_RULES,
  KING_COMMAND_PRESETS,
  getDoraemonCardById,
} from '../../data/doraemonRules';
import { DoraemonDrawHistoryItem } from '../../firebase/table/types';

// 1. Rules Customization Modal
export interface DoraemonRulesModalProps {
  isOpen: boolean;
  customRulesState: Record<string, string>;
  onChangeCustomRule: (rank: CardRank, value: string) => void;
  onResetAllRules: () => void;
  onSaveRules: () => void;
  onClose: () => void;
}

export const DoraemonRulesModal: React.FC<DoraemonRulesModalProps> = ({
  isOpen,
  customRulesState,
  onChangeCustomRule,
  onResetAllRules,
  onSaveRules,
  onClose,
}) => {
  const ranks: CardRank[] = [
    'A',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="กติกาไพ่โดเรม่อน (A ถึง K)"
      subtitle="CUSTOMIZABLE PARTY RULES"
      icon={<BookOpen className="w-5 h-5" />}
      maxWidth="2xl"
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          กติกามาตรฐานยอดนิยมของไทย สามารถคลิกแก้ไขข้อความของแต่ละใบให้ตรงกับวงของคุณได้ตามใจชอบ
        </p>

        <div className="space-y-2.5 max-h-[56vh] overflow-y-auto pr-1">
          {ranks.map((rank) => {
            const def = DEFAULT_DORAEMON_RULES[rank];
            const customVal = customRulesState[rank] ?? def.defaultDescription;
            return (
              <div
                key={rank}
                className="p-3 rounded-2xl bg-white border border-amber-200/80 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span className="text-base">{def.emoji}</span>
                    <span>{def.nameTh}</span>
                  </span>
                  {def.isSpecialPinned && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold">
                      📌 ปักหมุดบนจอ
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={customVal}
                  onChange={(e) => onChangeCustomRule(rank, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-hidden text-xs font-bold text-slate-800 bg-amber-50/20"
                />
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onResetAllRules}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
          >
            คืนค่าเริ่มต้นทั้งหมด
          </button>
          <button
            type="button"
            onClick={onSaveRules}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs cursor-pointer"
          >
            บันทึกกติกานี้
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

// 2. Draw History Modal
export interface DoraemonHistoryModalProps {
  isOpen: boolean;
  history: DoraemonDrawHistoryItem[];
  onClose: () => void;
}

export const DoraemonHistoryModal: React.FC<DoraemonHistoryModalProps> = ({
  isOpen,
  history,
  onClose,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`ประวัติการจั่วไพ่ (${history.length} ใบ)`}
      subtitle="CARD DRAW LOG"
      icon={<History className="w-5 h-5" />}
      maxWidth="md"
    >
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {history.length > 0 ? (
          history.map((item, idx) => {
            const card = getDoraemonCardById(item.cardId);
            if (!card) return null;
            return (
              <div
                key={`hist-${idx}`}
                className="p-3 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-10 rounded-xl border-2 flex items-center justify-center font-black ${
                      card.isRed
                        ? 'bg-rose-50 border-rose-300 text-rose-600'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {card.rank}
                    {card.suitSymbol}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1">
                      <span>{card.badgeEmoji}</span>
                      <span>{card.titleTh}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      จั่วโดย: <strong className="text-slate-800">{item.playerName}</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center text-xs text-slate-400 font-bold">
            ยังไม่มีประวัติการจั่วไพ่ในรอบนี้
          </div>
        )}
      </div>
    </BaseModal>
  );
};

// 3. King Command Edit Modal (when tapping on pinned King badge)
export interface DoraemonKingCommandModalProps {
  isOpen: boolean;
  activeCommand: string;
  kingPlayerName: string;
  newCommandInput: string;
  onChangeNewCommand: (val: string) => void;
  onSubmitNewCommand: () => void;
  onClose: () => void;
}

export const DoraemonKingCommandModal: React.FC<
  DoraemonKingCommandModalProps
> = ({
  isOpen,
  activeCommand,
  kingPlayerName,
  newCommandInput,
  onChangeNewCommand,
  onSubmitNewCommand,
  onClose,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="คำสั่งของพระราชา (KING)"
      subtitle="ROYAL DECREE"
      icon={<Crown className="w-5 h-5" />}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center space-y-1">
          <div className="text-xs font-extrabold text-amber-800">
            คำสั่งปัจจุบัน (ผู้ถือล่าสุด: {kingPlayerName}):
          </div>
          <div className="text-base font-black text-amber-950">
            &ldquo;{activeCommand}&rdquo;
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-800">
              แก้ไข/ตั้งคำสั่งใหม่สำหรับคนที่ได้ K คนต่อไป:
            </label>
            <button
              type="button"
              onClick={() => {
                const preset =
                  KING_COMMAND_PRESETS[
                    Math.floor(Math.random() * KING_COMMAND_PRESETS.length)
                  ];
                onChangeNewCommand(preset);
              }}
              className="text-[11px] text-amber-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>สุ่มคำสั่ง</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={newCommandInput}
            onChange={(e) => onChangeNewCommand(e.target.value)}
            placeholder="เช่น เต้นท่าไก่ 10 วินาที หรือดื่มหมดแก้ว..."
            className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:outline-hidden text-xs font-bold text-slate-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            onClick={onSubmitNewCommand}
            disabled={!newCommandInput.trim()}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs shadow-xs cursor-pointer"
          >
            บันทึกคำสั่งใหม่
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
