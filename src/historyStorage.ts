import { SavedAnalysis, SavedAnalysisImage, EvolutionSnapshot, DadosCompra } from "./types";

export const HISTORY_STORAGE_KEY = "candlescan_history_v1";
export const MAX_HISTORY_WITH_PHOTOS = 15;

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
  label: string
): EvolutionSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    label,
    images: photosToSavedImages(photos),
  };
}

export function mergeHistoryAnalysis(
  existing: SavedAnalysis,
  analysis: SavedAnalysis["analysis"],
  allPhotos: { name: string; type: string; base64: string }[],
  dadosCompra: DadosCompra | undefined,
  valorInvestidoTotal: number | undefined,
  newSnapshotPhotos: { name: string; type: string; base64: string }[] | null
): SavedAnalysis {
  const savedAll = photosToSavedImages(allPhotos);
  const snapshots = [...(existing.evolutionSnapshots ?? [])];

  if (newSnapshotPhotos && newSnapshotPhotos.length > 0) {
    snapshots.push(
      buildEvolutionSnapshot(
        newSnapshotPhotos,
        `Atualização ${snapshots.length + 1}`
      )
    );
  }

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
    dadosCompra: dadosCompra ?? existing.dadosCompra,
    valorInvestidoTotal: valorInvestidoTotal ?? existing.valorInvestidoTotal,
    isLiveTrade: !!dadosCompra || existing.isLiveTrade,
  };
}
