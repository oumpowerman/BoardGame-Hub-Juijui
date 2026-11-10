import { GamePhase, HuesCuesGuessEntry } from '../firebase/table/types';

export type HuesCuesPhase = Extract<
  GamePhase,
  | 'lobby'
  | 'hc_clue_1'
  | 'hc_guess_1'
  | 'hc_clue_2'
  | 'hc_guess_2'
  | 'hc_scoring'
  | 'hc_game_over'
>;

export interface HuesCuesTile {
  id: string; // e.g. "A1", "T24"
  col: number; // 0 to 19 (20 cols)
  row: number; // 0 to 23 (24 rows)
  hex: string;
  name?: string;
}

export type HuesCuesGuess = HuesCuesGuessEntry;
