import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { BaseModal } from '../BaseModal';
import { Share2, Copy, Check, QrCode, Smartphone, Sparkles, Send } from 'lucide-react';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomCode: string;
  roomName?: string;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomCode,
  roomName,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [localQrDataUrl, setLocalQrDataUrl] = useState<string>('');

  const getJoinUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      return `${origin}/?room=${encodeURIComponent(roomId)}&code=${encodeURIComponent(roomCode)}`;
    }
    return `https://tabletopnexus.app/?room=${roomId}&code=${roomCode}`;
  };

  const joinUrl = getJoinUrl();

  useEffect(() => {
    if (!isOpen || !roomId) return;
    QRCode.toDataURL(
      joinUrl,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#1E293B',
          light: '#FFFBEB',
        },
      },
      (err, url) => {
        if (!err && url) {
          setLocalQrDataUrl(url);
        }
      }
    );
  }, [isOpen, roomId, joinUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ชีสหนูอยู่ไหน — เข้าร่วมเล่นกับฉัน',
          text: `เข้ามาร่วมเล่นบอร์ดเกม "ชีสหนูอยู่ไหน" ที่โต๊ะ [${roomName || roomCode}] รหัสห้อง: ${roomCode}`,
          url: joinUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="ชวนเพื่อนเข้าโต๊ะเกม"
      subtitle="INVITE FRIENDS & QR CODE"
      icon={<QrCode className="w-5 h-5 text-amber-950" />}
      maxWidth="md"
    >
      <div className="space-y-4 text-center">
        {/* Room Header Info */}
        <div className="bg-amber-100/70 border border-amber-300/80 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              รหัสห้อง 4 หลัก
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-widest font-mono">
              {roomCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl transition-all shadow-xs min-h-[44px] cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-emerald-800" />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกรหัส</span>
              </>
            )}
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-white border-2 border-amber-200/90 rounded-3xl p-5 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-2 right-2 text-amber-500">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="w-48 h-48 sm:w-56 sm:h-56 bg-amber-50/60 rounded-2xl flex items-center justify-center p-2 border border-amber-100">
            {localQrDataUrl ? (
              <img
                src={localQrDataUrl}
                alt={`QR Code to join room ${roomCode}`}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-xs font-mono text-amber-900/60 animate-pulse">
                กำลังสร้าง QR Code...
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600">
            <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
            <span>เพื่อนใช้กล้องมือถือสแกนเพื่อเข้าโต๊ะได้ทันที</span>
          </div>
        </div>

        {/* Direct Link Share & Native Share */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-bold text-slate-700 block">
            หรือแชร์ลิงก์เข้าห้องโดยตรง:
          </label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="flex-1 bg-transparent text-xs font-mono text-slate-700 px-2 outline-none select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 min-h-[44px] cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-800" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-md min-h-[48px] transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ส่งคำเชิญ (LINE / Messenger)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl min-h-[48px] transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
