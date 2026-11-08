import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Share2, QrCode, Smartphone } from 'lucide-react';
import { BaseModal } from '../BaseModal';

interface RoomQrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomId: string;
  roomName?: string;
}

export const RoomQrShareModal: React.FC<RoomQrShareModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomId,
  roomName,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [canNativeShare, setCanNativeShare] = useState<boolean>(false);

  // Generate join URL using current origin + query params
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const joinUrl = `${origin}${pathname}?room=${roomId}&code=${roomCode}`;

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !roomCode) return;
    QRCode.toDataURL(
      joinUrl,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#1E293B',
          light: '#FFFFFF',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, roomCode, joinUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: roomName || `เข้าเล่นชีสหนูอยู่ไหน รหัส #${roomCode}`,
        text: `มาร่วมเล่นเกมชีสหนูอยู่ไหน (Cheese Thief) ด้วยกัน! รหัสห้อง #${roomCode}`,
        url: joinUrl,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="ชวนเพื่อนเข้าร่วมห้อง"
      subtitle="INVITE FRIENDS"
      icon={<QrCode className="w-5 h-5 text-amber-950" />}
      maxWidth="md"
    >
      <div className="space-y-4 text-center">
        {/* Room Code Badge */}
        <div className="p-3 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-200 border border-amber-300 rounded-2xl">
          <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">
            รหัสห้อง 4 หลักสำหรับเข้าเล่น
          </span>
          <div className="text-4xl font-mono font-black tracking-widest text-slate-950 select-all my-0.5">
            #{roomCode}
          </div>
          {roomName && (
            <p className="text-xs font-semibold text-amber-900 truncate">
              {roomName}
            </p>
          )}
        </div>

        {/* QR Code Canvas */}
        <div className="p-4 bg-white border border-amber-200/90 rounded-3xl shadow-xs inline-flex flex-col items-center justify-center mx-auto">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for room #${roomCode}`}
              className="w-56 h-56 rounded-xl object-contain shadow-2xs"
            />
          ) : (
            <div className="w-56 h-56 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400 font-mono">
              กำลังสร้าง QR Code...
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-600 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>เพื่อนเปิดกล้องมือถือสแกนเข้าห้องได้ทันที</span>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-bold text-slate-700 block">
            หรือแชร์ลิงก์ตรงให้เพื่อนแตะเพื่อเข้าเล่น
          </label>
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="flex-1 bg-transparent text-xs font-mono text-slate-700 px-2 select-all focus:outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer shrink-0 min-h-[40px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-800" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Native Mobile Share Button */}
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>แชร์ห้องไปยัง LINE / Messenger / แอปอื่น ๆ</span>
          </button>
        )}
      </div>
    </BaseModal>
  );
};
