import React, { useState } from 'react';
import { QrCode, Copy, Check, Volume2, VolumeX, LogOut } from 'lucide-react';
import { FirestoreRoom } from '../../firebase/tableService';

export interface AvalonActiveRoomHeaderProps {
  currentRoom: FirestoreRoom;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLeaveRoom: () => Promise<void>;
  onOpenInviteModal?: () => void;
}

export const AvalonActiveRoomHeader: React.FC<AvalonActiveRoomHeaderProps> = ({
  currentRoom,
  soundEnabled,
  onToggleSound,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-md text-slate-800 rounded-3xl shadow-xs border border-emerald-200/90 flex flex-wrap items-center justify-between gap-3">
      {/* Left: Room Code Badge */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-xl shadow-2xs">
          🏰
        </div>

        <div>
          <div className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>โต๊ะเล่นสดรหัส</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200/80 rounded-lg">
              #{currentRoom.roomCode}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            {currentRoom.hostName}&apos;s Tabletop
          </h2>
        </div>
      </div>

      {/* Right: Actions (Copy code, Sound toggle, Leave room) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
          <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกรหัส'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleSound}
          className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
        </button>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากโต๊ะ</span>
        </button>
      </div>
    </div>
  );
};
