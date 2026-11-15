import React from 'react';
import { DoraemonPlayerEntry } from '../../firebase/table/types';

export interface DoraemonTurnBannerProps {
  currentTurnPlayer?: DoraemonPlayerEntry;
  nextTurnPlayer?: DoraemonPlayerEntry;
  totalDrawn: number;
  remainingDeckCount: number;
}

export const DoraemonTurnBanner: React.FC<DoraemonTurnBannerProps> = ({
  currentTurnPlayer,
  nextTurnPlayer,
  totalDrawn,
  remainingDeckCount,
}) => {
  return (
    <div className="p-4 rounded-3xl bg-white border-2 border-amber-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      <div className="space-y-0.5">
        <div className="text-xs font-extrabold text-amber-700 flex items-center justify-center sm:justify-start gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>ตาของผู้เล่นลำดับที่ {currentTurnPlayer?.order || 1}</span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2.5">
          <span className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-300 shadow-xs flex items-center justify-center text-2xl shrink-0">
            {currentTurnPlayer?.avatarEmoji || '🐱'}
          </span>
          <div>
            🎯 ถึงตา:{' '}
            <span className="text-amber-600">
              {currentTurnPlayer?.name || 'ผู้เล่น'}
            </span>{' '}
            จั่วไพ่!
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-500 text-right hidden sm:block">
          <div>
            คิวถัดไป: <strong>{nextTurnPlayer?.name || '-'}</strong>
          </div>
          <div>เปิดแล้ว {totalDrawn} / 52 ใบ</div>
        </div>
        <div className="px-3.5 py-1.5 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs">
          เหลือ {remainingDeckCount} ใบ
        </div>
      </div>
    </div>
  );
};
