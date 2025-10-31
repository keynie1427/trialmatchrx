"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type FavoriteTrial = {
nctId: string;
title: string;
status: string;     // e.g. "Recruiting — Phase 2"
conditions: string; // short, comma-separated
location: string;   // city/state/country or “Multiple locations”
savedAt: number;    // ms epoch
};

const LS_KEY = "tmrx:favorites";

export default function useFavorites() {
  const [items, setItems] = useState<FavoriteTrial[]>([]);

  // Load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    // keep tabs/windows in sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue) {
        try {
          setItems(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist
  const persist = useCallback((next: FavoriteTrial[]) => {
    setItems(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const isSaved = useCallback(
    (nctId: string) => items.some((it) => it.nctId === nctId),
    [items]
  );

  const add = useCallback(
    (trial: Omit<FavoriteTrial, "savedAt">) => {
      if (isSaved(trial.nctId)) return;
      persist([{ ...trial, savedAt: Date.now() }, ...items]);
    },
    [items, isSaved, persist]
  );

  const remove = useCallback(
    (nctId: string) => {
      persist(items.filter((it) => it.nctId !== nctId));
    },
    [items, persist]
  );

  const toggle = useCallback(
    (trial: Omit<FavoriteTrial, "savedAt">) => {
      if (isSaved(trial.nctId)) {
        remove(trial.nctId);
      } else {
        add(trial);
      }
    },
    [isSaved, add, remove]
  );

  // nice sorted view (newest first)
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.savedAt - a.savedAt),
    [items]
  );

  return { items: sorted, add, remove, toggle, isSaved };
}