import { useRef, useState, useEffect } from "react";
import { Upload, Play, Pause, Square, SkipBack, Volume2, Repeat } from "lucide-react";
import * as Tone from "tone";
import {
  loadMidiFile, playMidi, pauseMidi, stopMidi,
  setVolume, setBpm, setLoopRange, clearLoopRange,
  getMidiState, resumeMidi, parseMidi,
} from "../../services/midiService";
import { saveFile, getFile, midiKey } from "../../services/storageService";

interface MidiPlayerProps {
  louvorId: string;
  defaultBpm?: number;
}

export default function MidiPlayer({ louvorId, defaultBpm = 80 }: MidiPlayerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [midiLoaded, setMidiLoaded] = useState(false);
  const [fileName, setFileName]     = useState("");
  const [isPlaying, setIsPlaying]   = useState(false);
  const [isPaused, setIsPaused]     = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [vol, setVol]               = useState(0.8);
  const [bpmVal, setBpmVal]         = useState(defaultBpm);
  const [markA, setMarkA]           = useState<number | null>(null);
  const [markB, setMarkB]           = useState<number | null>(null);
  const [loopActive, setLoopActive] = useState(false);
  const [midiInfo, setMidiInfo]     = useState<ReturnType<typeof parseMidi> | null>(null);
  const [error, setError]           = useState("");

  // Load saved MIDI from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await getFile(midiKey(louvorId));
        if (!stored) return;
        const blob = new Blob([stored.data], { type: "audio/midi" });
        const file = new File([blob], stored.name, { type: "audio/midi" });
        const midi = await loadMidiFile(file);
        setFileName(stored.name);
        setDuration(midi.duration);
        setMidiInfo(parseMidi(midi));
        setMidiLoaded(true);
        setBpm(bpmVal);
      } catch {
        // No saved MIDI — normal
      }
    })();
  }, [louvorId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      await saveFile(midiKey(louvorId), file);
      const midi = await loadMidiFile(file);
      setFileName(file.name);
      setDuration(midi.duration);
      setMidiInfo(parseMidi(midi));
      setMidiLoaded(true);
      setBpm(bpmVal);
    } catch {
      setError("Erro ao carregar MIDI. Verifique o arquivo.");
    }
  }

  function onProgress(t: number) {
    setProgress(t);
    const dur = getMidiState().duration;
    if (t >= dur - 0.2) {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  }

  const handlePlay = async () => {
    if (isPaused) {
      resumeMidi(onProgress);
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      await playMidi(onProgress);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => { pauseMidi(); setIsPlaying(false); setIsPaused(true); };

  const handleStop = () => {
    stopMidi();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  const handleVol = (v: number) => { setVol(v); setVolume(v); };
  const handleBpm = (v: number) => { setBpmVal(v); setBpm(v); };

  // Seek by clicking progress bar
  const handleSeek = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!midiLoaded || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = ratio * duration;

    // Stop current playback, set transport to new position, restart
    const wasPlaying = isPlaying;
    stopMidi();
    setProgress(seekTo);

    if (wasPlaying) {
      // Temporarily set loopStart to seekTo for playback offset
      if (loopActive && markA !== null && markB !== null) {
        setLoopRange(seekTo, markB);
      } else {
        setLoopRange(seekTo, duration);
      }
      await Tone.start();
      await playMidi(onProgress);
      if (!loopActive) clearLoopRange();
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const markStart = () => {
    const t = progress;
    setMarkA(t);
    if (markB !== null && t < markB) {
      setLoopRange(t, markB);
    }
  };

  const markEnd = () => {
    const t = progress;
    setMarkB(t);
    if (markA !== null && t > markA) {
      setLoopRange(markA, t);
    }
  };

  const toggleLoop = () => {
    if (loopActive) {
      setLoopActive(false);
      clearLoopRange();
    } else {
      if (markA !== null && markB !== null && markA < markB) {
        setLoopActive(true);
        setLoopRange(markA, markB);
      }
    }
  };

  const handleClearLoop = () => {
    setMarkA(null);
    setMarkB(null);
    setLoopActive(false);
    clearLoopRange();
  };

  const fmt = (t: number) =>
    `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const markAPct    = duration > 0 && markA !== null ? (markA / duration) * 100 : null;
  const markBPct    = duration > 0 && markB !== null ? (markB / duration) * 100 : null;

  return (
    <div className="flex flex-col gap-3 bg-panel border border-panel-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Áudio / MIDI
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-gold transition-colors"
        >
          <Upload size={12} /> Carregar
        </button>
      </div>

      <input ref={inputRef} type="file" accept=".mid,.midi" onChange={handleUpload} className="hidden" />

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!midiLoaded ? (
        <div
          className="border border-dashed border-panel-border rounded-lg h-16 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={16} className="text-slate-700" />
          <span className="text-xs text-slate-600">.mid / .midi</span>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 truncate">{fileName}</p>

          {midiInfo && (
            <div className="text-[10px] text-slate-600 flex gap-2 flex-wrap">
              <span>{midiInfo.tracks.length} faixa(s)</span>
              <span>BPM: {Math.round(midiInfo.bpm)}</span>
              <span>{fmt(midiInfo.duration)}</span>
            </div>
          )}

          {/* Progress bar — clickable to seek */}
          <div
            className="relative h-2.5 bg-panel-light rounded-full overflow-visible cursor-pointer group"
            onClick={handleSeek}
            title="Clique para reposicionar"
          >
            {/* Loop region highlight */}
            {loopActive && markAPct !== null && markBPct !== null && (
              <div
                className="absolute top-0 h-full bg-blue-500/20 border-x border-blue-500/40"
                style={{ left: `${markAPct}%`, width: `${markBPct - markAPct}%` }}
              />
            )}
            {/* Progress fill */}
            <div
              className="absolute top-0 h-full bg-gold rounded-full"
              style={{ width: `${progressPct}%` }}
            />
            {/* Playhead */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold border-2 border-ink shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
            {/* Marker A */}
            {markAPct !== null && (
              <div
                className="absolute top-0 h-full w-0.5 bg-blue-400"
                style={{ left: `${markAPct}%` }}
                title={`A: ${fmt(markA!)}`}
              />
            )}
            {/* Marker B */}
            {markBPct !== null && (
              <div
                className="absolute top-0 h-full w-0.5 bg-orange-400"
                style={{ left: `${markBPct}%` }}
                title={`B: ${fmt(markB!)}`}
              />
            )}
          </div>

          <div className="flex justify-between text-[10px] text-slate-600">
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={handleStop} className="text-slate-500 hover:text-slate-300 transition-colors" title="Parar e voltar ao início">
              <SkipBack size={15} />
            </button>
            <button onClick={handleStop} className="text-slate-500 hover:text-slate-300 transition-colors" title="Parar">
              <Square size={15} />
            </button>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="w-10 h-10 rounded-full bg-gold text-ink flex items-center justify-center hover:bg-gold-light transition-colors flex-shrink-0"
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button
              onClick={toggleLoop}
              title={loopActive ? "Desativar loop A-B" : "Ativar loop A-B"}
              className={`transition-colors ${
                loopActive
                  ? "text-blue-400"
                  : markA !== null && markB !== null
                  ? "text-slate-400 hover:text-blue-400"
                  : "text-slate-700 cursor-default"
              }`}
              disabled={markA === null || markB === null}
            >
              <Repeat size={15} />
            </button>
          </div>

          {/* Volume + BPM */}
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 flex-1">
              <Volume2 size={11} className="text-slate-500 flex-shrink-0" />
              <input type="range" min={0} max={1} step={0.05} value={vol}
                onChange={(e) => handleVol(Number(e.target.value))}
                className="flex-1 accent-amber-400" />
              <span className="text-[10px] text-slate-600 w-5 text-right">{Math.round(vol * 100)}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-[10px] text-slate-500 flex-shrink-0">BPM</span>
              <input type="range" min={40} max={200} value={bpmVal}
                onChange={(e) => handleBpm(Number(e.target.value))}
                className="flex-1 accent-amber-400" />
              <span className="text-gold text-[10px] font-bold w-7 text-right">{bpmVal}</span>
            </div>
          </div>

          {/* Loop markers */}
          <div className="flex gap-1.5">
            <button
              onClick={markStart}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-all
                ${markA !== null ? "border-blue-700 text-blue-400 bg-blue-900/20" : "border-panel-border text-slate-500 hover:text-blue-400 hover:border-blue-800"}`}
            >
              A {markA !== null ? fmt(markA) : "—"}
            </button>
            <button
              onClick={markEnd}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-all
                ${markB !== null ? "border-orange-700 text-orange-400 bg-orange-900/20" : "border-panel-border text-slate-500 hover:text-orange-400 hover:border-orange-800"}`}
            >
              B {markB !== null ? fmt(markB) : "—"}
            </button>
            <button
              onClick={handleClearLoop}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-panel-border text-slate-600 hover:text-red-400 transition-all"
              title="Limpar marcadores"
            >
              ✕
            </button>
          </div>

          {/* Status + fallback notice */}
          <div className="flex items-center justify-between text-[10px]">
            <span className={
              isPlaying  ? "text-green-600" :
              isPaused   ? "text-amber-600" :
              loopActive ? "text-blue-600"  : "text-slate-700"
            }>
              {isPlaying  ? "● Tocando"
               : isPaused   ? "❙❙ Pausado"
               : loopActive ? "⟲ Loop A-B ativo"
               : "Pronto"}
            </span>
            <span className="text-slate-700 italic">síntese Tone.js</span>
          </div>
        </>
      )}
    </div>
  );
}
