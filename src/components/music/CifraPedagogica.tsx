import { useState } from "react";
import type { SecaoMusical, NivelPedagogico } from "../../types/music";
import { Eye, EyeOff, Brain } from "lucide-react";

const SEC_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "Introdução": { text: "#94a3b8", bg: "#1e293b", border: "#334155" },
  "Verso 1":    { text: "#60a5fa", bg: "#1e3a5f20", border: "#3b82f660" },
  "Verso 2":    { text: "#60a5fa", bg: "#1e3a5f20", border: "#3b82f660" },
  "Refrão":     { text: "#f0b429", bg: "#42200620", border: "#f0b42960" },
  "Ponte":      { text: "#c084fc", bg: "#2d1b4e20", border: "#c084fc60" },
  "Coda":       { text: "#22c55e", bg: "#05301620", border: "#22c55e60" },
};

function getSecColor(label: string) {
  return SEC_COLORS[label] ?? { text: "#94a3b8", bg: "#1e293b", border: "#334155" };
}

interface CifraPedagogicaProps {
  secoes: SecaoMusical[];
  nivel: NivelPedagogico;
  compassoAtivo?: number;
  segmentoAtivo?: string;
  exibirFuncao?: boolean;
  exibirGrau?: boolean;
}

export default function CifraPedagogica({
  secoes,
  nivel,
  compassoAtivo,
  segmentoAtivo,
  exibirFuncao = false,
  exibirGrau = false,
}: CifraPedagogicaProps) {
  const [esconderCifras, setEsconderCifras] = useState(false);
  const [modoMemoria, setModoMemoria] = useState(false);

  const accordFontSize =
    nivel === "aprendiz" ? "text-xl" : nivel === "intermediario" ? "text-lg" : "text-base";
  const lyricFontSize =
    nivel === "aprendiz" ? "text-2xl" : nivel === "intermediario" ? "text-xl" : "text-lg";

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
      {/* Controls bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setEsconderCifras(!esconderCifras)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all
            ${esconderCifras
              ? "bg-gold/20 border-gold/50 text-gold"
              : "border-panel-border text-slate-500 hover:text-slate-300"}`}
        >
          {esconderCifras ? <EyeOff size={12} /> : <Eye size={12} />}
          {esconderCifras ? "Mostrar cifras" : "Esconder cifras"}
        </button>
        <button
          onClick={() => setModoMemoria(!modoMemoria)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all
            ${modoMemoria
              ? "bg-purple-900/40 border-purple-700/50 text-purple-300"
              : "border-panel-border text-slate-500 hover:text-slate-300"}`}
        >
          <Brain size={12} />
          Modo Memória
        </button>
      </div>

      {/* Sections */}
      {secoes.map((sec) => {
        const col = getSecColor(sec.label);
        return (
          <div key={sec.id} className="flex flex-col gap-3">
            {/* Section badge */}
            <div
              className="inline-flex items-center px-3 py-0.5 rounded-md text-xs font-bold border w-fit"
              style={{ color: col.text, background: col.bg, borderColor: col.border }}
            >
              {sec.label}
            </div>

            {/* Lines */}
            {sec.linhas.map((linha) => (
              <div key={linha.id} className="flex flex-col gap-2">
                {/* Compassos in this line */}
                {linha.compassos.map((comp) => {
                  const isActiveComp = compassoAtivo === comp.numero;
                  return (
                    <div
                      key={comp.numero}
                      className={`flex flex-wrap items-end gap-x-4 gap-y-1 px-4 py-3 rounded-xl border transition-all
                        ${isActiveComp
                          ? "bg-panel-light border-gold/40"
                          : "bg-panel border-panel-border"}`}
                    >
                      {/* Compass number */}
                      <span className="text-[10px] text-slate-700 self-start mr-1">{comp.numero}</span>

                      {comp.segmentos.map((seg) => {
                        const isActiveSeg = segmentoAtivo === seg.id;
                        const showChord = seg.acorde !== null;
                        const hide = modoMemoria
                          ? true
                          : esconderCifras
                          ? true
                          : false;

                        return (
                          <div
                            key={seg.id}
                            className={`flex flex-col items-center transition-all ${isActiveSeg ? "scale-105" : ""}`}
                          >
                            {/* Funcao / Grau — intermediario/profissional */}
                            {(exibirFuncao || exibirGrau) && (
                              <div className="flex gap-1 mb-0.5">
                                {exibirGrau && seg.grauHarmonico && (
                                  <span className="text-[9px] font-mono text-purple-400 px-1 rounded bg-purple-900/20">
                                    {seg.grauHarmonico}
                                  </span>
                                )}
                                {exibirFuncao && seg.funcaoHarmonica && (
                                  <span className="text-[9px] text-slate-500 italic">
                                    {seg.funcaoHarmonica}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Chord */}
                            {showChord ? (
                              <span
                                className={`font-bold leading-none mb-1 font-mono transition-all ${accordFontSize}
                                  ${hide
                                    ? modoMemoria && seg.acorde
                                      ? "text-transparent bg-panel-border rounded px-1"
                                      : "invisible"
                                    : isActiveSeg
                                    ? "text-gold"
                                    : "text-blue-400"
                                  }`}
                              >
                                {hide && modoMemoria ? "___" : (seg.acorde ?? "")}
                              </span>
                            ) : (
                              <span className={`leading-none mb-1 ${accordFontSize} invisible`}>·</span>
                            )}

                            {/* Syllable / text */}
                            <span
                              className={`leading-none font-medium ${lyricFontSize}
                                ${isActiveSeg ? "text-blue-300" : "text-slate-200"}`}
                            >
                              {seg.texto || "\u00A0"}
                            </span>
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
