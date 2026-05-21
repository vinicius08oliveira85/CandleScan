export type GeminiErrorCode =
  | 'MISSING_API_KEY'
  | 'GEMINI_QUOTA_EXCEEDED'
  | 'GEMINI_MODEL_NOT_FOUND'
  | 'GEMINI_INVALID_KEY'
  | 'GEMINI_API_ERROR';

export type ParsedGeminiError = {
  code: GeminiErrorCode;
  httpStatus: number;
  userMessagePt: string;
  retryAfterSec?: number;
  model?: string;
  triedModels?: string[];
};

const DEFAULT_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];

export function getGeminiModelList(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim();
  const csv = process.env.GEMINI_MODEL_FALLBACK?.trim();
  const fromEnv = csv
    ? csv.split(',').map((m) => m.trim()).filter(Boolean)
    : [...DEFAULT_FALLBACK_MODELS];

  const list: string[] = [];
  if (primary) list.push(primary);
  for (const m of fromEnv) {
    if (!list.includes(m)) list.push(m);
  }
  if (list.length === 0) list.push(...DEFAULT_FALLBACK_MODELS);
  return list;
}

export const DEFAULT_GEMINI_MODEL = getGeminiModelList()[0];

function extractRetryAfterSec(message: string): number | undefined {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]));
  return undefined;
}

function extractModelFromMessage(message: string): string | undefined {
  const match = message.match(/models\/([a-z0-9.-]+)/i);
  return match?.[1];
}

function isFetchError(err: unknown): err is { status?: number; message?: string } {
  return typeof err === 'object' && err !== null && ('status' in err || 'message' in err);
}

export function parseGeminiError(err: unknown): ParsedGeminiError {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code;
  const triedModels = (err as { triedModels?: string[] })?.triedModels;
  const status = isFetchError(err) ? err.status : undefined;
  const retryAfterSec = extractRetryAfterSec(message);
  const model = extractModelFromMessage(message) || (err as { model?: string })?.model;

  if (code === 'MISSING_API_KEY' || /Nenhuma chave API/i.test(message)) {
    return {
      code: 'MISSING_API_KEY',
      httpStatus: 400,
      userMessagePt:
        'Configure sua chave pessoal do Google AI Studio em Configurações e clique em Salvar.',
      triedModels,
    };
  }

  if (code === 'GEMINI_MODEL_NOT_FOUND' || (triedModels && triedModels.length > 0 && /nenhum modelo/i.test(message))) {
    return {
      code: 'GEMINI_MODEL_NOT_FOUND',
      httpStatus: 503,
      userMessagePt:
        'Nenhum modelo Gemini disponível no momento. Tente novamente em alguns minutos.',
      model,
      triedModels,
    };
  }

  if (status === 429 || /429|quota|rate limit|too many requests/i.test(message)) {
    const waitHint = retryAfterSec
      ? ` Aguarde cerca de ${retryAfterSec} segundos e tente de novo.`
      : ' Aguarde alguns minutos ou crie uma nova chave em Google AI Studio.';
    return {
      code: 'GEMINI_QUOTA_EXCEEDED',
      httpStatus: 429,
      userMessagePt: `Cota da API Gemini esgotada para esta chave.${waitHint}`,
      retryAfterSec,
      model,
      triedModels,
    };
  }

  if (status === 404 || /not found|is not found/i.test(message)) {
    return {
      code: 'GEMINI_MODEL_NOT_FOUND',
      httpStatus: 503,
      userMessagePt: `Modelo indisponível${model ? ` (${model})` : ''}. O servidor tentará outro modelo na próxima análise.`,
      model,
      triedModels,
    };
  }

  if (status === 401 || status === 403 || /invalid api key|api key not valid|permission/i.test(message)) {
    return {
      code: 'GEMINI_INVALID_KEY',
      httpStatus: 401,
      userMessagePt:
        'Chave API inválida ou sem permissão. Gere uma nova chave em Google AI Studio e salve em Configurações.',
      model,
      triedModels,
    };
  }

  return {
    code: 'GEMINI_API_ERROR',
    httpStatus: 500,
    userMessagePt: 'Erro ao consultar a IA. Tente novamente em instantes.',
    model,
    triedModels,
  };
}

export function mapGeminiErrorToHttp(err: unknown): ParsedGeminiError {
  return parseGeminiError(err);
}

export function createGeminiRouteError(err: unknown): Error & ParsedGeminiError {
  const parsed = parseGeminiError(err);
  const e = new Error(parsed.userMessagePt) as Error & ParsedGeminiError;
  Object.assign(e, parsed);
  return e;
}

export function geminiErrorResponseBody(err: unknown) {
  const mapped = mapGeminiErrorToHttp(err);
  return {
    httpStatus: mapped.httpStatus,
    payload: {
      error: mapped.userMessagePt,
      code: mapped.code,
      retryAfterSec: mapped.retryAfterSec,
      model: mapped.model,
      triedModels: mapped.triedModels,
    },
  };
}
