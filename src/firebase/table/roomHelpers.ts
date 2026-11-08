import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config';
import { FirestorePlayer } from './types';

export const BOT_NAMES = [
  'หนูมีมี่ (บอทเสริมโต๊ะ)',
  'หนูจอร์จ (บอทเสริมโต๊ะ)',
  'หนูเบคอน (บอทเสริมโต๊ะ)',
  'หนูสายฟ้า (บอทเสริมโต๊ะ)',
  'หนูขนมปัง (บอทเสริมโต๊ะ)',
  'หนูเชดดาร์ (บอทเสริมโต๊ะ)',
  'หนูพุดดิ้ง (บอทเสริมโต๊ะ)',
];

export function generate4DigitCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function syncRoomPlayerCount(roomId: string): Promise<number> {
  const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
  const count = playersSnap.size;
  await updateDoc(doc(db, 'rooms', roomId), {
    playerCount: count,
    updatedAt: new Date().toISOString(),
  });
  return count;
}

/**
 * Checks if a player seat should be automatically controlled by the system
 * (either a practice bot or a pulled friend seat not matching the current user).
 */
export function isAutoControlledSeat(
  player: FirestorePlayer,
  activeUid: string
): boolean {
  return (
    player.id.startsWith('bot_') ||
    (player.isFriendSeat === true && player.id !== activeUid)
  );
}

/**
 * Ensures a room has at least `minPlayers` (default 4) before dealing cards,
 * automatically adding practice bots if fewer players are seated.
 */
export async function ensureMinimumPlayersWithBots(
  roomId: string,
  minPlayers: number = 4
): Promise<Array<FirestorePlayer & { docId: string }>> {
  const playersRef = collection(db, 'rooms', roomId, 'players');
  let playersSnap = await getDocs(playersRef);
  let players = playersSnap.docs.map((d) => ({
    docId: d.id,
    ...(d.data() as FirestorePlayer),
  }));

  if (players.length < minPlayers) {
    const needed = minPlayers - players.length;
    for (let k = 0; k < needed; k++) {
      const botId = `bot_${Date.now()}_${k}_${Math.floor(Math.random() * 1000)}`;
      const botName = BOT_NAMES[(players.length + k) % BOT_NAMES.length];
      const botData: FirestorePlayer = {
        id: botId,
        name: botName,
        isHost: false,
        isReady: true,
        joinedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'rooms', roomId, 'players', botId), botData);
    }
    playersSnap = await getDocs(playersRef);
    players = playersSnap.docs.map((d) => ({
      docId: d.id,
      ...(d.data() as FirestorePlayer),
    }));
  }

  return players;
}
