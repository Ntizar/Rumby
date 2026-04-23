import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

const SPEED_KMH = 50; // cercanias cubre tramos largos rapido
const WAIT_MIN = 12;
const ACCESS_MIN = 10;

export const railMode: ModeEstimator = {
  id: "rail",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm < 5) return null; // por debajo, metro o bus mejor

    const durationMin =
      Math.round((distanceKm / SPEED_KMH) * 60) + WAIT_MIN + ACCESS_MIN;
    // Cercanias Madrid Zona A 1.70 EUR, larga distancia hasta 8.70.
    const costEur = distanceKm > 25 ? 5.5 : distanceKm > 12 ? 2.6 : 1.7;

    return {
      mode: "rail",
      label: "Cercanias",
      emoji: "🚆",
      durationMin,
      costEur,
      distanceKm,
      co2Grams: Math.round(distanceKm * 25),
      confidence: "estimated",
      dataSource: "Tarifa Cercanias Madrid + estimacion velocidad",
      hint: distanceKm > 12 ? "Bueno para distancias largas" : undefined,
      warnings: ["Sin horarios reales hasta integrar GTFS Cercanias"],
    };
  },
};
