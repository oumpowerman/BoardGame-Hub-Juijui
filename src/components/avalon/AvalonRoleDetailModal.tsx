import React from 'react';
import { motion } from 'motion/react';
import { Eye, Info, Check, X } from 'lucide-react';
import { BaseModal } from '../BaseModal';
import { AVALON_ROLES_META } from '../../data/avalonRules';
import { AvalonRoleIcon } from './AvalonRoleIcon';

export interface AvalonRoleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleKey: string | null;
  isEnabled?: boolean;
  isHost?: boolean;
  quantity?: number;
  onToggleRole?: (enabled: boolean) => void;
}

const ROLE_VISION_GUIDES: Record<
  string,
  {
    sees: string;
    seenBy: string;
    tips: string;
  }
> = {
  avalon_merlin: {
    sees: 'เห็นฝ่ายปีศาจทุกคน (Assassin, Morgana, Oberon, Minions) ยกเว้น Mordred',
    seenBy: 'Percival จะเห็นคุณและ Morgana เป็นผู้ต้องสงสัย',
    tips: 'ข้อควรระวัง: อย่าชี้นำฝ่ายอัศวินอย่างโจ่งแจ้งเกินไป มิฉะนั้น Assassin จะจำตัวได้และสังหารคุณในตอนจบเกม!',
  },
  avalon_percival: {
    sees: 'เห็นผู้เล่น 2 คน (คนหนึ่งคือ Merlin ตัวจริง และอีกคนคือ Morgana ตัวปลอม)',
    seenBy: 'ไม่ถูกมองเห็นโดยใครเป็นพิเศษ',
    tips: 'หน้าที่สำคัญ: ต้องจับสังเกตว่าใครคือ Merlin ตัวจริง และคอยออกหน้าเป็นเป้าหลอกแทน Merlin เพื่อป้องกันการลอบสังหาร',
  },
  avalon_loyal_servant: {
    sees: 'ไม่เห็นใครเลยในตอนเริ่มต้น (ไม่มีพลังหยั่งรู้)',
    seenBy: 'ไม่ถูกมองเห็นโดยใครเป็นพิเศษ',
    tips: 'ต้องใช้การตั้งคำถาม จับพิรุธ และสังเกตผลการลงมติในแต่ละรอบ และต้องลงการ์ด Success เสมอเมื่อออกภารกิจ',
  },
  avalon_assassin: {
    sees: 'เห็นเพื่อนร่วมฝ่ายปีศาจทั้งหมด (Morgana, Mordred, Minions) ยกเว้น Oberon',
    seenBy: 'Merlin และเพื่อนร่วมฝ่ายปีศาจมองเห็น',
    tips: 'หากฝ่ายอัศวินทำภารกิจสำเร็จครบ 3 รอบ คุณจะได้สิทธิ์ชี้ตัวสังหาร Merlin ทันที หากทายถูกจะพลิกกลับมาชนะเกม!',
  },
  avalon_morgana: {
    sees: 'เห็นเพื่อนร่วมฝ่ายปีศาจทั้งหมด ยกเว้น Oberon',
    seenBy: 'Percival มองเห็นคุณและ Merlin เป็นผู้ต้องสงสัย',
    tips: 'จงแกล้งทำตัวเป็น Merlin ตัวจริงให้เนียน เพื่อหลอกล่อให้ Percival เชื่อใจและยอมโหวตให้คุณเข้าร่วมทีมภารกิจ',
  },
  avalon_mordred: {
    sees: 'เห็นเพื่อนร่วมฝ่ายปีศาจทั้งหมด ยกเว้น Oberon',
    seenBy: 'ซ่อนตัวจาก Merlin! (Merlin มองเห็นคุณเป็นคนบริสุทธิ์)',
    tips: 'เป็นไพ่ลับตัวอันตรายที่สุด สามารถแฝงตัวเข้าทีมทำภารกิจได้อย่างแนบเนียนเพราะ Merlin ไม่ระแวงคุณ',
  },
  avalon_oberon: {
    sees: 'ไม่เห็นปีศาจคนอื่นเลย (อยู่แบบสันโดษ)',
    seenBy: 'Merlin มองเห็นว่าเป็นปีศาจ แต่เพื่อนร่วมฝ่ายปีศาจมองไม่เห็น Oberon',
    tips: 'ต้องสังเกตการเล่นของปีศาจคนอื่นและหาจังหวะลงการ์ด Fail ทำลายภารกิจโดยที่เพื่อนร่วมทีมปีศาจอาจไม่รู้ตัวล่วงหน้า',
  },
  avalon_minion: {
    sees: 'เห็นเพื่อนร่วมฝ่ายปีศาจทั้งหมด ยกเว้น Oberon',
    seenBy: 'Merlin และเพื่อนร่วมฝ่ายปีศาจมองเห็น',
    tips: 'เป็นกำลังหลักของฝ่ายปีศาจ ช่วยโหวตคัดค้านทีมที่ดีและแฝงตัวไปลง Fail ในภารกิจ',
  },
};

export const AvalonRoleDetailModal: React.FC<AvalonRoleDetailModalProps> = ({
  isOpen,
  onClose,
  roleKey,
  isEnabled = true,
  isHost = false,
  quantity,
  onToggleRole,
}) => {
  if (!roleKey) return null;

  const roleMeta = AVALON_ROLES_META[roleKey];
  if (!roleMeta) return null;

  const isGood = roleMeta.faction === 'good';
  const guide = ROLE_VISION_GUIDES[roleKey];
  const isToggleable = roleKey !== 'avalon_loyal_servant' && roleKey !== 'avalon_minion';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={roleMeta.nameTh}
      subtitle={`ข้อมูลตัวละคร · ${roleMeta.nameEn.toUpperCase()}`}
      icon={<AvalonRoleIcon roleId={roleKey} size="sm" showBackground={false} />}
    >
      <div className="space-y-4 py-1">
        {/* Hero Card Banner */}
        <div
          className={`p-5 rounded-3xl border-2 text-center space-y-3 relative overflow-hidden shadow-xs ${
            isGood
              ? 'bg-gradient-to-b from-emerald-100 via-white to-amber-50 border-emerald-300 text-emerald-950'
              : 'bg-gradient-to-b from-rose-100 via-white to-amber-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                isGood
                  ? 'bg-emerald-200 text-emerald-900 border-emerald-400'
                  : 'bg-rose-200 text-rose-900 border-rose-400'
              }`}
            >
              {isGood ? '🛡️ ฝ่ายอัศวิน (GOOD)' : '🔥 ฝ่ายปีศาจ (EVIL)'}
            </span>

            {quantity !== undefined ? (
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-white/80 border">
                มี {quantity} ใบในสำรับ
              </span>
            ) : isToggleable ? (
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                  isEnabled
                    ? isGood
                      ? 'bg-emerald-200 text-emerald-900 border-emerald-400'
                      : 'bg-rose-200 text-rose-900 border-rose-400'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}
              >
                {isEnabled ? 'เปิดใช้งานในโต๊ะนี้ ✓' : 'ปิดใช้งาน ✕'}
              </span>
            ) : null}
          </div>

          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex items-center justify-center py-2"
          >
            <AvalonRoleIcon roleId={roleKey} size="lg" />
          </motion.div>

          <div>
            <h3 className="text-xl font-black text-slate-900">{roleMeta.nameTh}</h3>
            <p className="text-xs font-mono font-bold text-slate-500 uppercase">
              {roleMeta.nameEn}
            </p>
          </div>

          <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-white/80 p-3 rounded-2xl border border-current/20">
            {roleMeta.description}
          </p>
        </div>

        {/* Vision & Ability Guide */}
        {guide && (
          <div className="space-y-2.5">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-extrabold block">
                    สายตาและการหยั่งรู้ (Night Vision):
                  </strong>
                  <span className="text-slate-600">{guide.sees}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-slate-200">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-extrabold block">
                    การถูกมองเห็นโดยคนอื่น:
                  </strong>
                  <span className="text-slate-600">{guide.seenBy}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-1">
              <strong className="text-amber-950 font-black flex items-center gap-1.5">
                <span>💡 เทคนิคและกลยุทธ์ที่โต๊ะ:</span>
              </strong>
              <p className="text-amber-900/90 leading-relaxed">{guide.tips}</p>
            </div>
          </div>
        )}

        {/* Host In-Modal Toggle Button */}
        {isHost && isToggleable && onToggleRole && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              สถานะบทบาทนี้ในห้อง:
            </span>
            <button
              type="button"
              onClick={() => onToggleRole(!isEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isEnabled
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isEnabled ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>คลิกเพื่อปิดบทบาทนี้</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>คลิกเพื่อเปิดบทบาทนี้</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
