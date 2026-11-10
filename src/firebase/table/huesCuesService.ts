import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  ensureAuthUser,
} from '../config';
import {
  FirestoreRoom,
  FirestorePlayer,
  HuesCuesGuessEntry,
} from './types';
import {
  HUES_CUES_BOARD_TILES,
  HUES_CUES_TILE_MAP,
  calculateTileDistance,
  COLS_COUNT,
  ROWS_COUNT,
  COL_LETTERS,
} from '../../data/huesCuesColors';
import {
  ensureMinimumPlayersWithBots,
  isAutoControlledSeat,
} from './roomHelpers';
import { recordGameEloUpdates } from './leaderboardService';

// Helper to pick 4 distinct well-spaced secret color candidates
function pickFourCandidateTiles(): string[] {
  const candidates: string[] = [];
  const quadrants = [
    { rMin: 1, rMax: 10, cMin: 1, cMax: 9 },
    { rMin: 1, rMax: 10, cMin: 10, cMax: 18 },
    { rMin: 11, rMax: 22, cMin: 1, cMax: 9 },
    { rMin: 11, rMax: 22, cMin: 10, cMax: 18 },
  ];

  for (const q of quadrants) {
    const r = Math.floor(Math.random() * (q.rMax - q.rMin + 1)) + q.rMin;
    const c = Math.floor(Math.random() * (q.cMax - q.cMin + 1)) + q.cMin;
    const tile = HUES_CUES_BOARD_TILES[r]?.[c];
    if (tile) {
      candidates.push(tile.id);
    }
  }
  return candidates.length > 0 ? candidates : ['E6', 'P6', 'E18', 'P18'];
}

// Helper to pick a nearby tile for bots so single-device / small-group games feel lively
function pickBotGuessTile(secretTileId: string, maxOffset: number): string {
  const target = HUES_CUES_TILE_MAP[secretTileId];
  if (!target) return 'K12';
  const dCol = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset;
  const dRow = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset;
  const col = Math.max(0, Math.min(COLS_COUNT - 1, target.col + dCol));
  const row = Math.max(0, Math.min(ROWS_COUNT - 1, target.row + dRow));
  return `${COL_LETTERS[col]}${row + 1}`;
}

// HC-1. Register or Toggle iPad Central Board Connection
export async function registerHuesCuesIpadBoard(
  roomId: string,
  connected: boolean = true
): Promise<void> {
  await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      hcIpadConnected: connected,
      hcIpadLastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-2. Start New Hues and Cues Round & Assign Clue Giver
export async function startHuesCuesRound(roomId: string): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;

    // Ensure at least 3 players (adds bots only if fewer than 2 real players)
    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    let players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    if (players.length < 2) {
      players = await ensureMinimumPlayersWithBots(roomId, 3);
    }

    // Prefer human players as Clue Giver so a real player gives the clue
    const humanPlayers = players.filter(
      (p) => !isAutoControlledSeat(p, user.uid)
    );
    const pool = humanPlayers.length > 0 ? humanPlayers : players;

    const currentGiverId = roomData.hcClueGiverId || '';
    const currentIndex = pool.findIndex((p) => p.id === currentGiverId);
    const nextClueGiver = pool[(currentIndex + 1) % pool.length];

    const candidates = pickFourCandidateTiles();
    const secretTileId = candidates[0];
    const nextRound = (roomData.hcRoundNumber || 0) + 1;

    // Initialize scores map for all seated players
    const existingScores = { ...(roomData.hcScores || {}) };
    for (const p of players) {
      if (typeof existingScores[p.id] !== 'number') {
        existingScores[p.id] = 0;
      }
      await updateDoc(doc(db, 'rooms', roomId, 'players', p.id), {
        role: p.id === nextClueGiver.id ? 'hc_clue_giver' : 'hc_guesser',
        hcSelectedTileId: '',
      });
    }

    await updateDoc(roomRef, {
      status: 'hc_clue_1',
      hcRoundNumber: nextRound,
      hcClueGiverId: nextClueGiver.id,
      hcClueGiverName: nextClueGiver.name,
      hcCandidateTileIds: candidates,
      hcSecretTileId: secretTileId,
      hcClue1: '',
      hcClue2: '',
      hcGuesses: {},
      hcRoundScores: {},
      hcScores: existingScores,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-3. Clue Giver Changes Secret Color Among the 4 Card Candidates
export async function selectHuesCuesTargetColor(
  roomId: string,
  tileId: string
): Promise<void> {
  await ensureAuthUser();
  if (!HUES_CUES_TILE_MAP[tileId]) return;
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      hcSecretTileId: tileId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-4. Submit Clue 1 (1-Word Clue) -> Move to First Guess Placement
export async function submitHuesCuesClue1(
  roomId: string,
  clue1: string
): Promise<void> {
  const user = await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;

    const cleanClue = clue1.trim() || 'ปริศนาสี';
    const guesses: Record<string, HuesCuesGuessEntry> = {
      ...(roomData.hcGuesses || {}),
    };

    // Auto-place initial guesses for bot seats so solo/small table testing works seamlessly
    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    for (const p of players) {
      if (
        p.id !== roomData.hcClueGiverId &&
        p.id.startsWith('bot_') &&
        roomData.hcSecretTileId
      ) {
        const botTile = pickBotGuessTile(roomData.hcSecretTileId, 3);
        guesses[p.id] = {
          uid: p.id,
          playerName: p.name,
          avatarUrl: p.avatarUrl || '',
          tileId: botTile,
          roundStep: 1,
          updatedBy: 'phone',
          updatedAt: new Date().toISOString(),
        };
      }
    }

    await updateDoc(roomRef, {
      hcClue1: cleanClue,
      hcGuesses: guesses,
      status: 'hc_guess_1',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-5. Place or Move Player Guess Marker (Two-Way Sync: Phone <-> iPad)
export async function placeHuesCuesGuess(
  roomId: string,
  uid: string,
  playerName: string,
  avatarUrl: string | undefined,
  tileId: string,
  updatedBy: 'phone' | 'ipad' = 'phone'
): Promise<void> {
  await ensureAuthUser();
  if (!HUES_CUES_TILE_MAP[tileId]) return;
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;

    // Clue giver cannot place a guess token
    if (uid === roomData.hcClueGiverId) return;

    const roundStep: 1 | 2 = roomData.status === 'hc_guess_2' ? 2 : 1;
    const updatedGuesses: Record<string, HuesCuesGuessEntry> = {
      ...(roomData.hcGuesses || {}),
      [uid]: {
        uid,
        playerName,
        avatarUrl: avatarUrl || '',
        tileId,
        roundStep,
        updatedBy,
        updatedAt: new Date().toISOString(),
      },
    };

    await updateDoc(roomRef, {
      hcGuesses: updatedGuesses,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-6. Advance to Clue 2 Phase (2-Word Clue)
export async function advanceToHuesCuesClue2(roomId: string): Promise<void> {
  await ensureAuthUser();
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'hc_clue_2',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-7. Submit Clue 2 (Up to 2 Words) -> Move to Second Guess Placement
export async function submitHuesCuesClue2(
  roomId: string,
  clue2: string
): Promise<void> {
  await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);
  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;

    const guesses: Record<string, HuesCuesGuessEntry> = {
      ...(roomData.hcGuesses || {}),
    };

    // Refine bot guesses slightly closer on 2nd clue
    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    for (const p of players) {
      if (
        p.id !== roomData.hcClueGiverId &&
        p.id.startsWith('bot_') &&
        roomData.hcSecretTileId
      ) {
        const botTile = pickBotGuessTile(roomData.hcSecretTileId, 2);
        guesses[p.id] = {
          uid: p.id,
          playerName: p.name,
          avatarUrl: p.avatarUrl || '',
          tileId: botTile,
          roundStep: 2,
          updatedBy: 'phone',
          updatedAt: new Date().toISOString(),
        };
      }
    }

    await updateDoc(roomRef, {
      hcClue2: clue2.trim(),
      hcGuesses: guesses,
      status: 'hc_guess_2',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-8. Reveal Target Frame & Calculate Scores
export async function calculateHuesCuesScores(roomId: string): Promise<void> {
  await ensureAuthUser();
  const roomRef = doc(db, 'rooms', roomId);

  try {
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const roomData = roomSnap.data() as FirestoreRoom;

    const secretTileId = roomData.hcSecretTileId;
    if (!secretTileId) return;

    const guesses = roomData.hcGuesses || {};
    const roundScores: Record<string, number> = {};
    const totalScores: Record<string, number> = { ...(roomData.hcScores || {}) };

    let playersInScoringFrame = 0;

    for (const guess of Object.values(guesses)) {
      if (guess.uid === roomData.hcClueGiverId) continue;
      const dist = calculateTileDistance(guess.tileId, secretTileId);
      let pts = 0;
      if (dist === 0) {
        pts = 3; // Exact Bullseye
        playersInScoringFrame++;
      } else if (dist === 1) {
        pts = 2; // Inside 3x3 Scoring Frame
        playersInScoringFrame++;
      } else if (dist === 2) {
        pts = 1; // Outer 5x5 Border
      }
      roundScores[guess.uid] = pts;
      totalScores[guess.uid] = (totalScores[guess.uid] || 0) + pts;
    }

    // Clue Giver earns 1 pt per player inside the 3x3 frame (max 3 pts)
    const clueGiverId = roomData.hcClueGiverId;
    if (clueGiverId) {
      const giverPts = Math.min(3, playersInScoringFrame);
      roundScores[clueGiverId] = giverPts;
      totalScores[clueGiverId] = (totalScores[clueGiverId] || 0) + giverPts;
    }

    // Record ELO update for top scorers
    const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const players = playersSnap.docs.map((d) => d.data() as FirestorePlayer);
    const winnerIds = players
      .filter((p) => (roundScores[p.id] || 0) >= 2)
      .map((p) => p.id);
    if (winnerIds.length > 0) {
      await recordGameEloUpdates(
        players,
        'ทายสีจากคำใบ้ (Hues and Cues)',
        (p) => winnerIds.includes(p.id)
      );
    }

    await updateDoc(roomRef, {
      status: 'hc_scoring',
      hcRoundScores: roundScores,
      hcScores: totalScores,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}

// HC-9. Reset Hues and Cues Room Back to Lobby
export async function resetHuesCuesToLobby(roomId: string): Promise<void> {
  await ensureAuthUser();
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      status: 'lobby',
      hcRoundNumber: 0,
      hcGuesses: {},
      hcRoundScores: {},
      hcClue1: '',
      hcClue2: '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
  }
}
