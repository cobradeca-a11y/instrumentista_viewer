import { Target, Lightbulb, AlertTriangle } from "lucide-react";;
import type { NivelPedagogico } from "../../types/music";

interface ObjectivePanelProps {
  nivel: NivelPedagogico;
  objetivo: string;
  dica: string;
  erroProvavel: string;
}

const NIVEL_COLOR: Record<NivelPedagogico, { accent: string; bg: string; border: string }> = {
  aprendiz:     { accent: "#22c55e", bg: "#05301820", border: "#22c55e40" },
  intermediario:{ accent: "#60a5fa", bg: "#1e3a5f20", border: "#60a5fa40" },
  profissional: { accent: "#f0b429", bg: "#42200620", border: "#f0b42940" },
};

export function ObjectivePanel({ nivel, objetivo, dica, erroProvavel }: ObjectivePanelProps) {
  const col = NIVEL_COLOR[nivel];
  return (
    <div className="flex flex-col gap-2">
      <div
        className="rounded-xl border p-3 flex gap-2"
        style={{ background: col.bg, borderColor: col.border }}
      >
        <Target size={14} style={{ color: col.accent, flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: col.accent }}>
            Objetivo
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{objetivo}</p>
        </div>
      </div>

      <div className="rounded-xl border border-panel-border bg-panel p-3 flex gap-2">
        <Lightbulb size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Dica</div>
          <p className="text-xs text-slate-400 leading-relaxed">{dica}</p>
        </div>
      </div>

      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 flex gap-2">
        <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Erro provável</div>
          <p className="text-xs text-red-400 leading-relaxed">{erroProvavel}</p>
        </div>
      </div>
    </div>
  );
}
