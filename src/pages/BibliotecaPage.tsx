import { useState } from "react";;
import { useNavigate } from "react-router-dom";;
import { Search, ChevronRight, Music, AlertCircle } from "lucide-react";;
import { LOUVORES } from "../data/louvores";;
import type { Louvor, NivelPedagogico, StatusLouvor } from "../types/music";
;
import Sidebar from "../components/layout/Sidebar";

const STATUS_BADGE: Record<StatusLouvor, { label: string; color: string }> = {
  preparado:  { label: "Preparado",  color: "#22c55e" },
  incompleto: { label: "Incompleto", color: "#f0b429" },
  pendente:   { label: "Pendente",   color: "#475569" },
};

const NIVEL_LABEL: Record<NivelPedagogico, string> = {
  aprendiz:     "Aprendiz",
  intermediario:"Intermediário",
  profissional: "Profissional",
};
const NIVEL_COLOR: Record<NivelPedagogico, string> = {
  aprendiz:     "#22c55e",
  intermediario:"#60a5fa",
  profissional: "#f0b429",
};

function LouvorCard({ louvor }: { louvor: Louvor }) {
  const nav = useNavigate();
  const st = STATUS_BADGE[louvor.status];

  return (
    <div
      onClick={() => nav(`/louvor/${louvor.id}`)}
      className="card hover:border-gold/30 cursor-pointer transition-all flex items-center gap-4"
    >
      {/* Number */}
      <div className="w-12 h-12 rounded-xl bg-panel-light border border-panel-border flex items-center justify-center flex-shrink-0">
        <span className="text-gold font-bold font-mono text-sm">{louvor.numero}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-100 text-sm truncate">{louvor.titulo}</span>
          <span
            className="badge flex-shrink-0 text-[10px]"
            style={{ color: st.color, borderColor: st.color + "50", background: st.color + "15" }}
          >
            {st.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{louvor.artista}</span>
          <span>Tom: <strong className="text-slate-400">{louvor.tom}</strong></span>
          <span>BPM: <strong className="text-slate-400">{louvor.bpm}</strong></span>
        </div>
        <div className="flex gap-1.5 mt-2">
          {louvor.niveisDisponiveis.map((n) => (
            <span
              key={n}
              className="badge text-[9px]"
              style={{ color: NIVEL_COLOR[n], borderColor: NIVEL_COLOR[n] + "50", background: NIVEL_COLOR[n] + "15" }}
            >
              {NIVEL_LABEL[n]}
            </span>
          ))}
        </div>
      </div>

      <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
    </div>
  );
}

export default function BibliotecaPage() {
  const [query, setQuery] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState<NivelPedagogico | "todos">("todos");

  const filtered = LOUVORES.filter((l) => {
    const q = query.toLowerCase();
    const matchText =
      !q ||
      l.titulo.toLowerCase().includes(q) ||
      l.numero.includes(q) ||
      l.artista.toLowerCase().includes(q);
    const matchNivel =
      nivelFiltro === "todos" || l.niveisDisponiveis.includes(nivelFiltro);
    return matchText && matchNivel;
  });

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-ink border-b border-panel-border flex items-center px-6 gap-4 flex-shrink-0">
          <Music size={18} className="text-gold" />
          <span className="font-bold text-slate-200">Biblioteca de Louvores</span>
          <span className="text-slate-600 text-sm">{LOUVORES.length} músicas</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Search + filter */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, número ou artista…"
                className="w-full bg-panel border border-panel-border text-slate-300 text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-gold/50 placeholder-slate-600"
              />
            </div>
            <select
              value={nivelFiltro}
              onChange={(e) => setNivelFiltro(e.target.value as NivelPedagogico | "todos")}
              className="bg-panel border border-panel-border text-slate-400 text-sm px-4 py-2.5 rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os níveis</option>
              <option value="aprendiz">Aprendiz</option>
              <option value="intermediario">Intermediário</option>
              <option value="profissional">Profissional</option>
            </select>
          </div>

          {/* Results */}
          <div className="flex flex-col gap-3 max-w-2xl">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
                <p>Nenhum louvor encontrado.</p>
              </div>
            ) : (
              filtered.map((l) => <LouvorCard key={l.id} louvor={l} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
