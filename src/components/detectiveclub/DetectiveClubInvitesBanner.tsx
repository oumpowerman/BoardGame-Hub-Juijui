import React from 'react';
import { Bell, X } from 'lucide-react';
import { RoomInviteDoc } from '../../firebase/userService';

export interface DetectiveClubInvitesBannerProps {
  roomInvites: RoomInviteDoc[];
  onAcceptInvite: (invite: RoomInviteDoc) => void;
  onDismissInvite: (id: string) => void;
}

export const DetectiveClubInvitesBanner: React.FC<DetectiveClubInvitesBannerProps> = ({
  roomInvites,
  onAcceptInvite,
  onDismissInvite,
}) => {
  if (roomInvites.length === 0) return null;

  return (
    <div className="p-4 bg-gradient-to-r from-amber-50 via-stone-50 to-emerald-50 border border-amber-300 rounded-2xl space-y-2.5 shadow-xs">
      <div className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-600" />
        <span>คำเชิญเข้าโต๊ะเกมจากเพื่อนของคุณ ({roomInvites.length})</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {roomInvites.map((inv) => (
          <div
            key={inv.id}
            className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-4 shadow-2xs"
          >
            <div className="text-xs">
              <strong className="text-slate-900">{inv.fromName}</strong> ชวนคุณเข้าห้อง{' '}
              <span className="font-mono font-bold text-amber-900">
                #{inv.roomCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onAcceptInvite(inv)}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                เข้าร่วมห้องทันที
              </button>
              <button
                type="button"
                onClick={() => onDismissInvite(inv.id)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                title="ปิดการแจ้งเตือน"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
