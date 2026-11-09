import React from 'react';
import { QrCode, LogOut } from 'lucide-react';

export interface InsiderActiveRoomHeaderProps {
  roomCode: string;
  roomName?: string;
  hostName: string;
  isHost: boolean;
  onOpenShareModal: () => void;
  onLeaveOrCloseRoom: () => void;
}

export const InsiderActiveRoomHeader: React.FC<InsiderActiveRoomHeaderProps> = ({
  roomCode,
  roomName,
  hostName,
  isHost,
  onOpenShareModal,
  onLeaveOrCloseRoom,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-200/70">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-2xl bg-rose-500 text-white font-bold text-xl shadow-2xs">
          🕵️
        </span>
        <div>
          <div className="text-[11px] font-mono font-bold text-rose-700 uppercase">
            INSIDER TABLE · รหัสห้อง #{roomCode}
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {roomName || `โต๊ะของ ${hostName}`}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenShareModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all shadow-xs cursor-pointer min-h-[38px]"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>แชร์ห้อง / QR Code</span>
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
