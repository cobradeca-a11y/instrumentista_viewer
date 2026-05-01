import type { Louvor } from "../types/music";

// Helper to build a segment
let _sid = 0;
function seg(
  acorde: string | null,
  texto: string,
  silaba: string,
  tempo: number,
  grau: string | null = null,
  funcao: string | null = null
) {
  return {
    id: `seg-${++_sid}`,
    acorde,
    texto,
    silaba,
    tempo,
    subdivisao: 0,
    duracao: 2,
    grauHarmonico: grau,
    funcaoHarmonica: funcao,
    analise: null,
    dinamica: null,
    linhaModalica: false,
  };
}

export const LOUVORES: Louvor[] = [
  {
    id: "001",
    numero: "001",
    titulo: "Ainda Uma Vez",
    artista: "[preencher compositor]",
    tom: "Cm",
    bpm: 72,
    formula: "4/4",
    status: "incompleto",
    niveisDisponiveis: ["aprendiz", "intermediario", "profissional"],

    secoes: [
      {
        id: "intro",
        label: "Introdução",
        cor: "#64748b",
        linhas: [
          {
            id: "intro-l1",
            compassos: [
              {
                numero: 1,
                formula: "4/4",
                segmentos: [
                  seg("Cm", "[introdução]", "[intro]", 1, "i", "tônica"),
                  seg("Ab", "", "", 3, "VI", "relativo maior"),
                ],
              },
              {
                numero: 2,
                formula: "4/4",
                segmentos: [
                  seg("Fm", "", "", 1, "iv", "subdominante"),
                  seg("G", "", "", 3, "V", "dominante"),
                ],
              },
            ],
          },
        ],
      },
      {
        id: "verso1",
        label: "Verso 1",
        cor: "#3b82f6",
        linhas: [
          {
            id: "v1-l1",
            compassos: [
              {
                numero: 3,
                formula: "4/4",
                segmentos: [
                  seg("Cm", "A-", "A-", 1, "i", "tônica"),
                  seg(null, "in-", "in-", 2, null, null),
                  seg(null, "da", "da", 2, null, null),
                  seg("Fm", "u-", "u-", 3, "iv", "subdominante"),
                  seg(null, "ma", "ma", 4, null, null),
                ],
              },
              {
                numero: 4,
                formula: "4/4",
                segmentos: [
                  seg(null, "vez", "vez", 1, null, null),
                  seg("Bb", "da-", "da-", 3, "VII", "subtônica"),
                  seg(null, "qui", "qui", 4, null, null),
                ],
              },
            ],
          },
          {
            id: "v1-l2",
            compassos: [
              {
                numero: 5,
                formula: "4/4",
                segmentos: [
                  seg("Eb", "a", "a", 1, "III", "mediante"),
                  seg(null, "pou-", "pou-", 2, null, null),
                  seg(null, "co,", "co,", 3, null, null),
                  seg("Ab", "e", "e", 4, "VI", "relativo maior"),
                ],
              },
              {
                numero: 6,
                formula: "4/4",
                segmentos: [
                  seg(null, "fa-", "fa-", 1, null, null),
                  seg("Fm", "rei", "rei", 2, "iv", "subdominante"),
                  seg(null, "tre-", "tre-", 3, null, null),
                  seg(null, "mer", "mer", 4, null, null),
                ],
              },
            ],
          },
          {
            id: "v1-l3",
            compassos: [
              {
                numero: 7,
                formula: "4/4",
                segmentos: [
                  seg("Cm", "os", "os", 1, "i", "tônica"),
                  seg(null, "céus", "céus", 2, null, null),
                  seg("G", "e", "e", 3, "V", "dominante"),
                  seg(null, "to-", "to-", 4, null, null),
                ],
              },
              {
                numero: 8,
                formula: "4/4",
                segmentos: [
                  seg(null, "da", "da", 1, null, null),
                  seg("Fm", "a", "a", 2, "iv", "subdominante"),
                  seg(null, "ter-", "ter-", 3, null, null),
                  seg("G", "ra", "ra", 4, "V", "dominante"),
                ],
              },
            ],
          },
        ],
      },
      {
        id: "refrao",
        label: "Refrão",
        cor: "#f0b429",
        linhas: [
          {
            id: "r-l1",
            compassos: [
              {
                numero: 9,
                formula: "4/4",
                segmentos: [
                  seg("Cm", "E", "E", 1, "i", "tônica"),
                  seg(null, "eu", "eu", 2, null, null),
                  seg("Fm", "en-", "en-", 3, "iv", "subdominante"),
                  seg(null, "che-", "che-", 4, null, null),
                ],
              },
              {
                numero: 10,
                formula: "4/4",
                segmentos: [
                  seg(null, "rei", "rei", 1, null, null),
                  seg("Bb", "as-", "as-", 2, "VII", "subtônica"),
                  seg(null, "sim", "sim", 3, null, null),
                  seg("Eb", "es-", "es-", 4, "III", "mediante"),
                ],
              },
            ],
          },
          {
            id: "r-l2",
            compassos: [
              {
                numero: 11,
                formula: "4/4",
                segmentos: [
                  seg(null, "te", "te", 1, null, null),
                  seg("Ab", "lu-", "lu-", 2, "VI", "relativo maior"),
                  seg(null, "gar", "gar", 3, null, null),
                  seg("Fm", "com", "com", 4, "iv", "subdominante"),
                ],
              },
              {
                numero: 12,
                formula: "4/4",
                segmentos: [
                  seg(null, "mi-", "mi-", 1, null, null),
                  seg("G", "nha", "nha", 2, "V", "dominante"),
                  seg(null, "gló-", "gló-", 3, null, null),
                  seg("Cm", "ria,", "ria,", 4, "i", "tônica"),
                ],
              },
            ],
          },
          {
            id: "r-l3",
            compassos: [
              {
                numero: 13,
                formula: "4/4",
                segmentos: [
                  seg(null, "diz", "diz", 1, null, null),
                  seg("Fm", "o", "o", 2, "iv", "subdominante"),
                  seg(null, "Se-", "Se-", 3, null, null),
                  seg(null, "nhor", "nhor", 4, null, null),
                ],
              },
              {
                numero: 14,
                formula: "4/4",
                segmentos: [
                  seg("Ab", "dos", "dos", 1, "VI", "relativo maior"),
                  seg(null, "e-", "e-", 2, null, null),
                  seg("G", "xér-", "xér-", 3, "V", "dominante"),
                  seg(null, "ci-", "ci-", 4, null, null),
                ],
              },
            ],
          },
          {
            id: "r-l4",
            compassos: [
              {
                numero: 15,
                formula: "4/4",
                segmentos: [
                  seg("Cm", "tos.", "tos.", 1, "i", "tônica"),
                  seg(null, "[preencher]", "[sílaba]", 3, null, null),
                ],
              },
            ],
          },
        ],
      },
      {
        id: "verso2",
        label: "Verso 2",
        cor: "#3b82f6",
        linhas: [
          {
            id: "v2-l1",
            compassos: [
              {
                numero: 16,
                formula: "4/4",
                segmentos: [
                  seg("Cm", "[preencher letra verso 2]", "[sílaba]", 1, "i", "tônica"),
                  seg("Fm", "[preencher]", "[sílaba]", 3, "iv", "subdominante"),
                ],
              },
              {
                numero: 17,
                formula: "4/4",
                segmentos: [
                  seg("Bb", "[preencher]", "[sílaba]", 1, "VII", "subtônica"),
                  seg("G", "[preencher]", "[sílaba]", 3, "V", "dominante"),
                ],
              },
            ],
          },
        ],
      },
    ],

    dadosProfissionais: {
      analisePorSecao: {
        intro: "Progressão i → VI → iv → V. Cadência frigia implícita. Estabelece Cm com movimentação cromática.",
        verso1: "Campo harmônico de Cm. Uso de Eb (III) como empréstimo do relativo maior (Eb Maior). Tensão acumulada na dominante G.",
        refrao: "Movimento pendular iv → III → VI → V cria sensação de expansão antes do retorno à tônica.",
        verso2: "[preencher análise do verso 2]",
      },
      erroProvavelAprendiz: "Trocar o acorde tarde, após a sílaba de entrada. Não antecipar a mudança.",
      erroProvavelIntermediario: "Tocar certo sem perceber a função harmônica. Ignorar o grau da subdominante como preparo.",
      exercicioExtraido: "Isolar os compassos 3–4 e praticar a troca Cm→Fm com metrônomo a 60 BPM até a entrada ser precisa.",
      objetivoPedagogico: "Compreender a progressão i–iv–V como estrutura central do louvor e sua relação com a letra.",
      comoExplicar: "Mostre que a harmonia menor cria o tom de súplica. O Fm prepara e o G resolve — sempre em direção ao Cm.",
      oQuePreservar: "A condução do baixo Cm→Bb→Ab→G. Ela sustenta a intenção emocional da música.",
      oQuePodeSimplificar: "O Eb pode ser omitido na versão de aprendiz, substituído por Cm sustentado.",
      alternativasArranjo: [
        {
          tipo: "simplificado",
          acorde: "Cm",
          grau: "i",
          descricao: "Manter Cm por dois compassos sem trocar para Eb. Reduz dificuldade sem destruir a harmonia.",
        },
        {
          tipo: "enriquecido",
          acorde: "Cm7",
          grau: "i7",
          descricao: "Adicionar sétima menor à tônica. Cor mais jazzística, adequada ao nível profissional.",
        },
        {
          tipo: "reharmonizado",
          acorde: "Abmaj7",
          grau: "VImaj7",
          descricao: "Substituir Ab por Abmaj7 no refrão. Enriquece sem mudar a função harmônica.",
        },
      ],
    },

    objetivoAprendiz: "Localizar a entrada do acorde na sílaba correta e manter o pulso estável.",
    objetivoIntermediario: "Relacionar a troca de acorde com o peso do tempo e identificar a função harmônica de cada grau.",
    objetivoProfissional: "Analisar a progressão, decidir adaptações e preparar materiais pedagógicos para outros músicos.",

    dicaAprendiz: "O acorde entra na sílaba destacada, não em cada nota da melodia. Conte 1-2-3-4 em voz baixa.",
    dicaIntermediario: "Observe como a troca harmônica se apoia no tempo forte ou médio do compasso. O Fm é subdominante — prepara o retorno.",
    dicaProfissional: "Preserve a condução do baixo quando ela sustenta a intenção harmônica. Enriquecer demais pode atrapalhar a comunicação.",

    erroProvavelAprendiz: "Trocar o acorde tarde, depois da sílaba de entrada.",
    erroProvavelIntermediario: "Tocar certo sem perceber a condução harmônica subjacente.",
    erroProvavelProfissional: "Enriquecer demais e perder a identidade da música.",
  },

  {
    id: "002",
    numero: "002",
    titulo: "[Louvor Exemplo 2]",
    artista: "[preencher]",
    tom: "G",
    bpm: 80,
    formula: "4/4",
    status: "pendente",
    niveisDisponiveis: ["aprendiz"],
    secoes: [
      {
        id: "verso",
        label: "Verso",
        cor: "#3b82f6",
        linhas: [
          {
            id: "v-l1",
            compassos: [
              {
                numero: 1,
                formula: "4/4",
                segmentos: [
                  seg("G", "[preencher letra]", "[sílaba]", 1, "I", "tônica"),
                  seg("D", "[preencher]", "[sílaba]", 3, "V", "dominante"),
                ],
              },
            ],
          },
        ],
      },
    ],
    dadosProfissionais: {
      analisePorSecao: { verso: "[preencher análise]" },
      erroProvavelAprendiz: "[preencher]",
      erroProvavelIntermediario: "[preencher]",
      exercicioExtraido: "[preencher]",
      objetivoPedagogico: "[preencher]",
      comoExplicar: "[preencher]",
      oQuePreservar: "[preencher]",
      oQuePodeSimplificar: "[preencher]",
      alternativasArranjo: [],
    },
    objetivoAprendiz: "[preencher objetivo]",
    objetivoIntermediario: "[preencher objetivo]",
    objetivoProfissional: "[preencher objetivo]",
    dicaAprendiz: "[preencher dica]",
    dicaIntermediario: "[preencher dica]",
    dicaProfissional: "[preencher dica]",
    erroProvavelAprendiz: "[preencher]",
    erroProvavelIntermediario: "[preencher]",
    erroProvavelProfissional: "[preencher]",
  },

  {
    id: "003",
    numero: "003",
    titulo: "[Louvor Exemplo 3]",
    artista: "[preencher]",
    tom: "D",
    bpm: 90,
    formula: "4/4",
    status: "pendente",
    niveisDisponiveis: ["aprendiz"],
    secoes: [],
    dadosProfissionais: {
      analisePorSecao: {},
      erroProvavelAprendiz: "[preencher]",
      erroProvavelIntermediario: "[preencher]",
      exercicioExtraido: "[preencher]",
      objetivoPedagogico: "[preencher]",
      comoExplicar: "[preencher]",
      oQuePreservar: "[preencher]",
      oQuePodeSimplificar: "[preencher]",
      alternativasArranjo: [],
    },
    objetivoAprendiz: "[preencher objetivo]",
    objetivoIntermediario: "[preencher objetivo]",
    objetivoProfissional: "[preencher objetivo]",
    dicaAprendiz: "[preencher dica]",
    dicaIntermediario: "[preencher dica]",
    dicaProfissional: "[preencher dica]",
    erroProvavelAprendiz: "[preencher]",
    erroProvavelIntermediario: "[preencher]",
    erroProvavelProfissional: "[preencher]",
  },
];

export function getLouvorById(id: string): Louvor | undefined {
  return LOUVORES.find((l) => l.id === id);
}
