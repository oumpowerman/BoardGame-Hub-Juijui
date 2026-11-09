import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { RoomInviteDoc } from '../../firebase/userService';

export interface AvalonInvitesBannerProps {
  invites: RoomInviteDoc[];
  onAcceptInvite: (invite: RoomInviteDoc) => void;
}

export const AvalonInvitesBanner: React.FC<AvalonInvitesBannerProps> = ({
  invites,
  onAcceptInvite,
}) => {
  if (invites.length === 0) return null;

  return (
    <div className="space-y-2">
      {invites.map((inv) => (
        <div
          key={inv.id}
          className="p-3.5 bg-emerald-100/90 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-950 font-medium shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">
              <strong>{inv.fromName}</strong> ชวนคุณเข้าโต๊ะ Avalon{' '}
              <strong className="font-mono font-black text-emerald-900">
                #{inv.roomCode}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAcceptInvite(inv)}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>เข้าโต๊ะทันที</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
