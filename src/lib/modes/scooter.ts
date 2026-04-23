import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

const SPEED_KMH = 18;

export const scooterMode: ModeEstimator = {
  id: "scooter",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm > 10) return null;

    const durationMin = Math.round((distanceKm / SPEED_KMH) * 60) + 2;
    // Tarifas tipicas Lime/Bird Madrid: 1 EUR desbloqueo + 0,25 EUR/min.
    const costEur = +(1 + 0.25 * durationMin).toFixed(2);

    return {
      mode: "scooter",
      label: "Patinete",
      emoji: "🛴",
      durationMin,
      costEur,
      distanceKm,
      co2Grams: 0,
      confidence: "estimated",
      dataSource: "Tarifa media Lime/Bird Madrid",
      hint: "Util para 1-3 km",
      warnings: ["Sin disponibilidad real en vivo"],
    };
  },
};
