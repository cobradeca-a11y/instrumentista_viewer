import { useNavigate, useLocation } from "react-router-dom";
import { Home, Music, Dumbbell, BarChart2, GraduationCap, BookOpen, Star } from "lucide-react";

interface SidebarProps {
  louvorId?: string;
  nivelAtual?: "aprendiz" | "intermediario" | "profissional";
  progresso?: number;
}

const NAV_ITEMS = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Music, label: "Músicas", path: "/biblioteca" },
  { icon: Dumbbell, label: "Exercícios", path: "/" },
  { icon: BarChart2, label: "Progresso", path: "/" },
];

const NIVEL_ITEMS = [
  { icon: BookOpen, label: "Aprendiz", nivel: "aprendiz" as const, color: "#22c55e" },
  { icon: GraduationCap, label: "Intermediário", nivel: "intermediario" as const, color: "#60a5fa" },
  { icon: Star, label: "Profissional", nivel: "profissional" as const, color: "#f0b429" },
];

export default function Sidebar({ louvorId, nivelAtual, progresso = 0 }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-[72px] bg-ink flex flex-col items-center py-4 gap-1 border-r border-panel-border flex-shrink-0">
      {/* Logo */}
      <div
        className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-ink font-bold text-lg mb-3 cursor-pointer"
        onClick={() => navigate("/")}
        title="Início"
      >
        𝄞
      </div>

      {/* Main nav */}
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            title={item.label}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all
              ${active ? "bg-panel-light text-gold" : "text-slate-500 hover:text-slate-300 hover:bg-panel-light"}`}
          >
            <item.icon size={18} />
            <span className="text-[9px]">{item.label}</span>
          </button>
        );
      })}

      <div className="flex-1" />

      {/* Level selectors */}
      {NIVEL_ITEMS.map((item) => {
        const isActive = nivelAtual === item.nivel;
        const path = louvorId ? `/louvor/${louvorId}/${item.nivel}` : "#";
        return (
          <button
            key={item.nivel}
            onClick={() => louvorId && navigate(path)}
            title={item.label}
            disabled={!louvorId}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold transition-all
              ${!louvorId ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
              ${isActive ? "border" : "hover:bg-panel-light"}`}
            style={{
              color: isActive ? item.color : "#475569",
              borderColor: isActive ? item.color + "60" : "transparent",
              backgroundColor: isActive ? item.color + "18" : undefined,
            }}
          >
            <item.icon size={16} />
            <span>{item.nivel === "intermediario" ? "Inter." : item.label.slice(0, 4)}</span>
          </button>
        );
      })}

      {/* Progress ring */}
      <div className="mt-3 flex flex-col items-center gap-1">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle
            cx="20" cy="20" r="16" fill="none"
            stroke={nivelAtual === "profissional" ? "#f0b429" : nivelAtual === "intermediario" ? "#60a5fa" : "#22c55e"}
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 16 * progresso / 100} ${2 * Math.PI * 16}`}
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
          />
          <text x="20" y="25" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">
            {progresso}%
          </text>
        </svg>
        <span className="text-[8px] text-slate-600">progresso</span>
      </div>
    </aside>
  );
}
