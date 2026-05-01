import { useState } from "react";;
import { useParams, useNavigate } from "react-router-dom";;
import { getLouvorById } from "../data/louvores";;
import { Music } from "lucide-react";;
import AppShell from "../components/layout/AppShell";
import CifraPedagogica from "../components/music/CifraPedagogica";
import PartituraPanel from "../components/music/PartituraPanel";
import MidiPlayer from "../components/music/MidiPlayer";
import PracticeControls from "../components/music/PracticeControls";
import { ObjectivePanel } from "../components/pedagogy/ObjectivePanel";;
import type { ConfiguracaoDePratica } from "../types/music";
;

const DEFAULT_CONFIG: ConfiguracaoDePratica = {
  velocidade: 100,
  bpm: 72,
  repeticaoAtiva: false,
  trechoA: null,
  trechoB: null,
  exibirCifras: true,
  modoMemoria: false,
  exibirFuncaoHarmonica: false,
  exibirLinhaMelodica: false,
  exibirDinamica: false,
  exibirSubdivisao: false,
  metronomeAtivo: false,
  metronomeComSom: true,
};

// Rhythmic counter display
function RhythmCounter({ formula }: { formula: string }) {
  const beats = parseInt(formula) || 4;
  const labels4 = ["1", "e", "2", "e", "3", "e", "4", "e"];
  const labels3 = ["1", "e", "2", "e", "3", "e"];
  const labels = beats === 3 ? labels3 : labels4;
  return (
    <div className="flex items-center gap-1">
      {labels.map((l, i) => (
        <div
          key={i}
          className={`flex items-center justify-center rounded-lg border text-xs font-bold font-mono
            ${i % 2 === 0
              ? "w-8 h-8 border-panel-border text-slate-400 bg-panel-light"
              : "w-5 h-5 border-transparent text-slate-700"}`}
        >
          {l}
        </div>
      ))}
    </div>
  );
}

export default function AprendizPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const louvor = id ? getLouvorById(id) : undefined;
  const [config, setConfig] = useState<ConfiguracaoDePratica>({ ...DEFAULT_CONFIG, bpm: louvor?.bpm ?? 72 });

  if (!louvor) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-ink text-slate-400">
        <Music size={40} className="opacity-30" />
        <p>Louvor não encontrado</p>
        <button onClick={() => nav("/biblioteca")} className="btn-ghost">Voltar</button>
      </div>
    );
  }

  const updateConfig = (partial: Partial<ConfiguracaoDePratica>) =>
    setConfig((c) => ({ ...c, ...partial }));

  return (
    <AppShell
      titulo={louvor.titulo}
      numero={louvor.numero}
      modulo="Cifras de Aprendiz"
      tom={louvor.tom}
      bpm={louvor.bpm}
      louvorId={louvor.id}
      nivel="aprendiz"
      progresso={32}
      backPath={`/louvor/${louvor.id}`}
    >
      <div className="h-full flex overflow-hidden">
        {/* ── CENTER: Cifra ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* Rhythmic counter + formula */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-xs text-slate-600 font-mono">{louvor.formula}</div>
            <RhythmCounter formula={louvor.formula} />
            <div className="text-xs text-gold font-mono">♩ = {louvor.bpm}</div>
          </div>

          {/* Main cifra area */}
          <div className="flex-1 overflow-y-auto">
            <CifraPedagogica
              secoes={louvor.secoes}
              nivel="aprendiz"
              exibirFuncao={false}
              exibirGrau={false}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-72 flex flex-col gap-3 p-4 border-l border-panel-border overflow-y-auto flex-shrink-0 bg-ink">
          {/* Partitura — small */}
          <PartituraPanel louvorId={louvor.id} nivel="aprendiz" />

          {/* Practice Controls */}
          <PracticeControls
            nivel="aprendiz"
            bpm={louvor.bpm}
            config={config}
            onChange={updateConfig}
          />

          {/* MIDI player */}
          <MidiPlayer louvorId={louvor.id} defaultBpm={louvor.bpm} />

          {/* Objective / Tips / Error */}
          <ObjectivePanel
            nivel="aprendiz"
            objetivo={louvor.objetivoAprendiz}
            dica={louvor.dicaAprendiz}
            erroProvavel={louvor.erroProvavelAprendiz}
          />
        </div>
      </div>
    </AppShell>
  );
}
