import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Music, Layers, Users, Sliders } from "lucide-react";
import { getLouvorById } from "../data/louvores";
import type { ConfiguracaoDePratica, SecaoMusical } from "../types/music";
import AppShell from "../components/layout/AppShell";
import PartituraPanel from "../components/music/PartituraPanel";
import MidiPlayer from "../components/music/MidiPlayer";
import PracticeControls from "../components/music/PracticeControls";
import { ObjectivePanel } from "../components/pedagogy/ObjectivePanel";
import {
  ProfessionalArrangementPanel,
  ProfessionalTeachingPanel,
} from "../components/pedagogy/ProfessionalPanels";

const DEFAULT_CONFIG: ConfiguracaoDePratica = {
  velocidade: 100, bpm: 72, repeticaoAtiva: false,
  trechoA: null, trechoB: null,
  exibirCifras: true, modoMemoria: false,
  exibirFuncaoHarmonica: true, exibirLinhaMelodica: true,
  exibirDinamica: true, exibirSubdivisao: true,
  metronomeAtivo: false, metronomeComSom: true,
};

type Painel = "arranjo" | "pedagogico" | "pratica";

// ─── Full analysis cifra ──────────────────────────────────────────────────────
const FN_COLOR: Record<string, string> = {
  "tônica":        "#22c55e",
  "dominante":     "#f87171",
  "subdominante":  "#60a5fa",
  "relativo maior":"#4ade80",
  "mediante":      "#22d3ee",
  "subtônica":     "#c084fc",
};

interface CifraProfProps {
  secoes: SecaoMusical[];
}

function CifraProfissional({ secoes }: CifraProfProps) {
  const SEC_COLORS: Record<string, { text: string; border: string }> = {
    "Introdução": { text: "#94a3b8", border: "#334155" },
    "Verso 1":    { text: "#60a5fa", border: "#3b82f660" },
    "Verso 2":    { text: "#60a5fa", border: "#3b82f660" },
    "Refrão":     { text: "#f0b429", border: "#f0b42960" },
    "Ponte":      { text: "#c084fc", border: "#c084fc60" },
    "Coda":       { text: "#22c55e", border: "#22c55e60" },
  };

  return (
    <div className="flex flex-col gap-4">
      {secoes.map((sec) => {
        const col = SEC_COLORS[sec.label] ?? { text: "#94a3b8", border: "#334155" };
        return (
          <div key={sec.id}>
            <div
              className="inline-flex items-center px-3 py-0.5 rounded-md text-xs font-bold border mb-2 w-fit"
              style={{ color: col.text, borderColor: col.border, background: col.text + "12" }}
            >
              {sec.label}
            </div>

            {sec.linhas.map((linha) => (
              <div key={linha.id} className="flex flex-col gap-1 mb-3">
                {linha.compassos.map((comp) => (
                  <div
                    key={comp.numero}
                    className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2 bg-panel border border-panel-border rounded-xl"
                  >
                    <span className="text-[9px] text-slate-700 font-mono self-start mt-3 w-4">
                      {comp.numero}
                    </span>

                    {comp.segmentos.map((seg) => {
                      const fnColor = seg.funcaoHarmonica
                        ? FN_COLOR[seg.funcaoHarmonica] ?? "#94a3b8"
                        : null;

                      return (
                        <div key={seg.id} className="flex flex-col items-center gap-0.5">
                          {/* Analysis layer — grau + function */}
                          {seg.acorde && (
                            <div className="flex flex-col items-center">
                              {seg.grauHarmonico && (
                                <span className="text-[9px] font-mono text-purple-400 bg-purple-900/20 px-1 rounded leading-tight">
                                  {seg.grauHarmonico}
                                </span>
                              )}
                              {seg.funcaoHarmonica && fnColor && (
                                <span className="text-[8px] italic leading-tight" style={{ color: fnColor }}>
                                  {seg.funcaoHarmonica}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Chord */}
                          {seg.acorde ? (
                            <span className="text-base font-bold font-mono text-blue-400 leading-none">
                              {seg.acorde}
                            </span>
                          ) : (
                            <span className="text-base leading-none invisible">·</span>
                          )}

                          {/* Syllable */}
                          <span className={`text-sm leading-none ${seg.acorde ? "text-slate-200 font-bold" : "text-slate-500"}`}>
                            {seg.texto || "\u00A0"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Harmonic map summary ─────────────────────────────────────────────────────
function HarmonicMap({ secoes, tom }: { secoes: SecaoMusical[]; tom: string }) {
  return (
    <div className="bg-panel border border-gold/20 rounded-xl p-3">
      <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">
        Mapa Harmônico — {tom}
      </div>
      <div className="flex flex-col gap-1">
        {secoes.map((s) => {
          const chords = [...new Set(
            s.linhas.flatMap(l =>
              l.compassos.flatMap(c =>
                c.segmentos.filter(sg => sg.acorde).map(sg => sg.acorde)
              )
            )
          )].filter(Boolean);
          if (chords.length === 0) return null;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "#94a3b8" }}>
                {s.label}:
              </span>
              {chords.map((ch, i) => (
                <span key={i} className="text-xs font-mono text-blue-300">
                  {ch}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfissionalPage() {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const louvor = id ? getLouvorById(id) : undefined;
  const [config, setConfig]       = useState<ConfiguracaoDePratica>({ ...DEFAULT_CONFIG, bpm: louvor?.bpm ?? 72 });
  const [painel, setPainel]       = useState<Painel>("arranjo");

  if (!louvor) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-ink text-slate-400">
        <Music size={40} className="opacity-30" />
        <p>Louvor não encontrado</p>
        <button onClick={() => nav("/biblioteca")} className="btn-ghost">Voltar</button>
      </div>
    );
  }

  const updateConfig = (p: Partial<ConfiguracaoDePratica>) => setConfig(c => ({ ...c, ...p }));

  const TABS: { id: Painel; label: string; icon: typeof Layers }[] = [
    { id: "arranjo",    label: "Arranjo",    icon: Layers },
    { id: "pedagogico", label: "Pedagógico", icon: Users },
    { id: "pratica",    label: "Prática",    icon: Sliders },
  ];

  return (
    <AppShell
      titulo={louvor.titulo} numero={louvor.numero}
      modulo="Modo Profissional"
      tom={louvor.tom} bpm={louvor.bpm}
      louvorId={louvor.id} nivel="profissional" progresso={78}
      backPath={`/louvor/${louvor.id}`}
    >
      <div className="h-full flex overflow-hidden">
        {/* ── CENTER: cifra + mapa ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* Mapa harmônico */}
          <HarmonicMap secoes={louvor.secoes} tom={louvor.tom} />

          {/* Cifra com análise completa */}
          <div className="flex-1 overflow-y-auto">
            <CifraProfissional secoes={louvor.secoes} />
          </div>
        </div>

        {/* ── RIGHT: partitura grande + painéis ── */}
        <div className="w-84 flex flex-col border-l border-panel-border overflow-hidden flex-shrink-0 bg-ink" style={{ width: 336 }}>
          {/* Partitura — large/ampliável */}
          <div className="p-4 border-b border-panel-border flex-shrink-0">
            <PartituraPanel louvorId={louvor.id} nivel="profissional" />
          </div>

          {/* Panel tabs */}
          <div className="flex border-b border-panel-border flex-shrink-0">
            {TABS.map(({ id: tid, label, icon: Icon }) => (
              <button
                key={tid}
                onClick={() => setPainel(tid)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2
                  ${painel === tid
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
            {painel === "arranjo" && (
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
            {painel === "pedagogico" && (
              <ProfessionalTeachingPanel dados={louvor.dadosProfissionais} />
            )}
            {painel === "pratica" && (
              <div className="flex flex-col gap-4">
                <PracticeControls
                  nivel="profissional"
                  bpm={louvor.bpm}
                  config={config}
                  onChange={updateConfig}
                />
                <MidiPlayer louvorId={louvor.id} defaultBpm={louvor.bpm} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
