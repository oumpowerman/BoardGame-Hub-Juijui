import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Tablet, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const isOnline = useOnlineStatus();

  // If already installed and running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {/* Offline Status Toast */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white shadow-lg border border-amber-400">
          <WifiOff className="w-4 h-4 text-amber-200" />
          <span>โหมดออฟไลน์ — กำลังใช้ข้อมูลที่แคชไว้ในเครื่อง</span>
        </div>
      )}

      {/* Primary Install Trigger Button */}
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-2xs"
          title="ติดตั้งแอปบนหน้าจอโฮม (PWA)"
        >
          <Download className="w-3.5 h-3.5 text-amber-700" />
          <span>ติดตั้งแอป</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-100 to-rose-100 hover:from-amber-200 hover:to-rose-200 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          title="ติดตั้ง TabletopNexus เป็น App เต็มจอบน iPad / iPhone / Android"
        >
          <Download className="w-3.5 h-3.5 text-rose-600" />
          <span>{isIOS ? 'ติดตั้งบน iPad / iOS' : 'ติดตั้งแอปเต็มจอ'}</span>
        </button>
      )}

      {/* Guided iOS / iPadOS Safari Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Tablet className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-display">
                    ติดตั้งแอปบน iPad / iPhone
                  </h3>
                  <p className="text-xs text-slate-500">
                    เล่นบอร์ดเกมเต็มหน้าจอ ไร้แถบเบราว์เซอร์
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>แตะปุ่มแชร์ (Share) ใน Safari</span>
                    <Share className="w-4 h-4 text-blue-600 inline" />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    ที่แถบด้านบน (บน iPad) หรือแถบด้านล่าง (บน iPhone)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>เลื่อนลงแล้วแตะ "เพิ่มไปยังหน้าจอโฮม"</span>
                    <PlusSquare className="w-4 h-4 text-slate-700 inline" />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    (Add to Home Screen) ในเมนูของ Safari
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900">
                    แตะ "เพิ่ม" (Add) ที่มุมขวาบน
                  </div>
                  <div className="text-[11px] text-slate-600">
                    ระบบจะสร้างไอคอน TabletopNexus บนจอโฮมของคุณทันที
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors shadow-sm"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
