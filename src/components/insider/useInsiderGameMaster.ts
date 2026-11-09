import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  FirestoreRoom,
  FirestorePlayer,
  startInsiderQuizPhase,
  triggerInsiderQuizTimeout,
} from '../../firebase/tableService';
import { tableAudio } from '../../utils/tableAudio';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

export interface UseInsiderGameMasterOptions {
  activeRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
}

export interface UseInsiderGameMasterReturn {
  isHostVoiceEnabled: boolean;
  setIsHostVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  insiderRevealCountdown: number | null;
  setInsiderRevealCountdown: React.Dispatch<React.SetStateAction<number | null>>;
  quizSecondsLeft: number;
  discussionSecondsLeft: number;
}

/**
 * Custom Hook isolating Thai Game Master Speech Synthesizer (TTS),
 * 6-second Insider peek countdown, sand-timer quiz countdown,
 * discussion timer, and victory audio fanfare.
 */
export function useInsiderGameMaster({
  activeRoom,
  players,
  currentUid,
}: UseInsiderGameMasterOptions): UseInsiderGameMasterReturn {
  const [isHostVoiceEnabled, setIsHostVoiceEnabled] = useState<boolean>(true);
  const [insiderRevealCountdown, setInsiderRevealCountdown] = useState<number | null>(null);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState<number>(180);
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState<number>(120);

  // Stop ongoing narration on unmount
  useEffect(() => {
    return () => {
      thaiGameMaster.cancel();
    };
  }, []);

  // STEP 3: Night Secret Word Reveal + Insider 6-Second Peek Countdown
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'word_reveal') {
      setInsiderRevealCountdown(null);
      return;
    }

    const isHost = activeRoom.hostId === currentUid;

    if (!activeRoom.insiderEyesOpen) {
      setInsiderRevealCountdown(null);
      if (isHost && isHostVoiceEnabled) {
        thaiGameMaster.speakInsiderMasterWordCheck();
      } else {
        tableAudio.playHourChime(1);
      }
      return;
    }

    setInsiderRevealCountdown(6);
    if (isHost && isHostVoiceEnabled) {
      thaiGameMaster.speakInsiderWakeToPeekWord();
    } else {
      tableAudio.playHourChime(3);
    }

    const interval = window.setInterval(() => {
      setInsiderRevealCountdown((prev) => {
        const current = prev ?? 6;
        if (current === 2 && isHost && isHostVoiceEnabled) {
          thaiGameMaster.speakInsiderCloseEyes();
        }
        if (current <= 1) {
          window.clearInterval(interval);
          if (isHost) {
            startInsiderQuizPhase(activeRoom.id);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.insiderEyesOpen,
    activeRoom?.hostId,
    currentUid,
    isHostVoiceEnabled,
  ]);

  // STEP 4: Question / Quiz Phase Sand Timer Countdown
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'question_phase') {
      return;
    }

    const duration = activeRoom.quizDurationSeconds || 180;
    setQuizSecondsLeft(duration);

    const isHost = activeRoom.hostId === currentUid;
    if (isHost && isHostVoiceEnabled) {
      thaiGameMaster.speakInsiderQuizStart();
    } else {
      tableAudio.playMorningGong();
    }

    const interval = window.setInterval(() => {
      setQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (isHost) {
            triggerInsiderQuizTimeout(activeRoom.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.quizDurationSeconds,
    activeRoom?.hostId,
    currentUid,
    isHostVoiceEnabled,
  ]);

  // Master Quick Signal Audio Chime
  useEffect(() => {
    if (
      activeRoom?.status === 'question_phase' &&
      activeRoom.masterSignalCount &&
      activeRoom.masterSignalCount > 0
    ) {
      tableAudio.playHourChime(2);
    }
  }, [activeRoom?.masterSignalCount, activeRoom?.status]);

  // STEP 5A: Flipped Sand Timer Discussion & Guesser Judgment Vote
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'discussion_guesser_vote') {
      return;
    }

    const discussDuration = activeRoom.elapsedQuizSeconds || 120;
    setDiscussionSecondsLeft(discussDuration);

    const isHost = activeRoom.hostId === currentUid;
    if (isHost && isHostVoiceEnabled) {
      thaiGameMaster.speakInsiderWordGuessed(
        activeRoom.guesserPlayerName || 'ผู้เล่น'
      );
    } else {
      tableAudio.playMorningGong();
    }

    const timer = window.setInterval(() => {
      setDiscussionSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.elapsedQuizSeconds,
    activeRoom?.guesserPlayerName,
    activeRoom?.hostId,
    currentUid,
    isHostVoiceEnabled,
  ]);

  // STEP 5B: General Vote Announcement
  useEffect(() => {
    if (activeRoom?.status === 'general_vote') {
      const isHost = activeRoom.hostId === currentUid;
      if (isHost && isHostVoiceEnabled) {
        thaiGameMaster.speakInsiderGeneralVote();
      } else {
        tableAudio.playMorningGong();
      }
    }
  }, [activeRoom?.status, activeRoom?.hostId, currentUid, isHostVoiceEnabled]);

  // STEP 6: Game Over Audio & Fanfare
  useEffect(() => {
    if (activeRoom?.status === 'game_over') {
      const isHost = activeRoom.hostId === currentUid;
      if (activeRoom.winnerTeam === 'nobody') {
        if (isHost && isHostVoiceEnabled) {
          thaiGameMaster.speakInsiderTimeoutLoss();
        }
        tableAudio.playDramaticReveal(false);
        return;
      }

      const myPlayer = players.find((p) => p.id === currentUid);
      const isWinner =
        (activeRoom.winnerTeam === 'insider' &&
          myPlayer?.role === 'insider_traitor') ||
        (activeRoom.winnerTeam === 'commons' &&
          (myPlayer?.role === 'insider_common' ||
            myPlayer?.role === 'insider_master'));

      tableAudio.playDramaticReveal(Boolean(isWinner));
      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  }, [
    activeRoom?.status,
    activeRoom?.winnerTeam,
    activeRoom?.hostId,
    players,
    currentUid,
    isHostVoiceEnabled,
  ]);

  return {
    isHostVoiceEnabled,
    setIsHostVoiceEnabled,
    insiderRevealCountdown,
    setInsiderRevealCountdown,
    quizSecondsLeft,
    discussionSecondsLeft,
  };
}
