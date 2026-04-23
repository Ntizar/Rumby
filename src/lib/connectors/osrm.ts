import type { Place } from "@/lib/domain/types";

/**
 * Cliente del OSRM publico (router.project-osrm.org).
 *
 * Sin auth, sin clave, CORS-friendly. Apto para uso ligero en cliente.
 * Si fuera necesario escalar, hay que self-hostear o cambiar de proveedor.
 *
 * Profiles disponibles en el host publico: walking, cycling, driving.
 */

export type OsrmProfile = "walking" | "cycling" | "driving";

export type OsrmRoute = {
  /** Distancia total en metros. */
  distanceM: number;
  /** Duracion total en segundos (segun perfil OSRM, sin trafico real). */
  durationS: number;
  /** Geometria como array de [lon, lat]. */
  coordinates: [number, number][];
};

const ENDPOINT = "https://router.project-osrm.org/route/v1";

export async function osrmRoute(
  profile: OsrmProfile,
  origin: Place,
  destination: Place,
  signal?: AbortSignal,
): Promise<OsrmRoute | null> {
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const url = `${ENDPOINT}/${profile}/${coords}?overview=full&geometries=geojson&alternatives=false&steps=false`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    return {
      distanceM: route.distance,
      durationS: route.duration,
      coordinates: route.geometry?.coordinates ?? [],
    };
  } catch {
    return null;
  }
}
