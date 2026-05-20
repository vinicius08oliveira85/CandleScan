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
      pontoEntrada: "Esperar o preço cair perto de $4,28 para comprar mais barato com menos risco.",
      stopLoss: "$4,22 (Seu cinto de segurança: se o preço despencar abaixo disso, você sai para não perder quase nada)",
      alvo: "$4,38 (Seu primeiro destino para sair feliz com o dinheiro no bolso).",
      nivelConfianca: "Médio",
      comentarioAnalista: "Olá iniciante! Nunca compre quando o preço acabou de subir muito rápido e bateu no teto de $4,38. Deixe o preço cair un pouquinho perto do piso de $4,28-$4,30. Operar com paciência protege seu dinheiro de armadilhas bobas!",
      rompimentoDetectado: false,
      rompimentoComentario: ""
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
      pontoEntrada: "Se o preço subir um tiquinho até $58,50 e falhar, é o ponto ideal para iniciar uma operação buscando lucrar com a queda.",
      stopLoss: "$58,85 (Cinto de segurança: caso o preço suba além disso, cancelamos a operação para proteger seu bolso)",
      alvo: "$57,90 (Onde você encerra a operação realizada com lucro garantido).",
      nivelConfianca: "Alto",
      comentarioAnalista: "Quando um 'piso' forte é rompido para baixo, ele vira um 'teto'. É um conceito clássico e seguro! Não tente adivinhar fundo comprando enquanto está caindo de forma violenta. Siga o fluxo de quem está vendendo.",
      rompimentoDetectado: true,
      rompimentoComentario: "ATENÇÃO: O piso forte de suporte nos R$ 58,50 foi quebrado com extrema convicção! O fechamento de múltiplas velas vermelhas encorpadas abaixo deste nível confirma que a força de queda rompeu a defesa compradora, abrindo caminho para mais perdas rápidas."
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
      pontoEntrada: "Comprar bem baratinho perto de $34,15, logo após o preço bater lá embaixo no piso e dar um sinal de que vai segurar.",
      stopLoss: "$33,95 (Cinto de segurança posicionado estrategicamente um pouco abaixo do piso histórico do canal)",
      alvo: "$34,70 (Sair correndo com o lucro no bolso logo antes do preço trombar com o teto de novo).",
      nivelConfianca: "Médio",
      comentarioAnalista: "Operar mercados laterais exige metas rápidas. Compre no piso, venda no teto. Se uma vela gigante fechar fora dessa caixinha (rompimento), caia fora imediatamente pois significa que uma nova tendência violenta começou!",
      rompimentoDetectado: false,
      rompimentoComentario: ""
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
