"use client";

import { useEffect, useState } from "react";

export type Operator = {
  id: number;
  name: string;
  url: string | null;
  modes: string[];
  datasetsCount: number;
};

/**
 * Lee operadores reales de NAP via el proxy /api/nap/operators.
 * Los resultados quedan cacheados por el server 24h.
 */
export function useOperators(napAreaUrbanaId: number) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const startT = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    }, 0);

    fetch(`/api/nap/operators?area=${napAreaUrbanaId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { operators: Operator[] }) => {
        if (!cancelled) setOperators(data.operators ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled && !(e instanceof DOMException && e.name === "AbortError")) {
          setError(e instanceof Error ? e.message : "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(startT);
      controller.abort();
    };
  }, [napAreaUrbanaId]);

  return { operators, loading, error };
}
