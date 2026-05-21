import {
  SavedAnalysis,
  SavedAnalysisImage,
  EvolutionSnapshot,
  DadosCompra,
  TipoOperacao,
} from "./types";

export const HISTORY_STORAGE_KEY = "candlescan_history_v1";
export const MAX_HISTORY_WITH_PHOTOS = 15;

export type SnapshotInvestment = {
  dadosCompra?: DadosCompra;
  valorInvestidoTotal?: number;
  tipoOperacao?: TipoOperacao;
};

export function photosToSavedImages(
  photos: { name: string; type: string; base64: string }[]
): SavedAnalysisImage[] {
  return photos.map((p) => ({
    name: p.name,
    mimeType: p.type,
    base64: p.base64,
  }));
}

export function normalizeHistoryRecord(record: SavedAnalysis): SavedAnalysis {
  const images = record.previewImages ?? [];
  if (!record.evolutionSnapshots?.length && images.length > 0) {
    return {
      ...record,
      evolutionSnapshots: [
        {
          capturedAt: record.timestamp,
          label: "Print inicial",
          images,
          dadosCompra: record.dadosCompra,
          valorInvestidoTotal: record.valorInvestidoTotal,
          tipoOperacao: record.tipoOperacao ?? record.dadosCompra?.tipoOperacao,
        },
      ],
    };
  }
  return record;
}

export function loadHistoryFromStorage(): SavedAnalysis[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as SavedAnalysis[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeHistoryRecord);
  } catch {
    return [];
  }
}

/** Persiste histórico com limpeza automática (máx. 15) e fallback se exceder quota. */
export function persistHistoryToStorage(records: SavedAnalysis[]): SavedAnalysis[] {
  let trimmed = records.slice(0, MAX_HISTORY_WITH_PHOTOS);

  const trySave = (list: SavedAnalysis[]) => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
  };

  while (trimmed.length > 0) {
    try {
      trySave(trimmed);
      return trimmed;
    } catch (err) {
      const isQuota =
        err instanceof DOMException &&
        (err.code === 22 || err.code === 1014 || err.name === "QuotaExceededError");

      if (!isQuota) throw err;

      if (trimmed.length > 1) {
        trimmed = trimmed.slice(0, -1);
        continue;
      }

      const withoutImages = trimmed.map((r) => ({
        ...r,
        previewImages: undefined,
        evolutionSnapshots: undefined,
        imageCount: r.imageCount,
      }));
      try {
        trySave(withoutImages);
        return withoutImages;
      } catch {
        return [];
      }
    }
  }

  return [];
}

export function buildEvolutionSnapshot(
  photos: { name: string; type: string; base64: string }[],
  label: string,
  investment?: SnapshotInvestment
): EvolutionSnapshot {
  const dadosCompra = investment?.dadosCompra
    ? {
        ...investment.dadosCompra,
        tipoOperacao:
          investment.tipoOperacao ??
          investment.dadosCompra.tipoOperacao ??
          "compra",
      }
    : undefined;

  return {
    capturedAt: new Date().toISOString(),
    label,
    images: photosToSavedImages(photos),
    dadosCompra,
    valorInvestidoTotal: investment?.valorInvestidoTotal,
    tipoOperacao: investment?.tipoOperacao ?? dadosCompra?.tipoOperacao ?? "compra",
  };
}

/** Índice da janela (snapshot) para cada foto na ordem cronológica de previewImages */
export function getSnapshotIndexForPhoto(
  photoIndex: number,
  snapshots: EvolutionSnapshot[]
): number {
  let offset = 0;
  for (let i = 0; i < snapshots.length; i++) {
    const count = snapshots[i].images?.length ?? 0;
    if (photoIndex < offset + count) return i;
    offset += count;
  }
  return Math.max(0, snapshots.length - 1);
}

export function mergeHistoryAnalysis(
  existing: SavedAnalysis,
  analysis: SavedAnalysis["analysis"],
  allPhotos: { name: string; type: string; base64: string }[],
  dadosCompra: DadosCompra | undefined,
  valorInvestidoTotal: number | undefined,
  tipoOperacao: TipoOperacao | undefined,
  newSnapshotPhotos: { name: string; type: string; base64: string }[] | null
): SavedAnalysis {
  const savedAll = photosToSavedImages(allPhotos);
  const snapshots = [...(existing.evolutionSnapshots ?? [])];

  const lockedDados = existing.dadosCompra ?? dadosCompra;
  const lockedValor = existing.valorInvestidoTotal ?? valorInvestidoTotal;
  const lockedTipo =
    existing.tipoOperacao ??
    existing.dadosCompra?.tipoOperacao ??
    tipoOperacao ??
    lockedDados?.tipoOperacao ??
    "compra";

  const lockedDadosWithTipo = lockedDados
    ? { ...lockedDados, tipoOperacao: lockedTipo }
    : undefined;

  const investment: SnapshotInvestment | undefined = lockedDadosWithTipo
    ? {
        dadosCompra: lockedDadosWithTipo,
        valorInvestidoTotal: lockedValor,
        tipoOperacao: lockedTipo,
      }
    : undefined;

  if (newSnapshotPhotos && newSnapshotPhotos.length > 0) {
    snapshots.push(
      buildEvolutionSnapshot(
        newSnapshotPhotos,
        `Janela atualizada ${snapshots.length + 1}`,
        investment
      )
    );
  }

  const isEvolutionUpdate = !!(newSnapshotPhotos && newSnapshotPhotos.length > 0);

  return {
    ...existing,
    timestamp: existing.timestamp,
    lastUpdatedAt: new Date().toLocaleString("pt-BR"),
    ativoCooptado: analysis.ativoCooptado || existing.ativoCooptado,
    tempoGrafico: analysis.tempoGrafico || existing.tempoGrafico,
    tendencia: analysis.tendencia || existing.tendencia,
    acaoRecomendada: analysis.acaoRecomendada || existing.acaoRecomendada,
    nivelConfianca: analysis.nivelConfianca || existing.nivelConfianca,
    analysis,
    previewImages: savedAll,
    imageCount: savedAll.length,
    evolutionSnapshots: snapshots.length ? snapshots : existing.evolutionSnapshots,
    dadosCompra: isEvolutionUpdate
      ? lockedDadosWithTipo ?? existing.dadosCompra
      : lockedDadosWithTipo ?? dadosCompra ?? existing.dadosCompra,
    valorInvestidoTotal: isEvolutionUpdate
      ? lockedValor ?? existing.valorInvestidoTotal
      : lockedValor ?? valorInvestidoTotal ?? existing.valorInvestidoTotal,
    tipoOperacao: lockedTipo,
    isLiveTrade: !!(lockedDadosWithTipo ?? existing.dadosCompra ?? dadosCompra),
  };
}
