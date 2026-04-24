import { NextResponse } from "next/server";
import { getFeedSpec } from "@/lib/gtfs/feeds";
import {
  loadGtfsBundle,
  haversineMeters,
  type GtfsStop,
  type GtfsRouteCategory,
} from "@/lib/gtfs/loader";

/**
 * GET /api/gtfs/stops?city=madrid&lat=40.42&lon=-3.70&radius=600&mode=metro
 *
 * Devuelve paradas reales cercanas con las lineas que pasan por cada una.
 * Lee feeds GTFS via Transit.land (requiere TRANSITLAND_API_KEY) o un mirror
 * directo configurado por env.
 *
 * `mode` filtra por categoria: metro|bus|rail|tram|transit (todo).
 *
 * Si no hay feed configurado, responde 200 con `{ stops: [], reason }` para
 * que el cliente caiga limpio a estimacion sin romper la UX.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

type RequestedMode = GtfsRouteCategory | "transit";

function clampRadius(value: number): number {
  if (!Number.isFinite(value)) return 600;
  return Math.min(Math.max(value, 100), 3000);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city");
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const radius = clampRadius(Number(url.searchParams.get("radius") ?? "600"));
  const mode = (url.searchParams.get("mode") ?? "transit") as RequestedMode;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "8"), 20);

  if (!city || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "missing city/lat/lon" }, { status: 400 });
  }

  // El feed se mantiene unico por ciudad (CRTM cubre metro+bus+rail+tram en Madrid).
  const spec = getFeedSpec(city, "transit");
  if (!spec) {
    return NextResponse.json(
      {
        stops: [],
        reason: "no_feed_configured",
        message: `No hay feed GTFS configurado para ${city}. Define TRANSITLAND_API_KEY o GTFS_${city.toUpperCase()}_TRANSIT_URL.`,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  }

  const bundle = await loadGtfsBundle(spec);
  if (!bundle) {
    return NextResponse.json({ stops: [], reason: "feed_load_failed" }, { status: 502 });
  }

  // Filtro grueso por bbox + filtro fino haversine.
  const dLat = radius / 111000;
  const dLon = radius / (111000 * Math.cos((lat * Math.PI) / 180));
  const candidates: Array<GtfsStop & { distance: number }> = [];
  for (const s of bundle.stops) {
    if (Math.abs(s.lat - lat) > dLat) continue;
    if (Math.abs(s.lon - lon) > dLon) continue;
    if (mode !== "transit" && !s.categories.includes(mode)) continue;
    if (s.routes.length === 0) continue;
    const distance = haversineMeters(lat, lon, s.lat, s.lon);
    if (distance > radius) continue;
    // Si el cliente pide un modo concreto, filtramos las routes para no enviar ruido.
    const filteredRoutes =
      mode === "transit" ? s.routes : s.routes.filter((r) => r.category === mode);
    if (filteredRoutes.length === 0) continue;
    candidates.push({
      ...s,
      routes: filteredRoutes,
      distance: Math.round(distance),
    });
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const stops = candidates.slice(0, limit);

  return NextResponse.json(
    {
      city,
      mode,
      center: { lat, lon },
      radius,
      count: stops.length,
      stops,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
