import type { DadosProfissionais } from "../../types/music";
import { Layers, Users, Shuffle, BookOpen, AlertTriangle, Wrench } from "lucide-react";;

interface ProfessionalArrangementPanelProps {
  dados: DadosProfissionais;
}

export function ProfessionalArrangementPanel({ dados }: ProfessionalArrangementPanelProps) {
  const TIPO_COLOR: Record<string, string> = {
    simplificado:  "#22c55e",
    enriquecido:   "#60a5fa",
    reharmonizado: "#c084fc",
    transposto:    "#f0b429",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-gold" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Painel de Arranjo</span>
      </div>

      {/* Análise por seção */}
      {Object.entries(dados.analisePorSecao).map(([sec, analise]) => (
        <div key={sec} className="bg-panel border border-panel-border rounded-xl p-3">
          <div className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1">{sec}</div>
          <p className="text-xs text-slate-400 leading-relaxed">{analise}</p>
        </div>
      ))}

      {/* Alternativas de arranjo */}
      {dados.alternativasArranjo.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shuffle size={12} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alternativas</span>
          </div>
          <div className="flex flex-col gap-2">
            {dados.alternativasArranjo.map((alt, i) => (
              <div
                key={i}
                className="rounded-xl border p-3 flex items-start gap-3"
                style={{ borderColor: TIPO_COLOR[alt.tipo] + "40", background: TIPO_COLOR[alt.tipo] + "10" }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg font-bold font-mono" style={{ color: TIPO_COLOR[alt.tipo] }}>
                    {alt.acorde}
                  </span>
                  <span className="text-[9px] font-mono text-slate-600">{alt.grau}</span>
                </div>
                <div>
                  <span
                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border mb-1 inline-block"
                    style={{ color: TIPO_COLOR[alt.tipo], borderColor: TIPO_COLOR[alt.tipo] + "50" }}
                  >
                    {alt.tipo}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">{alt.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to preserve / simplify */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-panel border border-panel-border rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <BookOpen size={11} className="text-green-500" />
            <span className="text-[9px] font-bold text-green-600 uppercase">Preservar</span>
          </div>
          <p className="text-xs text-slate-400">{dados.oQuePreservar}</p>
        </div>
        <div className="bg-panel border border-panel-border rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <Wrench size={11} className="text-orange-500" />
            <span className="text-[9px] font-bold text-orange-600 uppercase">Simplificar</span>
          </div>
          <p className="text-xs text-slate-400">{dados.oQuePodeSimplificar}</p>
        </div>
      </div>
    </div>
  );
}

interface ProfessionalTeachingPanelProps {
  dados: DadosProfissionais;
}

export function ProfessionalTeachingPanel({ dados }: ProfessionalTeachingPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Users size={14} className="text-blue-400" />
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Painel Pedagógico</span>
      </div>

      <div className="bg-panel border border-blue-900/40 rounded-xl p-3">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Como explicar</div>
        <p className="text-xs text-slate-400 leading-relaxed">{dados.comoExplicar}</p>
      </div>

      <div className="bg-panel border border-panel-border rounded-xl p-3">
        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Exercício extraído</div>
        <p className="text-xs text-slate-400 leading-relaxed">{dados.exercicioExtraido}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle size={10} className="text-red-500" />
            <span className="text-[9px] font-bold text-red-600 uppercase">Erro — Aprendiz</span>
          </div>
          <p className="text-xs text-red-400">{dados.erroProvavelAprendiz}</p>
        </div>
        <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle size={10} className="text-orange-500" />
            <span className="text-[9px] font-bold text-orange-600 uppercase">Erro — Interm.</span>
          </div>
          <p className="text-xs text-orange-400">{dados.erroProvavelIntermediario}</p>
        </div>
      </div>

      <div className="bg-panel border border-panel-border rounded-xl p-3">
        <div className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1">Objetivo pedagógico</div>
        <p className="text-xs text-slate-400 leading-relaxed">{dados.objetivoPedagogico}</p>
      </div>
    </div>
  );
}
