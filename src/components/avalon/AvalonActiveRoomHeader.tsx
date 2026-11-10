import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, LogOut, Mic } from 'lucide-react';
import { FirestoreRoom } from '../../firebase/tableService';

export interface AvalonActiveRoomHeaderProps {
  currentRoom: FirestoreRoom;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTestVoice?: () => void;
  onLeaveRoom: () => Promise<void>;
  onOpenInviteModal?: () => void;
}

export const AvalonActiveRoomHeader: React.FC<AvalonActiveRoomHeaderProps> = ({
  currentRoom,
  soundEnabled,
  onToggleSound,
  onTestVoice,
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

      {/* Right: Actions (Copy code, Test GM Voice, Sound toggle, Leave room) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
          <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกรหัส'}</span>
        </button>

        {onTestVoice && (
          <button
            type="button"
            onClick={onTestVoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="ทดสอบเสียงพากย์ Game Master"
          >
            <Mic className="w-3.5 h-3.5 text-amber-600" />
            <span>ทดสอบเสียง GM</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleSound}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-xl transition-all cursor-pointer shadow-2xs ${
            soundEnabled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title={soundEnabled ? 'ปิดเสียงพากย์ GM & เอฟเฟกต์' : 'เปิดเสียงพากย์ GM & เอฟเฟกต์'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span className="hidden sm:inline">
            {soundEnabled ? 'เสียงพากย์ GM: เปิด' : 'เสียงพากย์ GM: ปิด'}
          </span>
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
