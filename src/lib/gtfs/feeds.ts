import type { GtfsFeedSpec } from "./loader";

/**
 * Mapa de feeds GTFS por ciudad.
 *
 * Estrategia: un feed unico multimodal por ciudad (CRTM Madrid cubre metro,
 * bus, cercanias, tram). Para filtrar por modo concreto en runtime usamos
 * `route_type` GTFS dentro del propio bundle.
 *
 * Override por env: GTFS_<CITYID>_TRANSIT_URL=https://<mirror>.zip
 *
 * Onestop ids verificados:
 *   Madrid CRTM: f-ezjm-consorcioregionaldetransportesdemadrid
 *   Madrid EMT:  f-ezjm-empresamunicipaldetransportes
 *   Cercanias:   f-cercan%C3%ADas~madrid
 */

const TRANSITLAND_BASE = "https://transit.land/api/v2/rest/feeds";

const CITY_FEEDS: Record<string, string> = {
  madrid: "f-ezjm-consorcioregionaldetransportesdemadrid",
  // barcelona: pendiente de verificar onestop_id real (TMB).
  // valencia, sevilla, bilbao, etc.: anadir cuando confirmemos.
};

function transitlandFeed(id: string, onestopId: string): GtfsFeedSpec | null {
  const key = process.env.TRANSITLAND_API_KEY;
  if (!key) return null;
  return {
    id,
    url: `${TRANSITLAND_BASE}/${onestopId}/download_latest_feed_version?apikey=${encodeURIComponent(key)}`,
  };
}

export function getFeedSpec(
  cityId: string,
  // mantenemos el segundo arg por compatibilidad pero ya no afecta al feed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mode?: "transit" | "bus" | "metro" | "rail" | "tram",
): GtfsFeedSpec | null {
  const envKey = `GTFS_${cityId.toUpperCase()}_TRANSIT_URL`;
  const envUrl = process.env[envKey];
  if (envUrl) return { id: `${cityId}-transit`, url: envUrl };

  const onestopId = CITY_FEEDS[cityId];
  if (!onestopId) return null;
  return transitlandFeed(`${cityId}-transit`, onestopId);
}
