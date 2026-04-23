import type { Place } from "@/lib/domain/types";

/**
 * Reverse geocoding via Nominatim. Convierte lat/lon en una direccion humana.
 */
const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

type NominatimReverse = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string>;
};

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<Place | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "es");
  url.searchParams.set("zoom", "18");

  try {
    const res = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const item = (await res.json()) as NominatimReverse;
    const a = item.address ?? {};
    const street = [a.road, a.house_number].filter(Boolean).join(" ");
    const name = street || item.name || item.display_name.split(",")[0];
    return {
      id: String(item.place_id),
      name: name.trim(),
      lat,
      lon,
      context: [a.suburb, a.city, a.town, a.village].filter(Boolean).slice(0, 1).join(", "),
      kind: "address",
    };
  } catch {
    return null;
  }
}
