import { useNavigate } from "react-router-dom";
import { ChevronLeft, Settings } from "lucide-react";
import MetronomeControl from "../music/MetronomeControl";

interface HeaderProps {
  titulo: string;
  numero?: string;
  modulo: string;
  tom?: string;
  bpm?: number;
  backPath?: string;
}

export default function Header({ titulo, numero, modulo, tom, bpm, backPath }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-ink border-b border-panel-border flex items-center px-4 gap-3 flex-shrink-0">
      <button
        onClick={() => navigate(backPath ?? "/biblioteca")}
        className="text-slate-400 hover:text-gold transition-colors"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="text-slate-500 text-sm font-medium">{modulo}</div>

      <div className="flex-1 text-center">
        <span className="text-gold font-bold text-base leading-none">{titulo}</span>
        {numero && <span className="text-slate-600 text-xs ml-2">#{numero}</span>}
      </div>

      <div className="flex items-center gap-3">
        {tom && (
          <div className="text-xs bg-panel-light border border-panel-border text-slate-400 px-3 py-1 rounded-full">
            Tom: <span className="text-slate-200 font-bold">{tom}</span>
          </div>
        )}
        {bpm && (
          <div className="text-xs bg-panel-light border border-panel-border text-slate-400 px-3 py-1 rounded-full">
            ♩ = <span className="text-slate-200 font-bold">{bpm}</span>
          </div>
        )}
        <MetronomeControl defaultBpm={bpm ?? 80} />
        <button className="text-slate-500 hover:text-slate-300 transition-colors">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
