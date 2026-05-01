import type { SecaoMusical } from "../../types/music";

const ACENTO_LABELS: Record<number, string> = {
  0: "Forte",
  1: "fraco",
  2: "Médio",
  3: "fraco",
  4: "Forte",
  5: "fraco",
  6: "Médio",
  7: "fraco",
};

const BEAT_LABELS = ["1", "e", "2", "e", "3", "e", "4", "e"];

interface RhythmicGridProps {
  secao: SecaoMusical;
  compassoAtivo?: number;
}

export default function RhythmicGrid({ secao, compassoAtivo }: RhythmicGridProps) {
  const comp = secao.linhas
    .flatMap((l) => l.compassos)
    .find((c) => c.numero === compassoAtivo) ?? secao.linhas[0]?.compassos[0];

  if (!comp) return null;

  const chordSegs = comp.segmentos.filter((s) => s.acorde !== null);

  return (
    <div className="flex flex-col gap-3 bg-panel border border-panel-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grade Rítmica</span>
        <span className="text-xs text-slate-600">Compasso {comp.numero} — {comp.formula}</span>
      </div>

      {/* Beat ruler */}
      <div className="flex gap-1">
        {BEAT_LABELS.map((label, i) => {
          const hasChord = chordSegs.some((s) => s.tempo * 2 - 2 === i || (s.tempo - 1) * 2 === i);
          const isStrong = i === 0 || i === 4;
          const isMedium = i === 2 || i === 6;
          return (
            <div
              key={i}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-all
                ${hasChord
                  ? "bg-gold/15 border-gold/40"
                  : isStrong
                  ? "bg-panel-light border-panel-border"
                  : "bg-panel border-transparent"}`}
            >
              <span className={`text-sm font-bold font-mono ${isStrong ? "text-slate-200" : isMedium ? "text-slate-400" : "text-slate-600"}`}>
                {label}
              </span>
              <span className={`text-[9px] ${isStrong ? "text-gold" : isMedium ? "text-slate-500" : "text-slate-700"}`}>
                {ACENTO_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chord map over beats */}
      {chordSegs.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Acordes neste compasso</span>
          <div className="flex gap-2 flex-wrap">
            {chordSegs.map((s) => (
              <div key={s.id} className="flex items-center gap-2 bg-panel-light border border-panel-border rounded-lg px-3 py-2">
                <div>
                  <div className="text-base font-bold text-blue-400 font-mono leading-none">{s.acorde}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Tempo {s.tempo}</div>
                </div>
                {s.grauHarmonico && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono text-purple-400">{s.grauHarmonico}</span>
                    {s.funcaoHarmonica && (
                      <span className="text-[9px] text-slate-600 italic">{s.funcaoHarmonica}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
