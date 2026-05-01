import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Brain } from "lucide-react";
import { getLouvorById } from "../data/louvores";
import type { ConfiguracaoDePratica, SecaoMusical, SegmentoMusical } from "../types/music";
import AppShell from "../components/layout/AppShell";
import PartituraPanel from "../components/music/PartituraPanel";
import MidiPlayer from "../components/music/MidiPlayer";
import MetronomeControl from "../components/music/MetronomeControl";
import { ObjectivePanel } from "../components/pedagogy/ObjectivePanel";

const DEFAULT_CONFIG: ConfiguracaoDePratica = {
  velocidade: 100, bpm: 72, repeticaoAtiva: false,
  trechoA: null, trechoB: null,
  exibirCifras: true, modoMemoria: false,
  exibirFuncaoHarmonica: false, exibirLinhaMelodica: false,
  exibirDinamica: false, exibirSubdivisao: false,
  metronomeAtivo: false, metronomeComSom: true,
};

// ─── Beat counter: 1 e 2 e 3 e 4 e ──────────────────────────────────────────
function BeatCounter({ formula, activeBeat }: { formula: string; activeBeat: number }) {
  const total = parseInt(formula) || 4;
  const cells: { label: string; isNum: boolean; idx: number }[] = [];
  for (let i = 0; i < total; i++) {
    cells.push({ label: String(i + 1), isNum: true,  idx: i * 2 });
    cells.push({ label: "e",           isNum: false, idx: i * 2 + 1 });
  }
  return (
    <div className="flex items-center gap-1">
      {cells.map((c) => (
        <div
          key={c.idx}
          className={`flex items-center justify-center rounded-lg border font-mono font-bold transition-all
            ${c.isNum ? "w-9 h-9 text-sm" : "w-5 h-5 text-[10px]"}
            ${activeBeat === c.idx
              ? c.isNum
                ? "bg-gold text-ink border-gold scale-110 shadow-lg shadow-gold/30"
                : "bg-amber-600/40 text-amber-300 border-amber-600"
              : c.isNum
              ? "bg-panel-light border-panel-border text-slate-400"
              : "border-transparent text-slate-700"}`}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

// ─── Pedagogical unit panel ───────────────────────────────────────────────────
// Shows: acorde atual → sílaba → tempo → compasso
interface PedaUnitProps {
  seg: SegmentoMusical | null;
  compasso: number;
}
function PedaUnit({ seg: s, compasso }: PedaUnitProps) {
  const items = [
    { label: "Acorde",   value: s?.acorde  ?? "—",            color: "#60a5fa", big: true },
    { label: "Sílaba",   value: s?.silaba  || s?.texto || "—", color: "#e2e8f0", big: true },
    { label: "Tempo",    value: s ? String(s.tempo) : "—",     color: "#f0b429", big: false },
    { label: "Compasso", value: String(compasso),               color: "#94a3b8", big: false },
  ];
  return (
    <div className="bg-panel border border-gold/20 rounded-xl p-3">
      <div className="text-[10px] font-bold text-gold uppercase tracking-wider mb-2">
        Unidade Pedagógica
      </div>
      <div className="flex items-stretch gap-2">
        {items.map((item, i) => (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`font-bold font-mono leading-none ${item.big ? "text-xl" : "text-base"}`}
              style={{ color: item.color }}
            >
              {item.value}
            </div>
            <div className="text-[9px] text-slate-600 uppercase tracking-wide">
              {item.label}
            </div>
            {i < items.length - 1 && (
              <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 text-slate-700 text-xs">
                →
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Flow indicator */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-panel-border">
        {["Cifra", "→", "Sílaba", "→", "Tempo", "→", "Compasso"].map((t, i) => (
          <span
            key={i}
            className={`text-[9px] ${t === "→" ? "text-slate-700" : "text-slate-500 font-bold"}`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Section color map ────────────────────────────────────────────────────────
const SEC_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "Introdução": { text: "#94a3b8", bg: "#1e293b",   border: "#334155" },
  "Verso 1":    { text: "#60a5fa", bg: "#1e3a5f20", border: "#3b82f660" },
  "Verso 2":    { text: "#60a5fa", bg: "#1e3a5f20", border: "#3b82f660" },
  "Refrão":     { text: "#f0b429", bg: "#42200620", border: "#f0b42960" },
  "Ponte":      { text: "#c084fc", bg: "#2d1b4e20", border: "#c084fc60" },
  "Coda":       { text: "#22c55e", bg: "#05301620", border: "#22c55e60" },
};
function secCol(label: string) {
  return SEC_COLORS[label] ?? { text: "#94a3b8", bg: "#1e293b", border: "#334155" };
}

// ─── Cifra Aprendiz ───────────────────────────────────────────────────────────
interface CifraAprendizProps {
  secoes: SecaoMusical[];
  exibirCifras: boolean;
  modoMemoria: boolean;
  compassoAtivo: number;
  onSegClick: (seg: SegmentoMusical, compasso: number) => void;
}

function CifraAprendiz({ secoes, exibirCifras, modoMemoria, compassoAtivo, onSegClick }: CifraAprendizProps) {
  return (
    <div className="flex flex-col gap-5">
      {secoes.map((sec) => {
        const col = secCol(sec.label);
        return (
          <div key={sec.id}>
            <div
              className="inline-flex items-center px-3 py-0.5 rounded-md text-xs font-bold border mb-3 w-fit"
              style={{ color: col.text, background: col.bg, borderColor: col.border }}
            >
              {sec.label}
            </div>

            {sec.linhas.map((linha) => (
              <div key={linha.id} className="flex flex-col gap-2 mb-4">
                {linha.compassos.map((comp) => {
                  const isActive = compassoAtivo === comp.numero;
                  return (
                    <div
                      key={comp.numero}
                      className={`flex flex-wrap items-end gap-x-4 gap-y-2 px-4 py-3 rounded-xl border transition-all
                        ${isActive ? "bg-panel-light border-gold/40" : "bg-panel border-panel-border"}`}
                    >
                      <span className="text-[10px] text-slate-700 self-start mt-1 w-4 text-center font-mono">
                        {comp.numero}
                      </span>

                      {comp.segmentos.map((s) => {
                        const hide = !exibirCifras || modoMemoria;

                        return (
                          <div
                            key={s.id}
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => onSegClick(s, comp.numero)}
                          >
                            {/* Chord — large */}
                            {s.acorde ? (
                              <span
                                className={`text-2xl font-bold font-mono leading-none mb-2 transition-all select-none
                                  ${hide
                                    ? modoMemoria
                                      ? "text-transparent bg-panel-border rounded-lg px-2"
                                      : "invisible"
                                    : "text-blue-400 hover:text-blue-300"}`}
                              >
                                {modoMemoria && hide ? "___" : s.acorde}
                              </span>
                            ) : (
                              <span className="text-2xl leading-none mb-2 invisible">·</span>
                            )}

                            {/* Syllable */}
                            <span
                              className={`text-xl leading-none font-medium select-none
                                ${s.acorde ? "text-slate-100 font-bold" : "text-slate-400"}`}
                            >
                              {s.texto || "\u00A0\u00A0"}
                            </span>

                            {/* Chord entry dot */}
                            {s.acorde && (
                              <div className="w-1 h-1 rounded-full bg-gold/40 mt-1" />
                            )}
                          </div>
                        );
                      })}
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AprendizPage() {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const louvor = id ? getLouvorById(id) : undefined;

  const [config, setConfig]             = useState<ConfiguracaoDePratica>({ ...DEFAULT_CONFIG, bpm: louvor?.bpm ?? 72 });
  const [activeBeat, setActiveBeat]     = useState(-1);
  const [compassoAtivo, setCompassoAtivo] = useState<number>(3);
  const [activeSeg, setActiveSeg]       = useState<SegmentoMusical | null>(null);

  useEffect(() => { if (!louvor) nav("/biblioteca"); }, [louvor, nav]);
  if (!louvor) return null;

  const updateConfig = (p: Partial<ConfiguracaoDePratica>) => setConfig(c => ({ ...c, ...p }));

  const handleSegClick = useCallback((s: SegmentoMusical, comp: number) => {
    setActiveSeg(s);
    setCompassoAtivo(comp);
  }, []);

  // Find first chord segment in active compasso for peda unit
  const activeCompSeg: SegmentoMusical | null = (() => {
    if (activeSeg) return activeSeg;
    for (const sec of louvor.secoes)
      for (const l of sec.linhas)
        for (const c of l.compassos)
          if (c.numero === compassoAtivo) {
            const cs = c.segmentos.find(s => s.acorde);
            return cs ?? c.segmentos[0] ?? null;
          }
    return null;
  })();

  return (
    <AppShell
      titulo={louvor.titulo} numero={louvor.numero}
      modulo="Cifras de Aprendiz"
      tom={louvor.tom} bpm={louvor.bpm}
      louvorId={louvor.id} nivel="aprendiz" progresso={32}
      backPath={`/louvor/${louvor.id}`}
    >
      <div className="h-full flex overflow-hidden">
        {/* ── CENTER ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">

          {/* Top toolbar */}
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <div className="flex items-center gap-2 bg-panel border border-panel-border rounded-lg px-3 py-1.5 flex-shrink-0">
              <span className="text-xs font-mono text-slate-400">{louvor.formula}</span>
              <span className="text-slate-700">|</span>
              <span className="text-xs text-gold font-bold">♩ = {louvor.bpm}</span>
            </div>

            <BeatCounter formula={louvor.formula} activeBeat={activeBeat} />

            <div className="flex-1" />

            <button
              onClick={() => updateConfig({ exibirCifras: !config.exibirCifras })}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all flex-shrink-0
                ${!config.exibirCifras
                  ? "bg-gold/20 border-gold/50 text-gold"
                  : "border-panel-border text-slate-500 hover:text-slate-300"}`}
            >
              {config.exibirCifras ? <Eye size={12} /> : <EyeOff size={12} />}
              {config.exibirCifras ? "Esconder cifras" : "Mostrar cifras"}
            </button>

            <button
              onClick={() => updateConfig({ modoMemoria: !config.modoMemoria })}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all flex-shrink-0
                ${config.modoMemoria
                  ? "bg-purple-900/40 border-purple-700/50 text-purple-300"
                  : "border-panel-border text-slate-500 hover:text-slate-300"}`}
            >
              <Brain size={12} />
              Modo Memória
            </button>
          </div>

          {/* Pedagogical unit — cifra → sílaba → tempo → compasso */}
          <div className="flex-shrink-0">
            <PedaUnit
              seg={activeCompSeg}
              compasso={compassoAtivo}
            />
          </div>

          {/* Cifra — large */}
          <div className="flex-1 overflow-y-auto">
            <CifraAprendiz
              secoes={louvor.secoes}
              exibirCifras={config.exibirCifras}
              modoMemoria={config.modoMemoria}
              compassoAtivo={compassoAtivo}
              onSegClick={handleSegClick}
            />
          </div>

          {/* Velocidade */}
          <div className="flex items-center gap-3 flex-shrink-0 bg-panel border border-panel-border rounded-xl px-4 py-2">
            <span className="text-xs text-slate-500 flex-shrink-0">Velocidade</span>
            <input
              type="range" min={50} max={150} value={config.velocidade}
              onChange={(e) => updateConfig({ velocidade: Number(e.target.value) })}
              className="flex-1 accent-amber-400"
            />
            <span className="text-gold text-xs font-bold w-12 text-right">{config.velocidade}%</span>
          </div>
        </div>

        {/* ── RIGHT panel ── */}
        <div
          className="flex flex-col gap-3 p-4 border-l border-panel-border overflow-y-auto flex-shrink-0 bg-ink"
          style={{ width: 272 }}
        >
          <PartituraPanel louvorId={louvor.id} nivel="aprendiz" />

          <MetronomeControl
            defaultBpm={louvor.bpm}
            beats={parseInt(louvor.formula) || 4}
            onBeat={(b) => setActiveBeat(b)}
            inline
          />

          <MidiPlayer louvorId={louvor.id} defaultBpm={louvor.bpm} />

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
