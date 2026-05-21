import {
  buildCandleTimeLabelsFromMt5,
} from "../shared/analyzeLive";
import type { ChartAnalysis, SyntheticCandle } from "./types";

export function parsePriceFromString(priceString: string): number | null {
  if (!priceString || priceString === "Não identificada") return null;
  const match = priceString.match(/[\d]+[,.]?\d*/);
  if (!match) return null;
  const parsed = parseFloat(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function collectAnchorPrices(
  analysis: ChartAnalysis,
  userEntry?: number | null
): number[] {
  const raw = [
    parsePriceFromString(analysis.pontoEntrada),
    parsePriceFromString(analysis.stopLoss),
    parsePriceFromString(analysis.alvo),
    parsePriceFromString(analysis.suporte),
    parsePriceFromString(analysis.resistencia),
    parsePriceFromString(analysis.precoAtualEstimado || ""),
    userEntry ?? null,
  ].filter((p): p is number => p !== null && p > 0);

  return [...new Set(raw)];
}

function sanitizeCandle(c: SyntheticCandle): SyntheticCandle {
  const open = c.open;
  const close = c.close;
  let high = Math.max(c.high, open, close);
  let low = Math.min(c.low, open, close);
  if (high < low) [high, low] = [low, high];
  return { open, close, high, low };
}

export function candleScaleMismatch(
  candles: SyntheticCandle[],
  anchors: number[]
): boolean {
  if (candles.length < 2 || anchors.length < 1) return false;

  const nums = candles.flatMap((c) => [c.open, c.close, c.high, c.low]);
  const cMin = Math.min(...nums);
  const cMax = Math.max(...nums);
  const aMin = Math.min(...anchors);
  const aMax = Math.max(...anchors);
  const anchorMid = (aMin + aMax) / 2;
  const candleMid = (cMin + cMax) / 2;
  const anchorSpan = Math.max(aMax - aMin, 0.02);
  const candleSpan = cMax - cMin || 0.01;

  if (Math.abs(candleMid - anchorMid) > anchorSpan * 0.65) return true;

  if (cMax <= 160 && cMin >= 0 && aMax > 15 && aMax > cMax * 1.12) return true;

  if (candleSpan > anchorSpan * 2.5 && anchorSpan < candleSpan * 0.35) return true;

  return false;
}

export function rescaleCandlesToAnchors(
  candles: SyntheticCandle[],
  anchors: number[]
): SyntheticCandle[] {
  const nums = candles.flatMap((c) => [c.open, c.close, c.high, c.low]);
  const cMin = Math.min(...nums);
  const cMax = Math.max(...nums);
  const cRange = cMax - cMin || 1;

  const tMin = Math.min(...anchors);
  const tMax = Math.max(...anchors);
  const pad = Math.max((tMax - tMin) * 0.12, 0.05);
  const targetMin = tMin - pad;
  const targetMax = tMax + pad;
  const targetRange = targetMax - targetMin;

  const mapVal = (v: number) =>
    targetMin + ((v - cMin) / cRange) * targetRange;

  return candles.map((c) =>
    sanitizeCandle({
      open: mapVal(c.open),
      close: mapVal(c.close),
      high: mapVal(c.high),
      low: mapVal(c.low),
    })
  );
}

export function parseChartIntervalMinutes(tempoGrafico: string): number {
  const t = (tempoGrafico || "").toLowerCase();
  const match = t.match(/(\d+)\s*(min|minutos|m\b|hora|horas|h\b|dia|d\b)/);
  if (!match) return 5;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (unit.startsWith("h")) return n * 60;
  if (unit.startsWith("d")) return n * 1440;
  return n;
}

function padCandlesToTen(candles: SyntheticCandle[]): SyntheticCandle[] {
  const list = candles.map(sanitizeCandle);
  if (list.length >= 10) return list.slice(-10);
  while (list.length < 10) {
    const last = list[list.length - 1] ?? {
      open: 1,
      close: 1,
      high: 1,
      low: 1,
    };
    list.unshift({ ...last });
  }
  return list;
}

export function generateFallbackCandles(
  tendencia: string,
  momento: string,
  anchors: number[]
): SyntheticCandle[] {
  const mid =
    anchors.length > 0
      ? anchors.reduce((a, b) => a + b, 0) / anchors.length
      : 50;
  const span =
    anchors.length > 1
      ? Math.max(...anchors) - Math.min(...anchors)
      : mid * 0.04;
  const step = Math.max(span / 12, mid * 0.003);

  const isUp =
    tendencia?.includes("Alta") ||
    tendencia?.toLowerCase().includes("sub");
  const isDown =
    tendencia?.includes("Baixa") ||
    tendencia?.toLowerCase().includes("cai");
  const strong = (momento || "").toLowerCase().includes("forte");

  const candles: SyntheticCandle[] = [];
  let lastClose = mid - step * 4 * (isUp ? 1 : isDown ? -1 : 0);

  for (let i = 0; i < 10; i++) {
    const open = lastClose;
    let body = step * (strong ? 1.4 : 0.9);
    if (isUp) {
      lastClose = open + body * (i >= 8 && momento.includes("cansando") ? 0.35 : 1);
    } else if (isDown) {
      lastClose = open - body * (i >= 8 && momento.includes("cansando") ? 0.35 : 1);
    } else {
      lastClose = open + (i % 2 === 0 ? body : -body) * 0.6;
    }
    const wick = body * (strong ? 0.25 : 0.55);
    candles.push(
      sanitizeCandle({
        open,
        close: lastClose,
        high: Math.max(open, lastClose) + wick,
        low: Math.min(open, lastClose) - wick,
      })
    );
  }
  return candles;
}

export function normalizeChartAnalysis(
  analysis: ChartAnalysis,
  userEntry?: number | null
): ChartAnalysis {
  const anchors = collectAnchorPrices(analysis, userEntry);
  let candles = (analysis.syntheticCandles ?? []).slice(-10);

  if (candles.length < 2) {
    candles = generateFallbackCandles(
      analysis.tendencia,
      analysis.momento,
      anchors
    );
  } else if (anchors.length > 0 && candleScaleMismatch(candles, anchors)) {
    candles = rescaleCandlesToAnchors(candles, anchors);
  }

  candles = padCandlesToTen(candles);

  return {
    ...analysis,
    syntheticCandles: candles,
    graficoReferenciaEm: new Date().toISOString(),
  };
}

export function buildCandleTimeLabels(
  count: number,
  intervalMin: number,
  labelsFromAi: string[] | undefined,
  referenceIso?: string
): string[] {
  const fromAi = (labelsFromAi ?? [])
    .map((s) => s?.trim())
    .filter(Boolean)
    .slice(-count);

  if (fromAi.length === count) {
    const last = fromAi[count - 1];
    if (/agora|now/i.test(last)) return fromAi;
    return [...fromAi.slice(0, -1), "Agora"];
  }

  const ref = referenceIso ? new Date(referenceIso) : new Date();
  return Array.from({ length: count }, (_, i) => {
    if (i === count - 1) return "Agora";
    const minutesAgo = (count - 1 - i) * intervalMin;
    const t = new Date(ref.getTime() - minutesAgo * 60_000);
    return t.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  });
}

export type ChartViewBounds = {
  chartMin: number;
  chartMax: number;
  chartRange: number;
  candles: SyntheticCandle[];
  timeLabels: string[];
  isBrlAxis: boolean;
};

export function buildChartViewModel(
  analysis: ChartAnalysis,
  userEntry?: number | null
): ChartViewBounds {
  const normalized = normalizeChartAnalysis(analysis, userEntry);
  const candles = normalized.syntheticCandles ?? [];
  const anchors = collectAnchorPrices(normalized, userEntry);

  const candleNums = candles.flatMap((c) => [c.open, c.close, c.high, c.low]);

  let chartMin: number;
  let chartMax: number;

  const eixoMin = normalized.eixoPrecoMin;
  const eixoMax = normalized.eixoPrecoMax;
  let useVisibleAxis =
    eixoMin != null &&
    eixoMax != null &&
    Number.isFinite(eixoMin) &&
    Number.isFinite(eixoMax) &&
    eixoMax > eixoMin;

  if (useVisibleAxis && anchors.length >= 2) {
    const aMin = Math.min(...anchors);
    const aMax = Math.max(...anchors);
    const anchorSpan = Math.max(aMax - aMin, 0.02);
    const eixoSpan = eixoMax! - eixoMin!;
    const anchorMid = (aMin + aMax) / 2;
    const eixoMid = (eixoMin! + eixoMax!) / 2;
    if (
      eixoSpan > anchorSpan * 3.5 ||
      Math.abs(eixoMid - anchorMid) > anchorSpan * 2
    ) {
      useVisibleAxis = false;
    }
  }

  if (useVisibleAxis) {
    chartMin = eixoMin!;
    chartMax = eixoMax!;
  } else {
    const allNums = [...candleNums, ...anchors];
    chartMin = Math.min(...allNums);
    chartMax = Math.max(...allNums);
    const pad = (chartMax - chartMin) * 0.08 || 0.05;
    chartMin -= pad;
    chartMax += pad;
  }

  const chartRange = chartMax - chartMin || 1;
  const intervalMin = parseChartIntervalMinutes(normalized.tempoGrafico || "5 Minutos");
  const timeLabels = buildCandleTimeLabels(
    candles.length,
    intervalMin,
    normalized.candleTimeLabels,
    normalized.graficoReferenciaEm
  );

  const priceRef =
    normalized.pontoEntrada ||
    normalized.precoAtualEstimado ||
    normalized.alvo ||
    "";
  const isBrlAxis =
    /r\$/i.test(priceRef) || (!/\$/.test(priceRef) && priceRef.length > 0);

  return {
    chartMin,
    chartMax,
    chartRange,
    candles,
    timeLabels,
    isBrlAxis,
  };
}

export function priceToChartPercent(
  price: number,
  chartMin: number,
  chartRange: number
): number {
  return Math.max(2, Math.min(98, ((price - chartMin) / chartRange) * 100));
}

/** Gráfico alimentado diretamente pelo MT5 (OHLC reais) */
export function buildChartViewModelFromLive(
  candles: SyntheticCandle[],
  options?: {
    anchorPrices?: number[];
    isBrlAxis?: boolean;
    precoAtual?: number | null;
  }
): ChartViewBounds {
  const list = candles.map(sanitizeCandle);
  const anchors = (options?.anchorPrices ?? []).filter((p) => p > 0);
  const nums = [
    ...list.flatMap((c) => [c.open, c.close, c.high, c.low]),
    ...anchors,
  ];
  if (options?.precoAtual != null && options.precoAtual > 0) {
    nums.push(options.precoAtual);
  }

  let chartMin = Math.min(...nums);
  let chartMax = Math.max(...nums);
  const pad = (chartMax - chartMin) * 0.08 || 0.05;
  chartMin -= pad;
  chartMax += pad;
  const chartRange = chartMax - chartMin || 1;

  const timeLabels = buildCandleTimeLabelsFromMt5(list);
  const isBrlAxis = options?.isBrlAxis ?? true;

  return {
    chartMin,
    chartMax,
    chartRange,
    candles: list,
    timeLabels,
    isBrlAxis,
  };
}
