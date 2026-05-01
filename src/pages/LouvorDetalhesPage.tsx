import { useParams, useNavigate } from "react-router-dom";
import { getLouvorById } from "../data/louvores";
import { ChevronLeft, BookOpen, GraduationCap, Star, Music } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import PartituraPanel from "../components/music/PartituraPanel";
import MidiPlayer from "../components/music/MidiPlayer";

export default function LouvorDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const louvor = id ? getLouvorById(id) : undefined;

  if (!louvor) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-ink text-slate-400">
        <Music size={40} className="opacity-30" />
        <p className="text-lg font-bold">Louvor não encontrado</p>
        <button onClick={() => nav("/biblioteca")} className="btn-ghost">
          Voltar à biblioteca
        </button>
      </div>
    );
  }

  const NIVEL_BTN = [
    { nivel: "aprendiz",      label: "Abrir Aprendiz",      color: "#22c55e", icon: BookOpen },
    { nivel: "intermediario", label: "Abrir Intermediário",  color: "#60a5fa", icon: GraduationCap },
    { nivel: "profissional",  label: "Abrir Profissional",   color: "#f0b429", icon: Star },
  ] as const;

  return (
    <div className="h-full flex">
      <Sidebar louvorId={louvor.id} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-ink border-b border-panel-border flex items-center px-5 gap-3 flex-shrink-0">
          <button onClick={() => nav("/biblioteca")} className="text-slate-500 hover:text-gold transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-slate-500 text-sm">Biblioteca</span>
          <span className="text-slate-700">/</span>
          <span className="text-gold font-bold">{louvor.titulo}</span>
          <span className="text-slate-700 text-sm">#{louvor.numero}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
            {/* Left: info */}
            <div className="col-span-2 flex flex-col gap-5">
              {/* Title block */}
              <div className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-500 text-sm font-mono">#{louvor.numero}</span>
                      <span
                        className="badge text-[10px]"
                        style={{
                          color: louvor.status === "preparado" ? "#22c55e" : louvor.status === "incompleto" ? "#f0b429" : "#475569",
                          borderColor: louvor.status === "preparado" ? "#22c55e50" : louvor.status === "incompleto" ? "#f0b42950" : "#47556950",
                          background: louvor.status === "preparado" ? "#22c55e15" : louvor.status === "incompleto" ? "#f0b42915" : "#47556915",
                        }}
                      >
                        {louvor.status}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gold mb-1">{louvor.titulo}</h1>
                    <p className="text-slate-500 text-sm">{louvor.artista}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="text-xs bg-panel-light border border-panel-border px-3 py-1.5 rounded-full text-slate-400">
                      Tom: <strong className="text-slate-200">{louvor.tom}</strong>
                    </div>
                    <div className="text-xs bg-panel-light border border-panel-border px-3 py-1.5 rounded-full text-slate-400">
                      ♩ = <strong className="text-slate-200">{louvor.bpm}</strong>
                    </div>
                    <div className="text-xs bg-panel-light border border-panel-border px-3 py-1.5 rounded-full text-slate-400">
                      {louvor.formula}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pedagogical summary */}
              <div className="card grid grid-cols-3 gap-3">
                {[
                  { nivel: "aprendiz",      obj: louvor.objetivoAprendiz,      color: "#22c55e", label: "Aprendiz" },
                  { nivel: "intermediario", obj: louvor.objetivoIntermediario,  color: "#60a5fa", label: "Intermediário" },
                  { nivel: "profissional",  obj: louvor.objetivoProfissional,   color: "#f0b429", label: "Profissional" },
                ].map((item) => (
                  <div key={item.nivel} className="bg-panel-light border border-panel-border rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: item.color }}>
                      {item.label}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.obj}</p>
                  </div>
                ))}
              </div>

              {/* Sections overview */}
              <div className="card">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Estrutura — {louvor.secoes.length} seção(ões)
                </div>
                <div className="flex flex-wrap gap-2">
                  {louvor.secoes.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold"
                      style={{ color: s.cor, borderColor: s.cor + "50", background: s.cor + "15" }}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Level buttons */}
              <div className="flex flex-col gap-3">
                {NIVEL_BTN.map(({ nivel, label, color, icon: Icon }) => {
                  const available = louvor.niveisDisponiveis.includes(nivel);
                  return (
                    <button
                      key={nivel}
                      onClick={() => available && nav(`/louvor/${louvor.id}/${nivel}`)}
                      disabled={!available}
                      className="flex items-center gap-3 px-6 py-4 rounded-xl border font-bold transition-all text-sm"
                      style={{
                        color: available ? color : "#334155",
                        borderColor: available ? color + "50" : "#1e293b",
                        background: available ? color + "18" : "#0f172a",
                        cursor: available ? "pointer" : "not-allowed",
                      }}
                    >
                      <Icon size={18} />
                      {label}
                      {!available && <span className="text-xs font-normal text-slate-600 ml-auto">Em breve</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: partitura + MIDI */}
            <div className="flex flex-col gap-5">
              <div className="card">
                <PartituraPanel louvorId={louvor.id} nivel="intermediario" />
              </div>
              <MidiPlayer louvorId={louvor.id} defaultBpm={louvor.bpm} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
