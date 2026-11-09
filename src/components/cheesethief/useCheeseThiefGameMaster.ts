import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { FirestoreRoom, FirestorePlayer, advanceNightHour } from '../../firebase/tableService';
import { tableAudio } from '../../utils/tableAudio';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

export interface UseCheeseThiefGameMasterOptions {
  activeRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
}

export interface UseCheeseThiefGameMasterReturn {
  isHostVoiceEnabled: boolean;
  setIsHostVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  hourSecondsLeft: number;
  debateSecondsLeft: number;
  nightDuration: number;
  isNightPaused: boolean;
}

/**
 * Custom Hook isolating Thai Game Master Speech Synthesizer (TTS),
 * Customizable night hour timer (5-20s), pause/resume support, 90-second debate countdown, and fanfare audio.
 */
export function useCheeseThiefGameMaster({
  activeRoom,
  players,
  currentUid,
}: UseCheeseThiefGameMasterOptions): UseCheeseThiefGameMasterReturn {
  const [isHostVoiceEnabled, setIsHostVoiceEnabled] = useState<boolean>(true);
  const nightDuration = activeRoom?.cheeseNightDuration || 10;
  const isNightPaused = Boolean(activeRoom?.cheeseNightPaused);
  const [hourSecondsLeft, setHourSecondsLeft] = useState<number>(nightDuration);
  const [debateSecondsLeft, setDebateSecondsLeft] = useState<number>(90);

  // Stop ongoing narration on unmount
  useEffect(() => {
    return () => {
      thaiGameMaster.cancel();
    };
  }, []);

  // Moderator Auto-Timer per Night Hour (1:00 to 6:00 AM) + Chimes & Thai TTS Narration
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'night_phases') {
      setHourSecondsLeft(activeRoom?.cheeseNightDuration || 10);
      return;
    }

    const isHost = activeRoom.hostId === currentUid;
    const currentHour = activeRoom.nightHour;
    const duration = activeRoom.cheeseNightDuration || 10;
    const paused = Boolean(activeRoom.cheeseNightPaused);

    setHourSecondsLeft(duration);

    let cleanupOpening: (() => void) | undefined;

    // Host device acts as the central Tabletop Game Master speaker
    if (isHost && isHostVoiceEnabled && !paused) {
      if (currentHour === 1) {
        thaiGameMaster.speakNightBegins();
        const t = window.setTimeout(() => {
          thaiGameMaster.speakHourWake(1);
        }, 2600);
        cleanupOpening = () => window.clearTimeout(t);
      } else if (currentHour >= 2 && currentHour <= 6) {
        thaiGameMaster.speakHourWake(currentHour);
      }
    } else if (currentHour >= 1 && currentHour <= 6 && !paused) {
      // Non-host devices or muted mode play gentle sound chime
      tableAudio.playHourChime(currentHour);
    }

    const interval = window.setInterval(() => {
      setHourSecondsLeft((prev) => {
        // If host paused the night phase, freeze countdown without decrementing
        if (activeRoom.cheeseNightPaused) {
          return prev;
        }

        // At second 4 (or near half-time for short durations), command to close eyes
        const sleepTriggerSec = Math.max(2, Math.min(4, Math.floor(duration / 2)));
        if (
          prev === sleepTriggerSec &&
          isHost &&
          isHostVoiceEnabled &&
          currentHour >= 1 &&
          currentHour <= 6
        ) {
          thaiGameMaster.speakHourSleep(currentHour);
        }

        if (prev <= 1) {
          window.clearInterval(interval);
          advanceNightHour(activeRoom.id, currentHour + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cleanupOpening) cleanupOpening();
      window.clearInterval(interval);
    };
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.nightHour,
    activeRoom?.cheeseNightDuration,
    activeRoom?.cheeseNightPaused,
    activeRoom?.hostId,
    currentUid,
    isHostVoiceEnabled,
  ]);

  // Follower Phase Speech Announcement (Host Device)
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'follower_phase') return;
    const isHost = activeRoom.hostId === currentUid;
    if (isHost && isHostVoiceEnabled && players.length >= 6) {
      thaiGameMaster.speakFollowerThiefSelect();
    }
  }, [
    activeRoom?.status,
    activeRoom?.id,
    activeRoom?.hostId,
    currentUid,
    isHostVoiceEnabled,
    players.length,
  ]);

  // Morning Gong & TTS when entering voting phase
  useEffect(() => {
    if (activeRoom?.status === 'voting') {
      const isHost = activeRoom.hostId === currentUid;
      if (isHost && isHostVoiceEnabled) {
        thaiGameMaster.speakMorningWake();
      } else {
        tableAudio.playMorningGong();
      }
    }
  }, [activeRoom?.status, activeRoom?.hostId, currentUid, isHostVoiceEnabled]);

  // Morning Debate Countdown
  useEffect(() => {
    if (activeRoom?.status !== 'voting') {
      setDebateSecondsLeft(90);
      return;
    }
    const timer = window.setInterval(() => {
      setDebateSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeRoom?.status]);

  // Game Over Fanfare & Confetti
  useEffect(() => {
    if (activeRoom?.status === 'game_over') {
      const myPlayer = players.find((p) => p.id === currentUid);
      const isWinner =
        (activeRoom.winnerTeam === 'fall_mouse' &&
          myPlayer?.role === 'fall_mouse') ||
        (activeRoom.winnerTeam === 'mice' &&
          myPlayer?.role === 'sleepy_mouse' &&
          !myPlayer?.isFollower) ||
        (activeRoom.winnerTeam === 'thief' &&
          (myPlayer?.role === 'cheese_thief' || myPlayer?.isFollower === true));
      tableAudio.playDramaticReveal(Boolean(isWinner));
      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  }, [activeRoom?.status, activeRoom?.winnerTeam, players, currentUid]);

  return {
    isHostVoiceEnabled,
    setIsHostVoiceEnabled,
    hourSecondsLeft,
    debateSecondsLeft,
    nightDuration,
    isNightPaused,
  };
}
