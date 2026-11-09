import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { tableAudio } from '../../utils/tableAudio';

export interface UseDetectiveClubGameMasterOptions {
  activeRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
  soundEnabled: boolean;
}

export interface UseDetectiveClubGameMasterReturn {
  discussionSecondsLeft: number;
}

/**
 * Custom Hook isolating Detective Club discussion countdown timer,
 * audio chime sound effects, and round reveal fanfare.
 */
export function useDetectiveClubGameMaster({
  activeRoom,
  players,
  currentUid,
  soundEnabled,
}: UseDetectiveClubGameMasterOptions): UseDetectiveClubGameMasterReturn {
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState<number>(90);

  // Discussion countdown timer
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'dc_discussion') {
      setDiscussionSecondsLeft(90);
      return;
    }

    if (soundEnabled) {
      tableAudio.playMorningGong();
    }

    const duration = activeRoom.dcDiscussionDurationSeconds || 90;
    setDiscussionSecondsLeft(duration);

    const timer = window.setInterval(() => {
      setDiscussionSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.dcDiscussionDurationSeconds,
    soundEnabled,
  ]);

  // Round Scoring Reveal Fanfare & Confetti
  useEffect(() => {
    if (activeRoom?.status === 'dc_scoring') {
      const isConspiratorCaught = activeRoom.dcRoundSummary?.caught;
      const myPlayer = players.find((p) => p.id === currentUid);
      const isConspirator = myPlayer?.role === 'dc_conspirator';

      // Win sound check
      const didIWin = isConspirator ? !isConspiratorCaught : Boolean(isConspiratorCaught);

      if (soundEnabled) {
        tableAudio.playDramaticReveal(didIWin);
      }

      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  }, [
    activeRoom?.status,
    activeRoom?.dcRoundSummary?.caught,
    players,
    currentUid,
    soundEnabled,
  ]);

  return {
    discussionSecondsLeft,
  };
}
