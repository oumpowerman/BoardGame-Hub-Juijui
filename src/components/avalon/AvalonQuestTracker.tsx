import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Shield, AlertTriangle } from 'lucide-react';
import { FirestoreRoom, AvalonQuestResult } from '../../firebase/tableService';
import { AVALON_QUEST_MATRIX } from '../../data/avalonRules';

export interface AvalonQuestTrackerProps {
  currentRoom: FirestoreRoom;
  totalPlayers: number;
  onOpenQuestReveal: (result: AvalonQuestResult, questIndex: number) => void;
}

export const AvalonQuestTracker: React.FC<AvalonQuestTrackerProps> = ({
  currentRoom,
  totalPlayers,
  onOpenQuestReveal,
}) => {
  const safePlayerCount = Math.min(10, Math.max(5, totalPlayers));
  const matrix = AVALON_QUEST_MATRIX[safePlayerCount] || AVALON_QUEST_MATRIX[5];
  const questIndex = currentRoom.avalonCurrentQuestIndex || 0;
  const rejectedCount = currentRoom.avalonRejectedTeamsCount || 0;

  return (
    <div className="p-4 bg-white/95 backdrop-blur-xs border border-emerald-200 rounded-3xl space-y-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-700" />
          <span className="font-extrabold">ความก้าวหน้าภารกิจ 5 รอบ (QUEST PROGRESS)</span>
        </div>

        {/* Rejected Teams Danger Meter */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
          <span className="text-slate-500">ปฏิเสธทีมสะสม:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((step) => {
              const isFilled = step <= rejectedCount;
              const isDanger = step >= 4;

              return (
                <motion.span
                  key={step}
                  animate={isFilled && isDanger ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className={`w-3 h-3 rounded-full border transition-all ${
                    isFilled
                      ? isDanger
                        ? 'bg-rose-500 border-rose-600 shadow-rose-300 shadow-xs'
                        : 'bg-amber-400 border-amber-500'
                      : 'bg-slate-100 border-slate-300'
                  }`}
                  title={`ปฏิเสธทีมครั้งที่ ${step}${step === 5 ? ' (ครั้งที่ 5 ปีศาจชนะทันที)' : ''}`}
                />
              );
            })}
          </div>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded font-black ${
              rejectedCount >= 4
                ? 'bg-rose-100 text-rose-800'
                : rejectedCount > 0
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-500'
            }`}
          >
            {rejectedCount}/5
          </span>
        </div>
      </div>

      {/* 5 Quest Circles Grid */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono font-bold">
        {matrix.quests.map((q, idx) => {
          const result = currentRoom.avalonQuestResults?.find((r) => r.questIndex === idx);
          const isCurrent = questIndex === idx && currentRoom.status !== 'avalon_scoring';

          return (
            <motion.button
              key={idx}
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (result) {
                  onOpenQuestReveal(result, idx);
                }
              }}
              className={`p-2.5 rounded-2xl border transition-all text-left flex flex-col justify-between relative overflow-hidden select-none ${
                result
                  ? result.passed
                    ? 'bg-gradient-to-b from-emerald-100 to-emerald-50 border-emerald-400 text-emerald-950 shadow-xs cursor-pointer'
                    : 'bg-gradient-to-b from-rose-100 to-rose-50 border-rose-400 text-rose-950 shadow-xs cursor-pointer'
                  : isCurrent
                  ? 'bg-gradient-to-b from-amber-100 to-white border-amber-400 text-amber-950 ring-2 ring-amber-300/80 shadow-sm cursor-default'
                  : 'bg-slate-50/70 border-slate-200 text-slate-500 cursor-default'
              }`}
            >
              {/* Active Pulse indicator */}
              {isCurrent && (
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-amber-200/20 pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                <span>รอบ {idx + 1}</span>
                {result && <Sparkles className="w-2.5 h-2.5 opacity-60" />}
              </div>

              <div className="text-xs sm:text-sm font-black my-0.5 truncate">
                {result ? (result.passed ? '✓ PASSED' : '✕ FAILED') : `${q.teamSize} คน`}
              </div>

              <div className="flex items-center justify-between text-[10px] opacity-80">
                <span>{q.requiredFails > 1 ? `(${q.requiredFails} Fails)` : '1 Fail'}</span>
                {result && (
                  <span className="text-[9px] underline font-sans text-slate-600">
                    ดูไพ่ 🎴
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
