import React from 'react';
import { Volume2, VolumeX, QrCode, LogOut } from 'lucide-react';

export interface DetectiveClubActiveRoomHeaderProps {
  roomCode: string;
  roomName?: string;
  hostName: string;
  isHost: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenShareModal: () => void;
  onLeaveRoom: () => void;
}

export const DetectiveClubActiveRoomHeader: React.FC<DetectiveClubActiveRoomHeaderProps> = ({
  roomCode,
  roomName,
  hostName,
  isHost,
  soundEnabled,
  onToggleSound,
  onOpenShareModal,
  onLeaveRoom,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-2xl bg-amber-500 text-amber-950 font-bold text-xl shadow-2xs">
          🔍
        </span>
        <div>
          <div className="text-[11px] font-mono font-bold text-amber-800 uppercase">
            DETECTIVE CLUB TABLE · รหัสห้อง #{roomCode}
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {roomName || `โต๊ะของ ${hostName}`}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSound}
          className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs border transition-colors cursor-pointer min-h-[38px] ${
            soundEnabled
              ? 'bg-amber-50 border-amber-300 text-amber-950 font-extrabold'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-amber-700" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden sm:inline">
            {soundEnabled ? 'เสียง: เปิด' : 'เสียง: ปิด'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenShareModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs cursor-pointer min-h-[38px]"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>แชร์ห้อง / QR Code</span>
        </button>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer min-h-[38px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isHost ? 'ยุบห้อง / ออก' : 'ออกจากห้อง'}</span>
        </button>
      </div>
    </div>
  );
};
