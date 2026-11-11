import type { FirestoreRoom } from '../firebase/table/types';

export interface ActiveRoomSession {
  roomId: string;
  roomCode: string;
  gameId: FirestoreRoom['gameId'];
  isIpadBoard?: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'tabletop_active_room_session_v1';
const SESSION_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export function saveActiveRoomSession(
  session: Omit<ActiveRoomSession, 'updatedAt'>
): void {
  try {
    const payload: ActiveRoomSession = {
      ...session,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

export function getActiveRoomSession(): ActiveRoomSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveRoomSession;
    if (!parsed || !parsed.roomId || !parsed.roomCode || !parsed.gameId) {
      return null;
    }
    if (Date.now() - (parsed.updatedAt || 0) > SESSION_MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveRoomSession(roomId?: string): void {
  try {
    if (!roomId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const current = getActiveRoomSession();
    if (!current || current.roomId === roomId) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
