
export class NeonAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Settings State
  private musicEnabled: boolean = localStorage.getItem('musicEnabled') !== 'false';
  private sfxEnabled: boolean = localStorage.getItem('sfxEnabled') !== 'false';

  // UI BGM System
  private uiBgmGain: GainNode | null = null;
  private uiBgmTimer: number | null = null;
  private uiStep: number = 0;
  private currentBgmType: 'NONE' | 'MENU' | 'GAMEOVER' = 'NONE';
  
  // Gameplay State
  private lastBpmTick: number = 0;
  private baseBpm: number = 128; 
  private currentDynamicBpm: number = 128;
  private stepCount: number = 0;
  private isPlayingGameBgm: boolean = false;

  constructor() {}

  private init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.85;
    } catch (e) {
      console.error("Audio initialization failed:", e);
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    localStorage.setItem('musicEnabled', enabled.toString());
    if (!enabled) {
      this.stopUIBgm(false);
    } else {
      if (this.currentBgmType === 'MENU') this.startMenuBgm();
      else if (this.currentBgmType === 'GAMEOVER') this.startGameOverBgm();
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    localStorage.setItem('sfxEnabled', enabled.toString());
  }

  public getSettings() {
    return { music: this.musicEnabled, sfx: this.sfxEnabled };
  }

  public resume() {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.stopUIBgm();
    
    this.lastBpmTick = 0;
    this.stepCount = 0;
    this.currentDynamicBpm = this.baseBpm;
    this.isPlayingGameBgm = true;
  }

  private ensureActive() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  public playStartupHook() {
    if (!this.sfxEnabled) return;
    this.init();
    this.ensureActive();
    if (!this.ctx || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
      g.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.08);
      g.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + i * 0.08 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.2);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 0.2);
    });

    setTimeout(() => { if (this.sfxEnabled) this.playPerfect(); }, 800);
  }

  public startMenuBgm() { 
    this.currentBgmType = 'MENU';
    if (!this.musicEnabled) return;
    this.startUIBgm('MENU'); 
  }
  public startGameOverBgm() { 
    this.currentBgmType = 'GAMEOVER';
    if (!this.musicEnabled) return;
    this.startUIBgm('GAMEOVER'); 
  }

  private startUIBgm(type: 'MENU' | 'GAMEOVER') {
    this.init();
    this.ensureActive();
    if (!this.ctx || !this.masterGain) return;

    this.stopUIBgm(false);
    this.isPlayingGameBgm = false;
    this.uiStep = 0;

    this.uiBgmGain = this.ctx.createGain();
    this.uiBgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.uiBgmGain.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 1.5);
    this.uiBgmGain.connect(this.masterGain);

    const interval = type === 'MENU' ? (60 / 128) / 4 : (60 / 110) / 4;
    this.uiBgmTimer = window.setInterval(() => { this.tickUISequencer(); }, interval * 1000);
  }

  public stopUIBgm(fullReset: boolean = true) {
    if (this.uiBgmTimer) { clearInterval(this.uiBgmTimer); this.uiBgmTimer = null; }
    if (this.uiBgmGain && this.ctx) {
      try {
        this.uiBgmGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        const prevGain = this.uiBgmGain;
        setTimeout(() => { try { prevGain.disconnect(); } catch(e) {} }, 600);
      } catch (e) {}
      this.uiBgmGain = null;
    }
    if (fullReset) this.currentBgmType = 'NONE';
  }

  private tickUISequencer() {
    if (!this.ctx || !this.uiBgmGain || this.ctx.state !== 'running' || !this.musicEnabled) return;
    const step = this.uiStep % 16;
    if (this.currentBgmType === 'MENU') {
      if (step % 4 === 0) this.playKick(false);
      if (step % 8 === 4) this.playUISnare();
      if (step % 2 === 0) this.playHat(0.04);
      const bassNotes = [55, 55, 65.41, 55, 73.42, 55, 65.41, 82.41]; 
      if (step % 2 === 0) this.playUIBass(bassNotes[(step / 2) % bassNotes.length], 'triangle', 0.2);
      const leadNotes = [440, 0, 523.25, 440, 0, 587.33, 0, 659.25];
      if (leadNotes[step % 8] > 0) this.playUILead(leadNotes[step % 8], 'sine', 0.1);
    } else if (this.currentBgmType === 'GAMEOVER') {
      if (step % 8 === 0) this.playKick(false);
      if (step % 8 === 4) this.playHat(0.1);
      if (step % 8 === 0 || step % 8 === 3) [220, 261.63, 329.63].forEach(f => this.playUIBass(f, 'sine', 0.4));
      const chipNotes = [880, 987.77, 1046.50, 1174.66];
      if (step % 4 === 2) this.playUILead(chipNotes[Math.floor(Math.random() * chipNotes.length)], 'square', 0.08);
    }
    this.uiStep++;
  }

  private playUISnare() {
    if (!this.ctx || !this.uiBgmGain) return;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    noise.connect(g);
    g.connect(this.uiBgmGain);
    noise.start();
  }

  private playUIBass(freq: number, type: OscillatorType, duration: number) {
    if (!this.ctx || !this.uiBgmGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(0.12, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.uiBgmGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playUILead(freq: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.uiBgmGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(g);
    g.connect(this.uiBgmGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public update(_spacing: number, isMirror: boolean, gameTime: number) {
    if (!this.ctx || this.ctx.state !== 'running' || !this.isPlayingGameBgm || !this.musicEnabled) return;
    
    const timeProgress = gameTime / 1000;
    this.currentDynamicBpm = Math.min(165, this.baseBpm + (timeProgress * 0.4));
    
    const effectiveBpm = isMirror ? this.currentDynamicBpm * 1.3 : this.currentDynamicBpm; 
    const interval = 60 / (effectiveBpm * 4); 
    const currentTimeSec = gameTime / 1000;

    if (currentTimeSec < this.lastBpmTick) this.lastBpmTick = currentTimeSec;

    if (currentTimeSec - this.lastBpmTick > interval) {
      this.stepCount++;
      const currentLevel = Math.floor(timeProgress / 15);
      this.tickSequencer(this.stepCount % 16, isMirror, currentLevel);
      this.lastBpmTick = currentTimeSec;
    }
  }

  private tickSequencer(step: number, isMirror: boolean, level: number) {
    if (!this.ctx || !this.masterGain || !this.musicEnabled) return;
    if (step % 4 === 0) this.playKick(isMirror);
    if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
      this.playBassNote(isMirror ? 41.2 : 55, isMirror);
    }

    if (level >= 1 || isMirror) {
      if (step % 4 === 2) this.playHat(isMirror ? 0.08 : 0.06);
      if (step % 2 === 1 && Math.random() > 0.6) this.playHat(0.02);
    }

    if (level >= 3 || isMirror) {
      if (step % 8 === 4) this.playSnare(isMirror ? 0.15 : 0.1);
    }

    if (level >= 5 || isMirror) {
      const scale = isMirror ? [440, 523.25, 587.33, 659.25, 783.99] : [220, 261.63, 329.63, 392];
      if (step % 2 === 0) {
        const freq = scale[Math.floor((step / 2) % scale.length)];
        this.playUILead(freq, isMirror ? 'sawtooth' : 'sine', isMirror ? 0.06 : 0.04);
      }
    }

    if (isMirror && (step === 7 || step === 15)) {
      this.playAcidAccent();
    }
  }

  private playKick(isMirror: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(isMirror ? 200 : 160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    g.gain.setValueAtTime(isMirror ? 0.8 : 0.65, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  private playSnare(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start();
  }

  public playHat(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8500;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start();
  }

  private playBassNote(freq: number, isMirror: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = isMirror ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isMirror ? 800 : 300, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(isMirror ? 3000 : 1200, this.ctx.currentTime + 0.15);
    filter.Q.value = isMirror ? 12 : 5;
    g.gain.setValueAtTime(0.25, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  private playAcidAccent() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2); 
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4000;
    filter.Q.value = 15;
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playCollect() {
    if (!this.sfxEnabled) return;
    this.ensureActive();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playHit() {
    if (!this.sfxEnabled) return;
    this.ensureActive();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(50, this.ctx.currentTime); 
    g.gain.setValueAtTime(0.4, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
    this.playHat(0.3); 
  }

  public playPerfect() {
    if (!this.sfxEnabled) return;
    this.ensureActive();
    if (!this.ctx || !this.masterGain) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.03);
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + i * 0.03 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    });
  }

  public playPortal() {
    if (!this.sfxEnabled) return;
    this.ensureActive();
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(5000, this.ctx.currentTime + 1.2);
    g.gain.setValueAtTime(0.5, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }
}

export const audioManager = new NeonAudioManager();
