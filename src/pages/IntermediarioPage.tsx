import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Music } from "lucide-react";
import { getLouvorById } from "../data/louvores";
import type { ConfiguracaoDePratica, SecaoMusical, SegmentoMusical } from "../types/music";
import AppShell from "../components/layout/AppShell";
import PartituraPanel from "../components/music/PartituraPanel";
import MidiPlayer from "../components/music/MidiPlayer";
import MetronomeControl from "../components/music/MetronomeControl";
import PracticeControls from "../components/music/PracticeControls";
import { ObjectivePanel } from "../components/pedagogy/ObjectivePanel";
import RhythmicGrid from "../components/pedagogy/RhythmicGrid";

const DEFAULT_CONFIG: ConfiguracaoDePratica = {
  velocidade: 100, bpm: 72, repeticaoAtiva: false,
  trechoA: null, trechoB: null,
  exibirCifras: true, modoMemoria: false,
  exibirFuncaoHarmonica: true, exibirLinhaMelodica: false,
  exibirDinamica: false, exibirSubdivisao: true,
  metronomeAtivo: false, metronomeComSom: true,
};

// ─── Cifra Intermediário — chord + syllable + time + harmonic function connected ─
const SEC_COLORS: Record<string, { text: string; border: string }> = {
  "Introdução": { text: "#94a3b8", border: "#334155" },
  "Verso 1":    { text: "#60a5fa", border: "#3b82f660" },
  "Verso 2":    { text: "#60a5fa", border: "#3b82f660" },
  "Refrão":     { text: "#f0b429", border: "#f0b42960" },
  "Ponte":      { text: "#c084fc", border: "#c084fc60" },
  "Coda":       { text: "#22c55e", border: "#22c55e60" },
};

const FN_COLOR: Record<string, string> = {
  "tônica":        "#22c55e",
  "dominante":     "#f87171",
  "subdominante":  "#60a5fa",
  "relativo maior":"#4ade80",
  "mediante":      "#22d3ee",
  "subtônica":     "#c084fc",
};

interface CifraInterProps {
  secoes: SecaoMusical[];
  compassoAtivo: number;
  exibirFuncao: boolean;
  exibirSubdivisao: boolean;
}

function CifraInter({ secoes, compassoAtivo, exibirFuncao, exibirSubdivisao }: CifraInterProps) {
  return (
    <div className="flex flex-col gap-5">
      {secoes.map((sec) => {
        const col = SEC_COLORS[sec.label] ?? { text: "#94a3b8", border: "#334155" };
        return (
          <div key={sec.id}>
            <div
              className="inline-flex items-center px-3 py-0.5 rounded-md text-xs font-bold border mb-3 w-fit"
              style={{ color: col.text, borderColor: col.border, background: col.text + "12" }}
            >
              {sec.label}
            </div>

            {sec.linhas.map((linha) => (
              <div key={linha.id} className="flex flex-col gap-1.5 mb-4">
                {linha.compassos.map((comp) => {
                  const isActive = compassoAtivo === comp.numero;

                  // Beat ruler for this compasso
                  const beats4 = ["1", "e", "2", "e", "3", "e", "4", "e"];
                  const chordByBeat: Record<number, SegmentoMusical> = {};
                  comp.segmentos.filter(s => s.acorde).forEach(s => {
                    chordByBeat[(s.tempo - 1) * 2] = s;
                  });

                  return (
                    <div
                      key={comp.numero}
                      className={`rounded-xl border overflow-hidden transition-all
                        ${isActive ? "border-gold/40" : "border-panel-border"}`}
                    >
                      {/* Beat ruler header */}
                      {exibirSubdivisao && (
                        <div className="flex bg-ink/60 border-b border-panel-border">
                          <span className="w-6 text-center text-[9px] text-slate-700 font-mono self-center flex-shrink-0">
                            {comp.numero}
                          </span>
                          {beats4.map((b, i) => {
                            const chord = chordByBeat[i];
                            const isStrongBeat = i === 0 || i === 4;
                            return (
                              <div
                                key={i}
                                className={`flex-1 text-center py-1 border-r border-panel-border last:border-r-0
                                  ${chord ? "bg-gold/10" : ""}`}
                              >
                                <span
                                  className={`text-[9px] font-mono block leading-none
                                    ${isStrongBeat ? "text-slate-400 font-bold" : "text-slate-700"}`}
                                >
                                  {b}
                                </span>
                                {chord && (
                                  <span className="text-[8px] font-bold text-blue-400 block leading-none mt-0.5">
                                    {chord.acorde}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Chord + syllable row */}
                      <div className={`flex flex-wrap items-end gap-x-3 gap-y-1 px-3 py-2
                        ${isActive ? "bg-panel-light" : "bg-panel"}`}>
                        {!exibirSubdivisao && (
                          <span className="text-[10px] text-slate-700 font-mono self-start mt-1 w-4">
                            {comp.numero}
                          </span>
                        )}
                        {comp.segmentos.map((seg) => {
                          const fnColor = seg.funcaoHarmonica
                            ? FN_COLOR[seg.funcaoHarmonica] ?? "#94a3b8"
                            : null;

                          return (
                            <div key={seg.id} className="flex flex-col items-center">
                              {/* Grau + função */}
                              {exibirFuncao && seg.acorde && (
                                <div className="flex gap-1 items-center mb-0.5">
                                  {seg.grauHarmonico && (
                                    <span className="text-[9px] font-mono text-purple-400 px-1 rounded bg-purple-900/20">
                                      {seg.grauHarmonico}
                                    </span>
                                  )}
                                  {seg.funcaoHarmonica && fnColor && (
                                    <span className="text-[9px] italic" style={{ color: fnColor }}>
                                      {seg.funcaoHarmonica}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Chord */}
                              {seg.acorde ? (
                                <span className="text-lg font-bold font-mono text-blue-400 leading-none mb-1.5">
                                  {seg.acorde}
                                </span>
                              ) : (
                                <span className="text-lg leading-none mb-1.5 invisible">·</span>
                              )}

                              {/* Syllable */}
                              <span
                                className={`text-base leading-none
                                  ${seg.acorde ? "text-slate-100 font-bold" : "text-slate-400"}`}
                              >
                                {seg.texto || "\u00A0"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Compasso navigator ───────────────────────────────────────────────────────
function CompassoNav({
  louvorSecoes,
  compassoAtivo,
  onSelect,
}: {
  louvorSecoes: SecaoMusical[];
  compassoAtivo: number;
  onSelect: (n: number) => void;
}) {
  const allCompassos = louvorSecoes.flatMap((s) =>
    s.linhas.flatMap((l) => l.compassos)
  );
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-600 flex-shrink-0">Compasso:</span>
      <div className="flex gap-1 flex-wrap">
        {allCompassos.map((c) => (
          <button
            key={c.numero}
            onClick={() => onSelect(c.numero)}
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
  );
}

export default function IntermediarioPage() {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const louvor = id ? getLouvorById(id) : undefined;

  const [config, setConfig]           = useState<ConfiguracaoDePratica>({ ...DEFAULT_CONFIG, bpm: louvor?.bpm ?? 72 });
  const [compassoAtivo, setCompassoAtivo] = useState(3);

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

  const activeSec = louvor.secoes.find((s) =>
    s.linhas.flatMap((l) => l.compassos).some((c) => c.numero === compassoAtivo)
  );

  return (
    <AppShell
      titulo={louvor.titulo} numero={louvor.numero}
      modulo="Modo Intermediário"
      tom={louvor.tom} bpm={louvor.bpm}
      louvorId={louvor.id} nivel="intermediario" progresso={55}
      backPath={`/louvor/${louvor.id}`}
    >
      <div className="h-full flex overflow-hidden">
        {/* ── CENTER ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* Compasso navigator */}
          <div className="flex-shrink-0">
            <CompassoNav
              louvorSecoes={louvor.secoes}
              compassoAtivo={compassoAtivo}
              onSelect={setCompassoAtivo}
            />
          </div>

          {/* Régua analítica — connected ruler */}
          {activeSec && (
            <div className="flex-shrink-0">
              <RhythmicGrid secao={activeSec} compassoAtivo={compassoAtivo} />
            </div>
          )}

          {/* Cifra com função harmônica conectada */}
          <div className="flex-1 overflow-y-auto">
            <CifraInter
              secoes={louvor.secoes}
              compassoAtivo={compassoAtivo}
              exibirFuncao={config.exibirFuncaoHarmonica}
              exibirSubdivisao={config.exibirSubdivisao}
            />
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="w-72 flex flex-col gap-3 p-4 border-l border-panel-border overflow-y-auto flex-shrink-0 bg-ink">
          <PartituraPanel louvorId={louvor.id} nivel="intermediario" />
          <MetronomeControl defaultBpm={louvor.bpm} beats={parseInt(louvor.formula) || 4} inline />
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
