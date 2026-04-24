import type { GtfsRouteCategory } from "./loader";

export type NearbyStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  routes: { shortName: string; category: GtfsRouteCategory }[];
  categories: GtfsRouteCategory[];
};

export type NearbyResponse = {
  stops: NearbyStop[];
  reason?: string;
};

/**
 * Cliente simple para /api/gtfs/stops.
 * Devuelve `{ stops: [] }` con `reason` si el feed no esta configurado o falla.
 *
 * Funciona en server (modos) y en cliente porque hace fetch absoluto.
 */
export async function fetchNearbyStops(opts: {
  city: string;
  lat: number;
  lon: number;
  radius?: number;
  mode?: "transit" | "metro" | "bus" | "rail" | "tram";
  limit?: number;
  /** Base URL para SSR. Por defecto detecta de env Vercel o relativo. */
  baseUrl?: string;
}): Promise<NearbyResponse> {
  const params = new URLSearchParams({
    city: opts.city,
    lat: String(opts.lat),
    lon: String(opts.lon),
    radius: String(opts.radius ?? 600),
    mode: opts.mode ?? "transit",
    limit: String(opts.limit ?? 8),
  });
  const base = opts.baseUrl ?? defaultBaseUrl();
  try {
    const res = await fetch(`${base}/api/gtfs/stops?${params}`, {
      // Cache compartida del CDN; clientes navegan rapido y server reutiliza.
      next: { revalidate: 300 },
    });
    if (!res.ok) return { stops: [], reason: `http_${res.status}` };
    return (await res.json()) as NearbyResponse;
  } catch (err) {
    return { stops: [], reason: err instanceof Error ? err.message : "fetch_error" };
  }
}

function defaultBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  // En Vercel: VERCEL_URL no incluye protocolo.
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}
