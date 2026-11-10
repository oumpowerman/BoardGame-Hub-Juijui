import { HuesCuesTile } from '../types/huesCues';

// Helper to convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Generate 480 color tiles (20 cols A-T, 24 rows 1-24)
export const COLS_COUNT = 20; // A to T
export const ROWS_COUNT = 24; // 1 to 24

export const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

export function generateHuesCuesBoard(): HuesCuesTile[][] {
  const board: HuesCuesTile[][] = [];

  for (let r = 0; r < ROWS_COUNT; r++) {
    const rowTiles: HuesCuesTile[] = [];
    for (let c = 0; c < COLS_COUNT; c++) {
      const colLetter = COL_LETTERS[c];
      const rowNum = r + 1;
      const id = `${colLetter}${rowNum}`;

      // Calculate smooth hue across columns (0 to 360) and lightness/saturation across rows
      const hue = (c / (COLS_COUNT - 1)) * 360;
      // Rows go from very light (top, e.g. 90%) to very dark (bottom, e.g. 20%), with mid tones in middle
      const lightness = 92 - (r / (ROWS_COUNT - 1)) * 75; 
      // Saturation varies slightly
      const saturation = 85 + ((r + c) % 15);

      const hex = hslToHex(hue, Math.min(100, Math.max(20, saturation)), Math.min(95, Math.max(15, lightness)));

      rowTiles.push({
        id,
        col: c,
        row: r,
        hex,
        name: `Color ${id}`,
      });
    }
    board.push(rowTiles);
  }

  return board;
}

export const HUES_CUES_BOARD_TILES = generateHuesCuesBoard();

// Flattened map for quick lookup by ID e.g. "E12" -> HuesCuesTile
export const HUES_CUES_TILE_MAP: Record<string, HuesCuesTile> = {};
HUES_CUES_BOARD_TILES.forEach((row) => {
  row.forEach((tile) => {
    HUES_CUES_TILE_MAP[tile.id] = tile;
  });
});

// Calculate distance between two tiles for scoring (Manhattan or Euclidean on grid)
export function calculateTileDistance(tileId1: string, tileId2: string): number {
  const t1 = HUES_CUES_TILE_MAP[tileId1];
  const t2 = HUES_CUES_TILE_MAP[tileId2];
  if (!t1 || !t2) return 999;

  const colDiff = Math.abs(t1.col - t2.col);
  const rowDiff = Math.abs(t1.row - t2.row);
  return Math.max(colDiff, rowDiff); // Chebyshev distance / max grid steps
}
