export interface SyntheticCandle {
  open: number;
  high: number;
  low: number;
  close: number;
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
  rompimentoDetectado?: boolean;
  rompimentoComentario?: string;
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
  /** Prints em base64 para consulta offline no histórico */
  previewImages?: SavedAnalysisImage[];
}

/** Evento PWA beforeinstallprompt (Chromium) */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
