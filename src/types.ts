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
  comentarioAnalista: string;
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
}
