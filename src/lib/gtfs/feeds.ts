import type { GtfsFeedSpec } from "./loader";

/**
 * Mapa de feeds GTFS por ciudad/operador.
 *
 * Estrategia:
 * - Por defecto usamos Transit.land como mirror (requiere TRANSITLAND_API_KEY).
 * - Se puede sobreescribir con env GTFS_<CITYID>_<MODE>_URL si tenemos un mirror oficial.
 *
 * Onefeeds Transit.land (operador IDs):
 *   Madrid CRTM (multimodal):      f-ezjm-consorcioregionaldetransportesdemadrid
 *   Madrid EMT (autobus urbano):   f-ezjm-empresamunicipaldetransportes
 *   Madrid Cercanias (Renfe):      f-cercan%C3%ADas~madrid
 *
 * Si no hay TRANSITLAND_API_KEY, devolvemos null y el endpoint responde 503 limpio.
 */

export type FeedKey = `${string}:${"transit" | "bus" | "metro" | "rail"}`;

const TRANSITLAND_BASE = "https://transit.land/api/v2/rest/feeds";

function transitlandFeed(id: string, onestopId: string): GtfsFeedSpec | null {
  const key = process.env.TRANSITLAND_API_KEY;
  if (!key) return null;
  return {
    id,
    url: `${TRANSITLAND_BASE}/${onestopId}/download_latest_feed_version?apikey=${encodeURIComponent(key)}`,
  };
}

export function getFeedSpec(cityId: string, mode: "transit" | "bus" | "metro" | "rail"): GtfsFeedSpec | null {
  // Override via env: ej. GTFS_MADRID_TRANSIT_URL=https://...
  const envKey = `GTFS_${cityId.toUpperCase()}_${mode.toUpperCase()}_URL`;
  const envUrl = process.env[envKey];
  if (envUrl) {
    return { id: `${cityId}-${mode}`, url: envUrl };
  }

  // Mapa por ciudad. Solo Madrid de momento; resto cae a null y modo es estimado.
  if (cityId === "madrid") {
    return transitlandFeed(`${cityId}-${mode}`, "f-ezjm-consorcioregionaldetransportesdemadrid");
  }
  if (cityId === "barcelona") {
    // TODO: confirmar onestop id real para TMB.
    return transitlandFeed(`${cityId}-${mode}`, "f-sp3e-tmb");
  }
  return null;
}
