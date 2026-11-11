import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FirestoreRoom,
  FirestorePlayer,
  advanceNightHour,
} from '../../firebase/tableService';
import { tableAudio } from '../../utils/tableAudio';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

export interface UseCheeseThiefGameMasterOptions {
  activeRoom: FirestoreRoom | null;
  players: FirestorePlayer[];
  currentUid: string;
  isIpadBoardView?: boolean;
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
  isIpadBoardView = false,
}: UseCheeseThiefGameMasterOptions): UseCheeseThiefGameMasterReturn {
  const [isHostVoiceEnabled, setIsHostVoiceEnabled] = useState<boolean>(true);
  const nightDuration = activeRoom?.cheeseNightDuration || 10;
  const isNightPaused = Boolean(activeRoom?.cheeseNightPaused);
  const [hourSecondsLeft, setHourSecondsLeft] = useState<number>(nightDuration);
  const [debateSecondsLeft, setDebateSecondsLeft] = useState<number>(90);

  // Track room+round+hour keys to prevent audio overlap or cancel from Firestore snapshot re-renders
  const openingSpokenKeyRef = useRef<string>('');
  const wakeSpokenKeyRef = useRef<string>('');
  const timersRef = useRef<{
    openingTimer?: number;
    interval?: number;
    failoverTimer?: number;
  }>({});

  // Stop ongoing narration and clear active timers on unmount
  useEffect(() => {
    return () => {
      thaiGameMaster.cancel();
      if (timersRef.current.openingTimer) {
        window.clearTimeout(timersRef.current.openingTimer);
      }
      if (timersRef.current.interval) {
        window.clearInterval(timersRef.current.interval);
      }
      if (timersRef.current.failoverTimer) {
        window.clearTimeout(timersRef.current.failoverTimer);
      }
    };
  }, []);

  // Moderator Auto-Timer per Night Hour (1:00 to 6:00 AM) + Chimes & Thai TTS Narration
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'night_phases') {
      setHourSecondsLeft(activeRoom?.cheeseNightDuration || 10);
      openingSpokenKeyRef.current = '';
      wakeSpokenKeyRef.current = '';
      if (timersRef.current.openingTimer) {
        window.clearTimeout(timersRef.current.openingTimer);
        timersRef.current.openingTimer = undefined;
      }
      if (timersRef.current.interval) {
        window.clearInterval(timersRef.current.interval);
        timersRef.current.interval = undefined;
      }
      if (timersRef.current.failoverTimer) {
        window.clearTimeout(timersRef.current.failoverTimer);
        timersRef.current.failoverTimer = undefined;
      }
      return;
    }

    const isHost = activeRoom.hostId === currentUid;
    const hasIpadBoard = Boolean(activeRoom.ctIpadConnected);
    // If an iPad is connected to the room, the iPad Central Board is the sole TTS speaker.
    // If no iPad is connected, the room Host phone serves as the TTS speaker.
    const isSpeakerDevice = hasIpadBoard ? Boolean(isIpadBoardView) : isHost;
    const currentHour = activeRoom.nightHour;
    const duration = activeRoom.cheeseNightDuration || 10;
    const paused = Boolean(activeRoom.cheeseNightPaused);
    const roundNumber = activeRoom.ctRoundNumber || 1;
    const hourKey = `${activeRoom.id}_r${roundNumber}_h${currentHour}`;

    // On phone clients, chime only triggers if it is that specific player's wake hour
    const myPlayer = players.find((p) => p.id === currentUid);
    const isMyWakeHour = Boolean(
      myPlayer &&
        ((myPlayer.diceHour === currentHour) ||
         (myPlayer.secondaryDiceHour === currentHour))
    );

    // Clean up previous interval before starting new hour
    if (timersRef.current.interval) {
      window.clearInterval(timersRef.current.interval);
      timersRef.current.interval = undefined;
    }
    if (timersRef.current.failoverTimer) {
      window.clearTimeout(timersRef.current.failoverTimer);
      timersRef.current.failoverTimer = undefined;
    }

    // Function to run the 1-second countdown interval for the current hour
    const startHourCountdown = () => {
      setHourSecondsLeft(duration);

      const interval = window.setInterval(() => {
        setHourSecondsLeft((prev) => {
          // If host paused the night phase, freeze countdown without decrementing
          if (activeRoom.cheeseNightPaused) {
            return prev;
          }

          // At sleep trigger window (e.g. 3-4s remaining), command to close eyes
          const sleepTriggerSec = Math.max(
            2,
            Math.min(4, Math.floor(duration / 2))
          );
          if (
            prev === sleepTriggerSec &&
            currentHour >= 1 &&
            currentHour <= 6
          ) {
            if (isSpeakerDevice && isHostVoiceEnabled) {
              thaiGameMaster.speakHourSleep(currentHour);
            } else if (!isSpeakerDevice && isMyWakeHour) {
              // Bedtime chime cue strictly on waking player's phone
              tableAudio.playSleepChime();
            }
          }

          if (prev <= 1) {
            window.clearInterval(interval);
            const isTabVisible =
              typeof document === 'undefined' ||
              document.visibilityState === 'visible';

            if ((isHost || isIpadBoardView) && isTabVisible) {
              advanceNightHour(activeRoom.id, currentHour + 1);
            } else if (isTabVisible) {
              // Failover Timekeeper: if primary Host screen is locked or disconnected,
              // backup human player device automatically advances the hour after 2.2s
              timersRef.current.failoverTimer = window.setTimeout(() => {
                advanceNightHour(activeRoom.id, currentHour + 1);
              }, 2200);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timersRef.current.interval = interval;
    };

    if (currentHour === 1) {
      // ----------------------------------------------------------------------
      // HOUR 1: NIGHT OPENING BUFFER (4.5s)
      // 1. Host / iPad speaks: "ทุกคนหลับตา และเอามือวางบนโต๊ะ... คืนนี้ชีสจะถูกขโมยหรือไม่"
      // 2. Client devices wait silently during opening buffer
      // 3. At 4.5s: Host / iPad speaks "หนูตีหนึ่ง ลืมตา...", wake chime rings, and countdown begins
      // ----------------------------------------------------------------------
      if (openingSpokenKeyRef.current !== hourKey) {
        openingSpokenKeyRef.current = hourKey;
        setHourSecondsLeft(duration);

        if (isSpeakerDevice && isHostVoiceEnabled && !paused) {
          thaiGameMaster.speakNightBegins();
        }

        // Schedule 1:00 AM wake call and chime at 4500ms
        if (timersRef.current.openingTimer) {
          window.clearTimeout(timersRef.current.openingTimer);
        }
        timersRef.current.openingTimer = window.setTimeout(() => {
          wakeSpokenKeyRef.current = hourKey;
          if (isSpeakerDevice && isHostVoiceEnabled && !paused) {
            thaiGameMaster.speakHourWake(1);
          } else if (!isSpeakerDevice && !paused && isMyWakeHour) {
            tableAudio.playWakeChime(1);
          }
          startHourCountdown();
        }, 4500);
      }
    } else if (currentHour >= 2 && currentHour <= 6) {
      // ----------------------------------------------------------------------
      // HOURS 2 to 6: Wake call & countdown begin immediately at 0s
      // ----------------------------------------------------------------------
      if (wakeSpokenKeyRef.current !== hourKey) {
        wakeSpokenKeyRef.current = hourKey;
        if (isSpeakerDevice && isHostVoiceEnabled && !paused) {
          thaiGameMaster.speakHourWake(currentHour);
        } else if (!isSpeakerDevice && !paused && isMyWakeHour) {
          tableAudio.playWakeChime(currentHour);
        }
      }
      startHourCountdown();
    }

    return () => {
      // Clear interval when effect cleans up
      if (timersRef.current.interval) {
        window.clearInterval(timersRef.current.interval);
        timersRef.current.interval = undefined;
      }
      if (timersRef.current.failoverTimer) {
        window.clearTimeout(timersRef.current.failoverTimer);
        timersRef.current.failoverTimer = undefined;
      }
    };
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.nightHour,
    activeRoom?.cheeseNightDuration,
    activeRoom?.cheeseNightPaused,
    activeRoom?.ctRoundNumber,
    activeRoom?.ctIpadConnected,
    activeRoom?.hostId,
    currentUid,
    isHostVoiceEnabled,
    isIpadBoardView,
    players,
  ]);

  // Follower Phase Speech Announcement (iPad Board if connected, otherwise Host Device)
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'follower_phase') return;
    const isHost = activeRoom.hostId === currentUid;
    const hasIpadBoard = Boolean(activeRoom.ctIpadConnected);
    const isSpeaker = hasIpadBoard ? Boolean(isIpadBoardView) : isHost;
    if (isSpeaker && isHostVoiceEnabled && players.length >= 6) {
      thaiGameMaster.speakFollowerThiefSelect();
    }
  }, [
    activeRoom?.status,
    activeRoom?.id,
    activeRoom?.hostId,
    activeRoom?.ctIpadConnected,
    currentUid,
    isHostVoiceEnabled,
    isIpadBoardView,
    players.length,
  ]);

  // Morning Gong & TTS when entering voting phase
  useEffect(() => {
    if (activeRoom?.status === 'voting') {
      const isHost = activeRoom.hostId === currentUid;
      const hasIpadBoard = Boolean(activeRoom.ctIpadConnected);
      const isSpeaker = hasIpadBoard ? Boolean(isIpadBoardView) : isHost;
      if (isSpeaker && isHostVoiceEnabled) {
        thaiGameMaster.speakMorningWake();
      } else {
        tableAudio.playMorningGong();
      }
    }
  }, [
    activeRoom?.status,
    activeRoom?.hostId,
    activeRoom?.ctIpadConnected,
    currentUid,
    isHostVoiceEnabled,
    isIpadBoardView,
  ]);

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
