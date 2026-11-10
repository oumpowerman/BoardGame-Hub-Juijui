import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { FirestoreRoom, FirestorePlayer } from '../../firebase/tableService';
import { AVALON_QUEST_MATRIX } from '../../data/avalonRules';
import { thaiGameMaster } from '../../utils/thaiGameMasterTTS';

export function useAvalonGameMaster(
  room?: FirestoreRoom | null,
  players: FirestorePlayer[] = []
) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevLeaderKeyRef = useRef<string>('');
  const prevQuestResultsLenRef = useRef<number>(0);

  const isGameOver = room?.status === 'avalon_scoring';

  useEffect(() => {
    thaiGameMaster.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
  };

  const playTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  const playChime = () => {
    playTone(523.25, 0.2); // C5
    setTimeout(() => playTone(659.25, 0.3), 150); // E5
  };

  const playCardFlipSound = () => {
    playTone(440, 0.08, 'triangle');
    setTimeout(() => playTone(587.33, 0.12, 'sine'), 60);
  };

  const playSuspenseTick = () => {
    playTone(164.81, 0.1, 'sawtooth'); // E3 suspense pulse
  };

  const playCardSuccessSound = () => {
    playTone(587.33, 0.12, 'sine'); // D5
    setTimeout(() => playTone(880, 0.25, 'sine'), 100); // A5
  };

  const playCardFailSound = () => {
    playTone(196, 0.2, 'sawtooth'); // G3
    setTimeout(() => playTone(146.83, 0.35, 'sawtooth'), 150); // D3
  };

  const playVoteCastSound = () => {
    playTone(659.25, 0.08, 'sine');
  };

  const playQuestFailSound = () => {
    playTone(220, 0.3, 'sawtooth');
    setTimeout(() => playTone(180, 0.4, 'sawtooth'), 200);
  };

  const playFanfare = () => {
    if (!soundEnabled) return;
    playTone(523.25, 0.15);
    setTimeout(() => playTone(659.25, 0.15), 150);
    setTimeout(() => playTone(783.99, 0.15), 300);
    setTimeout(() => playTone(1046.5, 0.4), 450);
  };

  // Trigger Thai AI Game Master Voice Narration on Avalon Phase Transitions
  useEffect(() => {
    if (!room || !soundEnabled) return;

    const status = room.status;
    const questIndex = room.avalonCurrentQuestIndex || 0;
    const questNumber = questIndex + 1;
    const totalPlayers = Math.min(10, Math.max(5, players.length || 5));
    const matrix = AVALON_QUEST_MATRIX[totalPlayers] || AVALON_QUEST_MATRIX[5];
    const currentQuestReq = matrix.quests[questIndex] || matrix.quests[0];

    // Check if a quest result just completed
    const currentResults = room.avalonQuestResults || [];
    if (currentResults.length > prevQuestResultsLenRef.current && prevQuestResultsLenRef.current >= 0) {
      if (prevStatusRef.current && prevStatusRef.current !== 'lobby') {
        const latest = currentResults[currentResults.length - 1];
        if (latest) {
          thaiGameMaster.speakAvalonQuestResult(
            latest.questIndex + 1,
            latest.passed,
            latest.failCount
          );
        }
      }
    }
    prevQuestResultsLenRef.current = currentResults.length;

    // Phase-level transitions
    if (status !== prevStatusRef.current) {
      prevStatusRef.current = status;

      if (status === 'avalon_role_reveal') {
        thaiGameMaster.speakAvalonRoleDeal();
      } else if (status === 'avalon_team_vote') {
        thaiGameMaster.speakAvalonTeamVote(questNumber);
      } else if (status === 'avalon_quest_vote') {
        thaiGameMaster.speakAvalonQuestVote(questNumber);
      } else if (status === 'avalon_assassination') {
        thaiGameMaster.speakAvalonAssassination();
      } else if (status === 'avalon_scoring') {
        thaiGameMaster.speakAvalonGameOver(
          room.winnerTeam || 'good',
          Boolean(room.avalonAssassinationSuccess)
        );
      }
    }

    // Team Selection leader / quest change narration
    if (status === 'avalon_team_selection') {
      const leaderId = room.avalonLeaderId || '';
      const leaderKey = `${questNumber}_${leaderId}_${room.avalonRejectedTeamsCount || 0}`;
      if (leaderId && leaderKey !== prevLeaderKeyRef.current) {
        prevLeaderKeyRef.current = leaderKey;
        const leaderName =
          players.find((p) => p.id === leaderId)?.name || 'หัวหน้าอัศวิน';
        // Slight delay if a quest result just played so it doesn't cut off immediately
        const delayMs = currentResults.length > 0 && status === prevStatusRef.current ? 3200 : 150;
        const timer = setTimeout(() => {
          thaiGameMaster.speakAvalonTeamSelection(
            questNumber,
            leaderName,
            currentQuestReq.teamSize
          );
        }, delayMs);
        return () => clearTimeout(timer);
      }
    }
  }, [
    room?.status,
    room?.avalonCurrentQuestIndex,
    room?.avalonLeaderId,
    room?.avalonRejectedTeamsCount,
    room?.avalonQuestResults?.length,
    room?.winnerTeam,
    room?.avalonAssassinationSuccess,
    players,
    soundEnabled,
  ]);

  useEffect(() => {
    if (isGameOver) {
      playFanfare();
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#d97706', '#2563eb', '#dc2626'],
      });
    }
  }, [isGameOver]);

  return {
    soundEnabled,
    setSoundEnabled,
    playChime,
    playCardFlipSound,
    playSuspenseTick,
    playCardSuccessSound,
    playCardFailSound,
    playVoteCastSound,
    playQuestFailSound,
    playFanfare,
  };
}
