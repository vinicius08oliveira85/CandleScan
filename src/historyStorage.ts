import { SavedAnalysis } from "./types";

export const HISTORY_STORAGE_KEY = "candlescan_history_v1";
export const MAX_HISTORY_WITH_PHOTOS = 15;

export function loadHistoryFromStorage(): SavedAnalysis[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as SavedAnalysis[];
    return Array.isArray(parsed) ? parsed : [];
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
