export type SongId = "menu" | "forest" | "cave" | "guardian" | "dragon" | "victory" | "ending";
export type SfxId =
  | "click"
  | "confirm"
  | "correct"
  | "wrong"
  | "timeout"
  | "sword"
  | "impact"
  | "magic"
  | "hurt"
  | "down"
  | "card"
  | "pair"
  | "tick"
  | "star"
  | "boss"
  | "defeat"
  | "victory";

interface Song {
  bpm: number;
  lead: number[];
  bass: number[];
}

const SONGS: Record<SongId, Song> = {
  menu: {
    bpm: 108,
    lead: [67, 0, 71, 72, 71, 67, 64, 67, 69, 0, 72, 71, 67, 64, 62, 64],
    bass: [48, 0, 0, 0, 48, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 48],
  },
  forest: {
    bpm: 118,
    lead: [74, 71, 69, 71, 74, 0, 76, 74, 71, 69, 67, 69, 71, 0, 69, 67],
    bass: [50, 0, 0, 50, 45, 0, 0, 45, 43, 0, 0, 43, 50, 0, 0, 50],
  },
  cave: {
    bpm: 100,
    lead: [69, 0, 72, 76, 74, 72, 69, 67, 69, 0, 64, 67, 69, 67, 64, 62],
    bass: [45, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0, 45, 0, 0, 40],
  },
  guardian: {
    bpm: 92,
    lead: [60, 0, 58, 60, 65, 0, 63, 60, 58, 0, 55, 58, 60, 0, 55, 53],
    bass: [36, 0, 36, 0, 41, 0, 41, 0, 43, 0, 36, 0, 36, 0, 41, 0],
  },
  dragon: {
    bpm: 126,
    lead: [64, 67, 71, 72, 71, 67, 64, 62, 64, 67, 71, 74, 72, 71, 67, 64],
    bass: [40, 0, 40, 0, 47, 0, 45, 0, 43, 0, 40, 0, 45, 0, 40, 0],
  },
  victory: {
    bpm: 132,
    lead: [60, 64, 67, 72, 76, 72, 67, 64, 72, 76, 79, 76, 72, 67, 64, 60],
    bass: [48, 0, 55, 0, 52, 0, 48, 0, 48, 0, 55, 0, 53, 0, 48, 0],
  },
  ending: {
    bpm: 84,
    lead: [64, 67, 69, 67, 64, 62, 60, 62, 64, 67, 72, 67, 64, 60, 62, 64],
    bass: [48, 0, 0, 43, 45, 0, 0, 41, 48, 0, 0, 45, 43, 0, 0, 48],
  },
};

function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private unlocked = false;
  private current: SongId | null = null;
  private intense = false;
  private playing = false;
  private voices = 0;
  musicEnabled = true;
  sfxEnabled = true;
  volume = 0.85;

  private readonly onVis = (): void => {
    if (!this.ctx || !this.unlocked) return;
    if (document.hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  };

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.onVis);
    }
  }

  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    this.unlocked = true;
    if (ctx.state === "suspended") void ctx.resume();
    if (this.current && !this.playing) this.startLoop();
  }

  playMusic(id: SongId, intense = false): void {
    if (this.current === id && this.intense === intense && this.playing) return;
    this.current = id;
    this.intense = intense;
    this.step = 0;
    if (!this.ctx || !this.unlocked) return;
    this.startLoop();
  }

  stopMusic(): void {
    this.current = null;
    this.playing = false;
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = 0;
  }

  setMusicEnabled(on: boolean): void {
    this.musicEnabled = on;
    this.applyGains();
  }

  setSfxEnabled(on: boolean): void {
    this.sfxEnabled = on;
    this.applyGains();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.applyGains();
  }

  sfx(id: SfxId): void {
    if (!this.sfxEnabled || !this.unlocked || this.voices > 10) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const tone = (freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) => {
      this.voice(ctx, () => {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + delay);
        amp.gain.setValueAtTime(0.0001, now + delay);
        amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + delay + 0.015);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
        osc.connect(amp);
        amp.connect(this.sfxGain!);
        osc.start(now + delay);
        osc.stop(now + delay + dur + 0.02);
        osc.onended = () => {
          osc.disconnect();
          amp.disconnect();
          this.voices = Math.max(0, this.voices - 1);
        };
      });
    };
    const burst = (dur: number, gain: number, freq = 800) => {
      if (!this.noise) return;
      this.voice(ctx, () => {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = freq;
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(gain, now);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(filter);
        filter.connect(amp);
        amp.connect(this.sfxGain!);
        src.start(now);
        src.stop(now + dur);
        src.onended = () => {
          src.disconnect();
          filter.disconnect();
          amp.disconnect();
          this.voices = Math.max(0, this.voices - 1);
        };
      });
    };
    if (id === "click") tone(720, 0.06, "square", 0.05);
    else if (id === "confirm") {
      tone(523, 0.08, "square", 0.05);
      tone(784, 0.1, "square", 0.05, 0.07);
    } else if (id === "correct") {
      tone(523, 0.1, "square", 0.06);
      tone(659, 0.1, "square", 0.06, 0.08);
      tone(784, 0.14, "square", 0.06, 0.16);
    } else if (id === "wrong") {
      tone(392, 0.12, "triangle", 0.07);
      tone(311, 0.16, "triangle", 0.06, 0.09);
    } else if (id === "timeout") tone(180, 0.22, "sawtooth", 0.04);
    else if (id === "sword") burst(0.12, 0.08, 1400);
    else if (id === "impact") {
      burst(0.1, 0.1, 240);
      tone(140, 0.12, "sine", 0.08);
    } else if (id === "magic") {
      tone(880, 0.1, "sine", 0.05);
      tone(1174, 0.12, "sine", 0.04, 0.06);
      tone(1568, 0.16, "sine", 0.04, 0.12);
    } else if (id === "hurt") tone(440, 0.16, "triangle", 0.07);
    else if (id === "down") {
      tone(523, 0.08, "square", 0.05);
      tone(392, 0.12, "square", 0.05, 0.08);
    } else if (id === "card") tone(680, 0.05, "square", 0.04);
    else if (id === "pair") {
      tone(784, 0.08, "square", 0.05);
      tone(1046, 0.1, "square", 0.05, 0.07);
    } else if (id === "tick") tone(980, 0.04, "square", 0.03);
    else if (id === "star") {
      tone(523, 0.08, "square", 0.05);
      tone(659, 0.08, "square", 0.05, 0.07);
      tone(784, 0.08, "square", 0.05, 0.14);
      tone(1046, 0.12, "square", 0.05, 0.21);
    } else if (id === "boss") {
      tone(196, 0.16, "sawtooth", 0.04);
      tone(247, 0.16, "triangle", 0.05, 0.1);
      tone(294, 0.2, "triangle", 0.05, 0.2);
    } else if (id === "defeat") {
      tone(392, 0.14, "triangle", 0.05);
      tone(349, 0.14, "triangle", 0.05, 0.12);
      tone(330, 0.16, "triangle", 0.05, 0.24);
      tone(262, 0.22, "triangle", 0.05, 0.36);
    } else if (id === "victory") {
      tone(523, 0.1, "square", 0.05);
      tone(659, 0.1, "square", 0.05, 0.1);
      tone(784, 0.18, "square", 0.06, 0.2);
    }
  }

  dispose(): void {
    this.stopMusic();
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this.onVis);
    void this.ctx?.close();
    this.ctx = null;
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 0.4);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.applyGains();
    return ctx;
  }

  private applyGains(): void {
    if (!this.ctx || !this.master || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.volume * this.volume;
    this.master.gain.setTargetAtTime(master, now, 0.03);
    this.musicGain.gain.setTargetAtTime(this.musicEnabled ? 0.55 : 0, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? 0.8 : 0, now, 0.03);
  }

  private startLoop(): void {
    if (!this.ctx || !this.current) return;
    this.playing = true;
    this.nextTime = this.ctx.currentTime + 0.05;
    if (this.timer) window.clearTimeout(this.timer);
    this.pump();
  }

  private pump = (): void => {
    const ctx = this.ctx;
    const id = this.current;
    if (!ctx || !id || !this.playing || !this.musicGain) return;
    const song = SONGS[id];
    const tempo = song.bpm * (this.intense && id === "dragon" ? 1.18 : 1);
    const stepDur = 60 / tempo / 2;
    const horizon = ctx.currentTime + 0.28;
    while (this.nextTime < horizon) {
      const index = this.step % song.lead.length;
      if (this.musicEnabled) {
        const lead = song.lead[index] ?? 0;
        const bass = song.bass[index] ?? 0;
        if (lead) this.note(lead, stepDur * 0.9, "square", 0.05, this.nextTime);
        if (this.intense && lead) this.note(lead + 12, stepDur * 0.7, "triangle", 0.03, this.nextTime);
        if (bass) this.note(bass, stepDur * 1.4, "triangle", 0.07, this.nextTime);
        if (index % 2 === 0) this.drum(index % 4 === 0 ? "kick" : "hat", this.nextTime);
        if (index % 8 === 4) this.drum("snare", this.nextTime);
      }
      this.step += 1;
      this.nextTime += stepDur;
    }
    this.timer = window.setTimeout(this.pump, 70);
  };

  private note(midi: number, dur: number, type: OscillatorType, gain: number, when: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = midiToFreq(midi);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(gain, when + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.05, dur));
    osc.connect(amp);
    amp.connect(this.musicGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  }

  private drum(kind: "kick" | "snare" | "hat", when: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    if (kind === "kick") {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, when);
      osc.frequency.exponentialRampToValueAtTime(50, when + 0.12);
      amp.gain.setValueAtTime(0.12, when);
      amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
      osc.connect(amp);
      amp.connect(this.musicGain);
      osc.start(when);
      osc.stop(when + 0.15);
      osc.onended = () => {
        osc.disconnect();
        amp.disconnect();
      };
      return;
    }
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = kind === "hat" ? "highpass" : "bandpass";
    filter.frequency.value = kind === "hat" ? 6000 : 1400;
    const amp = ctx.createGain();
    const dur = kind === "hat" ? 0.04 : 0.1;
    amp.gain.setValueAtTime(kind === "hat" ? 0.03 : 0.06, when);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.musicGain);
    src.start(when);
    src.stop(when + dur);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      amp.disconnect();
    };
  }

  private voice(ctx: AudioContext, start: () => void): void {
    if (ctx.state !== "running") return;
    this.voices += 1;
    start();
  }
}
