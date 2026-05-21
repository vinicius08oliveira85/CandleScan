import { PresetChart } from "../types";

export const PRESET_CHARTS: PresetChart[] = [
  {
    id: "csed3-example",
    title: "CSED3 - Subindo Firme, mas com Dúvida no Topo",
    asset: "CSED3",
    timeframe: "15 Minutos (Vela de 15m)",
    description: "Excelente gráfico didático mostrando o preço subindo bastante, mas encontrando uma barreira difícil de passar lá no teto.",
    imageUrl: "placeholder-csed",
    analysis: {
      ativoCooptado: "CSED3",
      tempoGrafico: "15 Minutos (Tempo de 15m)",
      tendencia: "Alta (Subindo)",
      momento: "Preço cansando no teto / Chance de recuo rápido",
      leituraCandles: "O gráfico vinha subindo de forma espetacular com velas verdes grandes (mostrando que os compradores estavam muito empolgados e empurrando o preço para cima). Porém, ao chegar perto do valor $4,38, o preço encontrou um 'teto' difícil. O último candle fechou no formato de uma pequena cruz (chamado de Doji, que indica total empate e hesitação do mercado). Isso significa que as forças equilibraram e o preço pode descansar um pouco.",
      suporte: "$4,32 (o chão firme que impede o preço de cair mais nesta região) e $4,23 (um segundo colchão de apoio que impede novas quedas e ajuda o preço a subir).",
      resistencia: "$4,38 (o teto firme que impede o preço de subir mais do que isso por enquanto).",
      cenarioProvavel: "O preço deve dar uma leve respirada para trás (cair um pouquinho) até perto de $4,28 ou $4,30. É uma retração natural para ganhar fôlego antes de tentar subir de novo.",
      acaoRecomendada: "Aguardar (Melhor esperar o preço baratear)",
      tipoEntrada: "Pisar de leve no chão recém-testado após o preço recuar para checar a segurança do apoio (Pullback)",
      pontoEntrada: "$4,28 (esperar retração para comprar mais barato)",
      stopLoss: "$4,22 (cinto de segurança se o preço despencar)",
      alvo: "$4,38 (primeiro destino para realizar lucro)",
      nivelConfianca: "Médio",
      relacaoRiscoRetorno: "1:1,7 — equilibrada (ganho um pouco maior que o risco)",
      comentarioAnalista: "Se perder, você perde cerca de $0,06 até o stop; se ganhar, você ganha cerca de $0,10 até o alvo. Olá iniciante! Nunca compre quando o preço acabou de subir muito rápido e bateu no teto de $4,38. Deixe o preço cair um pouquinho perto do piso de $4,28-$4,30.",
      rompimentoDetectado: false,
      rompimentoComentario: "",
      syntheticCandles: [
        { open: 4.18, high: 4.21, low: 4.16, close: 4.20 },
        { open: 4.20, high: 4.24, low: 4.19, close: 4.23 },
        { open: 4.23, high: 4.27, low: 4.22, close: 4.26 },
        { open: 4.26, high: 4.30, low: 4.25, close: 4.29 },
        { open: 4.29, high: 4.33, low: 4.28, close: 4.32 },
        { open: 4.32, high: 4.36, low: 4.31, close: 4.35 },
        { open: 4.35, high: 4.38, low: 4.34, close: 4.37 },
        { open: 4.37, high: 4.39, low: 4.35, close: 4.36 },
        { open: 4.36, high: 4.38, low: 4.33, close: 4.34 },
        { open: 4.34, high: 4.38, low: 4.33, close: 4.37 }
      ]
    }
  },
  {
    id: "vales3-breakout",
    title: "VALE3 - Força de Queda & Perda do Piso Protetor",
    asset: "VALE3",
    timeframe: "5 Minutos (Vela rápida de 5m)",
    description: "Um gráfico simples mostrando o preço perdendo um piso protetor e pegando velocidade para baixo.",
    imageUrl: "placeholder-vale3",
    analysis: {
      ativoCooptado: "VALE3",
      tempoGrafico: "5 Minutos (Tempo rápido de 5m)",
      tendencia: "Baixa (Caindo)",
      momento: "Queda livre / Vendedores no controle",
      leituraCandles: "As velas vermelhas de queda estão muito maiores e gordinhas que as verdes, mostrando que as pessoas estão vendendo o ativo com pressa. O preço caiu abaixo de uma barreira importante e as sombras sugerem que os compradores desistiram temporariamente de segurar o preço.",
      suporte: "$58,50 (o chão que acabava de impedir quedas, mas rachou e foi vencido) e $57,80 (o próximo colchão de chão firme lá embaixo).",
      resistencia: "$58,50 (o antigo chão que agora virou o teto que impede o preço de subir de volta).",
      cenarioProvavel: "Como o 'piso' estourou para baixo, a tendência é o preço dar um pequeno ensaio de subida para testar os $58,50 (teto temporário) e depois continuar deslizando em direção a $57,80.",
      acaoRecomendada: "Vender (Aproveitar a queda)",
      tipoEntrada: "Entrar em terreno plano de descida depois que o chão de apoio rachou e desabou de vez (Rompimento de Chão)",
      pontoEntrada: "$58,50 (entrada no reteste após rompimento do piso)",
      stopLoss: "$58,85 (stop de proteção acima do reteste)",
      alvo: "$57,90 (meta para realizar lucro na queda)",
      nivelConfianca: "Alto",
      relacaoRiscoRetorno: "1:1,7 — viável (lucro na queda supera o risco do stop)",
      comentarioAnalista: "Quando um 'piso' forte é rompido para baixo, ele vira um 'teto'. É um conceito clássico e seguro! Não tente adivinhar fundo comprando enquanto está caindo de forma violenta. Siga o fluxo de quem está vendendo.",
      rompimentoDetectado: true,
      rompimentoComentario: "ATENÇÃO: O piso forte de suporte nos R$ 58,50 foi quebrado com extrema convicção! O fechamento de múltiplas velas vermelhas encorpadas abaixo deste nível confirma que a força de queda rompeu a defesa compradora, abrindo caminho para mais perdas rápidas.",
      syntheticCandles: [
        { open: 59.10, high: 59.15, low: 58.95, close: 59.00 },
        { open: 59.00, high: 59.05, low: 58.80, close: 58.85 },
        { open: 58.85, high: 58.90, low: 58.65, close: 58.70 },
        { open: 58.70, high: 58.75, low: 58.55, close: 58.58 },
        { open: 58.58, high: 58.62, low: 58.48, close: 58.50 },
        { open: 58.50, high: 58.55, low: 58.35, close: 58.38 },
        { open: 58.38, high: 58.42, low: 58.20, close: 58.22 },
        { open: 58.22, high: 58.28, low: 58.05, close: 58.08 },
        { open: 58.08, high: 58.12, low: 57.95, close: 57.98 },
        { open: 57.98, high: 58.05, low: 57.85, close: 57.88 }
      ]
    }
  },
  {
    id: "petr4-range",
    title: "PETR4 - Andando de Lado no Retângulo de Equilíbrio",
    asset: "PETR4",
    timeframe: "15 Minutos (Vela de 15m)",
    description: "Perfeito exemplo de mercado calmo, batendo no teto, voltando no piso, sem sair do lugar.",
    imageUrl: "placeholder-petr4",
    analysis: {
      ativoCooptado: "PETR4",
      tempoGrafico: "15 Minutos (Tempo de 15m)",
      tendencia: "Lateral (Andando de Lado)",
      momento: "Total equilíbrio / Sem tendência definida",
      leituraCandles: "As velas estão se alternando constantemente: uma verde de alta, uma vermelha de queda, todas pequenininhas. Isso denota que nem compradores nem vendedores sabem para onde ir, mantendo o preço preso em um canal estrito.",
      suporte: "$34,10 (o chão bem demarcado que impede o preço de cair mais que isso).",
      resistencia: "$34,80 (o teto claro que impede o preço de subir mais, batendo e voltando).",
      cenarioProvavel: "O preço deve continuar quicando feito bolinha de tênis de mesa entre $34,10 e $34,80 pelos próximos períodos, até que apareça uma grande notícia ou movimento financeiro.",
      acaoRecomendada: "Comprar (Apenas perto do piso)",
      tipoEntrada: "Terreno plano e restrito: preço quicando feito bolinha entre o chão firme e o teto rígido",
      pontoEntrada: "$34,15 (comprar perto do piso do canal)",
      stopLoss: "$33,95 (stop abaixo do piso histórico)",
      alvo: "$34,70 (realizar lucro antes do teto)",
      nivelConfianca: "Médio",
      relacaoRiscoRetorno: "1:3,7 — viável (lucro no teto compensa bem o stop apertado)",
      comentarioAnalista: "Operar mercados laterais exige metas rápidas. Compre no piso, venda no teto. Se uma vela gigante fechar fora dessa caixinha (rompimento), caia fora imediatamente pois significa que uma nova tendência violenta começou!",
      rompimentoDetectado: false,
      rompimentoComentario: "",
      syntheticCandles: [
        { open: 34.45, high: 34.52, low: 34.40, close: 34.48 },
        { open: 34.48, high: 34.55, low: 34.42, close: 34.50 },
        { open: 34.50, high: 34.58, low: 34.45, close: 34.42 },
        { open: 34.42, high: 34.48, low: 34.35, close: 34.38 },
        { open: 34.38, high: 34.45, low: 34.30, close: 34.32 },
        { open: 34.32, high: 34.40, low: 34.25, close: 34.35 },
        { open: 34.35, high: 34.50, low: 34.33, close: 34.48 },
        { open: 34.48, high: 34.62, low: 34.45, close: 34.55 },
        { open: 34.55, high: 34.72, low: 34.52, close: 34.68 },
        { open: 34.68, high: 34.78, low: 34.60, close: 34.65 }
      ]
    }
  }
];

export interface PresetMultiChart {
  id: string;
  title: string;
  asset: string;
  description: string;
  m5ImageUrl: string;
  m15ImageUrl: string;
  analysis: any; // typed as MultiChartAnalysis in import
}

export const PRESET_MULTI_CHARTS: PresetMultiChart[] = [
  {
    id: "petr4-multi-preset",
    title: "Sincronia M5 + M15 (Macro Alta + Micro Retração)",
    asset: "PETR4",
    description: "Excelente alinhamento pedagógico mostrando como a tendência macro do M15 ampara e potencializa compras em retrações do M5.",
    m5ImageUrl: "placeholder-petr4-m5",
    m15ImageUrl: "placeholder-petr4-m15",
    analysis: {
      ativoCooptado: "PETR4 (M5 + M15)",
      comparativoAnalise: "O gráfico de 15 minutos (M15) atua como o 'Binóculo' do mercado, definindo a tendência macro. Ele mostra o Time Verde (compradores) em absoluto controle do cabo de guerra, impulsionando o preço das médias para cima com candles cheios e poucas sombras superiores. Já o gráfico de 5 minutos (M5) atua como a 'Lupa', revelando os detalhes do micro-terreno. No M5, vemos que o preço acabou de passar por um pequeno recuo (uma retração saudável ou pullback) até a região de R$ 34,30. Esta divergência é, na verdade, a situação perfeita: o macro (M15) nos diz que a maré principal é para cima, e o micro (M5) nos dá o momento de calmaria para comprar mais barato, evitando comprar no topo escaldado.",
      conclusaoDecisao: "A união dos dois tempos gráficos aponta para uma ótima oportunidade de compra. Com o M15 subindo de forma consistente e o M5 testando um chão (suporte) local de curto prazo, o risco é reduzido e a probabilidade de ganho rápido é excelente assim que o M5 voltar a subir.",
      acaoRecomendada: "Comprar",
      pontoEntrada: "R$ 34,30 (no chão protetor do gráfico de 5 minutos)",
      stopLoss: "R$ 33,95 (posicionado logo abaixo do piso protetor forte de R$ 34,10 do gráfico de 15 minutos)",
      alvo: "R$ 34,80 (próximo ao teto rígido do canal de 15 minutos)",
      nivelConfianca: "Alto",
      comentarioAnalista: "Sincronia de tempos gráficos é a chave dos traders de consistência! Nunca compre quando o gráfico de 5m estiver esticado demais sem antes consultar o de 15m. Ter a paciência de esperar o M5 testar as fundações de suporte enquanto o M15 empurra para cima é o que separa os amadores dos vencedores.",
      m5: {
        tendencia: "Baixa (Caindo temporariamente)",
        momento: "Micro Correção / Retração Saudável de Preço",
        leituraCandles: "No gráfico micro de 5 minutos, o preço vinha recuando através de velas vermelhas que começaram a encolher de tamanho (mostrando cansaço do Time Vermelho). O último candle fechou com um pavio de rejeição inferior bem longo perto do chão de R$ 34,30, desenhando uma mola de empurrão dos compradores.",
        suporte: "R$ 34,30 (o colchão local que impede quedas adicionais)",
        resistencia: "R$ 34,60 (o teto anterior vencido e que agora atua como área de congestionamento)",
        rompimentoDetectado: false,
        rompimentoComentario: ""
      },
      m15: {
        tendencia: "Alta (Subindo forte)",
        momento: "Aceleração impulsivadora",
        leituraCandles: "No gráfico de 15 minutos, as velas verdes de alta são corpulentas e cobrem com sobras todas as oscilações anteriores (Engolfos). As poucas sombras superiores mostram que o Time Verde não está encontrando barreiras expressivas para esticar a corda.",
        suporte: "R$ 34,10 (o piso consolidado que protege o ativo contra picos de pânico)",
        resistencia: "R$ 34,80 (o teto histórico que limita os avanços momentâneos)",
        rompimentoDetectado: false,
        rompimentoComentario: ""
      }
    }
  }
];
