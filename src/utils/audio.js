/**
 * Olympus Web Audio Synthesizer
 * Generates celestial harmonic chimes, ethereal wind textures, and transition sweeps
 * natively in the browser without requiring external audio assets.
 */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Heavenly harp / celestial chime on hover or progress tick
  playChime(pitchIndex = 0, volume = 0.15) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major ethereal pentatonic
      const freq = freqs[pitchIndex % freqs.length] || 523.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      // Gentle exponential decay like a golden bell / harp string
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.6);
    } catch (e) {
      console.warn("Audio context error:", e);
    }
  }

  // Divine portal entry chord when clicking "Ascend to Olympus"
  playEnterChord() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const chord = [220, 329.63, 440, 554.37, 659.25, 880, 1108.73, 1318.51];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        const startTime = this.ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), startTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 3.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 3.2);
      });
    } catch (e) {
      console.warn("Audio chord error:", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundFX = new SoundFX();
