import { useNavigate } from "react-router-dom";
import { Library, BookOpen, GraduationCap, Music } from "lucide-react";

export default function HomePage() {
  const nav = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center bg-ink gap-8 p-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-gold flex items-center justify-center text-4xl font-bold text-ink shadow-2xl">
          𝄞
        </div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Instrumentistas</h1>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          Plataforma pedagógica progressiva para formação de instrumentistas de louvor
        </p>
      </div>

      {/* Main CTA */}
      <button
        onClick={() => nav("/biblioteca")}
        className="btn-gold flex items-center gap-2 text-base px-8 py-3 shadow-lg shadow-amber-900/30"
      >
        <Library size={18} />
        Abrir Biblioteca de Louvores
      </button>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl w-full">
        {[
          { icon: BookOpen, label: "Aprendiz", desc: "Decodificação guiada", color: "#22c55e" },
          { icon: Music, label: "Intermediário", desc: "Relação entre planos musicais", color: "#60a5fa" },
          { icon: GraduationCap, label: "Profissional", desc: "Análise, arranjo e ensino", color: "#f0b429" },
        ].map((item) => (
          <div
            key={item.label}
            className="card flex flex-col items-center gap-2 text-center cursor-pointer hover:border-gold/30 transition-all"
            onClick={() => nav("/biblioteca")}
          >
            <item.icon size={24} style={{ color: item.color }} />
            <div className="font-bold text-slate-200 text-sm">{item.label}</div>
            <div className="text-xs text-slate-500">{item.desc}</div>
          </div>
        ))}
      </div>

      <p className="text-slate-700 text-xs">
        Projeto sem fins lucrativos · Formação musical progressiva
      </p>
    </div>
  );
}
