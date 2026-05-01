import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ChevronRight, Lock } from "lucide-react";
import { LOUVORES } from "../data/louvores";
import Sidebar from "../components/layout/Sidebar";

interface Exercicio {
  id: string;
  louvorId: string;
  louvorTitulo: string;
  nivel: string;
  titulo: string;
  descricao: string;
  tipo: "troca_de_acorde" | "memorizacao" | "ritmo" | "analise";
  disponivel: boolean;
}

const EXERCICIOS: Exercicio[] = [
  {
    id: "ex-001-a",
    louvorId: "001",
    louvorTitulo: "Ainda Uma Vez",
    nivel: "Aprendiz",
    titulo: "Troca de Acorde — Cm → Fm",
    descricao: "Pratique a troca entre Cm e Fm no tempo certo. Foque na entrada na sílaba correta.",
    tipo: "troca_de_acorde",
    disponivel: true,
  },
  {
    id: "ex-001-b",
    louvorId: "001",
    louvorTitulo: "Ainda Uma Vez",
    nivel: "Aprendiz",
    titulo: "Memorização — Verso 1",
    descricao: "Esconda as cifras e tente lembrar a sequência harmônica do Verso 1.",
    tipo: "memorizacao",
    disponivel: true,
  },
  {
    id: "ex-001-c",
    louvorId: "001",
    louvorTitulo: "Ainda Uma Vez",
    nivel: "Intermediário",
    titulo: "Ritmo — Subdivisão do Refrão",
    descricao: "Identifique os tempos fortes e fracos de cada compasso do Refrão. Use a régua analítica.",
    tipo: "ritmo",
    disponivel: true,
  },
  {
    id: "ex-001-d",
    louvorId: "001",
    louvorTitulo: "Ainda Uma Vez",
    nivel: "Profissional",
    titulo: "Análise — Progressão i–iv–V",
    descricao: "Analise a progressão harmônica completa. Identifique cadências e decida uma reharmonização.",
    tipo: "analise",
    disponivel: true,
  },
  {
    id: "ex-002-a",
    louvorId: "002",
    louvorTitulo: "Louvor Exemplo 2",
    nivel: "Aprendiz",
    titulo: "[Exercício a preencher]",
    descricao: "[Descrição do exercício a preencher quando o louvor for preparado.]",
    tipo: "troca_de_acorde",
    disponivel: false,
  },
];

const TIPO_BADGE: Record<Exercicio["tipo"], { label: string; color: string }> = {
  troca_de_acorde: { label: "Troca de Acorde", color: "#60a5fa" },
  memorizacao:     { label: "Memorização",     color: "#c084fc" },
  ritmo:           { label: "Ritmo",           color: "#f0b429" },
  analise:         { label: "Análise",         color: "#22c55e" },
};

const NIVEL_COLOR: Record<string, string> = {
  Aprendiz:      "#22c55e",
  Intermediário: "#60a5fa",
  Profissional:  "#f0b429",
};

export default function ExerciciosPage() {
  const nav = useNavigate();
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroLouvor, setFiltroLouvor] = useState("todos");

  const filtered = EXERCICIOS.filter((ex) => {
    const matchNivel  = filtroNivel  === "todos" || ex.nivel === filtroNivel;
    const matchLouvor = filtroLouvor === "todos" || ex.louvorId === filtroLouvor;
    return matchNivel && matchLouvor;
  });

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-ink border-b border-panel-border flex items-center px-6 gap-3 flex-shrink-0">
          <Dumbbell size={18} className="text-gold" />
          <span className="font-bold text-slate-200">Exercícios</span>
          <span className="text-slate-600 text-sm">{EXERCICIOS.filter(e => e.disponivel).length} disponíveis</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="bg-panel border border-panel-border text-slate-400 text-sm px-4 py-2.5 rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os níveis</option>
              <option value="Aprendiz">Aprendiz</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Profissional">Profissional</option>
            </select>
            <select
              value={filtroLouvor}
              onChange={(e) => setFiltroLouvor(e.target.value)}
              className="bg-panel border border-panel-border text-slate-400 text-sm px-4 py-2.5 rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os louvores</option>
              {LOUVORES.map((l) => (
                <option key={l.id} value={l.id}>{l.numero} — {l.titulo}</option>
              ))}
            </select>
          </div>

          {/* Exercise cards */}
          <div className="flex flex-col gap-3 max-w-2xl">
            {filtered.map((ex) => {
              const tb = TIPO_BADGE[ex.tipo];
              const nc = NIVEL_COLOR[ex.nivel] ?? "#94a3b8";
              return (
                <div
                  key={ex.id}
                  className={`card flex items-start gap-4 transition-all
                    ${ex.disponivel ? "hover:border-gold/30 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                  onClick={() => ex.disponivel && nav(`/louvor/${ex.louvorId}/aprendiz`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="badge text-[9px]"
                        style={{ color: nc, borderColor: nc + "50", background: nc + "15" }}
                      >
                        {ex.nivel}
                      </span>
                      <span
                        className="badge text-[9px]"
                        style={{ color: tb.color, borderColor: tb.color + "50", background: tb.color + "15" }}
                      >
                        {tb.label}
                      </span>
                      <span className="text-slate-600 text-[10px]">{ex.louvorTitulo}</span>
                    </div>
                    <div className="font-bold text-slate-200 text-sm mb-1">{ex.titulo}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{ex.descricao}</p>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {ex.disponivel
                      ? <ChevronRight size={16} className="text-slate-600" />
                      : <Lock size={14} className="text-slate-700" />
                    }
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-700 mt-6 italic">
            Os exercícios são gerados a partir dos louvores preparados. Adicione mais louvores para expandir a lista.
          </p>
        </div>
      </div>
    </div>
  );
}
