import { useCallback, useEffect, useState } from "react";

const FAVORITES_STORAGE_KEY = "fish-money:favorites";

export interface FavoriteTicker {
  ticker: string;
  companyName: string;
  addedAt: string;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

function isFavoriteTicker(value: unknown): value is FavoriteTicker {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.ticker === "string" &&
    typeof candidate.companyName === "string" &&
    typeof candidate.addedAt === "string"
  );
}

function readFavorites(): FavoriteTicker[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const deduped = new Map<string, FavoriteTicker>();
    for (const item of parsed) {
      if (!isFavoriteTicker(item)) {
        continue;
      }

      const normalized = normalizeTicker(item.ticker);
      if (!normalized) {
        continue;
      }

      deduped.set(normalized, {
        ticker: normalized,
        companyName: item.companyName.trim() || normalized,
        addedAt: item.addedAt,
      });
    }

    return Array.from(deduped.values()).sort((a, b) =>
      b.addedAt.localeCompare(a.addedAt),
    );
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteTicker[]>(() =>
    readFavorites(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback(
    (ticker: string) => {
      const normalized = normalizeTicker(ticker);
      return favorites.some((entry) => entry.ticker === normalized);
    },
    [favorites],
  );

  const addFavorite = useCallback(
    (ticker: string, companyName: string) => {
      const normalized = normalizeTicker(ticker);
      if (!normalized || favorites.some((entry) => entry.ticker === normalized)) {
        return false;
      }

      setFavorites((current) => [
        {
          ticker: normalized,
          companyName: companyName.trim() || normalized,
          addedAt: new Date().toISOString(),
        },
        ...current,
      ]);

      return true;
    },
    [favorites],
  );

  const removeFavorite = useCallback(
    (ticker: string) => {
      const normalized = normalizeTicker(ticker);
      if (!favorites.some((entry) => entry.ticker === normalized)) {
        return false;
      }

      setFavorites((current) =>
        current.filter((entry) => entry.ticker !== normalized),
      );

      return true;
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (ticker: string, companyName: string): "added" | "removed" => {
      const removed = removeFavorite(ticker);
      if (removed) {
        return "removed";
      }

      addFavorite(ticker, companyName);
      return "added";
    },
    [addFavorite, removeFavorite],
  );

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
