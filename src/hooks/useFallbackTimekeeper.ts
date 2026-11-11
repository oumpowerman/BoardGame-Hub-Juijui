import { useEffect, useState } from 'react';
import type { FirestoreRoom, FirestorePlayer } from '../firebase/table/types';

interface UseFallbackTimekeeperOptions {
  activeRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
  isIpadBoardView?: boolean;
}

export interface FallbackTimekeeperResult {
  /** True if this device is the primary host and its tab is visible */
  isPrimaryHost: boolean;
  /** True if this device is an eligible backup timekeeper (iPad board or first online human player) */
  isBackupTimekeeper: boolean;
  /** True if this device should actively run timers (either primary host or backup timekeeper) */
  canRunTimers: boolean;
  /** Delay in ms to wait after deadline before backup triggers transition (0 for primary host, 2500ms for backup) */
  failoverDelayMs: number;
}

/**
 * Coordinates timer responsibility so that if the Host's phone screen locks or disconnects,
 * the iPad Central Board or the next active human player automatically takes over phase transitions.
 */
export function useFallbackTimekeeper({
  activeRoom,
  players,
  currentUid,
  isIpadBoardView = false,
}: UseFallbackTimekeeperOptions): FallbackTimekeeperResult {
  const [isTabVisible, setIsTabVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!activeRoom) {
    return {
      isPrimaryHost: false,
      isBackupTimekeeper: false,
      canRunTimers: false,
      failoverDelayMs: 0,
    };
  }

  const isPrimaryHost = activeRoom.hostId === currentUid;

  // Check if the primary host is seated as a human player or if there are other human players
  const humanPlayers = players.filter((p) => !p.id.startsWith('bot_') && !p.isFriendSeat);
  const firstBackupHuman = humanPlayers.find((p) => p.id !== activeRoom.hostId);
  const isFirstBackupHuman = firstBackupHuman?.id === currentUid;

  const isBackupTimekeeper =
    !isPrimaryHost && isTabVisible && (isIpadBoardView || isFirstBackupHuman);

  const canRunTimers = (isPrimaryHost && isTabVisible) || isBackupTimekeeper;
  const failoverDelayMs = isPrimaryHost ? 0 : 2500;

  return {
    isPrimaryHost,
    isBackupTimekeeper,
    canRunTimers,
    failoverDelayMs,
  };
}
