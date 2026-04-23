import type { Place } from "@/lib/domain/types";
import { reverseGeocode } from "@/lib/geocode/reverse";

export type GeolocationFix = {
  place: Place;
  accuracyMeters: number;
};

/**
 * Pide la ubicacion al navegador y resuelve a un Place real.
 * Lanza un Error con mensaje humano si falla.
 */
export async function getCurrentLocation(): Promise<GeolocationFix> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Tu navegador no soporta geolocalizacion");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 30_000,
    });
  }).catch((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      throw new Error("Permiso denegado. Activa la ubicacion en el navegador.");
    }
    if (err.code === err.POSITION_UNAVAILABLE) {
      throw new Error("Ubicacion no disponible ahora mismo.");
    }
    if (err.code === err.TIMEOUT) {
      throw new Error("Tardamos demasiado en obtener tu ubicacion.");
    }
    throw new Error("No se pudo obtener la ubicacion.");
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

  return { place, accuracyMeters: accuracy ?? 0 };
}
