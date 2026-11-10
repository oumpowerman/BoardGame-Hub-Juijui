import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Check,
  Sparkles,
  AlertCircle,
  Loader2,
  Smile,
} from 'lucide-react';
import { BaseModal } from '../BaseModal';
import {
  AVATAR_PRESETS,
  AvatarPreset,
  compressImageToDataUrl,
  createPresetDataUrl,
} from '../../utils/imageCompressor';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  userName: string;
  onSaveAvatar: (avatarUrl: string) => Promise<void>;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  onSaveAvatar,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatarUrl || '');
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setErrorMessage(null);

    try {
      // Compress to 128x128 JPEG ~5-9 KB
      const compressedDataUrl = await compressImageToDataUrl(file, 128, 0.78);
      setSelectedAvatar(compressedDataUrl);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถประมวลผลรูปภาพได้'
      );
    } finally {
      setIsProcessingFile(false);
      // Reset input value so same file can be re-selected if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectPreset = (preset: AvatarPreset) => {
    const bgColors: Record<string, string> = {
      'bg-amber-100': '#fef3c7',
      'bg-yellow-100': '#fef9c3',
      'bg-indigo-100': '#e0e7ff',
      'bg-sky-100': '#e0f2fe',
      'bg-orange-100': '#ffedd5',
      'bg-emerald-100': '#d1fae5',
      'bg-rose-100': '#ffe4e6',
      'bg-purple-100': '#f3e8ff',
    };
    const hex = bgColors[preset.bgColor] || '#fef3c7';
    const dataUrl = createPresetDataUrl(preset.emoji, hex);
    setSelectedAvatar(dataUrl);
    setErrorMessage(null);
  };

  const handleConfirmSave = async () => {
    if (!selectedAvatar) {
      setErrorMessage('กรุณาเลือกรูปภาพหรืออวตารก่อนกดยืนยัน');
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSaveAvatar(selectedAvatar);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกรูปโปรไฟล์'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Camera className="w-5 h-5 text-amber-950" />}
      subtitle="CUSTOM AVATAR & PHOTO · อัปโหลดรูปจริงหรือเลือกตัวละครน่ารัก"
      title="ตั้งค่ารูปโปรไฟล์ของคุณ"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Current / Selected Preview Card */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-amber-100 flex items-center justify-center">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-amber-900">
                  {userName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile || isSaving}
              className="absolute -bottom-1 -right-1 p-2 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-full shadow-sm cursor-pointer border-2 border-white transition-transform active:scale-90"
              title="เปลี่ยนรูปถ่าย"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-amber-900 font-extrabold flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>รูปตัวอย่างที่จะแสดงบนโต๊ะและใบ้บทบาท</span>
            </div>
            <div className="text-base font-black text-slate-900">
              {userName}
            </div>
            <p className="text-xs text-slate-500">
              รูปภาพจะถูกบีบอัดให้แสดงผลไว ไม่กระตุก และซิงค์ขึ้นโต๊ะเกมทันที
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile || isSaving}
            className="w-full py-3.5 px-4 bg-white hover:bg-amber-50/70 border-2 border-dashed border-amber-300 hover:border-amber-400 rounded-2xl text-xs font-bold text-amber-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            {isProcessingFile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>กำลังย่อขนาดรูปภาพของคุณ...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-amber-700" />
                <span>เลือกรูปจากมือถือหรือคอมพิวเตอร์ (กล้อง / แกลเลอรี)</span>
              </>
            )}
          </button>
        </div>

        {/* Preset Emojis & Characters */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-amber-600" />
            <span>หรือเลือกตัวการ์ตูนพาสเทลน่ารัก:</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  preset.bgColor
                } ${
                  preset.borderColor
                }`}
              >
                <span className="text-2xl">{preset.emoji}</span>
                <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Status / Error Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving || isProcessingFile || !selectedAvatar}
            className="flex-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-amber-950 font-black text-xs rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-950" />
                <span>ยืนยันใช้รูปนี้</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
