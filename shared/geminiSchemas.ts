import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getGeminiModelList, parseGeminiError, type GeminiErrorCode } from './geminiErrors';

export { GoogleGenerativeAI, SchemaType };
export { getGeminiModelList, DEFAULT_GEMINI_MODEL } from './geminiErrors';

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
      description:
        'Exatamente 10 candles OHLC em REAIS da moeda do ativo (mesma escala de pontoEntrada/stop/alvo). Último = vela mais recente.',
    },
    candleTimeLabels: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description:
        '10 horários do eixo X do print (ex: "16:26") da esquerda para direita; último = "Agora" se visível',
    },
    eixoPrecoMin: {
      type: SchemaType.NUMBER,
      description: 'Menor preço legível no eixo Y esquerdo do print',
    },
    eixoPrecoMax: {
      type: SchemaType.NUMBER,
      description: 'Maior preço legível no eixo Y esquerdo do print',
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
      'Nenhuma chave API do Gemini encontrada. Abra Configurações no app e cole sua chave do Google AI Studio.'
    ) as Error & { code?: GeminiErrorCode };
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

function shouldTryNextModel(err: unknown): boolean {
  const parsed = parseGeminiError(err);
  return (
    parsed.code === 'GEMINI_QUOTA_EXCEEDED' ||
    parsed.code === 'GEMINI_MODEL_NOT_FOUND' ||
    (typeof (err as { status?: number })?.status === 'number' &&
      [404, 429].includes((err as { status: number }).status))
  );
}

type GeminiResponseSchema = typeof CHART_ANALYSIS_SCHEMA | typeof MULTI_ANALYSIS_SCHEMA;

async function generateWithModel(
  ai: GoogleGenerativeAI,
  modelName: string,
  systemInstruction: string,
  parts: ReturnType<typeof buildGeminiParts>,
  responseSchema: GeminiResponseSchema
): Promise<string> {
  const model = ai.getGenerativeModel({
    model: modelName,
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

export async function generateGeminiJson(
  ai: GoogleGenerativeAI,
  systemInstruction: string,
  parts: ReturnType<typeof buildGeminiParts>,
  responseSchema: GeminiResponseSchema
): Promise<string> {
  const models = getGeminiModelList();
  const errors: { model: string; message: string }[] = [];

  for (const modelName of models) {
    try {
      const text = await generateWithModel(ai, modelName, systemInstruction, parts, responseSchema);
      if (modelName !== models[0]) {
        console.warn(`[Gemini] Sucesso com modelo fallback: ${modelName}`);
      }
      return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ model: modelName, message: msg.slice(0, 200) });
      console.warn(`[Gemini] Falha em ${modelName}:`, msg.slice(0, 300));

      if (!shouldTryNextModel(err)) {
        throw err;
      }
    }
  }

  const allQuota = errors.every((e) => /429|quota|rate limit/i.test(e.message));
  const finalErr = new Error(
    allQuota
      ? 'Cota da API Gemini esgotada em todos os modelos tentados.'
      : 'Nenhum modelo Gemini disponível para esta análise.'
  ) as Error & { code: GeminiErrorCode; triedModels: string[] };
  finalErr.code = allQuota ? 'GEMINI_QUOTA_EXCEEDED' : 'GEMINI_MODEL_NOT_FOUND';
  finalErr.triedModels = models;
  throw finalErr;
}
