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
import RhythmicGrid from "../components/pedagogy/RhythmicGrid";
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
  exibirLinhaMelodica: false,
  exibirDinamica: false,
  exibirSubdivisao: true,
  metronomeAtivo: false,
  metronomeComSom: true,
};

// Harmonic ruler bar
function HarmonicRuler({ secao, compassoAtivo }: { secao: import("../types/music").SecaoMusical; compassoAtivo: number }) {
  const comp = secao.linhas.flatMap(l => l.compassos).find(c => c.numero === compassoAtivo);
  if (!comp) return null;

  const chords = comp.segmentos.filter(s => s.acorde);

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-3 flex flex-col gap-2">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        Régua Harmônica — Compasso {compassoAtivo}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {chords.map((s) => (
          <div
            key={s.id}
            className="flex-shrink-0 flex flex-col items-center gap-1 bg-panel-light border border-panel-border rounded-xl px-4 py-3"
          >
            <span className="text-[10px] text-slate-600 font-mono">Tempo {s.tempo}</span>
            <span className="text-xl font-bold text-blue-400 font-mono leading-none">{s.acorde}</span>
            <span className="text-sm font-mono text-purple-400">{s.grauHarmonico ?? "—"}</span>
            <span className="text-[9px] text-slate-600 italic text-center leading-tight">{s.funcaoHarmonica ?? ""}</span>
            {s.silaba && (
              <span className="text-[10px] text-slate-500 mt-1">"{s.silaba}"</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IntermediarioPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const louvor = id ? getLouvorById(id) : undefined;
  const [config, setConfig] = useState<ConfiguracaoDePratica>({
    ...DEFAULT_CONFIG, bpm: louvor?.bpm ?? 72
  });
  const [compassoAtivo, setCompassoAtivo] = useState(3);
  const activeSec = louvor?.secoes?.find((s: import("../types/music").SecaoMusical) => s.linhas.flatMap((l: import("../types/music").LinhaMusical) => l.compassos).some((c: import("../types/music").CompassoMusical) => c.numero === compassoAtivo));

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

  const allCompassos = louvor.secoes.flatMap(s => s.linhas.flatMap(l => l.compassos));

  return (
    <AppShell
      titulo={louvor.titulo}
      numero={louvor.numero}
      modulo="Modo Intermediário"
      tom={louvor.tom}
      bpm={louvor.bpm}
      louvorId={louvor.id}
      nivel="intermediario"
      progresso={55}
      backPath={`/louvor/${louvor.id}`}
    >
      <div className="h-full flex overflow-hidden">
        {/* ── CENTER ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* Harmonic ruler */}
          {activeSec && (
            <HarmonicRuler secao={activeSec} compassoAtivo={compassoAtivo} />
          )}

          {/* Compasso navigator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-600">Compasso:</span>
            <div className="flex gap-1">
              {allCompassos.slice(0, 16).map(c => (
                <button
                  key={c.numero}
                  onClick={() => setCompassoAtivo(c.numero)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all
                    ${compassoAtivo === c.numero
                      ? "bg-gold text-ink"
                      : "bg-panel-light border border-panel-border text-slate-600 hover:text-slate-300"}`}
                >
                  {c.numero}
                </button>
              ))}
            </div>
          </div>

          {/* Cifra with function labels */}
          <div className="flex-1 overflow-y-auto">
            <CifraPedagogica
              secoes={louvor.secoes}
              nivel="intermediario"
              compassoAtivo={compassoAtivo}
              exibirFuncao={config.exibirFuncaoHarmonica}
              exibirGrau={config.exibirFuncaoHarmonica}
            />
          </div>

          {/* Rhythmic grid */}
          {activeSec && (
            <div className="flex-shrink-0">
              <RhythmicGrid secao={activeSec} compassoAtivo={compassoAtivo} />
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-72 flex flex-col gap-3 p-4 border-l border-panel-border overflow-y-auto flex-shrink-0 bg-ink">
          <PartituraPanel louvorId={louvor.id} nivel="intermediario" />
          <PracticeControls nivel="intermediario" bpm={louvor.bpm} config={config} onChange={updateConfig} />
          <MidiPlayer louvorId={louvor.id} defaultBpm={louvor.bpm} />
          <ObjectivePanel
            nivel="intermediario"
            objetivo={louvor.objetivoIntermediario}
            dica={louvor.dicaIntermediario}
            erroProvavel={louvor.erroProvavelIntermediario}
          />
        </div>
      </div>
    </AppShell>
  );
}
