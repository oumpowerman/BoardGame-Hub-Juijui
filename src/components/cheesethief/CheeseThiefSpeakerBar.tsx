import React from 'react';
import { Radio, Volume2, VolumeX } from 'lucide-react';

export interface CheeseThiefSpeakerBarProps {
  isHost: boolean;
  isHostVoiceEnabled: boolean;
  hostName: string;
  onTestVoice: () => void;
  onToggleVoice: () => void;
}

export const CheeseThiefSpeakerBar: React.FC<CheeseThiefSpeakerBarProps> = ({
  isHost,
  isHostVoiceEnabled,
  hostName,
  onTestVoice,
  onToggleVoice,
}) => {
  return (
    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-2 rounded-xl bg-amber-400 text-amber-950 font-bold shrink-0">
          <Radio
            className={`w-3.5 h-3.5 ${
              isHostVoiceEnabled ? 'animate-pulse text-amber-950' : 'text-slate-500'
            }`}
          />
        </span>
        <div className="min-w-0">
          <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
            <span>ลำโพง Game Master ประจำโต๊ะ:</span>
            <span
              className={
                isHostVoiceEnabled
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 font-bold'
              }
            >
              {isHostVoiceEnabled
                ? 'เปิดเสียงพากย์ไทย (เครื่องโฮสต์)'
                : 'ปิดเสียงพากย์ (Mute)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {isHost
              ? 'คุณคือโฮสต์ · วางเครื่องนี้ไว้กลางโต๊ะเพื่อส่งเสียงนำเล่น "ลืมตา - หลับตา" ให้ทุกคนได้ยิน'
              : `เสียง Game Master จะเปล่งออกจากเครื่องของ ${hostName} (โฮสต์) เป็นลำโพงกลาง`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isHost ? (
          <>
            <button
              type="button"
              onClick={onTestVoice}
              className="px-2.5 py-1.5 bg-white hover:bg-amber-100/60 text-amber-950 border border-amber-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              🔊 ทดสอบเสียงพากย์
            </button>
            <button
              type="button"
              onClick={onToggleVoice}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                isHostVoiceEnabled
                  ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-2xs'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {isHostVoiceEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>{isHostVoiceEnabled ? 'เสียง: เปิด' : 'เสียง: ปิด'}</span>
            </button>
          </>
        ) : (
          <span className="text-[11px] font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
            ฟังเสียงจากเครื่องโฮสต์
          </span>
        )}
      </div>
    </div>
  );
};
