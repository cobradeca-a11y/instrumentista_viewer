import { useNavigate } from "react-router-dom";
import { BarChart2, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { LOUVORES } from "../data/louvores";
import Sidebar from "../components/layout/Sidebar";
import type { NivelPedagogico } from "../types/music";

// Mock progress data — will come from IndexedDB in a future version
const PROGRESSO_MOCK: Record<string, Record<NivelPedagogico, number>> = {
  "001": { aprendiz: 32, intermediario: 12, profissional: 0 },
  "002": { aprendiz: 0,  intermediario: 0,  profissional: 0 },
  "003": { aprendiz: 0,  intermediario: 0,  profissional: 0 },
};

const NIVEL_INFO: { nivel: NivelPedagogico; label: string; color: string }[] = [
  { nivel: "aprendiz",     label: "Aprendiz",     color: "#22c55e" },
  { nivel: "intermediario",label: "Intermediário", color: "#60a5fa" },
  { nivel: "profissional", label: "Profissional",  color: "#f0b429" },
];

function Ring({ value, color, size = 48 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${circ * value / 100} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text
        x={size/2} y={size/2 + 4}
        textAnchor="middle"
        fontSize={size < 48 ? 9 : 11}
        fill={color}
        fontWeight="bold"
      >
        {value}%
      </text>
    </svg>
  );
}

export default function ProgressoPage() {
  const nav = useNavigate();

  const totalLouvores    = LOUVORES.length;
  const louvoresAtivos   = LOUVORES.filter(l => l.status !== "pendente").length;
  const progressoGeral   = Math.round(
    Object.values(PROGRESSO_MOCK).reduce((acc, niveis) =>
      acc + Object.values(niveis).reduce((a, b) => a + b, 0), 0
    ) / (totalLouvores * 3)
  );

  return (
    <div className="h-full flex">
      <Sidebar progresso={progressoGeral} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-ink border-b border-panel-border flex items-center px-6 gap-3 flex-shrink-0">
          <BarChart2 size={18} className="text-gold" />
          <span className="font-bold text-slate-200">Progresso</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Progresso geral", value: `${progressoGeral}%`, icon: BarChart2, color: "#f0b429" },
                { label: "Louvores ativos", value: `${louvoresAtivos} / ${totalLouvores}`, icon: CheckCircle2, color: "#22c55e" },
                { label: "Em andamento", value: "1", icon: Clock, color: "#60a5fa" },
              ].map((s) => (
                <div key={s.label} className="card flex flex-col gap-2">
                  <s.icon size={18} style={{ color: s.color }} />
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Per-louvor progress */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Por louvor
              </h2>

              {LOUVORES.map((louvor) => {
                const prog = PROGRESSO_MOCK[louvor.id] ?? { aprendiz: 0, intermediario: 0, profissional: 0 };
                const media = Math.round(Object.values(prog).reduce((a, b) => a + b, 0) / 3);

                return (
                  <div
                    key={louvor.id}
                    className="card hover:border-gold/30 cursor-pointer transition-all"
                    onClick={() => nav(`/louvor/${louvor.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-panel-light border border-panel-border flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-bold font-mono text-xs">{louvor.numero}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-200 text-sm mb-2">{louvor.titulo}</div>
                        <div className="flex gap-3">
                          {NIVEL_INFO.map(({ nivel, label, color }) => {
                            const pct = prog[nivel];
                            const available = louvor.niveisDisponiveis.includes(nivel);
                            return (
                              <div key={nivel} className="flex items-center gap-2">
                                <Ring value={available ? pct : 0} color={available ? color : "#334155"} size={40} />
                                <div>
                                  <div
                                    className="text-[10px] font-bold"
                                    style={{ color: available ? color : "#334155" }}
                                  >
                                    {label}
                                  </div>
                                  {!available && (
                                    <div className="text-[9px] text-slate-700">indisponível</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <Ring value={media} color="#f0b429" size={52} />
                        <span className="text-[9px] text-slate-600">média</span>
                      </div>

                      <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-700 italic">
              O progresso é calculado localmente com dados de prática. Persistência completa via IndexedDB será implementada em versão futura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
