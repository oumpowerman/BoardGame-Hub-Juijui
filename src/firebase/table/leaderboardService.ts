import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config';
import { FirestoreLeaderboardEntry, FirestorePlayer } from './types';

/**
 * Shared ELO updater across all games (Cheese Thief, Insider, etc.).
 * Updates or creates `leaderboard/{playerId}` documents for all non-bot players.
 */
export async function recordGameEloUpdates(
  players: FirestorePlayer[],
  favoriteGameTitle: string,
  didPlayerWinFn: (player: FirestorePlayer) => boolean
): Promise<void> {
  for (const p of players) {
    if (p.id.startsWith('bot_')) continue;
    const won = didPlayerWinFn(p);
    const eloDelta = won ? 25 : -15;

    const leaderRef = doc(db, 'leaderboard', p.id);
    const leaderSnap = await getDoc(leaderRef);
    if (leaderSnap.exists()) {
      const prev = leaderSnap.data() as FirestoreLeaderboardEntry;
      const nextElo = Math.max(1000, (prev.overallElo || 1500) + eloDelta);
      const nextMatches = (prev.matchesPlayed || 0) + 1;
      const nextWins = (prev.wins || 0) + (won ? 1 : 0);
      await updateDoc(leaderRef, {
        playerName: p.name,
        overallElo: nextElo,
        matchesPlayed: nextMatches,
        wins: nextWins,
        winRate: Math.round((nextWins / nextMatches) * 100),
        favoriteGame: favoriteGameTitle,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(leaderRef, {
        playerName: p.name,
        overallElo: 1500 + eloDelta,
        matchesPlayed: 1,
        wins: won ? 1 : 0,
        winRate: won ? 100 : 0,
        favoriteGame: favoriteGameTitle,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Real-Time Listener for Top 20 Leaderboard Entries
 */
export function listenToLeaderboard(
  onUpdate: (entries: FirestoreLeaderboardEntry[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'leaderboard'),
    orderBy('overallElo', 'desc'),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as Omit<FirestoreLeaderboardEntry, 'id'>;
        return { ...data, id: d.id };
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'leaderboard');
    }
  );
}
