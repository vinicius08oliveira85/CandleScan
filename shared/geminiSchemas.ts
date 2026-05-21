import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export { GoogleGenerativeAI, SchemaType };

export const CHART_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    ativoCooptado: {
      type: SchemaType.STRING,
      description:
        "Ticker ou nome do ativo detectado no gráfico (ex: CSED3, PETR4, EUR/USD), ou 'Não detectado'",
    },
    tempoGrafico: {
      type: SchemaType.STRING,
      description: "Tempo gráfico detectado (ex: 15 Minutos, 5 Minutos, Diário), ou 'Não detectado'",
    },
    tendencia: { type: SchemaType.STRING, description: 'Tendência principal: Alta, Baixa ou Lateral' },
    momento: { type: SchemaType.STRING, description: 'Momento do mercado: Forte, fraco, indeciso, reversão possível' },
    leituraCandles: { type: SchemaType.STRING, description: 'Explicação lúdica dos candles recentes' },
    suporte: { type: SchemaType.STRING, description: 'Suporte como chão que impede o preço de cair' },
    resistencia: { type: SchemaType.STRING, description: 'Resistência como teto que limita subidas' },
    cenarioProvavel: { type: SchemaType.STRING, description: 'Cenário técnico mais provável a curto prazo' },
    acaoRecomendada: { type: SchemaType.STRING, description: "Comprar, Vender ou Aguardar" },
    tipoEntrada: { type: SchemaType.STRING, description: 'Tipo de terreno lúdico da entrada' },
    pontoEntrada: { type: SchemaType.STRING, description: 'Preço de entrada R$ ou $' },
    stopLoss: { type: SchemaType.STRING, description: 'Stop loss R$ ou $' },
    alvo: { type: SchemaType.STRING, description: 'Take profit R$ ou $' },
    nivelConfianca: { type: SchemaType.STRING, description: 'Baixo, Médio ou Alto' },
    relacaoRiscoRetorno: { type: SchemaType.STRING, description: 'Formato 1:X — viável/equilibrada/fraca' },
    comentarioAnalista: { type: SchemaType.STRING, description: 'Conselho do mentor com formato obrigatório' },
    precoAtualEstimado: { type: SchemaType.STRING, description: 'Preço atual no print mais recente' },
    statusTrade: {
      type: SchemaType.STRING,
      description: 'MANTER, VENDER AGORA, REALIZAR PARCIAL ou STOP ATIVADO',
    },
    syntheticCandles: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          open: { type: SchemaType.NUMBER },
          high: { type: SchemaType.NUMBER },
          low: { type: SchemaType.NUMBER },
          close: { type: SchemaType.NUMBER },
        },
      },
      description: 'Exatamente 10 candles OHLC em ordem cronológica',
    },
    rompimentoDetectado: { type: SchemaType.BOOLEAN, description: 'true se houve rompimento recente' },
    rompimentoComentario: { type: SchemaType.STRING, description: 'Comentário sobre rompimento ou vazio' },
  },
  required: [
    'ativoCooptado',
    'tempoGrafico',
    'tendencia',
    'momento',
    'leituraCandles',
    'suporte',
    'resistencia',
    'cenarioProvavel',
    'acaoRecomendada',
    'tipoEntrada',
    'pontoEntrada',
    'stopLoss',
    'alvo',
    'nivelConfianca',
    'relacaoRiscoRetorno',
    'comentarioAnalista',
    'rompimentoDetectado',
    'rompimentoComentario',
    'syntheticCandles',
  ],
};

export const MULTI_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    ativoCooptado: { type: SchemaType.STRING },
    comparativoAnalise: { type: SchemaType.STRING },
    conclusaoDecisao: { type: SchemaType.STRING },
    acaoRecomendada: { type: SchemaType.STRING },
    pontoEntrada: { type: SchemaType.STRING },
    stopLoss: { type: SchemaType.STRING },
    alvo: { type: SchemaType.STRING },
    nivelConfianca: { type: SchemaType.STRING },
    comentarioAnalista: { type: SchemaType.STRING },
    m5: {
      type: SchemaType.OBJECT,
      properties: {
        tendencia: { type: SchemaType.STRING },
        momento: { type: SchemaType.STRING },
        leituraCandles: { type: SchemaType.STRING },
        suporte: { type: SchemaType.STRING },
        resistencia: { type: SchemaType.STRING },
      },
      required: ['tendencia', 'momento', 'leituraCandles', 'suporte', 'resistencia'],
    },
    m15: {
      type: SchemaType.OBJECT,
      properties: {
        tendencia: { type: SchemaType.STRING },
        momento: { type: SchemaType.STRING },
        leituraCandles: { type: SchemaType.STRING },
        suporte: { type: SchemaType.STRING },
        resistencia: { type: SchemaType.STRING },
      },
      required: ['tendencia', 'momento', 'leituraCandles', 'suporte', 'resistencia'],
    },
  },
  required: [
    'ativoCooptado',
    'comparativoAnalise',
    'conclusaoDecisao',
    'acaoRecomendada',
    'pontoEntrada',
    'stopLoss',
    'alvo',
    'nivelConfianca',
    'comentarioAnalista',
    'm5',
    'm15',
  ],
};

export function resolveGeminiApiKey(userApiKey?: string): string {
  return (userApiKey?.trim() || process.env.GEMINI_API_KEY || '').trim();
}

export function getGeminiClient(userApiKey?: string): GoogleGenerativeAI {
  const key = resolveGeminiApiKey(userApiKey);
  if (!key) {
    const err = new Error(
      'Nenhuma chave API do Gemini encontrada. Abra Configurações no app e cole sua chave, ou defina GEMINI_API_KEY na Vercel.'
    ) as Error & { code?: string };
    err.code = 'MISSING_API_KEY';
    throw err;
  }
  return new GoogleGenerativeAI(key);
}

type ImageInput = { data: string; mimeType: string };

export function buildGeminiParts(promptText: string, images: ImageInput[]) {
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: promptText },
  ];
  for (const img of images) {
    if (!img.data || !img.mimeType) continue;
    const cleanData = img.data.replace(/^data:image\/\w+;base64,/, '');
    parts.push({ inlineData: { data: cleanData, mimeType: img.mimeType } });
  }
  return parts;
}

/** Modelo padrão na API Google AI (1.5-flash foi descontinuado na v1beta). */
export const DEFAULT_GEMINI_MODEL =
  (typeof process !== 'undefined' && process.env?.GEMINI_MODEL?.trim()) || 'gemini-2.0-flash';

export async function generateGeminiJson(
  ai: GoogleGenerativeAI,
  systemInstruction: string,
  parts: ReturnType<typeof buildGeminiParts>,
  responseSchema: typeof CHART_ANALYSIS_SCHEMA
): Promise<string> {
  const model = ai.getGenerativeModel({
    model: DEFAULT_GEMINI_MODEL,
    systemInstruction,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const text = result.response.text();
  if (!text) {
    throw new Error('O modelo Gemini retornou uma resposta vazia.');
  }
  return text;
}
