import type { Place } from "@/lib/domain/types";

/**
 * Geocoder publico Nominatim (OpenStreetMap).
 * Sin claves. Limite ~1 req/s. Apto para autocompletar con debounce.
 *
 * Para Madrid acotamos el viewbox para resultados mas relevantes.
 */

const MADRID_VIEWBOX = "-3.9,40.6,-3.5,40.3"; // left,top,right,bottom
const ENDPOINT = "https://nominatim.openstreetmap.org/search";

export type GeocodeResult = Place & {
  /** "city, country" para distinguir homonimos. */
  display: string;
};

type NominatimItem = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  address?: Record<string, string>;
};

export async function searchPlacesMadrid(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("viewbox", MADRID_VIEWBOX);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("accept-language", "es");

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      // Nominatim requiere identificacion del cliente.
      "Accept": "application/json",
    },
  });

  if (!res.ok) return [];

  const data: NominatimItem[] = await res.json();

  return data.map((item) => {
    const lat = Number.parseFloat(item.lat);
    const lon = Number.parseFloat(item.lon);
    const shortName = item.name ?? item.display_name.split(",")[0];
    const context = buildContext(item);

    return {
      id: String(item.place_id),
      name: shortName.trim(),
      display: item.display_name,
      context,
      lat,
      lon,
      kind: "address" as const,
    };
  });
}

function buildContext(item: NominatimItem): string {
  const a = item.address ?? {};
  const parts = [a.suburb, a.city_district, a.city, a.town, a.village, a.state]
    .filter(Boolean)
    .slice(0, 2);
  return parts.join(", ");
}
