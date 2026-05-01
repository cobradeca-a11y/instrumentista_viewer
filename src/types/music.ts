// ─── Core Music Types ─────────────────────────────────────────────────────────

export type NivelPedagogico = "aprendiz" | "intermediario" | "profissional";
export type StatusLouvor = "preparado" | "incompleto" | "pendente";

export interface SegmentoMusical {
  id: string;
  acorde: string | null;
  texto: string;
  silaba: string;
  tempo: number;
  subdivisao: number;
  duracao: number;
  grauHarmonico: string | null;
  funcaoHarmonica: string | null;
  analise: string | null;
  dinamica: string | null;
  linhaMelodica: boolean;
}

export interface CompassoMusical {
  numero: number;
  formula: string;
  segmentos: SegmentoMusical[];
}

export interface LinhaMusical {
  id: string;
  compassos: CompassoMusical[];
}

export interface SecaoMusical {
  id: string;
  label: string;
  cor: string;
  linhas: LinhaMusical[];
}

export interface AlternativaArranjo {
  tipo: "simplificado" | "enriquecido" | "reharmonizado" | "transposto";
  acorde: string;
  grau: string;
  descricao: string;
}

export interface DadosProfissionais {
  analisePorSecao: Record<string, string>;
  erroProvavelAprendiz: string;
  erroProvavelIntermediario: string;
  exercicioExtraido: string;
  objetivoPedagogico: string;
  comoExplicar: string;
  oQuePreservar: string;
  oQuePodeSimplificar: string;
  alternativasArranjo: AlternativaArranjo[];
}

export interface ConfiguracaoDePratica {
  velocidade: number;
  bpm: number;
  repeticaoAtiva: boolean;
  trechoA: number | null;
  trechoB: number | null;
  exibirCifras: boolean;
  modoMemoria: boolean;
  exibirFuncaoHarmonica: boolean;
  exibirLinhaMelodica: boolean;
  exibirDinamica: boolean;
  exibirSubdivisao: boolean;
  metronomeAtivo: boolean;
  metronomeComSom: boolean;
}

export interface FerramentaPedagogica {
  id: string;
  label: string;
  niveis: NivelPedagogico[];
  ativa: boolean;
}

export interface ArquivoPersistido {
  louvorId: string;
  tipo: "partitura" | "midi" | "audio";
  nome: string;
  tamanho: number;
  dataUpload: string;
}

export interface Louvor {
  id: string;
  numero: string;
  titulo: string;
  artista: string;
  tom: string;
  bpm: number;
  formula: string;
  status: StatusLouvor;
  niveisDisponiveis: NivelPedagogico[];
  secoes: SecaoMusical[];
  dadosProfissionais: DadosProfissionais;
  objetivoAprendiz: string;
  objetivoIntermediario: string;
  objetivoProfissional: string;
  dicaAprendiz: string;
  dicaIntermediario: string;
  dicaProfissional: string;
  erroProvavelAprendiz: string;
  erroProvavelIntermediario: string;
  erroProvavelProfissional: string;
}
