import React from 'react';
import { AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';
import { BaseModal } from '../BaseModal';

export interface DisbandRoomConfirmModalProps {
  isOpen: boolean;
  roomCode: string;
  gameTitle?: string;
  isLoading?: boolean;
  onConfirmDisband: () => void;
  onClose: () => void;
}

export const DisbandRoomConfirmModal: React.FC<DisbandRoomConfirmModalProps> = ({
  isOpen,
  roomCode,
  gameTitle = 'บอร์ดเกม',
  isLoading = false,
  onConfirmDisband,
  onClose,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      showGrabHandle={true}
      showCloseButton={!isLoading}
      icon={<AlertTriangle className="w-5 h-5 text-amber-900" />}
      title={`ยุบห้อง #${roomCode} หรือไม่?`}
      subtitle="แจ้งเตือนโฮสต์ผู้เปิดโต๊ะ"
    >
      <div className="space-y-4 py-1">
        <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2 text-xs text-slate-700 leading-relaxed">
          <p className="font-extrabold text-amber-950 text-sm">
            คุณเป็นโฮสต์ของโต๊ะ {gameTitle} (รหัส #{roomCode})
          </p>
          <p>
            หากคุณออกจากโต๊ะในขณะนี้ ระบบจะทำการ{' '}
            <strong className="text-rose-700">ยุบและลบห้องออกจากระบบทันที</strong>{' '}
            เพื่อป้องกันไม่ให้มีห้องร้างค้างอยู่ในระบบ
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirmDisband}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isLoading ? 'กำลังยุบห้อง...' : 'ยุบห้องและกลับสู่คลัง'}</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            <span>อยู่ในห้องต่อ</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
