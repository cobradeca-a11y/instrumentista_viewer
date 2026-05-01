import { useState } from "react";;
import { useParams, useNavigate } from "react-router-dom";;
import { getLouvorById } from "../data/louvores";;
import { Music, Layers, Users } from "lucide-react";;
import AppShell from "../components/layout/AppShell";
import CifraPedagogica from "../components/music/CifraPedagogica";
import PartituraPanel from "../components/music/PartituraPanel";
import MidiPlayer from "../components/music/MidiPlayer";
import PracticeControls from "../components/music/PracticeControls";
import { ObjectivePanel } from "../components/pedagogy/ObjectivePanel";;
import { ProfessionalArrangementPanel, ProfessionalTeachingPanel } from "../components/pedagogy/ProfessionalPanels";;
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
  exibirFuncaoHarmonica: true,
  exibirLinhaMelodica: true,
  exibirDinamica: true,
  exibirSubdivisao: true,
  metronomeAtivo: false,
  metronomeComSom: true,
};

type PainelAtivo = "arranjo" | "pedagogico" | "pratica";

export default function ProfissionalPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const louvor = id ? getLouvorById(id) : undefined;
  const [config, setConfig] = useState<ConfiguracaoDePratica>({
    ...DEFAULT_CONFIG, bpm: louvor?.bpm ?? 72
  });
  const [painelAtivo, setPainelAtivo] = useState<PainelAtivo>("arranjo");

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
    setConfig(c => ({ ...c, ...partial }));

  const PAINEL_TABS: { id: PainelAtivo; label: string; icon: typeof Layers }[] = [
    { id: "arranjo",    label: "Arranjo",    icon: Layers },
    { id: "pedagogico", label: "Pedagógico", icon: Users },
    { id: "pratica",    label: "Prática",    icon: Music },
  ];

  return (
    <AppShell
      titulo={louvor.titulo}
      numero={louvor.numero}
      modulo="Modo Profissional"
      tom={louvor.tom}
      bpm={louvor.bpm}
      louvorId={louvor.id}
      nivel="profissional"
      progresso={78}
      backPath={`/louvor/${louvor.id}`}
    >
      <div className="h-full flex overflow-hidden">
        {/* ── CENTER: cifra + analysis header ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* Full analysis header */}
          <div className="bg-panel border border-gold/20 rounded-xl p-3 flex items-center gap-4 flex-shrink-0">
            <div className="flex-1">
              <div className="text-xs font-bold text-gold uppercase tracking-wider mb-0.5">Mapa Harmônico</div>
              <div className="flex gap-2 flex-wrap">
                {louvor.secoes.map(s => {
                  const chords = [...new Set(s.linhas.flatMap(l => l.compassos.flatMap(c => c.segmentos.filter(sg => sg.acorde).map(sg => sg.acorde))))];
                  return (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold" style={{ color: s.cor }}>{s.label}:</span>
                      {chords.slice(0, 4).map((ch, i) => (
                        <span key={i} className="text-xs font-mono text-blue-300">{ch}</span>
                      ))}
                      {chords.length > 4 && <span className="text-slate-600 text-xs">+{chords.length - 4}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-slate-600">Tom: <strong className="text-slate-400">{louvor.tom}</strong></div>
          </div>

          {/* Cifra with all layers */}
          <div className="flex-1 overflow-y-auto">
            <CifraPedagogica
              secoes={louvor.secoes}
              nivel="profissional"
              exibirFuncao={config.exibirFuncaoHarmonica}
              exibirGrau={true}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-80 flex flex-col border-l border-panel-border overflow-hidden flex-shrink-0 bg-ink">
          {/* Partitura — large */}
          <div className="p-4 border-b border-panel-border flex-shrink-0">
            <PartituraPanel louvorId={louvor.id} nivel="profissional" />
          </div>

          {/* Panel tabs */}
          <div className="flex border-b border-panel-border flex-shrink-0">
            {PAINEL_TABS.map(({ id: pid, label, icon: Icon }) => (
              <button
                key={pid}
                onClick={() => setPainelAtivo(pid)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2
                  ${painelAtivo === pid
                    ? "border-gold text-gold"
                    : "border-transparent text-slate-600 hover:text-slate-400"}`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4">
            {painelAtivo === "arranjo" && (
              <div className="flex flex-col gap-4">
                <ProfessionalArrangementPanel dados={louvor.dadosProfissionais} />
                <ObjectivePanel
                  nivel="profissional"
                  objetivo={louvor.objetivoProfissional}
                  dica={louvor.dicaProfissional}
                  erroProvavel={louvor.erroProvavelProfissional}
                />
              </div>
            )}
            {painelAtivo === "pedagogico" && (
              <ProfessionalTeachingPanel dados={louvor.dadosProfissionais} />
            )}
            {painelAtivo === "pratica" && (
              <div className="flex flex-col gap-4">
                <PracticeControls nivel="profissional" bpm={louvor.bpm} config={config} onChange={updateConfig} />
                <MidiPlayer louvorId={louvor.id} defaultBpm={louvor.bpm} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
