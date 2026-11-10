import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Trophy,
  RefreshCw,
  CheckCircle2,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/table/types';
import { HUES_CUES_TILE_MAP } from '../../data/huesCuesColors';

interface HuesCuesPlayerControlsProps {
  room: FirestoreRoom;
  players: FirestorePlayer[];
  myUid: string;
  isIpadMode?: boolean;
  onSelectTargetColor: (tileId: string) => void;
  onSubmitClue1: (clue1: string) => void;
  onAdvanceToClue2: () => void;
  onSubmitClue2: (clue2: string) => void;
  onCalculateScores: () => void;
  onStartNewRound: () => void;
}

export const HuesCuesPlayerControls: React.FC<HuesCuesPlayerControlsProps> = ({
  room,
  players,
  myUid,
  isIpadMode = false,
  onSelectTargetColor,
  onSubmitClue1,
  onAdvanceToClue2,
  onSubmitClue2,
  onCalculateScores,
  onStartNewRound,
}) => {
  const [clue1Input, setClue1Input] = useState('');
  const [clue2Input, setClue2Input] = useState('');
  const [isSecretRevealed, setIsSecretRevealed] = useState(false);

  const phase = room.status;
  const isClueGiver = !isIpadMode && room.hcClueGiverId === myUid;
  const isHost = room.hostId === myUid;

  const secretTile = room.hcSecretTileId
    ? HUES_CUES_TILE_MAP[room.hcSecretTileId]
    : null;
  const candidateIds = room.hcCandidateTileIds || (room.hcSecretTileId ? [room.hcSecretTileId] : []);

  const guesserPlayers = players.filter((p) => p.id !== room.hcClueGiverId);
  const guessesMap = room.hcGuesses || {};
  const placedCount = guesserPlayers.filter((p) => Boolean(guessesMap[p.id])).length;

  const handleClue1Submit = (e: React.FormEvent, isSkipped: boolean = false) => {
    e.preventDefault();
    const finalClue = isSkipped ? '🗣️ พูดคุยด้วยเสียง (ไม่พิมพ์คำใบ้)' : (clue1Input.trim() || 'คำใบ้จากเสียง');
    onSubmitClue1(finalClue);
    setClue1Input('');
    setIsSecretRevealed(false);
  };

  const handleClue2Submit = (e: React.FormEvent, isSkipped: boolean = false) => {
    e.preventDefault();
    const finalClue = isSkipped ? '🗣️ พูดคุยเพิ่มเติมด้วยเสียง' : (clue2Input.trim() || 'คำใบ้เพิ่มเติม');
    onSubmitClue2(finalClue);
    setClue2Input('');
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-xl border border-amber-200/90 space-y-4">
      {/* Phase & Active Clue Banner */}
      <div className="pb-3 border-b border-amber-100 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-semibold">
          <span>รอบที่ {room.hcRoundNumber || 1}</span>
          <span>·</span>
          <span>
            ผู้ให้คำใบ้:{' '}
            <strong className="text-amber-900">{room.hcClueGiverName || 'โฮสต์'}</strong>
          </span>
        </div>

        <div className="text-sm sm:text-base font-extrabold text-slate-900 font-display">
          {phase === 'hc_clue_1' &&
            (isClueGiver
              ? 'การ์ดสีลับของคุณ: มองกระดานไอแพดกลาง เลือกสี & ตั้งคำใบ้'
              : `รอ "${room.hcClueGiverName}" เลือกสีลับและให้คำใบ้...`)}
          {phase === 'hc_guess_1' && 'รอบทายสีครั้งที่ 1: เลือกช่องสีตามคำใบ้เพื่อน!'}
          {phase === 'hc_clue_2' &&
            (isClueGiver
              ? 'ให้คำใบ้เพิ่มเติมรอบที่ 2 (หรือพูดคุยด้วยเสียง)'
              : `รอ "${room.hcClueGiverName}" ให้คำใบ้เพิ่มเติมรอบที่ 2...`)}
          {phase === 'hc_guess_2' && 'รอบทายสีครั้งที่ 2: ปรับตำแหน่งหมากบนกระดาน!'}
          {phase === 'hc_scoring' && 'เฉลยสีเป้าหมาย & สรุปคะแนนรอบนี้'}
        </div>

        {/* Active Clue Display Box */}
        {(room.hcClue1 || room.hcClue2) && (
          <div className="p-3 bg-gradient-to-r from-amber-50 via-pink-50 to-rose-50 border border-amber-200 rounded-2xl space-y-1.5">
            {room.hcClue1 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  คำใบ้ที่ 1:
                </span>
                <span className="text-sm font-black text-slate-900">
                  “{room.hcClue1}”
                </span>
              </div>
            )}
            {room.hcClue2 && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                <span className="text-[11px] font-bold text-pink-700">
                  คำใบ้ที่ 2:
                </span>
                <span className="text-sm font-black text-pink-900">
                  “{room.hcClue2}”
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CLUE GIVER SECRET CARD & INPUT (Hidden/Spoiler Toggle so neighbors don't peek & players look at iPad) */}
      {isClueGiver && !isIpadMode && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-700" />
              <span>การ์ดสีเป้าหมายลับ (มองกระดาน iPad เป็นหลัก)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsSecretRevealed(!isSecretRevealed)}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
            >
              {isSecretRevealed ? 'ซ่อนการ์ดสีลับ' : '🔓 แตะเพื่อเปิดดูสี'}
            </button>
          </div>

          {isSecretRevealed ? (
            <div className="space-y-3 animate-fadeIn">
              {secretTile && (
                <div className="p-2 bg-white border border-amber-300 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">สีเป้าหมายปัจจุบัน:</span>
                  <span className="font-mono text-xs font-black px-2 py-0.5 bg-amber-100 rounded-lg text-amber-950">
                    พิกัด {secretTile.id}
                  </span>
                </div>
              )}

              {/* 4 Candidate Color Swatches */}
              <div className="grid grid-cols-4 gap-2">
                {candidateIds.map((cid) => {
                  const t = HUES_CUES_TILE_MAP[cid];
                  if (!t) return null;
                  const isSelected = room.hcSecretTileId === cid;
                  return (
                    <button
                      key={cid}
                      type="button"
                      disabled={phase !== 'hc_clue_1'}
                      onClick={() => onSelectTargetColor(cid)}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                          : 'bg-white text-slate-700 border-amber-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div
                        className="w-full aspect-square rounded-lg border border-white shadow-2xs mb-1"
                        style={{ backgroundColor: t.hex }}
                      />
                      <span className="text-[11px] font-mono font-black block">
                        {t.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsSecretRevealed(true)}
              className="p-4 bg-amber-100/70 border-2 border-dashed border-amber-300 rounded-2xl text-center cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <p className="text-xs font-bold text-amber-900">
                🔒 ซ่อนสีเป้าหมายไว้เพื่อความตื่นเต้น
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                แตะตรงนี้หากต้องการตรวจสอบสีลับของคุณ (ดูที่กระดานกลางร่วมกัน)
              </p>
            </div>
          )}

          {/* Phase hc_clue_1 Form (Optional text or Quick Voice Skip) */}
          {phase === 'hc_clue_1' && (
            <form onSubmit={handleClue1Submit} className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                พิมพ์คำใบ้ (หรือกดข้ามหากพูดคุยกันด้วยเสียงในห้อง):
              </label>
              <input
                type="text"
                value={clue1Input}
                onChange={(e) => setClue1Input(e.target.value)}
                placeholder="พิมพ์คำใบ้ หรือเว้นว่างไว้..."
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ส่งคำใบ้</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleClue1Submit(e as any, true)}
                  className="px-3 py-2.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  🗣️ ข้าม (ใช้เสียงพูด)
                </button>
              </div>
            </form>
          )}

          {/* Phase hc_clue_2 Form */}
          {phase === 'hc_clue_2' && (
            <form onSubmit={handleClue2Submit} className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                คำใบ้เพิ่มเติมรอบที่ 2 (หรือใช้เสียงพูดคุย):
              </label>
              <input
                type="text"
                value={clue2Input}
                onChange={(e) => setClue2Input(e.target.value)}
                placeholder="พิมพ์คำใบ้เพิ่มเติม หรือเว้นว่าง..."
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>ส่งคำใบ้รอบ 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleClue2Submit(e as any, true)}
                    className="px-3 py-2.5 bg-white hover:bg-pink-50 text-pink-900 border border-pink-300 font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    🗣️ ข้าม (ใช้เสียง)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onCalculateScores}
                  className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  ข้ามไปเปิดเผยเฉลยเลย
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Progression Controls During Guessing & Scoring */}
      {(phase === 'hc_guess_1' || phase === 'hc_guess_2' || phase === 'hc_scoring') && (
        <div className="space-y-2.5">
          {phase !== 'hc_scoring' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                ผู้เล่นวางหมากแล้ว:
              </span>
              <span className="font-mono font-black text-emerald-700">
                {placedCount} / {guesserPlayers.length} คน
              </span>
            </div>
          )}

          {phase === 'hc_guess_1' && (isClueGiver || isHost || isIpadMode) && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onAdvanceToClue2}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span>ไปตั้งคำใบ้ที่ 2 (2 คำ)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onCalculateScores}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>เปิดเผยกรอบคะแนน 3×3 ทันที</span>
              </button>
            </div>
          )}

          {phase === 'hc_guess_2' && (isClueGiver || isHost || isIpadMode) && (
            <button
              type="button"
              onClick={onCalculateScores}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>เปิดเผยกรอบคะแนน 3×3 & สรุปแต้ม</span>
            </button>
          )}

          {phase === 'hc_scoring' && (isHost || isClueGiver || isIpadMode) && (
            <button
              type="button"
              onClick={onStartNewRound}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>เริ่มรอบถัดไป (ผลัดเปลี่ยนผู้ให้คำใบ้)</span>
            </button>
          )}
        </div>
      )}

      {/* Live Player Placements & Scoreboard */}
      <div className="space-y-2 pt-2 border-t border-amber-100">
        <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
          <span>ตารางคะแนนและพิกัดหมากสด</span>
          <span className="text-[11px] font-mono text-slate-500">Real-Time Sync</span>
        </div>

        <div className="space-y-1.5">
          {players.map((p) => {
            const totalScore = room.hcScores?.[p.id] || 0;
            const roundPts = room.hcRoundScores?.[p.id] || 0;
            const isGiver = p.id === room.hcClueGiverId;
            const guess = guessesMap[p.id];
            const guessedTile = guess ? HUES_CUES_TILE_MAP[guess.tileId] : undefined;

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                  isGiver
                    ? 'bg-amber-50/90 border-amber-300'
                    : 'bg-slate-50/90 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border border-white shadow-2xs"
                    style={{
                      backgroundColor: guessedTile ? guessedTile.hex : '#FDE68A',
                      color: guessedTile ? '#fff' : '#451A03',
                    }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                      <span>{p.name}</span>
                      {isGiver && (
                        <span className="text-[10px] font-bold text-amber-800">
                          · ผู้ใบ้สี
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                      {isGiver ? (
                        <span>รอรับโบนัสตามคนทายถูก</span>
                      ) : guess ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          เลือกช่อง {guess.tileId}
                        </span>
                      ) : (
                        <span>กำลังเลือกสี...</span>
                      )}
                      {phase === 'hc_scoring' && (
                        <span className="text-rose-700 font-bold">
                          (+{roundPts} แต้ม)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="font-mono tabular-nums font-extrabold text-xs sm:text-sm text-amber-950 bg-amber-200/90 px-2.5 py-1 rounded-lg shrink-0">
                  {totalScore} pt
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
