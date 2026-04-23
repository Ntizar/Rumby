/**
 * Conector de estaciones BiciMAD (Madrid).
 *
 * BiciMAD publica un feed GBFS (estandar abierto). Lo usamos como fuente real
 * de "hay estacion cerca de mi origen y hay otra cerca de mi destino".
 *
 * Si el feed bloquea por CORS, devolvemos null y la app sigue funcionando
 * con la estimacion sin penalizar al usuario.
 */

const STATION_INFO_URL =
  "https://gbfs.urbansharing.com/bicimad.com/station_information.json";
const STATION_STATUS_URL =
  "https://gbfs.urbansharing.com/bicimad.com/station_status.json";

export type BiciMadStation = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bikesAvailable: number;
  docksAvailable: number;
};

type GbfsStationInfoFeed = {
  data: { stations: Array<{ station_id: string; name: string; lat: number; lon: number }> };
};

type GbfsStationStatusFeed = {
  data: {
    stations: Array<{
      station_id: string;
      num_bikes_available?: number;
      num_docks_available?: number;
    }>;
  };
};

let cache: { ts: number; stations: BiciMadStation[] } | null = null;
const TTL_MS = 60_000;

export async function fetchBiciMadStations(): Promise<BiciMadStation[] | null> {
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return cache.stations;
  }

  try {
    const [infoRes, statusRes] = await Promise.all([
      fetch(STATION_INFO_URL),
      fetch(STATION_STATUS_URL),
    ]);
    if (!infoRes.ok || !statusRes.ok) return null;

    const info = (await infoRes.json()) as GbfsStationInfoFeed;
    const status = (await statusRes.json()) as GbfsStationStatusFeed;

    const statusById = new Map(
      status.data.stations.map((s) => [s.station_id, s]),
    );

    const stations: BiciMadStation[] = info.data.stations.map((s) => {
      const st = statusById.get(s.station_id);
      return {
        id: s.station_id,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        bikesAvailable: st?.num_bikes_available ?? 0,
        docksAvailable: st?.num_docks_available ?? 0,
      };
    });

    cache = { ts: Date.now(), stations };
    return stations;
  } catch {
    return null;
  }
}

export function nearestStation(
  stations: BiciMadStation[],
  lat: number,
  lon: number,
): { station: BiciMadStation; distanceKm: number } | null {
  if (stations.length === 0) return null;
  let best: BiciMadStation | null = null;
  let bestDist = Infinity;

  for (const s of stations) {
    const d = haversineKm(lat, lon, s.lat, s.lon);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }

  if (!best) return null;
  return { station: best, distanceKm: bestDist };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
