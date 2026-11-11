import React from 'react';
import { QrCode, LogOut, Tablet, Trophy } from 'lucide-react';

export interface CheeseThiefActiveRoomHeaderProps {
  roomCode: string;
  roomName?: string;
  hostName: string;
  isHost: boolean;
  roundNumber?: number;
  isIpadConnected?: boolean;
  onOpenShareModal: () => void;
  onOpenScoreModal?: () => void;
  onSwitchToIpadTable?: () => void;
  onLeaveOrCloseRoom: () => void;
}

export const CheeseThiefActiveRoomHeader: React.FC<CheeseThiefActiveRoomHeaderProps> = ({
  roomCode,
  roomName,
  hostName,
  isHost,
  roundNumber = 1,
  isIpadConnected = false,
  onOpenShareModal,
  onOpenScoreModal,
  onSwitchToIpadTable,
  onLeaveOrCloseRoom,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-2xl bg-amber-400 text-amber-950 font-bold text-xl shadow-2xs">
          🧀
        </span>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold text-amber-800 uppercase">
              CHEESE THIEF TABLE · รหัสห้อง #{roomCode}
            </span>
            <span className="text-[11px] font-mono font-extrabold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md">
              รอบที่ {Math.max(1, roundNumber)}
            </span>
            {isIpadConnected && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <Tablet className="w-3 h-3 text-emerald-600" />
                <span>เชื่อม iPad โต๊ะกลางแล้ว</span>
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {roomName || `โต๊ะของ ${hostName}`}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onSwitchToIpadTable && (
          <button
            type="button"
            onClick={onSwitchToIpadTable}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all cursor-pointer min-h-[38px]"
          >
            <Tablet className="w-3.5 h-3.5 text-indigo-700" />
            <span>จอโต๊ะกลาง iPad</span>
          </button>
        )}

        {onOpenScoreModal && (
          <button
            type="button"
            onClick={onOpenScoreModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xs cursor-pointer min-h-[38px]"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>จบเกม & สรุปคะแนนโต๊ะ</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenShareModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer min-h-[38px]"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>แชร์ห้อง / QR</span>
        </button>

        <button
          type="button"
          onClick={onLeaveOrCloseRoom}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer min-h-[38px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isHost ? 'ยุบห้อง / ออก' : 'ออกจากห้อง'}</span>
        </button>
      </div>
    </div>
  );
};
