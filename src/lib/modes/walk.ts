import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";
import { osrmRoute } from "@/lib/connectors/osrm";

const SPEED_KMH = 4.8;

export const walkMode: ModeEstimator = {
  id: "walk",
  async estimate(trip): Promise<ModeOption | null> {
    const fallbackKm = haversineKm(trip.origin, trip.destination);
    if (fallbackKm > 6) return null;

    // Intento OSRM real para obtener distancia y geometria de la ruta peatonal.
    const route = await osrmRoute("walking", trip.origin, trip.destination, trip.waypoints ?? []);

    if (route) {
      const distanceKm = route.distanceM / 1000;
      const durationMin = Math.max(1, Math.round(route.durationS / 60));
      return {
        mode: "walk",
        label: "Caminar",
        emoji: "🚶",
        durationMin,
        costEur: 0,
        distanceKm,
        co2Grams: 0,
        confidence: "real",
        dataSource: "OSRM publico (foot)",
        hint: distanceKm < 1.5 ? "Mas rapido que esperar transporte" : "Sano, pero largo",
        warnings: distanceKm > 3 ? ["Mas de 3 km a pie"] : undefined,
        geometry: route.coordinates,
      };
    }

    // Fallback: estimacion lineal si OSRM cae.
    const durationMin = Math.round((fallbackKm / SPEED_KMH) * 60);
    return {
      mode: "walk",
      label: "Caminar",
      emoji: "🚶",
      durationMin,
      costEur: 0,
      distanceKm: fallbackKm,
      co2Grams: 0,
      confidence: "estimated",
      dataSource: "Estimacion lineal a 4,8 km/h (OSRM no disponible)",
      hint: fallbackKm < 1.5 ? "Mas rapido que esperar transporte" : "Sano, pero largo",
      warnings: fallbackKm > 3 ? ["Mas de 3 km a pie"] : undefined,
      geometry: null,
    };
  },
};
