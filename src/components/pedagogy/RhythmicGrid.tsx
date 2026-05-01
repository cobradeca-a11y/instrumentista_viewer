import type { SecaoMusical, SegmentoMusical } from "../../types/music";

interface SubDiv {
  label: string;
  idx: number;
  isNum: boolean;
  acento: string;
  acentoColor: string;
  isStrong: boolean;
}

function buildSubdivisions(formula: string): SubDiv[] {
  const beats = parseInt(formula) || 4;
  const ACENTO: Record<number, { label: string; color: string; strong: boolean }> = {
    0: { label: "Forte",  color: "#f0b429", strong: true  },
    2: { label: "Médio",  color: "#94a3b8", strong: false },
    4: { label: "Forte",  color: "#f0b429", strong: true  },
    6: { label: "Médio",  color: "#94a3b8", strong: false },
  };
  const cells: SubDiv[] = [];
  for (let i = 0; i < beats; i++) {
    const numIdx = i * 2;
    const eIdx   = i * 2 + 1;
    const ac = ACENTO[numIdx] ?? { label: "fraco", color: "#475569", strong: false };
    cells.push({
      label: String(i + 1), idx: numIdx,
      isNum: true, acento: ac.label, acentoColor: ac.color, isStrong: ac.strong,
    });
    cells.push({
      label: "e", idx: eIdx,
      isNum: false, acento: "fraco", acentoColor: "#334155", isStrong: false,
    });
  }
  return cells;
}

interface RhythmicGridProps {
  secao: SecaoMusical;
  compassoAtivo?: number;
}

export default function RhythmicGrid({ secao, compassoAtivo }: RhythmicGridProps) {
  const comp =
    secao.linhas.flatMap(l => l.compassos).find(c => c.numero === compassoAtivo) ??
    secao.linhas[0]?.compassos[0];

  if (!comp) return null;

  const formula = comp.formula || "4/4";
  const subdivs = buildSubdivisions(formula);

  // Map each chord segment to its subdivision index
  const chordAtSub: Record<number, SegmentoMusical> = {};
  comp.segmentos.filter(s => s.acorde).forEach(s => {
    chordAtSub[(s.tempo - 1) * 2] = s;
  });

  return (
    <div className="flex flex-col gap-3 bg-panel border border-panel-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Régua Analítica
        </span>
        <span className="text-xs text-slate-600 font-mono">
          Compasso {comp.numero} — {formula}
        </span>
      </div>

      {/* Ruler cells */}
      <div className="flex gap-1">
        {subdivs.map((sub) => {
          const chord = chordAtSub[sub.idx];
          const hasChord = Boolean(chord);

          return (
            <div
              key={sub.idx}
              className={`flex flex-col items-center rounded-xl border transition-all
                ${sub.isNum ? "flex-1 py-2.5 px-1" : "w-5 py-2.5"}
                ${hasChord
                  ? "bg-gold/10 border-gold/50"
                  : sub.isStrong
                  ? "bg-panel-light border-panel-border"
                  : "bg-panel border-transparent"}`}
            >
              {/* Beat number or "e" */}
              <span
                className={`font-mono font-bold leading-none
                  ${sub.isNum ? "text-sm" : "text-[9px]"}`}
                style={{ color: sub.isNum ? sub.acentoColor : "#334155" }}
              >
                {sub.label}
              </span>

              {/* Accent label */}
              {sub.isNum && (
                <span className="text-[8px] leading-none mt-0.5" style={{ color: sub.acentoColor + "aa" }}>
                  {sub.acento}
                </span>
              )}

              {/* Chord data block — only when a chord falls here */}
              {hasChord && (
                <div className="flex flex-col items-center gap-0.5 mt-1.5 w-full">
                  {/* Chord symbol */}
                  <span className="text-sm font-bold font-mono text-blue-400 leading-none">
                    {chord.acorde}
                  </span>
                  {/* Grade */}
                  {chord.grauHarmonico && (
                    <span className="text-[9px] font-mono text-purple-400 leading-none">
                      {chord.grauHarmonico}
                    </span>
                  )}
                  {/* Function */}
                  {chord.funcaoHarmonica && (
                    <span className="text-[8px] text-slate-500 italic leading-tight text-center px-0.5">
                      {chord.funcaoHarmonica}
                    </span>
                  )}
                  {/* Syllable */}
                  {chord.silaba && chord.silaba !== chord.acorde && (
                    <span className="text-[8px] text-slate-600 leading-tight mt-0.5">
                      "{chord.silaba}"
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chord summary row — horizontal list with full data */}
      {comp.segmentos.filter(s => s.acorde).length > 0 && (
        <div className="flex gap-2 flex-wrap pt-2 border-t border-panel-border">
          <span className="text-[9px] text-slate-700 uppercase tracking-wider self-center flex-shrink-0">
            Progressão:
          </span>
          {comp.segmentos.filter(s => s.acorde).map((s, i, arr) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center bg-panel-light border border-panel-border rounded-lg px-2.5 py-1.5">
                <span className="text-sm font-bold font-mono text-blue-400 leading-none">{s.acorde}</span>
                <div className="flex gap-1 mt-0.5">
                  {s.grauHarmonico && (
                    <span className="text-[9px] font-mono text-purple-400">{s.grauHarmonico}</span>
                  )}
                  {s.funcaoHarmonica && (
                    <span className="text-[9px] text-slate-600 italic">{s.funcaoHarmonica}</span>
                  )}
                </div>
                <span className="text-[8px] text-slate-700">T.{s.tempo}</span>
              </div>
              {i < arr.length - 1 && (
                <span className="text-slate-700 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
