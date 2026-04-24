import { unzipSync, strFromU8 } from "fflate";

/**
 * Mini-loader de GTFS estatico.
 *
 * - Descarga el ZIP completo (Transit.land feed) o un mirror configurado.
 * - Descomprime en memoria con fflate.
 * - Solo parsea stops.txt y routes.txt (lo que necesitamos para mostrar
 *   paradas + lineas cercanas).
 * - Cachea el resultado en memoria del runtime.
 */

/** Categoria simplificada Rumby derivada de GTFS route_type. */
export type GtfsRouteCategory = "metro" | "bus" | "rail" | "tram" | "other";

export type GtfsStopRoute = {
  shortName: string;
  category: GtfsRouteCategory;
};

export type GtfsStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: GtfsStopRoute[];
  /** Categorias presentes en esta parada (rapido para filtrar). */
  categories: GtfsRouteCategory[];
};

/**
 * Mapea route_type GTFS a categoria Rumby.
 * Spec: https://gtfs.org/schedule/reference/#routestxt
 *  0 tram/streetcar | 1 metro/subway | 2 rail | 3 bus | 4 ferry
 *  5 cable tram | 6 aerial lift | 7 funicular | 11 trolleybus | 12 monorail
 * Tambien soportamos extended types Hierarchical Vehicle Type (100..1700).
 */
export function categorizeRouteType(rt: string | number | undefined): GtfsRouteCategory {
  const n = typeof rt === "string" ? Number(rt) : rt ?? -1;
  if (!Number.isFinite(n)) return "other";
  if (n === 1 || n === 12 || (n >= 400 && n <= 405)) return "metro";
  if (n === 2 || (n >= 100 && n <= 199)) return "rail";
  if (n === 3 || n === 11 || n === 800 || (n >= 700 && n <= 717)) return "bus";
  if (n === 0 || n === 5 || (n >= 900 && n <= 906)) return "tram";
  return "other";
}

export type GtfsBundle = {
  feedId: string;
  stops: GtfsStop[];
  fetchedAt: number;
};

const CACHE = new Map<string, Promise<GtfsBundle | null>>();
const TTL_MS = 12 * 60 * 60 * 1000;

export type GtfsFeedSpec = {
  /** id logico del feed (para cache) */
  id: string;
  /** URL directa al ZIP GTFS. Si necesita auth, pon header en `headers`. */
  url: string;
  headers?: Record<string, string>;
};

export async function loadGtfsBundle(spec: GtfsFeedSpec): Promise<GtfsBundle | null> {
  const cached = CACHE.get(spec.id);
  if (cached) {
    const v = await cached;
    if (v && Date.now() - v.fetchedAt < TTL_MS) return v;
  }

  const promise = fetchAndParse(spec).catch((err) => {
    console.error(`[gtfs] failed to load ${spec.id}:`, err);
    return null;
  });
  CACHE.set(spec.id, promise);
  const result = await promise;
  if (!result) CACHE.delete(spec.id);
  return result;
}

async function fetchAndParse(spec: GtfsFeedSpec): Promise<GtfsBundle | null> {
  const res = await fetch(spec.url, {
    headers: spec.headers,
    // Permitimos que Next cachee al menos 12h en CDN.
    next: { revalidate: 43200 },
  });
  if (!res.ok) {
    console.warn(`[gtfs] ${spec.id} responded ${res.status}`);
    return null;
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(buf, {
    filter: (file) => file.name.endsWith("stops.txt") || file.name.endsWith("routes.txt") || file.name.endsWith("trips.txt") || file.name.endsWith("stop_times.txt"),
  });

  const stopsTxt = pickFile(files, "stops.txt");
  const routesTxt = pickFile(files, "routes.txt");
  const tripsTxt = pickFile(files, "trips.txt");
  const stopTimesTxt = pickFile(files, "stop_times.txt");
  if (!stopsTxt) return null;

  const stopsRaw = parseCsv(strFromU8(stopsTxt));
  const routesRaw = routesTxt ? parseCsv(strFromU8(routesTxt)) : [];
  const tripsRaw = tripsTxt ? parseCsv(strFromU8(tripsTxt)) : [];
  const stopTimesRaw = stopTimesTxt ? parseCsv(strFromU8(stopTimesTxt)) : [];

  // route_id -> { short, category }
  const routeInfo = new Map<string, GtfsStopRoute>();
  for (const r of routesRaw) {
    const id = r.route_id;
    if (!id) continue;
    routeInfo.set(id, {
      shortName: r.route_short_name || r.route_long_name || id,
      category: categorizeRouteType(r.route_type),
    });
  }

  // trip_id -> route_id
  const tripRoute = new Map<string, string>();
  for (const t of tripsRaw) {
    if (t.trip_id && t.route_id) tripRoute.set(t.trip_id, t.route_id);
  }

  // stop_id -> Map<shortName, GtfsStopRoute> (dedupe por nombre)
  const stopRoutes = new Map<string, Map<string, GtfsStopRoute>>();
  for (const st of stopTimesRaw) {
    const tripId = st.trip_id;
    const stopId = st.stop_id;
    if (!tripId || !stopId) continue;
    const routeId = tripRoute.get(tripId);
    if (!routeId) continue;
    const info = routeInfo.get(routeId);
    if (!info) continue;
    let map = stopRoutes.get(stopId);
    if (!map) {
      map = new Map();
      stopRoutes.set(stopId, map);
    }
    if (!map.has(info.shortName)) map.set(info.shortName, info);
  }

  const stops: GtfsStop[] = [];
  for (const s of stopsRaw) {
    const lat = Number(s.stop_lat);
    const lon = Number(s.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (s.location_type && s.location_type !== "0") continue;
    const routesMap = stopRoutes.get(s.stop_id);
    const routes = routesMap
      ? Array.from(routesMap.values()).sort((a, b) => naturalSort(a.shortName, b.shortName))
      : [];
    const cats = new Set<GtfsRouteCategory>();
    for (const r of routes) cats.add(r.category);
    stops.push({
      id: s.stop_id,
      name: s.stop_name || s.stop_id,
      lat,
      lon,
      routes,
      categories: Array.from(cats),
    });
  }

  return { feedId: spec.id, stops, fetchedAt: Date.now() };
}

function pickFile(files: Record<string, Uint8Array>, name: string): Uint8Array | null {
  for (const k of Object.keys(files)) {
    if (k.endsWith(name)) return files[k];
  }
  return null;
}

/** Parser CSV minimo para GTFS (RFC 4180, comillas dobles). */
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = splitCsvLines(text);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^\uFEFF/, "").trim());
  const out: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = (cols[c] ?? "").trim();
    }
    out.push(row);
  }
  return out;
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (cur) lines.push(cur);
      cur = "";
      // saltar \r\n
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function naturalSort(a: string, b: string): number {
  const an = Number(a);
  const bn = Number(b);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return a.localeCompare(b);
}

/** Distancia haversine en metros. */
export function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
