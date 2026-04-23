import { useEffect, useRef, useState } from "react";

import { searchPlacesMadrid, type GeocodeResult } from "@/lib/geocode/nominatim";

/**
 * Hook simple con debounce para autocompletar Madrid via Nominatim.
 */
export function usePlaceSearch(query: string, debounceMs = 400) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (query.trim().length < 3) {
      // Limpiar de forma asincrona para no chocar con react-hooks/set-state-in-effect.
      const t = window.setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(t);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const startT = window.setTimeout(() => setLoading(true), 0);

    const handle = window.setTimeout(async () => {
      try {
        const items = await searchPlacesMadrid(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(items);
        }
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(startT);
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query, debounceMs]);

  return { results, loading };
}
