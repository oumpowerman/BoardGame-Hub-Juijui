import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Camera,
  Copy,
  Check,
  Share2,
  Upload,
  Sparkles,
  Smartphone,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { BaseModal } from '../BaseModal';
import {
  UserProfile,
  addInstantMutualFriendByCodeOrUid,
} from '../../firebase/userService';

interface FriendQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onFriendAddedSuccess: (friend: UserProfile) => void;
}

// Type definition for experimental Web BarcodeDetector API
interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
}

export const FriendQrScannerModal: React.FC<FriendQrScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onFriendAddedSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'my_qr' | 'scan_qr'>('my_qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [manualLinkOrCode, setManualLinkOrCode] = useState<string>('');

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getFriendInviteUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}?addFriend=${encodeURIComponent(
        currentUser.friendCode
      )}`;
    }
    return `https://tabletopnexus.app/?addFriend=${currentUser.friendCode}`;
  };

  const friendInviteUrl = getFriendInviteUrl();

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    QRCode.toDataURL(
      friendInviteUrl,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#1E293B',
          light: '#FFF1F2',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, friendInviteUrl]);

  useEffect(() => {
    if (activeTab !== 'scan_qr') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleProcessScannedValue = async (rawValue: string) => {
    if (isProcessing || !rawValue.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const addedFriend = await addInstantMutualFriendByCodeOrUid(
        currentUser,
        rawValue.trim()
      );
      stopCamera();
      setStatusMessage(
        `เพิ่ม "${addedFriend.accountName}" เป็นเพื่อนสำเร็จทันที!`
      );
      onFriendAddedSuccess(addedFriend);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเพิ่มเพื่อนจาก QR นี้ได้'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setErrorMessage(
        'เบราว์เซอร์ของคุณไม่รองรับการเปิดกล้องโดยตรง สามารถใช้แอปกล้องมือถือสแกน หรือวางลิงก์ด้านล่างแทนได้ครับ'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      // Check if BarcodeDetector is supported in browser
      const BarcodeDetectorClass = (
        window as unknown as {
          BarcodeDetector?: new (options: {
            formats: string[];
          }) => BarcodeDetectorInstance;
        }
      ).BarcodeDetector;

      if (BarcodeDetectorClass) {
        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (
            videoRef.current &&
            videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
          ) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleProcessScannedValue(barcodes[0].rawValue);
              }
            } catch {
              // Ignore frame read errors
            }
          }
        }, 500);
      }
    } catch {
      setErrorMessage(
        'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้อง หรือใช้กล้องมือถือทั่วไปสแกน QR ได้เลย'
      );
    }
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setStatusMessage(null);

    const BarcodeDetectorClass = (
      window as unknown as {
        BarcodeDetector?: new (options: {
          formats: string[];
        }) => BarcodeDetectorInstance;
      }
    ).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      setErrorMessage(
        'เบราว์เซอร์นี้ไม่รองรับการอ่าน QR จากไฟล์ภาพโดยตรง กรุณาใช้กล้องมือถือสแกน หรือกรอกรหัสเพื่อนด้านล่างแทนครับ'
      );
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      const results = await detector.detect(bitmap);
      if (results.length > 0 && results[0].rawValue) {
        await handleProcessScannedValue(results[0].rawValue);
      } else {
        setErrorMessage('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setErrorMessage('ไม่สามารถอ่าน QR Code จากรูปภาพนี้ได้');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(friendInviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `แอดเพื่อนกับ ${currentUser.accountName} บน TabletopNexus`,
          text: `แตะลิงก์นี้เพื่อแอด ${currentUser.accountName} (รหัส ${currentUser.friendCode}) เป็นเพื่อนทันที!`,
          url: friendInviteUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyInviteLink();
    }
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={<QrCode className="w-5 h-5 text-rose-950" />}
      subtitle="INSTANT QR FRIEND ADD · สแกนปุ๊บเป็นเพื่อนกันทันที"
      title="QR Code แอดเพื่อนด่วน"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('my_qr');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'my_qr'
                ? 'bg-white text-rose-950 shadow-xs border border-rose-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-rose-600" />
            <span>QR Code ของฉัน</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('scan_qr');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'scan_qr'
                ? 'bg-white text-rose-950 shadow-xs border border-rose-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>สแกน QR เพื่อน</span>
          </button>
        </div>

        {/* Status & Error Alerts */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'my_qr' ? (
          <div className="space-y-4 text-center">
            {/* Profile Info Header */}
            <div className="p-3.5 bg-gradient-to-r from-rose-50 via-amber-50 to-pink-50 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-left min-w-0">
                <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center font-black text-amber-950 text-sm shrink-0 overflow-hidden shadow-2xs">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.accountName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.accountName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900 truncate">
                    {currentUser.accountName}
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-800">
                    รหัสเพื่อน: #{currentUser.friendCode}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-white border border-rose-200 text-rose-900 text-[11px] font-extrabold rounded-xl shrink-0">
                แอดอัตโนมัติ
              </span>
            </div>

            {/* QR Canvas */}
            <div className="p-5 bg-white border-2 border-rose-200/80 rounded-3xl shadow-inner flex flex-col items-center justify-center relative">
              <div className="absolute top-3 right-3 text-rose-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Friend QR for ${currentUser.accountName}`}
                  className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-2xl border border-rose-100 p-2 bg-rose-50/30"
                />
              ) : (
                <div className="w-52 h-52 bg-slate-50 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-mono">
                  กำลังสร้าง QR Code...
                </div>
              )}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                <Smartphone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  ให้เพื่อนเปิดกล้องมือถือสแกนเพื่อเป็นเพื่อนกันทันที (ไม่ต้องรอกดรับ)
                </span>
              </div>
            </div>

            {/* One-Click Friend Link */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                หรือส่งลิงก์แอดเพื่อนด่วนให้เพื่อนกดคลิกเดียว:
              </label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={friendInviteUrl}
                  className="flex-1 bg-transparent text-xs font-mono text-slate-700 px-2 select-all focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-800" />
                      <span>คัดลอกแล้ว!</span>
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

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>แชร์ลิงก์แอดเพื่อนไปยัง LINE / แชทกลุ่ม</span>
              </button>
            )}
          </div>
        ) : (
          /* SCAN QR TAB */
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-center space-y-3">
              {isCameraActive ? (
                <div className="space-y-2.5">
                  <div className="relative w-full aspect-square max-w-[260px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-6 border-2 border-dashed border-amber-300/80 rounded-xl pointer-events-none" />
                  </div>
                  <p className="text-xs font-bold text-amber-950">
                    ส่องกล้องไปที่ QR Code ของเพื่อนเพื่อแอดอัตโนมัติ
                  </p>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>ปิดกล้อง</span>
                  </button>
                </div>
              ) : (
                <div className="py-4 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto">
                    <Camera className="w-7 h-7 text-amber-800" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-black text-slate-900">
                      สแกน QR Code จากหน้าจอมือถือเพื่อน
                    </div>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      กดเปิดกล้องสแกนด้านล่าง หรืออัปโหลดภาพแคปหน้าจอ QR Code ของเพื่อนได้เลย
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black rounded-xl shadow-2xs cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>เปิดกล้องสแกน QR</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>เลือกรูปภาพ QR</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Paste Friend Link or Code */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScannedValue(manualLinkOrCode);
              }}
              className="p-3.5 bg-white border border-rose-200 rounded-2xl space-y-2"
            >
              <label className="text-xs font-bold text-slate-800 block">
                หรือวางลิงก์ / รหัสเพื่อนเพื่อแอดทันที (ไม่ต้องรอกดรับ):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualLinkOrCode}
                  onChange={(e) => setManualLinkOrCode(e.target.value)}
                  placeholder="วางลิงก์ หรือพิมพ์รหัส CT... / ชื่อเพื่อน"
                  className="flex-1 px-3 py-2 bg-rose-50/40 border border-rose-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualLinkOrCode.trim()}
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>แอดทันที</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
