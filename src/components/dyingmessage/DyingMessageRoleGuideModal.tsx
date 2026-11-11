import React from 'react';
import { Tablet, Smartphone, Sparkles, ShieldAlert, Eye } from 'lucide-react';
import { BaseModal } from '../BaseModal';
import { DYING_MESSAGE_ROLES } from '../../data/dyingMessageCards';

interface DyingMessageRoleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DyingMessageRoleGuideModal: React.FC<
  DyingMessageRoleGuideModalProps
> = ({ isOpen, onClose }) => {
  const rolesList = Object.values(DYING_MESSAGE_ROLES);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="คู่มือกติกา & บทบาทพิเศษ — เบาะแสมรณะ (Dying Message)"
      subtitle="HEADS-UP TABLETOP EDITION · WISE BOX INSPIRED"
      icon="🔎"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-slate-700">
        {/* Highlight: Heads-Up iPad Tabletop Philosophy */}
        <div className="p-4 rounded-2xl bg-sky-50/90 border border-sky-200 space-y-2">
          <div className="flex items-center gap-2 text-sky-950 font-extrabold text-sm">
            <Tablet className="w-4 h-4 text-sky-600 shrink-0" />
            <span>โหมดเชื่อมจอ iPad กระดานกลาง (Heads-Up Tabletop Mode)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            เมื่อเชื่อมต่อจอ <strong>iPad กระดานกลาง</strong> แล้ว ข้อมูลกองกลางทั้งหมด
            (การ์ดเบาะแสทั้ง 3 ใบ, รายชื่อผู้ต้องสงสัย, และเวลานับถอยหลัง)
            จะแสดงผลบนจอ iPad เท่านั้น <strong>โดยไม่แสดงซ้ำในมือถือ</strong>{' '}
            เพื่อให้ทุกคนวางมือถือลง เงยหน้าสังเกตเสื้อผ้า ท่าทาง
            และพูดคุยจับพิรุธกันในชีวิตจริง!
          </p>
        </div>

        {/* How to Link Clues to Real People & Avatars */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>เทคนิคการเลือกการ์ดเบาะแสมรณะของผู้ตาย</span>
          </div>
          <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1">
            <li>
              <strong>ผู้ตาย (Victim)</strong> จะเห็นชื่อและอวตารของฆาตกรตอนกลางคืน
              แล้วเลือก <strong>การ์ดเบาะแสจริง 1 ใบ</strong> ที่ตรงกับตัวจริงของคนนั้น
              (เช่น ใส่แว่น, เสื้อสีเข้ม, มีแก้วน้ำวางข้างตัว, ชอบยิ้ม) หรือตรงกับสีอวตารในห้อง
            </li>
            <li>
              <strong>ฆาตกร (Killer)</strong> จะแอบเลือก{' '}
              <strong>การ์ดเบาะแสปลอม 2 ใบ</strong> ที่ชี้เป้าไปหาเพื่อนคนอื่นในวง
              แล้วระบบจะสับรวมกันเป็น 3 ใบบนจอ iPad!
            </li>
          </ul>
        </div>

        {/* All 5 Roles Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>รายละเอียดบทบาททั้ง 5 ในเกม</span>
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {rolesList.map((role) => (
              <div
                key={role.id}
                className={`p-3.5 rounded-2xl border ${role.badgeBg} ${role.badgeBorder} flex flex-col gap-1.5`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{role.emoji}</span>
                    <span className={`text-sm font-extrabold ${role.badgeText}`}>
                      {role.nameTh}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                      role.faction === 'evil'
                        ? 'bg-rose-200/80 border-rose-300 text-rose-950'
                        : 'bg-emerald-200/80 border-emerald-300 text-emerald-950'
                    }`}
                  >
                    {role.faction === 'evil' ? 'ฝ่ายฆาตกร' : 'ฝ่ายชาวบ้าน & สายสืบ'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {role.shortAbility}
                </p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                  <Smartphone className="w-3 h-3 shrink-0" />
                  <span>วิธีเล่น: {role.dayInstruction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-extrabold cursor-pointer transition-colors"
          >
            เข้าใจกติกาแล้ว · ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
