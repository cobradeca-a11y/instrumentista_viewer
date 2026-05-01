import { RotateCcw, Eye, EyeOff, Brain, Hash, Music2, Waves, BookOpen } from "lucide-react";
import type { NivelPedagogico, ConfiguracaoDePratica } from "../../types/music";
import MetronomeControl from "./MetronomeControl";

interface PracticeControlsProps {
  nivel: NivelPedagogico;
  bpm: number;
  config: ConfiguracaoDePratica;
  onChange: (c: Partial<ConfiguracaoDePratica>) => void;
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all
        ${on
          ? "bg-gold/20 border-gold/50 text-gold"
          : "border-panel-border text-slate-500 hover:text-slate-300"}`}
    >
      {children}
    </button>
  );
}

export default function PracticeControls({ nivel, bpm, config, onChange }: PracticeControlsProps) {
  return (
    <div className="flex flex-col gap-3 bg-panel border border-panel-border rounded-xl p-4">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Controle de Práticas</span>

      {/* Velocity */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 w-20">Velocidade</span>
        <input
          type="range" min={50} max={150} value={config.velocidade}
          onChange={(e) => onChange({ velocidade: Number(e.target.value) })}
          className="flex-1 accent-amber-400"
        />
        <span className="text-gold text-xs font-bold w-10 text-right">{config.velocidade}%</span>
      </div>

      {/* Metronome inline */}
      <MetronomeControl defaultBpm={bpm} inline />

      {/* Toggles by level */}
      <div className="flex flex-wrap gap-2">
        <Toggle on={config.exibirCifras} onClick={() => onChange({ exibirCifras: !config.exibirCifras })}>
          {config.exibirCifras ? <Eye size={12} /> : <EyeOff size={12} />}
          Cifras
        </Toggle>

        <Toggle on={config.modoMemoria} onClick={() => onChange({ modoMemoria: !config.modoMemoria })}>
          <Brain size={12} />
          Memória
        </Toggle>

        <Toggle on={config.repeticaoAtiva} onClick={() => onChange({ repeticaoAtiva: !config.repeticaoAtiva })}>
          <RotateCcw size={12} />
          Repetir
        </Toggle>

        {(nivel === "intermediario" || nivel === "profissional") && (
          <>
            <Toggle
              on={config.exibirFuncaoHarmonica}
              onClick={() => onChange({ exibirFuncaoHarmonica: !config.exibirFuncaoHarmonica })}
            >
              <Hash size={12} />
              Função
            </Toggle>
            <Toggle
              on={config.exibirSubdivisao}
              onClick={() => onChange({ exibirSubdivisao: !config.exibirSubdivisao })}
            >
              <Waves size={12} />
              Subdivisão
            </Toggle>
            <Toggle
              on={config.exibirLinhaMelodica}
              onClick={() => onChange({ exibirLinhaMelodica: !config.exibirLinhaMelodica })}
            >
              <Music2 size={12} />
              Melodia
            </Toggle>
          </>
        )}

        {nivel === "profissional" && (
          <Toggle
            on={config.exibirDinamica}
            onClick={() => onChange({ exibirDinamica: !config.exibirDinamica })}
          >
            <BookOpen size={12} />
            Dinâmica
          </Toggle>
        )}
      </div>

      {/* Loop A-B */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="text-[10px] text-slate-600 mb-1">Trecho A (comp.)</div>
          <input
            type="number" min={1} value={config.trechoA ?? ""}
            onChange={(e) => onChange({ trechoA: e.target.value ? Number(e.target.value) : null })}
            placeholder="—"
            className="w-full bg-panel-light border border-panel-border text-slate-300 text-xs px-2 py-1.5 rounded-lg"
          />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-slate-600 mb-1">Trecho B (comp.)</div>
          <input
            type="number" min={1} value={config.trechoB ?? ""}
            onChange={(e) => onChange({ trechoB: e.target.value ? Number(e.target.value) : null })}
            placeholder="—"
            className="w-full bg-panel-light border border-panel-border text-slate-300 text-xs px-2 py-1.5 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
