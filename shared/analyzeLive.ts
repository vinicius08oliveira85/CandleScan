import type { SyntheticCandle } from '../src/types';

export type LiveCandleInput = SyntheticCandle & { time?: number };

export function buildCandleTimeLabelsFromMt5(
  candles: LiveCandleInput[],
  locale = 'pt-BR'
): string[] {
  if (!candles.length) return [];
  return candles.map((c, i) => {
    if (i === candles.length - 1) return 'Agora';
    if (c.time == null) return `T${i + 1}`;
    const d = new Date(c.time * 1000);
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  });
}

export function timeframeLabel(tf: string): string {
  const key = (tf || 'M5').toUpperCase();
  const map: Record<string, string> = {
    M1: '1 Minuto',
    M5: '5 Minutos',
    M15: '15 Minutos',
    M30: '30 Minutos',
    H1: '1 Hora',
    D1: 'Diário',
  };
  return map[key] || tf;
}

export function buildLiveAnalysisPrompt(
  symbol: string,
  timeframe: string,
  candles: LiveCandleInput[],
  precoAtual: number | null,
  dadosCompra?: { precoEntrada: number; quantidade: number; tipoOperacao?: string }
): string {
  const lines = candles.map((c, i) => {
    const t =
      c.time != null
        ? new Date(c.time * 1000).toISOString()
        : `bar_${i}`;
    return `${i + 1}. t=${t} O=${c.open} H=${c.high} L=${c.low} C=${c.close}`;
  });

  let prompt = `Análise técnica com dados OHLC REAIS do MetaTrader 5 (sem imagem).
Ativo: ${symbol}
Timeframe: ${timeframe}
Preço atual (mid/bid-ask): ${precoAtual ?? 'não informado'}

Últimas ${candles.length} velas (antiga → recente; a última pode estar em formação):
${lines.join('\n')}

Use EXATAMENTE estes valores em syntheticCandles (mesma ordem e escala).
Construa candleTimeLabels a partir dos timestamps acima (HH:mm, último = "Agora").
Não invente velas nem preços fora desta série.
`;

  if (dadosCompra?.precoEntrada && dadosCompra?.quantidade) {
    const op = dadosCompra.tipoOperacao === 'venda' ? 'vendeu' : 'comprou';
    prompt += `\nMODO GERENTE DE TRADE: investidor ${op} a ${dadosCompra.precoEntrada}, quantidade ${dadosCompra.quantidade}. Manter preço de entrada original. Preencher statusTrade e comentarioAnalista no formato obrigatório.\n`;
  }

  return prompt;
}

export const LIVE_ANALYSIS_SYSTEM_INSTRUCTION = `Você é analista de trading didático para iniciantes.
Você recebe candles OHLC reais exportados do MetaTrader 5 — NÃO há imagem.
Regras:
- syntheticCandles: copie fielmente os OHLC fornecidos no prompt (10 velas).
- candleTimeLabels: derive dos timestamps fornecidos.
- pontoEntrada, stopLoss, alvo, suporte, resistencia: valores numéricos reais na moeda do ativo (R$ ou $) com explicação breve entre parênteses.
- precoAtualEstimado: use o preço atual informado no prompt.
- Comunicação lúdica (cabo de guerra, chão/teto, escudo/troféu).
- Proteção de capital sempre em primeiro lugar.
- Sem dadosCompra: comentarioAnalista com "Se perder... Se ganhar..." no formato exato.
- Com dadosCompra: comentarioAnalista com "Você comprou/vendeu a..., o preço está em..." no formato exato.`;
