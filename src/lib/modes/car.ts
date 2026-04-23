import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";
import { osrmRoute } from "@/lib/connectors/osrm";

const SPEED_KMH = 20; // trafico ciudad + busqueda de aparcamiento

export const carMode: ModeEstimator = {
  id: "car",
  async estimate(trip): Promise<ModeOption | null> {
    const fallbackKm = haversineKm(trip.origin, trip.destination);
    if (fallbackKm < 1) return null;

    const route = await osrmRoute("driving", trip.origin, trip.destination, trip.waypoints ?? []);
    const distanceKm = route ? route.distanceM / 1000 : fallbackKm;
    const durationMin = route
      ? Math.max(1, Math.round(route.durationS / 60)) + 6 // +6 buscar aparcamiento
      : Math.round((fallbackKm / SPEED_KMH) * 60) + 6;

    const costEur = +(0.18 * distanceKm + 1.5).toFixed(2);

    return {
      mode: "car",
      label: "Coche propio",
      emoji: "🚗",
      durationMin,
      costEur,
      distanceKm,
      co2Grams: Math.round(distanceKm * 150),
      confidence: route ? "real" : "estimated",
      dataSource: route
        ? "OSRM driving + estimacion combustible/parking"
        : "Estimacion combustible + parking (OSRM no disponible)",
      hint: "Solo si necesitas coche en destino",
      warnings: ["Zona Bajas Emisiones puede restringir acceso"],
      geometry: route?.coordinates ?? null,
    };
  },
};
