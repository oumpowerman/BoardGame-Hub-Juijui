import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Tablet,
  Target,
  Move,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  HUES_CUES_BOARD_TILES,
  HUES_CUES_TILE_MAP,
  COL_LETTERS,
  COLS_COUNT,
  ROWS_COUNT,
  calculateTileDistance,
} from '../../data/huesCuesColors';
import { HuesCuesTile } from '../../types/huesCues';
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

// Stable empty array reference to avoid unnecessary re-renders in memoized tile cells
const EMPTY_GUESSES: HuesCuesGuessEntry[] = [];

// ============================================================================
// MEMOIZED CELL COMPONENT FOR 480-TILE GRID (60 FPS on iPad with 6-10 players)
// Replaces heavy Framer Motion instances with lightweight CSS GPU transforms
// ============================================================================
interface HuesCuesTileCellProps {
  tile: HuesCuesTile;
  isMyGuess: boolean;
  tileGuesses: HuesCuesGuessEntry[];
  distToSecret: number;
  canInteract: boolean;
  myUid: string;
  onTileClick: (tileId: string) => void;
  onTileDrop: (tileId: string, droppedUid?: string) => void;
  onTokenDragStart: (playerUid: string) => void;
}

const HuesCuesTileCell = React.memo<HuesCuesTileCellProps>(
  ({
    tile,
    isMyGuess,
    tileGuesses,
    distToSecret,
    canInteract,
    myUid,
    onTileClick,
    onTileDrop,
    onTokenDragStart,
  }) => {
    const isBullseye = distToSecret === 0;
    const isInnerFrame = distToSecret === 1;
    const isOuterFrame = distToSecret === 2;

    return (
      <button
        key={tile.id}
        type="button"
        onDragOver={(e) => {
          if (canInteract) e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!canInteract) return;
          const droppedUid = e.dataTransfer.getData('text/plain');
          onTileDrop(tile.id, droppedUid);
        }}
        onClick={() => {
          if (!canInteract) return;
          onTileClick(tile.id);
        }}
        style={{ backgroundColor: tile.hex }}
        className={`relative aspect-square rounded-[3px] sm:rounded-md cursor-pointer border select-none transition-transform will-change-transform ${
          canInteract ? 'active:scale-95 hover:scale-110 hover:z-25' : ''
        } ${
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
        {/* Bullseye Target Score Indicator on Reveal */}
        {isBullseye && (
          <span className="absolute -top-2 -right-2 z-40 px-1 py-0.2 bg-rose-600 text-white text-[8px] font-mono font-black rounded shadow pointer-events-none">
            3pt
          </span>
        )}

        {/* Draggable Player Token Badges on this Tile */}
        {tileGuesses.length > 0 && (
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5 pointer-events-none">
            {tileGuesses.map((g) => (
              <div
                key={g.uid}
                draggable={canInteract}
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData('text/plain', g.uid);
                  onTokenDragStart(g.uid);
                }}
                className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[7px] sm:text-[10px] font-black shadow-md border border-white cursor-grab active:cursor-grabbing pointer-events-auto ${
                  g.uid === myUid
                    ? 'bg-amber-400 text-amber-950 ring-1 ring-black/40'
                    : 'bg-slate-900 text-white'
                }`}
                title={`${g.playerName} (${tile.id})`}
              >
                {g.playerName.slice(0, 1).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </button>
    );
  },
  (prev, next) => {
    // Ultra-fast shallow memo comparison for skipping unmodified grid cells
    if (
      prev.tile.id !== next.tile.id ||
      prev.isMyGuess !== next.isMyGuess ||
      prev.distToSecret !== next.distToSecret ||
      prev.canInteract !== next.canInteract ||
      prev.myUid !== next.myUid
    ) {
      return false;
    }
    if (prev.tileGuesses === next.tileGuesses) {
      return true;
    }
    if (prev.tileGuesses.length !== next.tileGuesses.length) {
      return false;
    }
    for (let i = 0; i < prev.tileGuesses.length; i++) {
      if (
        prev.tileGuesses[i].uid !== next.tileGuesses[i].uid ||
        prev.tileGuesses[i].playerName !== next.tileGuesses[i].playerName
      ) {
        return false;
      }
    }
    return true;
  }
);
HuesCuesTileCell.displayName = 'HuesCuesTileCell';

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

  // iPad Fullscreen Mode State & DOM Reference
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (boardContainerRef.current?.requestFullscreen) {
          await boardContainerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // CSS Viewport Overlay Fallback for iOS Safari & strict iframes
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const effectiveIpadPlayerId =
    activeIpadPlayerId && guesserPlayers.some((p) => p.id === activeIpadPlayerId)
      ? activeIpadPlayerId
      : guesserPlayers[0]?.id || myUid;

  // Memoized map: tileId -> array of player guesses (avoids rebuilding array references every render)
  const tilesWithGuesses = useMemo(() => {
    const map: Record<string, HuesCuesGuessEntry[]> = {};
    Object.values(guesses).forEach((g) => {
      if (!map[g.tileId]) {
        map[g.tileId] = [];
      }
      map[g.tileId].push(g);
    });
    return map;
  }, [guesses]);

  const myCurrentGuess = guesses[myUid];

  // --------------------------------------------------------------------------
  // OPTIMISTIC LOCAL STATE + 150ms DEBOUNCED FIRESTORE SYNC (Phone Remote)
  // Provides instantaneous 0ms token feedback on mobile while preventing
  // Firestore write congestion when 6-10 players nudge concurrently.
  // --------------------------------------------------------------------------
  const [localTileId, setLocalTileId] = useState<string>(
    mySelectedTileId || 'K12'
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNudgingRef = useRef<boolean>(false);

  // Sync server tile position into local state when not actively nudging
  useEffect(() => {
    if (!isNudgingRef.current && mySelectedTileId) {
      setLocalTileId(mySelectedTileId);
    }
  }, [mySelectedTileId]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const scheduleNudge = useCallback(
    (nextId: string) => {
      // 1. Instant local optimistic update (0ms UI latency on phone screen)
      setLocalTileId(nextId);
      isNudgingRef.current = true;

      // 2. Clear existing debounced timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 3. Debounce network broadcast to Firestore (150ms)
      debounceTimerRef.current = setTimeout(() => {
        isNudgingRef.current = false;
        onSelectTile(nextId, myUid, 'phone');
      }, 150);
    },
    [myUid, onSelectTile]
  );

  // Directional Nudge Handler (Up / Down / Left / Right by 1 square)
  const handleNudge = (dCol: number, dRow: number) => {
    if (!canInteract || isClueGiver) return;
    const baseTile =
      HUES_CUES_TILE_MAP[localTileId] ||
      (mySelectedTileId ? HUES_CUES_TILE_MAP[mySelectedTileId] : undefined) ||
      HUES_CUES_TILE_MAP['K12'];
    if (!baseTile) return;
    const nextCol = Math.max(0, Math.min(COLS_COUNT - 1, baseTile.col + dCol));
    const nextRow = Math.max(0, Math.min(ROWS_COUNT - 1, baseTile.row + dRow));
    const nextId = `${COL_LETTERS[nextCol]}${nextRow + 1}`;
    scheduleNudge(nextId);
  };

  // Direct Coordinate Dropdown Picker
  const handleCoordChange = (newColLetter: string, newRowNum: number) => {
    if (!canInteract || isClueGiver) return;
    const nextId = `${newColLetter}${newRowNum}`;
    if (HUES_CUES_TILE_MAP[nextId]) {
      scheduleNudge(nextId);
    }
  };

  const activePhoneTileObj =
    HUES_CUES_TILE_MAP[localTileId] ||
    (mySelectedTileId ? HUES_CUES_TILE_MAP[mySelectedTileId] : undefined);

  // Memoized handlers for iPad Grid to keep cell props reference-equal
  const handleTileClick = useCallback(
    (tileId: string) => {
      if (!canInteract) return;
      onSelectTile(tileId, effectiveIpadPlayerId, 'ipad');
    },
    [canInteract, effectiveIpadPlayerId, onSelectTile]
  );

  const handleTileDrop = useCallback(
    (tileId: string, droppedUid?: string) => {
      if (!canInteract) return;
      const targetUid = droppedUid || draggedPlayerId || effectiveIpadPlayerId;
      if (targetUid) {
        onSelectTile(tileId, targetUid, 'ipad');
      }
      setDraggedPlayerId(null);
    },
    [canInteract, draggedPlayerId, effectiveIpadPlayerId, onSelectTile]
  );

  const handleTokenDragStart = useCallback((playerUid: string) => {
    setDraggedPlayerId(playerUid);
    setActiveIpadPlayerId(playerUid);
  }, []);

  // ==========================================================================
  // VIEW A: PHONE COMPANION REMOTE (Optimistic 0ms UI with 150ms Debounced Sync)
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
                    backgroundColor: activePhoneTileObj
                      ? activePhoneTileObj.hex
                      : '#E2E8F0',
                  }}
                >
                  {localTileId || '—'}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    ตำแหน่งหมากของคุณ
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono flex items-center gap-2">
                    <span>
                      {localTileId ? `พิกัด ${localTileId}` : 'ยังไม่ได้วางหมาก'}
                    </span>
                    {localTileId && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isNudgingRef.current ? (
                      <span className="text-amber-700 font-bold animate-pulse">
                        ⚡ กำลังซิงค์ไป iPad...
                      </span>
                    ) : myCurrentGuess?.updatedBy === 'ipad' ? (
                      <span className="text-pink-700 font-bold">
                        ⚡ ปรับตำแหน่งจากจอ iPad
                      </span>
                    ) : localTileId ? (
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
                    value={activePhoneTileObj ? COL_LETTERS[activePhoneTileObj.col] : 'K'}
                    onChange={(e) =>
                      handleCoordChange(
                        e.target.value,
                        activePhoneTileObj ? activePhoneTileObj.row + 1 : 12
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
                    value={activePhoneTileObj ? activePhoneTileObj.row + 1 : 12}
                    onChange={(e) =>
                      handleCoordChange(
                        activePhoneTileObj ? COL_LETTERS[activePhoneTileObj.col] : 'K',
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

                  <div className="w-16 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono font-black text-xs shadow-2xs transition-all">
                    {localTileId || '—'}
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
  // VIEW B: CENTRAL IPAD BOARD (Auto-Fit & Fullscreen Theater Mode at 60 FPS)
  // ==========================================================================
  return (
    <div
      ref={boardContainerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 text-white p-3 sm:p-5 flex flex-col justify-between overflow-y-auto w-screen h-screen select-none'
          : 'w-full bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-5 shadow-xl border border-pink-200 space-y-3'
      }
    >
      {/* Header Bar with Fullscreen Toggle */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${
          isFullscreen ? 'border-slate-800' : 'border-pink-100'
        }`}
      >
        <div>
          <h2
            className={`text-sm sm:text-base font-extrabold font-display flex items-center gap-2 ${
              isFullscreen ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Tablet
              className={`w-4 h-4 shrink-0 ${
                isFullscreen ? 'text-pink-400' : 'text-pink-600'
              }`}
            />
            <span>กระดานสีกลาง iPad (480 ช่อง · ซิงค์สองทางกับโทรศัพท์ทุกคน)</span>
          </h2>
          <p
            className={`text-xs ${
              isFullscreen ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            ลากหมากชื่อผู้เล่นไปวางบนช่องสี หรือแตะชื่อด้านล่างแล้วจิ้มช่องสี (โทรศัพท์ของผู้เล่นจะซิงค์ตามทันที)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showSecret && secretTileId && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-300 rounded-xl">
              <Target className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-rose-900 font-mono tabular-nums">
                สีเป้าหมาย: {secretTileId}
              </span>
            </div>
          )}

          {/* iPad Fullscreen Theater Mode Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isFullscreen
                ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 border border-amber-300'
                : 'bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300'
            }`}
            title={isFullscreen ? 'ย่อกลับเป็นขนาดปกติ' : 'ขยายกระดานเต็มหน้าจอ iPad'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>ย่อจอ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>ขยายเต็มจอ iPad</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* iPad Mode: Draggable & Selectable Player Token Dock */}
      {guesserPlayers.length > 0 && (
        <div
          className={`p-2.5 sm:p-3 rounded-2xl space-y-1.5 sm:space-y-2 border ${
            isFullscreen
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-pink-50/70 border-pink-200'
          }`}
        >
          <div
            className={`flex items-center justify-between gap-2 text-xs font-bold ${
              isFullscreen ? 'text-pink-300' : 'text-pink-950'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-pink-500" />
              <span>
                หมากผู้เล่นบนกระดาน iPad (ลากหมากไปวางบนช่องสี หรือแตะชื่อแล้วจิ้มช่องสี):
              </span>
            </span>
            <span
              className={`text-[11px] font-mono ${
                isFullscreen ? 'text-pink-400' : 'text-pink-700'
              }`}
            >
              ซิงค์ไปที่มือถือผู้เล่นอัตโนมัติ
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs font-bold transition-all cursor-grab active:cursor-grabbing select-none ${
                    isSelectedForTap
                      ? isFullscreen
                        ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-sm scale-[1.02]'
                        : 'bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]'
                      : isFullscreen
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-white text-slate-800 border-pink-200 hover:bg-pink-100/50'
                  }`}
                >
                  <span
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black border border-white shadow-2xs"
                    style={{
                      backgroundColor: pTile ? pTile.hex : '#F472B6',
                      color: '#fff',
                    }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[90px]">{p.name}</span>
                  <span
                    className={`font-mono text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md ${
                      isSelectedForTap
                        ? 'bg-slate-900 text-white font-black'
                        : isFullscreen
                        ? 'bg-slate-900 text-slate-300'
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

      {/* 480-Tile Color Spectrum Grid: Auto-fit on iPad & Fullscreen Support */}
      <div
        className={
          isFullscreen
            ? 'flex-1 flex flex-col items-center justify-center p-1 w-full min-h-0'
            : 'overflow-x-auto pb-2 scrollbar-thin'
        }
      >
        <div
          className={
            isFullscreen
              ? 'w-full max-w-[860px] max-h-[75vh] aspect-[20/24] flex flex-col justify-center select-none mx-auto'
              : 'select-none w-full min-w-[560px] sm:min-w-0 max-w-full mx-auto'
          }
        >
          {/* Column Header Letters A - T */}
          <div
            className={`grid grid-cols-[20px_repeat(20,minmax(0,1fr))] sm:grid-cols-[28px_repeat(20,minmax(0,1fr))] gap-0.5 sm:gap-1 mb-1 text-center text-[8px] sm:text-xs font-mono font-bold ${
              isFullscreen ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <div />
            {COL_LETTERS.map((letter) => (
              <div
                key={letter}
                className={`py-0.5 rounded text-center ${
                  isFullscreen ? 'bg-slate-900 text-slate-300' : 'bg-slate-100'
                }`}
              >
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
                  className="grid grid-cols-[20px_repeat(20,minmax(0,1fr))] sm:grid-cols-[28px_repeat(20,minmax(0,1fr))] gap-0.5 sm:gap-1 items-center"
                >
                  {/* Row Number Label */}
                  <div
                    className={`text-center text-[8px] sm:text-xs font-mono font-bold py-0.5 rounded tabular-nums ${
                      isFullscreen
                        ? 'bg-slate-900 text-slate-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rowNumber}
                  </div>

                  {/* 20 Color Tiles in this row (Memoized Subcomponents) */}
                  {rowTiles.map((tile) => {
                    const isMyGuess = mySelectedTileId === tile.id;
                    const tileGuesses = tilesWithGuesses[tile.id] || EMPTY_GUESSES;
                    const distToSecret =
                      showSecret && secretTileId
                        ? calculateTileDistance(tile.id, secretTileId)
                        : 999;

                    return (
                      <HuesCuesTileCell
                        key={tile.id}
                        tile={tile}
                        isMyGuess={isMyGuess}
                        tileGuesses={tileGuesses}
                        distToSecret={distToSecret}
                        canInteract={canInteract}
                        myUid={myUid}
                        onTileClick={handleTileClick}
                        onTileDrop={handleTileDrop}
                        onTokenDragStart={handleTokenDragStart}
                      />
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
        <div
          className={`pt-2 border-t flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-bold ${
            isFullscreen
              ? 'border-slate-800 text-slate-300'
              : 'border-pink-100 text-slate-700'
          }`}
        >
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
