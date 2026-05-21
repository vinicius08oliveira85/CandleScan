export interface SyntheticCandle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TradeStatus =
  | "MANTER"
  | "VENDER AGORA"
  | "REALIZAR PARCIAL"
  | "STOP ATIVADO";

export type TipoOperacao = "compra" | "venda";

export interface DadosCompra {
  precoEntrada: number;
  quantidade: number;
  /** Compra ou venda informada pelo usuário no print */
  tipoOperacao?: TipoOperacao;
}

export interface ChartAnalysis {
  ativoCooptado: string;
  tempoGrafico: string;
  tendencia: string; // "Alta" | "Baixa" | "Lateral"
  momento: string;
  leituraCandles: string;
  suporte: string;
  resistencia: string;
  cenarioProvavel: string;
  acaoRecomendada: string; // "Comprar" | "Vender" | "Aguardar"
  tipoEntrada: string;
  pontoEntrada: string;
  stopLoss: string;
  alvo: string;
  nivelConfianca: string; // "Baixo" | "Médio" | "Alto"
  relacaoRiscoRetorno?: string;
  comentarioAnalista: string;
  syntheticCandles?: SyntheticCandle[];
  /** Rótulos HH:mm lidos do eixo X do print (10 itens, último pode ser "Agora") */
  candleTimeLabels?: string[];
  /** Faixa visível do eixo Y no print (mesma escala dos candles) */
  eixoPrecoMin?: number;
  eixoPrecoMax?: number;
  /** ISO — âncora para reconstruir horários ao atualizar prints */
  graficoReferenciaEm?: string;
  rompimentoDetectado?: boolean;
  rompimentoComentario?: string;
  /** Gerente de trade — preenchido quando há posição aberta */
  statusTrade?: TradeStatus;
  precoAtualEstimado?: string;
}

export interface MultiChartAnalysis {
  ativoCooptado: string;
  comparativoAnalise: string;
  conclusaoDecisao: string;
  acaoRecomendada: string;
  pontoEntrada: string;
  stopLoss: string;
  alvo: string;
  nivelConfianca: string;
  comentarioAnalista: string;
  m5: {
    tendencia: string;
    momento: string;
    leituraCandles: string;
    suporte: string;
    resistencia: string;
    rompimentoDetectado?: boolean;
    rompimentoComentario?: string;
  };
  m15: {
    tendencia: string;
    momento: string;
    leituraCandles: string;
    suporte: string;
    resistencia: string;
    rompimentoDetectado?: boolean;
    rompimentoComentario?: string;
  };
}

export interface PresetChart {
  id: string;
  title: string;
  asset: string;
  timeframe: string;
  description: string;
  imageUrl: string; // A placeholder or a direct base64
  analysis: ChartAnalysis;
}

export interface SavedAnalysisImage {
  name: string;
  mimeType: string;
  base64: string;
}

/** Um momento da evolução do trade (série de prints) */
export interface EvolutionSnapshot {
  capturedAt: string;
  label: string;
  images: SavedAnalysisImage[];
  /** Preço e valor fixados nesta janela/print */
  dadosCompra?: DadosCompra;
  valorInvestidoTotal?: number;
  tipoOperacao?: TipoOperacao;
}

export interface SavedAnalysis {
  id: string;
  timestamp: string;
  ativoCooptado: string;
  tempoGrafico: string;
  tendencia: string;
  acaoRecomendada: string;
  nivelConfianca: string;
  analysis: ChartAnalysis;
  imageCount: number;
  /** Todos os prints da sessão em ordem cronológica */
  previewImages?: SavedAnalysisImage[];
  /** Evolução por atualizações (cada clique em "Atualizar com novo Print") */
  evolutionSnapshots?: EvolutionSnapshot[];
  /** Dados da compra para acompanhamento vivo */
  dadosCompra?: DadosCompra;
  /** Valor total investido (R$) — espelha o input do usuário */
  valorInvestidoTotal?: number;
  tipoOperacao?: TipoOperacao;
  isLiveTrade?: boolean;
  lastUpdatedAt?: string;
}

/** Evento PWA beforeinstallprompt (Chromium) */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Dados enviados para o backend */
export interface AnalyzeRequest {
  apiKey?: string;
}
