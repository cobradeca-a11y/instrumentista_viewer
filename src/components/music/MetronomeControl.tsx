import { useState, useEffect } from "react";
import { Gauge, Volume2, VolumeX } from "lucide-react";
import { metronomeService } from "../../services/metronomeService";

interface MetronomeControlProps {
  defaultBpm?: number;
  beats?: number;
  onBeat?: (beat: number) => void;
  inline?: boolean;
}

export default function MetronomeControl({
  defaultBpm = 80,
  beats = 4,
  onBeat,
  inline = false,
}: MetronomeControlProps) {
  const [bpm, setBpm] = useState(defaultBpm);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [open, setOpen] = useState(false);

  const toggleMetronome = () => {
    if (running) {
      metronomeService.stop();
      setRunning(false);
      setCurrentBeat(-1);
    } else {
      metronomeService.start(bpm, beats, (beat) => {
        setCurrentBeat(beat);
        if (onBeat) onBeat(beat);
      }, sound);
      setRunning(true);
    }
  };

  useEffect(() => {
    return () => { metronomeService.stop(); };
  }, []);

  useEffect(() => {
    metronomeService.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    metronomeService.setSound(sound);
  }, [sound]);

  if (inline) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-panel rounded-xl border border-panel-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-300">Metrônomo</span>
          <button
            onClick={() => setSound(!sound)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>

        <div className="flex gap-2 justify-center">
          {Array.from({ length: beats }).map((_, i) => (
            <div
              key={i}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2
                ${running && currentBeat === i
                  ? i === 0
                    ? "bg-gold text-ink border-gold scale-110"
                    : "bg-amber-500/40 text-amber-300 border-amber-500"
                  : "bg-panel-light text-slate-600 border-panel-border"
                }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range" min={40} max={200} value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1 accent-amber-400"
          />
          <span className="text-gold font-bold text-sm w-12 text-right">{bpm}</span>
        </div>

        <button
          onClick={toggleMetronome}
          className={`py-2 rounded-lg font-bold text-sm transition-all
            ${running ? "bg-red-900/50 text-red-400 border border-red-800" : "bg-gold text-ink"}`}
        >
          {running ? "⏹ Parar" : "▶ Iniciar"}
        </button>
      </div>
    );
  }

  // Compact header button
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all
          ${running
            ? "bg-gold/20 border-gold/50 text-gold"
            : "border-panel-border text-slate-500 hover:text-slate-300"
          }`}
      >
        <Gauge size={13} />
        <span>{bpm}</span>
        {running && (
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-56 bg-panel-light border border-panel-border rounded-xl p-3 shadow-xl">
          <div className="flex gap-2 justify-center mb-3">
            {Array.from({ length: beats }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border
                  ${running && currentBeat === i
                    ? i === 0 ? "bg-gold text-ink border-gold" : "bg-amber-500/30 text-amber-300 border-amber-500"
                    : "bg-panel border-panel-border text-slate-600"
                  }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input type="range" min={40} max={200} value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="flex-1 accent-amber-400" />
            <span className="text-gold font-bold text-sm w-10 text-right">{bpm}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleMetronome}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                ${running ? "bg-red-900/50 text-red-400" : "bg-gold text-ink"}`}
            >
              {running ? "Parar" : "Iniciar"}
            </button>
            <button
              onClick={() => setSound(!sound)}
              className="w-9 h-9 rounded-lg bg-panel border border-panel-border text-slate-400 hover:text-slate-200 flex items-center justify-center"
            >
              {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
