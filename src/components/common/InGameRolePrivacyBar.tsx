import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface InGameRolePrivacyBarProps {
  roleTitle: string;
  roleEmoji?: string;
  secretWordLabel?: string;
  secretWordValue?: string;
  extraHint?: string;
  accentTheme?: 'violet' | 'rose' | 'amber';
  children?: React.ReactNode;
}

export const InGameRolePrivacyBar: React.FC<InGameRolePrivacyBarProps> = ({
  roleTitle,
  roleEmoji = '🪪',
  secretWordLabel = 'คำลับของคุณ',
  secretWordValue,
  extraHint,
  accentTheme = 'violet',
  children,
}) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const themeClasses =
    accentTheme === 'rose'
      ? {
          container: 'bg-rose-50/90 border-rose-200',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          buttonHide: 'bg-rose-600 hover:bg-rose-700 text-white',
          buttonShow:
            'bg-white hover:bg-rose-100 text-rose-900 border border-rose-300',
          wordBox: 'bg-white border-rose-300 text-rose-950',
        }
      : accentTheme === 'amber'
      ? {
          container: 'bg-amber-50/90 border-amber-200',
          badge: 'bg-amber-100 text-amber-950 border-amber-300',
          buttonHide: 'bg-amber-500 hover:bg-amber-600 text-amber-950',
          buttonShow:
            'bg-white hover:bg-amber-100 text-amber-950 border border-amber-300',
          wordBox: 'bg-white border-amber-300 text-amber-950',
        }
      : {
          container: 'bg-violet-50/90 border-violet-200',
          badge: 'bg-violet-100 text-violet-900 border-violet-300',
          buttonHide: 'bg-violet-600 hover:bg-violet-700 text-white',
          buttonShow:
            'bg-white hover:bg-violet-100 text-violet-900 border border-violet-300',
          wordBox: 'bg-white border-violet-300 text-violet-950',
        };

  return (
    <div
      className={`rounded-2xl border p-3.5 transition-all select-none ${themeClasses.container}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-white/90 border border-slate-200 flex items-center justify-center text-base shrink-0 shadow-2xs">
            {isRevealed ? roleEmoji : '🙈'}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
              <span>
                {isRevealed
                  ? `บทบาทของคุณ: ${roleTitle}`
                  : 'ซ่อนบทบาทและข้อมูลลับอยู่'}
              </span>
              {!isRevealed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 text-slate-600 border border-slate-200">
                  <ShieldAlert className="w-3 h-3 text-emerald-600" />
                  ป้องกันคนข้างๆ แอบมองจอ
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-600 truncate">
              {isRevealed
                ? extraHint || 'ดูเสร็จแล้วอย่าลืมกดซ่อนก่อนวางมือถือบนโต๊ะ'
                : 'แตะปุ่มด้านขวาเพื่อแอบดูบทบาทหรือคำลับของคุณชั่วคราว'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsRevealed((prev) => !prev)}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs ${
            isRevealed ? themeClasses.buttonHide : themeClasses.buttonShow
          }`}
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>ซ่อนบทบาททันที</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>แตะดูบทบาท/คำลับ</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-slate-200/70 space-y-2.5">
              {secretWordValue !== undefined && (
                <div
                  className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${themeClasses.wordBox}`}
                >
                  <span className="text-xs font-bold text-slate-600">
                    {secretWordLabel}:
                  </span>
                  <span className="text-sm sm:text-base font-black tracking-wide">
                    {secretWordValue}
                  </span>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
