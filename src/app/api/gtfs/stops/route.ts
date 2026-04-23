import { NextResponse } from "next/server";
import { getFeedSpec } from "@/lib/gtfs/feeds";
import { loadGtfsBundle, haversineMeters, type GtfsStop } from "@/lib/gtfs/loader";

/**
 * GET /api/gtfs/stops?city=madrid&lat=40.42&lon=-3.70&radius=600&mode=transit
 *
 * Devuelve paradas reales cercanas con las lineas que pasan por cada una.
 * Lee feeds GTFS via Transit.land (requiere TRANSITLAND_API_KEY) o un mirror
 * directo configurado por env.
 *
 * Si no hay feed configurado, responde 200 con `{ stops: [], reason }` para
 * que el cliente caiga limpio a estimacion sin romper la UX.
 */

export const runtime = "nodejs";
// La carga del feed es pesada (varios MB). Reservamos hasta 60s en Vercel.
export const maxDuration = 60;

type Mode = "transit" | "bus" | "metro" | "rail";

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
  const mode = (url.searchParams.get("mode") ?? "transit") as Mode;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "8"), 20);

  if (!city || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "missing city/lat/lon" },
      { status: 400 },
    );
  }

  const spec = getFeedSpec(city, mode);
  if (!spec) {
    return NextResponse.json(
      {
        stops: [],
        reason: "no_feed_configured",
        message: `No hay feed GTFS configurado para ${city}/${mode}. Define TRANSITLAND_API_KEY o GTFS_${city.toUpperCase()}_${mode.toUpperCase()}_URL.`,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  }

  const bundle = await loadGtfsBundle(spec);
  if (!bundle) {
    return NextResponse.json(
      { stops: [], reason: "feed_load_failed" },
      { status: 502 },
    );
  }

  // Filtro grueso por bbox para no haversinear ~30k stops por request.
  const dLat = radius / 111000;
  const dLon = radius / (111000 * Math.cos((lat * Math.PI) / 180));
  const candidates: Array<GtfsStop & { distance: number }> = [];
  for (const s of bundle.stops) {
    if (Math.abs(s.lat - lat) > dLat) continue;
    if (Math.abs(s.lon - lon) > dLon) continue;
    const distance = haversineMeters(lat, lon, s.lat, s.lon);
    if (distance > radius) continue;
    candidates.push({ ...s, distance: Math.round(distance) });
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
