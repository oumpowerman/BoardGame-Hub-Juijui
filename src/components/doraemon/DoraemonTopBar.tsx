import React from 'react';
import {
  Share2,
  Check,
  BookOpen,
  History,
  Settings,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export interface DoraemonTopBarProps {
  roomCode?: string;
  copiedCode: boolean;
  onCopyRoomCode: () => void;
  onBackToCatalog: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  totalDrawn: number;
  onBackToSetup: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onHideHeader?: () => void;
}

export const DoraemonTopBar: React.FC<DoraemonTopBarProps> = ({
  roomCode,
  copiedCode,
  onCopyRoomCode,
  onBackToCatalog,
  onOpenRules,
  onOpenHistory,
  totalDrawn,
  onBackToSetup,
  isSoundEnabled,
  onToggleSound,
  isFullscreen,
  onToggleFullscreen,
  onHideHeader,
}) => {
  return (
    <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-2 pb-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          ← กลับ
        </button>
        {roomCode && (
          <button
            type="button"
            onClick={onCopyRoomCode}
            className="py-1.5 px-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="คัดลอกรหัสห้อง"
          >
            <span>#{roomCode}</span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenRules}
          className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">กติกา A-K</span>
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden sm:inline">ประวัติ ({totalDrawn})</span>
        </button>
        <button
          type="button"
          onClick={onBackToSetup}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          title="ปรับรายชื่อผู้เล่น"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          title={isSoundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
        >
          {isSoundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          title={isFullscreen ? 'ย่อหน้าจอ' : 'สลับเต็มจอ'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
        {onHideHeader && (
          <button
            type="button"
            onClick={onHideHeader}
            className="py-2 px-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 hover:bg-amber-200 shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-extrabold"
            title="พับเก็บเมนูให้โต๊ะเกมเด่นชัดที่สุด"
          >
            <span>🔽 พับ</span>
          </button>
        )}
      </div>
    </div>
  );
};
