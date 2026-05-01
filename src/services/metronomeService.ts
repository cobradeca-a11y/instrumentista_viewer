// src/services/metronomeService.ts
// Web Audio API metronome — no external files

let ctx: AudioContext | null = null;
let timerID: ReturnType<typeof setTimeout> | null = null;
let nextNoteTime = 0;
let currentBeat = 0;
let beatsPerBar = 4;
let _bpm = 80;
let _soundEnabled = true;
let _onTick: ((beat: number) => void) | null = null;
let _running = false;

const LOOK_AHEAD = 0.1;    // seconds
const SCHEDULE_AHEAD = 25; // ms

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function scheduleClick(time: number, isAccent: boolean) {
  if (!_soundEnabled) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.frequency.value = isAccent ? 1000 : 800;
  gain.gain.setValueAtTime(isAccent ? 0.6 : 0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.start(time);
  osc.stop(time + 0.08);
}

function scheduler() {
  const c = getCtx();
  while (nextNoteTime < c.currentTime + LOOK_AHEAD) {
    const beat = currentBeat % beatsPerBar;
    scheduleClick(nextNoteTime, beat === 0);
    if (_onTick) _onTick(beat);
    const secondsPerBeat = 60.0 / _bpm;
    nextNoteTime += secondsPerBeat;
    currentBeat++;
  }
  timerID = setTimeout(scheduler, SCHEDULE_AHEAD);
}

export const metronomeService = {
  start(bpm: number, beats: number, onTick: (beat: number) => void, sound = true) {
    if (_running) this.stop();
    _bpm = bpm;
    beatsPerBar = beats;
    _onTick = onTick;
    _soundEnabled = sound;
    _running = true;
    currentBeat = 0;
    const c = getCtx();
    if (c.state === "suspended") c.resume();
    nextNoteTime = c.currentTime + 0.05;
    scheduler();
  },

  stop() {
    _running = false;
    if (timerID) clearTimeout(timerID);
    timerID = null;
    currentBeat = 0;
  },

  isRunning() {
    return _running;
  },

  setBpm(bpm: number) {
    _bpm = bpm;
  },

  setSound(enabled: boolean) {
    _soundEnabled = enabled;
  },
};
