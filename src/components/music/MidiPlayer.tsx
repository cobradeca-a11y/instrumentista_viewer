import { useRef, useState } from "react";
import { Upload, Play, Pause, Square, SkipBack, SkipForward, Volume2, Repeat } from "lucide-react";
import { loadMidiFile, playMidi, pauseMidi, stopMidi, setVolume, setBpm, setLoopRange, clearLoopRange, getMidiState, resumeMidi, parseMidi,  } from "../../services/midiService";
import { saveFile, midiKey } from "../../services/storageService";

interface MidiPlayerProps {
  louvorId: string;
  defaultBpm?: number;
}

export default function MidiPlayer({ louvorId, defaultBpm = 80 }: MidiPlayerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [midiLoaded, setMidiLoaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [bpmVal, setBpmVal] = useState(defaultBpm);
  const [markA, setMarkA] = useState<number | null>(null);
  const [markB, setMarkB] = useState<number | null>(null);
  const [midiInfo, setMidiInfo] = useState<ReturnType<typeof parseMidi> | null>(null);
  const [error, setError] = useState("");

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


  const handlePlay = async () => {
    if (isPaused) {
      resumeMidi((t) => {
        setProgress(t);
        const dur = getMidiState().duration;
        if (t >= dur) { setIsPlaying(false); setIsPaused(false); setProgress(0); }
      });
      setIsPlaying(true); setIsPaused(false);
    } else {
      await playMidi((t) => {
        setProgress(t);
        const dur = getMidiState().duration;
        if (t >= dur) { setIsPlaying(false); setProgress(0); }
      });
      setIsPlaying(true); setIsPaused(false);
    }
  };

  const handlePause = () => { pauseMidi(); setIsPlaying(false); setIsPaused(true); };
  const handleStop  = () => { stopMidi(); setIsPlaying(false); setIsPaused(false); setProgress(0); };

  const handleVolume = (v: number) => { setVolumeState(v); setVolume(v); };
  const handleBpm    = (v: number) => { setBpmVal(v); setBpm(v); };

  const markStart = () => setMarkA(progress);
  const markEnd   = () => { setMarkB(progress); if (markA !== null) setLoopRange(markA, progress); };
  const clearLoop = () => { setMarkA(null); setMarkB(null); clearLoopRange(); };

  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-3 bg-panel border border-panel-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Áudio / MIDI</span>
        <div className="flex gap-1">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-gold transition-colors"
          >
            <Upload size={12} /> Carregar MIDI
          </button>
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".mid,.midi" onChange={handleUpload} className="hidden" />

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!midiLoaded ? (
        <div
          className="border border-dashed border-panel-border rounded-lg h-20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={18} className="text-slate-700" />
          <span className="text-xs text-slate-600">Clique para carregar .mid / .midi</span>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 truncate">{fileName}</p>

          {midiInfo && (
            <div className="text-[10px] text-slate-600 flex gap-3">
              <span>{midiInfo.tracks.length} faixa(s)</span>
              <span>BPM original: {Math.round(midiInfo.bpm)}</span>
              <span>Duração: {fmt(midiInfo.duration)}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="relative h-1.5 bg-panel-light rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gold rounded-full transition-all"
              style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={handleStop} className="text-slate-500 hover:text-slate-300 transition-colors">
              <SkipBack size={16} />
            </button>
            <button onClick={handleStop} className="text-slate-500 hover:text-slate-300 transition-colors">
              <Square size={16} />
            </button>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="w-10 h-10 rounded-full bg-gold text-ink flex items-center justify-center hover:bg-gold-light transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <SkipForward size={16} />
            </button>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <Repeat size={16} />
            </button>
          </div>

          {/* Volume + BPM */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Volume2 size={12} className="text-slate-500" />
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => handleVolume(Number(e.target.value))}
                className="flex-1 accent-amber-400" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-500 text-xs">BPM</span>
              <input type="range" min={40} max={200} value={bpmVal}
                onChange={(e) => handleBpm(Number(e.target.value))}
                className="flex-1 accent-amber-400" />
              <span className="text-gold text-xs w-8 text-right font-bold">{bpmVal}</span>
            </div>
          </div>

          {/* Loop markers */}
          <div className="flex gap-2">
            <button onClick={markStart}
              className="flex-1 text-xs py-1.5 rounded-lg border border-panel-border text-slate-500 hover:text-blue-400 hover:border-blue-800 transition-all">
              A {markA !== null ? fmt(markA) : "—"}
            </button>
            <button onClick={markEnd}
              className="flex-1 text-xs py-1.5 rounded-lg border border-panel-border text-slate-500 hover:text-orange-400 hover:border-orange-800 transition-all">
              B {markB !== null ? fmt(markB) : "—"}
            </button>
            <button onClick={clearLoop}
              className="text-xs py-1.5 px-3 rounded-lg border border-panel-border text-slate-600 hover:text-red-400 transition-all">
              ✕
            </button>
          </div>

          <p className="text-[10px] text-slate-700 italic text-center">
            MIDI carregado. Reprodução sonora requer engine/soundfont configurado.
          </p>
        </>
      )}
    </div>
  );
}
