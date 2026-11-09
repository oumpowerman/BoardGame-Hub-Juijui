import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export function useAvalonGameMaster(isGameOver: boolean = false) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
