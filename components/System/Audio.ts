
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export class AudioController {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  musicFilter: BiquadFilterNode | null = null;
  
  // Music State
  isPlayingMusic: boolean = false;
  currentStep: number = 0;
  nextStepTime: number = 0;
  tempo: number = 120; // BPM
  lookAhead: number = 0.1; // seconds
  scheduleInterval: number = 25; // ms
  timerID: number | null = null;

  constructor() {}

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 800;
      this.musicFilter.Q.value = 1.0;

      this.musicGain.connect(this.musicFilter);
      this.musicFilter.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // --- Music Engine ---

  startMusic() {
    this.init();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.nextStepTime = this.ctx!.currentTime;
    this.currentStep = 0;
    this.scheduler();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  updateMusicParams(speedFactor: number) {
    if (!this.musicFilter || !this.ctx) return;
    
    // Scale BPM: 120 to 160 based on speed
    this.tempo = 120 + (speedFactor * 30);
    
    // Open filter: 600Hz to 4000Hz based on speed
    const targetFreq = 600 + (speedFactor * 3400);
    this.musicFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  private scheduler = () => {
    while (this.nextStepTime < this.ctx!.currentTime + this.lookAhead) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
    this.timerID = window.setTimeout(this.scheduler, this.scheduleInterval);
  };

  private advanceStep() {
    const secondsPerStep = 60.0 / this.tempo / 4.0; // 16th notes
    this.nextStepTime += secondsPerStep;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleStep(step: number, time: number) {
    // 1. Kick Drum (Steps 0, 4, 8, 12)
    if (step % 4 === 0) {
      this.playKick(time);
    }

    // 2. Snare/Clap (Steps 4, 12)
    if (step === 4 || step === 12) {
      this.playSnare(time);
    }

    // 3. Cyber Bass (8th notes pattern)
    if (step % 2 === 0) {
      // Basic Synthwave "Rolling" Bass Pattern
      // Alternating root and fifth for that driving feel
      const note = (step === 0 || step === 4 || step === 8 || step === 12) ? 55 : 82.41; // A1 and E2 approx
      this.playBass(note, time);
    }

    // 4. Arpeggio Lead (Patterned)
    const arpPattern = [0, 2, 4, 7, 9, 12];
    if (step % 2 !== 0 && Math.random() > 0.3) {
        const noteIdx = arpPattern[Math.floor(Math.random() * arpPattern.length)];
        const freq = 440 * Math.pow(2, noteIdx / 12);
        this.playLead(freq, time);
    }
  }

  private playKick(time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playSnare(time: number) {
    const noise = this.ctx!.createBufferSource();
    const bufferSize = this.ctx!.sampleRate * 0.1;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);
    noise.start(time);
    noise.stop(time + 0.1);
  }

  private playBass(freq: number, time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playLead(freq: number, time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  // --- Legacy FX ---

  playGemCollect() {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playLetterCollect() {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; 
    freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        const start = t + (i * 0.04);
        const dur = 0.3;
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + dur);
    });
  }

  playJump(isDouble = false) {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = isDouble ? 400 : 200;
    const endFreq = isDouble ? 800 : 450;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playDamage() {
    if (!this.ctx || !this.masterGain) this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
    noise.start(t);
    noise.stop(t + 0.3);
  }
}

export const audio = new AudioController();
