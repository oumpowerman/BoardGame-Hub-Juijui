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
  insiderRevealStage: 'idle' | 'master_closing' | 'insider_peeking';
  quizSecondsLeft: number;
  discussionSecondsLeft: number;
}

/**
 * Custom Hook isolating Thai Game Master Speech Synthesizer (TTS),
 * 2-Stage Insider peek countdown (3s Master + 8s Insider), sand-timer quiz countdown,
 * discussion timer, and victory audio fanfare.
 */
export function useInsiderGameMaster({
  activeRoom,
  players,
  currentUid,
}: UseInsiderGameMasterOptions): UseInsiderGameMasterReturn {
  const [isHostVoiceEnabled, setIsHostVoiceEnabled] = useState<boolean>(true);
  const [insiderRevealCountdown, setInsiderRevealCountdown] = useState<number | null>(null);
  const [insiderRevealStage, setInsiderRevealStage] = useState<
    'idle' | 'master_closing' | 'insider_peeking'
  >('idle');
  const [quizSecondsLeft, setQuizSecondsLeft] = useState<number>(180);
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState<number>(120);
  const timerSequenceActiveRef = useState<{ activeKey: string }>({ activeKey: '' })[0];

  // Stop ongoing narration on unmount
  useEffect(() => {
    return () => {
      thaiGameMaster.cancel();
    };
  }, []);

  // STEP 3: Night Secret Word Reveal + 2-Stage Smooth Sequence
  // Stage 1: Master Close Eyes (3s) -> Stage 2: Insider Peek Word (8s) (Total 11s)
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'word_reveal') {
      setInsiderRevealCountdown(null);
      setInsiderRevealStage('idle');
      timerSequenceActiveRef.activeKey = '';
      return;
    }

    const isHost = activeRoom.hostId === currentUid;

    // Stage 0: Master is checking and confirming the word
    if (!activeRoom.insiderEyesOpen) {
      setInsiderRevealCountdown(null);
      setInsiderRevealStage('idle');
      timerSequenceActiveRef.activeKey = '';
      if (isHost && isHostVoiceEnabled) {
        thaiGameMaster.speakInsiderMasterWordCheck();
      } else {
        tableAudio.playHourChime(1);
      }
      return;
    }

    // Guard: Prevent re-initializing the 11-second sequence on every Firestore snapshot
    const sequenceKey = `${activeRoom.id}_${activeRoom.secretWord}_revealed`;
    if (timerSequenceActiveRef.activeKey === sequenceKey) {
      return;
    }
    timerSequenceActiveRef.activeKey = sequenceKey;

    // STAGE 1: Master Closes Eyes (3 Seconds)
    setInsiderRevealStage('master_closing');
    setInsiderRevealCountdown(3);
    if (isHost && isHostVoiceEnabled) {
      thaiGameMaster.speakInsiderMasterCloseEyes();
    } else {
      tableAudio.playSleepChime();
    }

    let remainingInStage1 = 3;
    const stage1Interval = window.setInterval(() => {
      remainingInStage1 -= 1;
      setInsiderRevealCountdown(remainingInStage1);

      if (remainingInStage1 <= 0) {
        window.clearInterval(stage1Interval);

        // STAGE 2: Insider Wakes Up & Peeks (8 Seconds)
        setInsiderRevealStage('insider_peeking');
        setInsiderRevealCountdown(8);
        if (isHost && isHostVoiceEnabled) {
          thaiGameMaster.speakInsiderWakeToPeekWord();
        } else {
          tableAudio.playHourChime(4);
        }

        let remainingInStage2 = 8;
        const stage2Interval = window.setInterval(() => {
          remainingInStage2 -= 1;
          setInsiderRevealCountdown(remainingInStage2);

          // Alert 2 seconds before closing
          if (remainingInStage2 === 2 && isHost && isHostVoiceEnabled) {
            thaiGameMaster.speakInsiderCloseEyes();
          }

          if (remainingInStage2 <= 0) {
            window.clearInterval(stage2Interval);
            setInsiderRevealCountdown(null);
            setInsiderRevealStage('idle');

            // Safe transition to Quiz Phase by Host or fallback after 2.2s if Host screen locked
            const isPrimaryActive =
              isHost &&
              typeof document !== 'undefined' &&
              document.visibilityState === 'visible';
            if (isPrimaryActive) {
              startInsiderQuizPhase(activeRoom.id);
            } else {
              window.setTimeout(() => {
                startInsiderQuizPhase(activeRoom.id);
              }, 2200);
            }
          }
        }, 1000);
      }
    }, 1000);

    return () => {
      window.clearInterval(stage1Interval);
    };
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.insiderEyesOpen,
    activeRoom?.hostId,
    activeRoom?.secretWord,
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
          const isPrimaryActive =
            isHost &&
            typeof document !== 'undefined' &&
            document.visibilityState === 'visible';
          if (isPrimaryActive) {
            triggerInsiderQuizTimeout(activeRoom.id);
          } else {
            window.setTimeout(() => {
              triggerInsiderQuizTimeout(activeRoom.id);
            }, 2200);
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
    insiderRevealStage,
    quizSecondsLeft,
    discussionSecondsLeft,
  };
}
