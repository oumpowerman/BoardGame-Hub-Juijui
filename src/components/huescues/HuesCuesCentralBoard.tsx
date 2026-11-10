import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Tablet,
  Smartphone,
  Target,
  Move,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  HUES_CUES_BOARD_TILES,
  HUES_CUES_TILE_MAP,
  COL_LETTERS,
  COLS_COUNT,
  ROWS_COUNT,
  calculateTileDistance,
} from '../../data/huesCuesColors';
import { FirestorePlayer, HuesCuesGuessEntry } from '../../firebase/table/types';

interface HuesCuesCentralBoardProps {
  onSelectTile: (
    tileId: string,
    targetPlayerUid?: string,
    source?: 'phone' | 'ipad'
  ) => void;
  guesses: Record<string, HuesCuesGuessEntry>;
  players: FirestorePlayer[];
  clueGiverId?: string;
  myUid: string;
  mySelectedTileId?: string;
  secretTileId?: string;
  showSecret: boolean;
  isClueGiver: boolean;
  isIpadMode?: boolean;
  canInteract: boolean;
}

export const HuesCuesCentralBoard: React.FC<HuesCuesCentralBoardProps> = ({
  onSelectTile,
  guesses,
  players,
  clueGiverId,
  myUid,
  mySelectedTileId,
  secretTileId,
  showSecret,
  isClueGiver,
  isIpadMode = false,
  canInteract,
}) => {
  // On iPad Central Board, allow selecting which player's token to move by tapping or dragging
  const guesserPlayers = players.filter((p) => p.id !== clueGiverId);
  const [activeIpadPlayerId, setActiveIpadPlayerId] = useState<string>('');
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);

  const effectiveIpadPlayerId =
    activeIpadPlayerId && guesserPlayers.some((p) => p.id === activeIpadPlayerId)
      ? activeIpadPlayerId
      : guesserPlayers[0]?.id || myUid;

  // Map tileId -> array of player guesses on this tile (for iPad display)
  const tilesWithGuesses: Record<string, HuesCuesGuessEntry[]> = {};
  Object.values(guesses).forEach((g) => {
    if (!tilesWithGuesses[g.tileId]) {
      tilesWithGuesses[g.tileId] = [];
    }
    tilesWithGuesses[g.tileId].push(g);
  });

  const myCurrentGuess = guesses[myUid];
  const currentTileObj = mySelectedTileId
    ? HUES_CUES_TILE_MAP[mySelectedTileId]
    : undefined;

  // Directional Nudge Handler (Up / Down / Left / Right by 1 square)
  const handleNudge = (dCol: number, dRow: number) => {
    if (!canInteract || isClueGiver) return;
    const baseTile = currentTileObj || HUES_CUES_TILE_MAP['K12'];
    if (!baseTile) return;
    const nextCol = Math.max(0, Math.min(COLS_COUNT - 1, baseTile.col + dCol));
    const nextRow = Math.max(0, Math.min(ROWS_COUNT - 1, baseTile.row + dRow));
    const nextId = `${COL_LETTERS[nextCol]}${nextRow + 1}`;
    onSelectTile(nextId, myUid, 'phone');
  };

  // Direct Coordinate Dropdown Picker
  const handleCoordChange = (newColLetter: string, newRowNum: number) => {
    if (!canInteract || isClueGiver) return;
    const nextId = `${newColLetter}${newRowNum}`;
    if (HUES_CUES_TILE_MAP[nextId]) {
      onSelectTile(nextId, myUid, 'phone');
    }
  };

  // ==========================================================================
  // VIEW A: PHONE COMPANION REMOTE (No 480 grid - Look at the Central iPad!)
  // ==========================================================================
  if (!isIpadMode) {
    return (
      <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-xl border border-amber-200/90 space-y-4">
        {/* Banner prompting user to look up at iPad */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 via-pink-50 to-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Tablet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 font-display flex items-center gap-1.5">
              <span>มองกระดานสีที่จอ iPad กลางโต๊ะ</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
              {isClueGiver
                ? 'คุณคือผู้ให้คำใบ้ — มองกระดานกลางแล้วใบ้คำให้เพื่อนทาย'
                : 'เลือกพิกัดหรือใช้ปุ่มลูกศรด้านล่าง เพื่อเลื่อนหมากของคุณบนจอ iPad'}
            </p>
          </div>
        </div>

        {/* Clue Giver Guidance Card */}
        {isClueGiver ? (
          <div className="p-5 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-3xl text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center mx-auto text-xl shadow-xs">
              👑
            </div>
            <h4 className="text-sm font-extrabold text-amber-950 font-display">
              รอบนี้คุณคือผู้ให้คำใบ้
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
              มองหาช่องสีเป้าหมายลับของคุณบนกระดาน iPad กลางโต๊ะ แล้วพิมพ์หรือพูดคำใบ้ในช่องด้านล่างเพื่อให้เพื่อนเริ่มทายสี
            </p>
          </div>
        ) : (
          /* Guesser Phone Controller Remote */
          <div className="space-y-4">
            {/* Selected Coordinate & Color Display Card */}
            <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-14 h-14 rounded-2xl border-2 border-white shadow-md flex items-center justify-center font-mono text-sm font-black text-white drop-shadow-xs shrink-0 transition-all"
                  style={{
                    backgroundColor: currentTileObj ? currentTileObj.hex : '#E2E8F0',
                  }}
                >
                  {mySelectedTileId || '—'}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    ตำแหน่งหมากของคุณ
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono flex items-center gap-2">
                    <span>{mySelectedTileId ? `พิกัด ${mySelectedTileId}` : 'ยังไม่ได้วางหมาก'}</span>
                    {mySelectedTileId && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {myCurrentGuess?.updatedBy === 'ipad' ? (
                      <span className="text-pink-700 font-bold">
                        ⚡ ปรับตำแหน่งจากจอ iPad
                      </span>
                    ) : mySelectedTileId ? (
                      <span className="text-emerald-700 font-bold">
                        ✓ ซิงค์แสดงบน iPad แล้ว
                      </span>
                    ) : (
                      <span>กดเลือกพิกัดหรือลูกศรเพื่อวางหมาก</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reveal Bullseye Indicator during scoring */}
              {showSecret && secretTileId && (
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-rose-600 font-mono">
                    เฉลยสีจริง
                  </div>
                  <div className="font-mono text-sm font-black text-rose-700 px-2 py-0.5 bg-rose-50 border border-rose-300 rounded-lg">
                    {secretTileId}
                  </div>
                </div>
              )}
            </div>

            {/* Coordinate Pickers: Column A-T & Row 1-24 */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3">
              <div className="text-xs font-extrabold text-amber-950 flex items-center justify-between">
                <span>เลือกพิกัดโดยตรง (คอลัมน์ A–T / แถว 1–24):</span>
                <span className="text-[11px] font-mono text-amber-700">A1 — T24</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    คอลัมน์ (ตัวอักษร):
                  </label>
                  <select
                    aria-label="เลือกตัวอักษรคอลัมน์"
                    disabled={!canInteract}
                    value={currentTileObj ? COL_LETTERS[currentTileObj.col] : 'K'}
                    onChange={(e) =>
                      handleCoordChange(
                        e.target.value,
                        currentTileObj ? currentTileObj.row + 1 : 12
                      )
                    }
                    className="w-full px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  >
                    {COL_LETTERS.map((letter) => (
                      <option key={letter} value={letter}>
                        คอลัมน์ {letter}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    แถว (ตัวเลข):
                  </label>
                  <select
                    aria-label="เลือกแถวตัวเลข"
                    disabled={!canInteract}
                    value={currentTileObj ? currentTileObj.row + 1 : 12}
                    onChange={(e) =>
                      handleCoordChange(
                        currentTileObj ? COL_LETTERS[currentTileObj.col] : 'K',
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  >
                    {Array.from({ length: ROWS_COUNT }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        แถว {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Directional Nudge Pad (Up / Down / Left / Right) */}
            <div className="p-4 bg-white border border-amber-200 rounded-2xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800">
                  ปุ่มเลื่อนหมากทีละช่อง (มองจอ iPad แล้วกดเลื่อนได้เลย):
                </span>
                <span className="text-[11px] font-mono text-slate-500">▲ ▼ ◄ ►</span>
              </div>

              {/* D-Pad Layout */}
              <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                {/* UP */}
                <button
                  type="button"
                  disabled={!canInteract}
                  onClick={() => handleNudge(0, -1)}
                  className="w-16 h-11 bg-amber-100 hover:bg-amber-200 active:scale-95 disabled:opacity-40 border border-amber-300 rounded-xl text-amber-950 flex items-center justify-center font-bold shadow-2xs cursor-pointer transition-all"
                  title="เลื่อนขึ้น 1 แถว"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>

                {/* LEFT / CENTER / RIGHT */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!canInteract}
                    onClick={() => handleNudge(-1, 0)}
                    className="w-16 h-11 bg-amber-100 hover:bg-amber-200 active:scale-95 disabled:opacity-40 border border-amber-300 rounded-xl text-amber-950 flex items-center justify-center font-bold shadow-2xs cursor-pointer transition-all"
                    title="เลื่อนซ้าย 1 คอลัมน์"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-16 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono font-black text-xs shadow-2xs">
                    {mySelectedTileId || '—'}
                  </div>

                  <button
                    type="button"
                    disabled={!canInteract}
                    onClick={() => handleNudge(1, 0)}
                    className="w-16 h-11 bg-amber-100 hover:bg-amber-200 active:scale-95 disabled:opacity-40 border border-amber-300 rounded-xl text-amber-950 flex items-center justify-center font-bold shadow-2xs cursor-pointer transition-all"
                    title="เลื่อนขวา 1 คอลัมน์"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* DOWN */}
                <button
                  type="button"
                  disabled={!canInteract}
                  onClick={() => handleNudge(0, 1)}
                  className="w-16 h-11 bg-amber-100 hover:bg-amber-200 active:scale-95 disabled:opacity-40 border border-amber-300 rounded-xl text-amber-950 flex items-center justify-center font-bold shadow-2xs cursor-pointer transition-all"
                  title="เลื่อนลง 1 แถว"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW B: CENTRAL IPAD BOARD (Full 480-Tile Spectrum Grid with Live Tokens)
  // ==========================================================================
  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-5 shadow-xl border border-pink-200 space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-pink-100">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
            <Tablet className="w-4 h-4 text-pink-600 shrink-0" />
            <span>กระดานสีกลาง iPad (480 ช่อง · ซิงค์สองทางกับโทรศัพท์ทุกคน)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ลากหมากชื่อผู้เล่นไปวางบนช่องสี หรือแตะชื่อด้านล่างแล้วจิ้มช่องสี (โทรศัพท์ของผู้เล่นจะซิงค์ตามทันที)
          </p>
        </div>

        {showSecret && secretTileId && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-300 rounded-xl">
            <Target className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-rose-900 font-mono tabular-nums">
              สีเป้าหมาย: {secretTileId}
            </span>
          </div>
        )}
      </div>

      {/* iPad Mode: Draggable & Selectable Player Token Dock */}
      {guesserPlayers.length > 0 && (
        <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-pink-950">
            <span className="inline-flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-pink-600" />
              <span>
                หมากผู้เล่นบนกระดาน iPad (ลากหมากไปวางบนช่องสี หรือแตะชื่อแล้วจิ้มช่องสี):
              </span>
            </span>
            <span className="text-[11px] text-pink-700 font-mono">
              ซิงค์ไปที่มือถือผู้เล่นอัตโนมัติ
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {guesserPlayers.map((p) => {
              const pGuess = guesses[p.id];
              const pTile = pGuess ? HUES_CUES_TILE_MAP[pGuess.tileId] : undefined;
              const isSelectedForTap = effectiveIpadPlayerId === p.id;

              return (
                <div
                  key={p.id}
                  draggable={canInteract}
                  onDragStart={(e) => {
                    setDraggedPlayerId(p.id);
                    setActiveIpadPlayerId(p.id);
                    e.dataTransfer.setData('text/plain', p.id);
                  }}
                  onDragEnd={() => setDraggedPlayerId(null)}
                  onClick={() => setActiveIpadPlayerId(p.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-grab active:cursor-grabbing select-none ${
                    isSelectedForTap
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]'
                      : 'bg-white text-slate-800 border-pink-200 hover:bg-pink-100/50'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow-2xs"
                    style={{
                      backgroundColor: pTile ? pTile.hex : '#F472B6',
                      color: '#fff',
                    }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>{p.name}</span>
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                      isSelectedForTap
                        ? 'bg-amber-400 text-amber-950 font-black'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pGuess ? pGuess.tileId : 'ยังไม่วาง'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 480-Tile Color Spectrum Grid on iPad */}
      <div className="overflow-x-auto pb-2">
        <div className="select-none min-w-[680px] w-full">
          {/* Column Header Letters A - T */}
          <div className="grid grid-cols-[28px_repeat(20,minmax(0,1fr))] gap-0.5 sm:gap-1 mb-1 text-center text-[10px] sm:text-xs font-mono font-bold text-slate-600">
            <div />
            {COL_LETTERS.map((letter) => (
              <div key={letter} className="py-0.5 bg-slate-100 rounded">
                {letter}
              </div>
            ))}
          </div>

          {/* Rows 1 to 24 */}
          <div className="space-y-0.5 sm:space-y-1">
            {HUES_CUES_BOARD_TILES.map((rowTiles, rowIndex) => {
              const rowNumber = rowIndex + 1;
              return (
                <div
                  key={`row-${rowNumber}`}
                  className="grid grid-cols-[28px_repeat(20,minmax(0,1fr))] gap-0.5 sm:gap-1 items-center"
                >
                  {/* Row Number Label */}
                  <div className="text-center text-[10px] sm:text-xs font-mono font-bold text-slate-600 py-0.5 bg-slate-100 rounded tabular-nums">
                    {rowNumber}
                  </div>

                  {/* 20 Color Tiles in this row */}
                  {rowTiles.map((tile) => {
                    const isMyGuess = mySelectedTileId === tile.id;
                    const tileGuesses = tilesWithGuesses[tile.id] || [];
                    const distToSecret =
                      showSecret && secretTileId
                        ? calculateTileDistance(tile.id, secretTileId)
                        : 999;
                    const isBullseye = distToSecret === 0;
                    const isInnerFrame = distToSecret === 1;
                    const isOuterFrame = distToSecret === 2;

                    return (
                      <motion.button
                        key={tile.id}
                        type="button"
                        whileHover={
                          canInteract ? { scale: 1.18, zIndex: 25 } : undefined
                        }
                        whileTap={canInteract ? { scale: 0.94 } : undefined}
                        onDragOver={(e) => {
                          if (canInteract) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!canInteract) return;
                          const droppedUid =
                            e.dataTransfer.getData('text/plain') ||
                            draggedPlayerId ||
                            effectiveIpadPlayerId;
                          if (droppedUid) {
                            onSelectTile(tile.id, droppedUid, 'ipad');
                          }
                          setDraggedPlayerId(null);
                        }}
                        onClick={() => {
                          if (!canInteract) return;
                          onSelectTile(tile.id, effectiveIpadPlayerId, 'ipad');
                        }}
                        style={{ backgroundColor: tile.hex }}
                        className={`relative aspect-square rounded-[4px] sm:rounded-md transition-transform cursor-pointer border ${
                          isBullseye
                            ? 'ring-4 ring-rose-600 border-2 border-white z-30 scale-110 shadow-lg'
                            : isInnerFrame
                            ? 'ring-2 ring-amber-400 border-2 border-white z-20'
                            : isOuterFrame
                            ? 'ring-1 ring-white/90 border border-dashed border-slate-900/60 z-10'
                            : isMyGuess
                            ? 'ring-2 ring-slate-950 border-2 border-white z-20 scale-105 shadow-md'
                            : 'border-black/10 hover:border-white'
                        }`}
                        title={`ช่อง ${tile.id}`}
                      >
                        {/* Bullseye Target Icon on Reveal */}
                        {isBullseye && (
                          <span className="absolute -top-2 -right-2 z-40 px-1 py-0.2 bg-rose-600 text-white text-[8px] font-mono font-black rounded shadow">
                            3pt
                          </span>
                        )}

                        {/* Draggable Player Token Badges on this Tile */}
                        {tileGuesses.length > 0 && (
                          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5">
                            {tileGuesses.map((g) => (
                              <div
                                key={g.uid}
                                draggable={canInteract}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setDraggedPlayerId(g.uid);
                                  setActiveIpadPlayerId(g.uid);
                                  e.dataTransfer.setData('text/plain', g.uid);
                                }}
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-black shadow-md border border-white cursor-grab active:cursor-grabbing ${
                                  g.uid === myUid
                                    ? 'bg-amber-400 text-amber-950'
                                    : 'bg-slate-900 text-white'
                                }`}
                                title={`${g.playerName} (${tile.id})`}
                              >
                                {g.playerName.slice(0, 1).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scoring Legend when Secret Target Frame is Revealed */}
      {showSecret && (
        <div className="pt-2 border-t border-pink-100 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block ring-2 ring-rose-300" />
            <span>ตรงช่องเป้าหมายเป๊ะ: +3 คะแนน</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block ring-2 ring-amber-200" />
            <span>ในกรอบ 3×3 รอบเป้าหมาย: +2 คะแนน</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-dashed border-slate-700 bg-slate-100 inline-block" />
            <span>ขอบนอก 5×5 ถัดออกมา: +1 คะแนน</span>
          </span>
        </div>
      )}
    </div>
  );
};
