// src/services/midiService.ts
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";;

interface MidiState {
  midi: Midi | null;
  fileName: string;
  duration: number;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  loopStart: number | null;
  loopEnd: number | null;
  volume: number;
  bpm: number;
}

const state: MidiState = {
  midi: null,
  fileName: "",
  duration: 0,
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  loopStart: null,
  loopEnd: null,
  volume: 0.8,
  bpm: 120,
};

// Synths pool
const synths: Tone.PolySynth[] = [];
let progressInterval: ReturnType<typeof setInterval> | null = null;
let onProgressCb: ((t: number) => void) | null = null;

function clearSynths() {
  synths.forEach((s) => {
    s.releaseAll();
    s.dispose();
  });
  synths.length = 0;
}

export async function loadMidiFile(file: File): Promise<Midi> {
  const buffer = await file.arrayBuffer();
  const midi = new Midi(buffer);
  state.midi = midi;
  state.fileName = file.name;
  state.duration = midi.duration;
  state.bpm = midi.header.tempos[0]?.bpm ?? 120;
  state.isPlaying = false;
  state.isPaused = false;
  state.currentTime = 0;
  Tone.getTransport().bpm.value = state.bpm;
  return midi;
}

export function parseMidi(midi: Midi) {
  return {
    tracks: midi.tracks.map((t) => ({
      name: t.name,
      noteCount: t.notes.length,
      instrument: t.instrument.name,
    })),
    bpm: midi.header.tempos[0]?.bpm ?? 120,
    duration: midi.duration,
    timeSignature: midi.header.timeSignatures[0]?.timeSignature ?? [4, 4],
  };
}

export async function playMidi(onProgress?: (t: number) => void) {
  if (!state.midi) return;
  onProgressCb = onProgress ?? null;

  await Tone.start();
  clearSynths();
  Tone.getTransport().cancel();
  Tone.getTransport().stop();

  const startOffset = state.loopStart ?? 0;
  Tone.getTransport().seconds = startOffset;
  Tone.getTransport().bpm.value = state.bpm;
  // volume applied per synth

  state.midi.tracks.forEach((track) => {
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 },
    }).toDestination();
    synths.push(synth);

    track.notes.forEach((note) => {
      const t = note.time - startOffset;
      if (t < 0) return;
      if (state.loopEnd !== null && note.time > state.loopEnd) return;
      Tone.getTransport().schedule((time) => {
        synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
      }, t);
    });
  });

  const endTime = state.loopEnd ?? state.duration;
  Tone.getTransport().schedule(() => {
    stopMidi();
  }, endTime - startOffset + 0.1);

  Tone.getTransport().start();
  state.isPlaying = true;
  state.isPaused = false;

  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    state.currentTime = Tone.getTransport().seconds + (state.loopStart ?? 0);
    if (onProgressCb) onProgressCb(state.currentTime);
  }, 100);
}

export function pauseMidi() {
  if (!state.isPlaying) return;
  Tone.getTransport().pause();
  state.isPlaying = false;
  state.isPaused = true;
  if (progressInterval) clearInterval(progressInterval);
}

export function resumeMidi(onProgress?: (t: number) => void) {
  if (!state.isPaused) return;
  onProgressCb = onProgress ?? null;
  Tone.getTransport().start();
  state.isPlaying = true;
  state.isPaused = false;
  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    state.currentTime = Tone.getTransport().seconds + (state.loopStart ?? 0);
    if (onProgressCb) onProgressCb(state.currentTime);
  }, 100);
}

export function stopMidi() {
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
  clearSynths();
  state.isPlaying = false;
  state.isPaused = false;
  state.currentTime = 0;
  if (progressInterval) clearInterval(progressInterval);
}

export function setVolume(value: number) {
  state.volume = Math.max(0, Math.min(1, value));
  // volume applied per synth
}

export function setBpm(value: number) {
  state.bpm = value;
  Tone.getTransport().bpm.value = value;
}

export function setLoopRange(start: number, end: number) {
  state.loopStart = start;
  state.loopEnd = end;
}

export function clearLoopRange() {
  state.loopStart = null;
  state.loopEnd = null;
}

export function getMidiState(): Readonly<MidiState> {
  return state;
}
