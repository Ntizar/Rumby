import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

const SPEED_KMH = 4.8;

export const walkMode: ModeEstimator = {
  id: "walk",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    // Sobre 2 km a pie deja de ser util como opcion principal, pero la mostramos hasta 6.
    if (distanceKm > 6) return null;

    const durationMin = Math.round((distanceKm / SPEED_KMH) * 60);

    return {
      mode: "walk",
      label: "Caminar",
      emoji: "🚶",
      durationMin,
      costEur: 0,
      distanceKm,
      co2Grams: 0,
      confidence: "estimated",
      dataSource: "Estimacion lineal a 4,8 km/h",
      hint: distanceKm < 1.5 ? "Mas rapido que esperar transporte" : "Sano, pero largo",
      warnings: distanceKm > 3 ? ["Mas de 3 km a pie"] : undefined,
    };
  },
};
