import type { Mt5CandlesResponse, Mt5HealthResponse, Mt5TickResponse, SyntheticCandle } from "./types";

const STORAGE_BRIDGE_URL = "candlescan_mt5_bridge_url";
const STORAGE_BRIDGE_KEY = "candlescan_mt5_bridge_key";
const DEFAULT_BRIDGE_URL = "http://127.0.0.1:8765";

export function getBridgeUrl(): string {
  try {
    return localStorage.getItem(STORAGE_BRIDGE_URL)?.trim() || DEFAULT_BRIDGE_URL;
  } catch {
    return DEFAULT_BRIDGE_URL;
  }
}

export function setBridgeUrl(url: string): void {
  localStorage.setItem(STORAGE_BRIDGE_URL, url.replace(/\/$/, ""));
}

export function getBridgeApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_BRIDGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setBridgeApiKey(key: string): void {
  localStorage.setItem(STORAGE_BRIDGE_KEY, key.trim());
}

function bridgeHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  const key = getBridgeApiKey();
  if (key) h["X-Bridge-Key"] = key;
  return h;
}

async function bridgeFetch<T>(path: string): Promise<T> {
  const base = getBridgeUrl();
  const res = await fetch(`${base}${path}`, { headers: bridgeHeaders() });
  const text = await res.text();
  let body: { detail?: string; error?: string } = {};
  try {
    body = JSON.parse(text);
  } catch {
    /* not json */
  }
  if (!res.ok) {
    throw new Error(body.detail || body.error || text || `Erro ${res.status} na ponte MT5`);
  }
  return JSON.parse(text) as T;
}

export async function fetchMt5Health(): Promise<Mt5HealthResponse> {
  return bridgeFetch<Mt5HealthResponse>("/health");
}

export async function fetchMt5Candles(
  symbol: string,
  timeframe: string,
  count = 10
): Promise<Mt5CandlesResponse> {
  const params = new URLSearchParams({
    symbol,
    timeframe,
    count: String(count),
  });
  return bridgeFetch<Mt5CandlesResponse>(`/candles?${params}`);
}

export async function fetchMt5Tick(symbol: string): Promise<Mt5TickResponse> {
  const params = new URLSearchParams({ symbol });
  return bridgeFetch<Mt5TickResponse>(`/tick?${params}`);
}

export async function searchMt5Symbols(q: string, limit = 15): Promise<string[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const data = await bridgeFetch<{ symbols: { name: string }[] }>(
    `/symbols/search?${params}`
  );
  return data.symbols.map((s) => s.name);
}

/** Intervalo de polling sugerido (ms) por timeframe */
export function pollIntervalMs(timeframe: string): number {
  const tf = (timeframe || "M5").toUpperCase();
  if (tf === "M1") return 1000;
  if (tf === "M5") return 2000;
  if (tf === "M15") return 5000;
  if (tf.startsWith("H")) return 10000;
  return 3000;
}

export function normalizeTimeframeInput(tf: string): string {
  const t = (tf || "").trim().toUpperCase();
  if (/^M\d+$|^H\d+$|^D\d+$/.test(t)) return t;
  const m = t.match(/(\d+)\s*(min|minutos|m\b)/i);
  if (m) return `M${m[1]}`;
  const h = t.match(/(\d+)\s*(hora|horas|h\b)/i);
  if (h) return `H${h[1]}`;
  return "M5";
}

export function detectNewClosedCandle(
  prev: SyntheticCandle[] | null,
  next: SyntheticCandle[]
): boolean {
  if (!prev?.length || !next.length) return false;
  const p = prev[prev.length - 1];
  const n = next[next.length - 1];
  const pt = (p as SyntheticCandle & { time?: number }).time;
  const nt = (n as SyntheticCandle & { time?: number }).time;
  if (pt != null && nt != null && nt !== pt) return true;
  return false;
}

export type Mt5StreamPayload = Mt5CandlesResponse & { tick?: Mt5TickResponse; error?: string };

/** Assina SSE da ponte; retorna função para cancelar */
export function subscribeMt5CandleStream(
  symbol: string,
  timeframe: string,
  count: number,
  onData: (payload: Mt5StreamPayload) => void,
  onError: (err: Error) => void
): () => void {
  const base = getBridgeUrl();
  const params = new URLSearchParams({
    symbol,
    timeframe,
    count: String(count),
    interval_ms: String(pollIntervalMs(timeframe)),
  });
  const key = getBridgeApiKey();
  const url = `${base}/stream/candles?${params}${key ? "" : ""}`;

  let closed = false;
  const controller = new AbortController();

  (async () => {
    try {
      const headers: Record<string, string> = { Accept: "text/event-stream" };
      if (key) headers["X-Bridge-Key"] = key;
      const res = await fetch(url, { headers, signal: controller.signal });
      if (!res.ok || !res.body) {
        throw new Error(`SSE MT5: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const chunk of parts) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const json = line.slice(6);
          const payload = JSON.parse(json) as Mt5StreamPayload;
          if (payload.error) onError(new Error(payload.error));
          else onData(payload);
        }
      }
    } catch (e) {
      if (!closed) onError(e instanceof Error ? e : new Error(String(e)));
    }
  })();

  return () => {
    closed = true;
    controller.abort();
  };
}
