// Synthesized Web Audio API sound effects for in-person tabletop gaming
class TableAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play dice roll rattle sound
  playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220 + Math.random() * 280, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.08);
        } catch {}
      }, i * 60);
    }
  }

  // Play night hour transition chime (wake up call - bright crystal bell C5 -> G5)
  playWakeChime(hour: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    const baseFreq = 523.25 + (hour - 1) * 20; // C5 base with subtle hour pitch
    const notes = [baseFreq, baseFreq * 1.5]; // Perfect 5th chime (C -> G)
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.22, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.1);
        } catch {}
      }, idx * 160);
    });
  }

  // Alias for backward compatibility
  playHourChime(hour: number) {
    this.playWakeChime(hour);
  }

  // Play night hour bedtime chime (gentle descending lullaby gong: G4 -> E4 -> C4)
  playSleepChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [392.0, 329.63, 261.63]; // G4 -> E4 -> C4
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle'; // warmer, softer bedtime tone
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.4);
        } catch {}
      }, idx * 180);
    });
  }

  // Play morning wake up fanfare
  playMorningGong() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        } catch {}
      }, idx * 120);
    });
  }

  // Play dramatic vote reveal chord
  playDramaticReveal(victory: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = victory
      ? [587.33, 739.99, 880, 1174.66] // D major triumph
      : [311.13, 370.0, 440.0, 587.33]; // mysterious tense chord

    chords.forEach((freq) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = victory ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } catch {}
    });
  }
}

export const tableAudio = new TableAudioSynthesizer();
