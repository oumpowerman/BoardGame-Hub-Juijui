import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Trophy,
  Crown,
  Medal,
  RotateCcw,
  Play,
  X,
  Sparkles,
  LogOut,
  Award,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';

export interface CheeseThiefScoreModalProps {
  isOpen: boolean;
  room: FirestoreRoom;
  players: FirestorePlayer[];
  currentUid: string;
  isLoading?: boolean;
  onClose: () => void;
  onPlayNextRound: () => void;
  onResetScores: () => void;
  onEndAndCloseTable: () => void;
}

export const CheeseThiefScoreModal: React.FC<CheeseThiefScoreModalProps> = ({
  isOpen,
  room,
  players,
  currentUid,
  isLoading = false,
  onClose,
  onPlayNextRound,
  onResetScores,
  onEndAndCloseTable,
}) => {
  const isHost = room.hostId === currentUid;
  const roundNumber = room.ctRoundNumber || 1;
  const scoresMap = room.ctScores || {};
  const roundScoresMap = room.ctRoundScores || {};
  const winsMap = room.ctWinsCount || {};
  const thiefMap = room.ctThiefCount || {};

  // Build sorted leaderboard of seated players
  const rankedPlayers = [...players]
    .map((p) => ({
      player: p,
      totalScore: scoresMap[p.id] || 0,
      lastRoundDelta: roundScoresMap[p.id] || 0,
      winsCount: winsMap[p.id] || 0,
      thiefCount: thiefMap[p.id] || 0,
    }))
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.winsCount !== a.winsCount) return b.winsCount - a.winsCount;
      return a.player.name.localeCompare(b.player.name);
    });

  const topThree = rankedPlayers.slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-2xl bg-[#FDFBF7] border-2 border-amber-300 rounded-3xl shadow-2xl overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 border-b border-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-950 text-amber-300 flex items-center justify-center shadow-sm shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-mono font-extrabold text-amber-950/80 uppercase tracking-wider">
                    TABLE SCOREBOARD · โต๊ะ #{room.roomCode} · เล่นแล้ว {roundNumber} รอบ
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-amber-950">
                    สรุปคะแนนสะสมประจำโต๊ะหนูขโมยชีส
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-amber-950/10 hover:bg-amber-950/20 text-amber-950 transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Top 3 Podium Showcase */}
              {topThree.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topThree.map((entry, idx) => {
                    const isFirst = idx === 0;
                    const isSecond = idx === 1;
                    return (
                      <div
                        key={entry.player.id}
                        className={`p-4 rounded-2xl border text-center relative flex flex-col items-center justify-between gap-2 ${
                          isFirst
                            ? 'bg-gradient-to-b from-amber-100 via-yellow-50 to-white border-amber-400 ring-2 ring-amber-300/70 shadow-md'
                            : isSecond
                            ? 'bg-gradient-to-b from-slate-100 to-white border-slate-300 shadow-xs'
                            : 'bg-gradient-to-b from-orange-50/80 to-white border-orange-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-xs font-black">
                          {isFirst ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950">
                              <Crown className="w-3.5 h-3.5" /> อันดับ 1 แชมป์โต๊ะ
                            </span>
                          ) : isSecond ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                              <Medal className="w-3.5 h-3.5" /> อันดับ 2
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-200/80 text-orange-950">
                              <Award className="w-3.5 h-3.5" /> อันดับ 3
                            </span>
                          )}
                        </div>

                        <div className="relative mt-1">
                          {entry.player.avatarUrl ? (
                            <img
                              src={entry.player.avatarUrl}
                              alt={entry.player.name}
                              referrerPolicy="no-referrer"
                              className={`w-14 h-14 rounded-full object-cover border-2 ${
                                isFirst ? 'border-amber-400' : 'border-slate-300'
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-base border-2 ${
                                isFirst
                                  ? 'bg-amber-200 border-amber-400 text-amber-950'
                                  : 'bg-slate-100 border-slate-300 text-slate-700'
                              }`}
                            >
                              {entry.player.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 w-full">
                          <div className="font-extrabold text-sm text-slate-900 truncate">
                            {entry.player.name}
                            {entry.player.id === currentUid ? ' (คุณ)' : ''}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ชนะ {entry.winsCount} รอบ · เป็นโจร {entry.thiefCount} ตา
                          </div>
                        </div>

                        <div className="pt-1 flex items-baseline gap-1.5">
                          <span className="text-2xl font-mono font-black tabular-nums text-amber-950">
                            {entry.totalScore}
                          </span>
                          <span className="text-xs font-bold text-amber-800">
                            แต้ม
                          </span>
                          {entry.lastRoundDelta > 0 && (
                            <span className="text-[11px] font-mono font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                              +{entry.lastRoundDelta}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full Player Standings List */}
              <div className="bg-white border border-amber-200/90 rounded-2xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-amber-50/90 border-b border-amber-200/80 flex items-center justify-between text-xs font-extrabold text-amber-950">
                  <span>ตารางคะแนนผู้เล่นทั้งหมดในโต๊ะ ({rankedPlayers.length} คน)</span>
                  <span className="font-mono">คะแนนสะสมรวม</span>
                </div>

                <div className="divide-y divide-amber-100">
                  {rankedPlayers.map((entry, idx) => (
                    <div
                      key={entry.player.id}
                      className={`px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm ${
                        entry.player.id === currentUid
                          ? 'bg-amber-50/60'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : idx === 2
                              ? 'bg-orange-200 text-orange-950'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        {entry.player.avatarUrl ? (
                          <img
                            src={entry.player.avatarUrl}
                            alt={entry.player.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-amber-300 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-xs shrink-0">
                            {entry.player.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span className="truncate">
                              {entry.player.name}
                              {entry.player.id === currentUid && ' (คุณ)'}
                            </span>
                            {entry.player.isHost && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-950 rounded-md font-bold shrink-0">
                                โฮสต์
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ชนะ {entry.winsCount} รอบ · เป็นจอมโจร {entry.thiefCount} ครั้ง
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {entry.lastRoundDelta > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-xs font-extrabold">
                            +{entry.lastRoundDelta} รอบล่าสุด
                          </span>
                        )}
                        <div className="text-right min-w-[64px]">
                          <span className="text-lg font-mono font-black tabular-nums text-slate-900">
                            {entry.totalScore}
                          </span>{' '}
                          <span className="text-xs font-bold text-slate-500">
                            แต้ม
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring Rules Reference Box */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-slate-700 space-y-1.5">
                <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>เกณฑ์การคำนวณคะแนนสะสมแต่ละรอบ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-0.5">
                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-900 block">
                      🧀 จอมโจรหนีรอดสำเร็จ
                    </span>
                    <span>จอมโจรชีส +2 แต้ม · ลูกน้อง +1 แต้ม</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <span className="font-bold text-emerald-900 block">
                      🐭 หนูขี้เซาจับโจรได้
                    </span>
                    <span>หนูขี้เซา +1 แต้ม · โบนัสชี้โจรแม่น +1 แต้ม</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <span className="font-bold text-rose-900 block">
                      🃏 Fall Mouse ถูกโหวตสูงสุด
                    </span>
                    <span>Fall Mouse ชนะเดี่ยวรับทันที +3 แต้ม</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {isHost && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={onResetScores}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>รีเซ็ตคะแนนเริ่มนับใหม่</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={onEndAndCloseTable}
                    className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isHost ? 'จบเกมและยุบโต๊ะนี้' : 'ออกจากโต๊ะ'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    ดูโต๊ะต่อ
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      onClose();
                      onPlayNextRound();
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs sm:text-sm font-black shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>เล่นรอบต่อไป (สะสมแต้มต่อ)</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
