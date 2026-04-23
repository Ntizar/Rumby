import type { Place } from "@/lib/domain/types";
import { reverseGeocode } from "@/lib/geocode/reverse";

export type GeolocationFix = {
  place: Place;
  accuracyMeters: number;
  source: "gps" | "ip";
};

/**
 * Pide la ubicacion al navegador (GPS/WiFi). Si falla, fallback a ipapi.co.
 * Lanza un Error con mensaje humano solo si ambos fallan.
 */
export async function getCurrentLocation(): Promise<GeolocationFix> {
  // Requiere contexto seguro (HTTPS o localhost)
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return getLocationFromIp();
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return getLocationFromIp();
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8_000,
        maximumAge: 30_000,
      });
    });

    const { latitude, longitude, accuracy } = position.coords;
    const reversed = await reverseGeocode(latitude, longitude);
    const place: Place =
      reversed ?? {
        id: `me-${Date.now()}`,
        name: "Mi ubicacion",
        lat: latitude,
        lon: longitude,
        kind: "address",
      };
    return { place, accuracyMeters: accuracy ?? 0, source: "gps" };
  } catch (err) {
    // Fallback IP solo si el usuario no ha denegado explicitamente
    const e = err as GeolocationPositionError;
    if (e?.code === 1 /* PERMISSION_DENIED */) {
      throw new Error("Permiso denegado. Activa la ubicacion en el navegador.");
    }
    try {
      return await getLocationFromIp();
    } catch {
      if (e?.code === 3) throw new Error("Tardamos demasiado en obtener tu ubicacion.");
      if (e?.code === 2) throw new Error("Ubicacion no disponible ahora mismo.");
      throw new Error("No se pudo obtener la ubicacion.");
    }
  }
}

/**
 * Observa la ubicacion del usuario en vivo. Devuelve una funcion de cancelacion.
 */
export function watchCurrentLocation(
  onUpdate: (lat: number, lon: number, accuracy: number) => void,
  onError: (err: Error) => void,
): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError(new Error("Geolocalizacion no soportada"));
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? 0),
    (err) => {
      if (err.code === 1) onError(new Error("Permiso denegado"));
      else if (err.code === 2) onError(new Error("Ubicacion no disponible"));
      else if (err.code === 3) onError(new Error("Timeout ubicacion"));
      else onError(new Error("Error ubicacion"));
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

async function getLocationFromIp(): Promise<GeolocationFix> {
  const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
  if (!res.ok) throw new Error("Geo IP no disponible");
  const data = (await res.json()) as {
    latitude?: number;
    longitude?: number;
    city?: string;
    region?: string;
    country_name?: string;
  };
  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    throw new Error("Geo IP sin coordenadas");
  }
  const name = data.city ? `${data.city} (aprox.)` : "Ubicacion aproximada";
  const context = [data.region, data.country_name].filter(Boolean).join(", ");
  return {
    place: {
      id: `ip-${Date.now()}`,
      name,
      lat: data.latitude,
      lon: data.longitude,
      context: context || undefined,
      kind: "address",
    },
    accuracyMeters: 10_000,
    source: "ip",
  };
}
