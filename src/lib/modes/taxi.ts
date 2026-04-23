import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

// Velocidad efectiva considerando trafico Madrid centro.
const SPEED_KMH = 22;

export const taxiMode: ModeEstimator = {
  id: "taxi",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm < 0.4) return null;

    const durationMin = Math.round((distanceKm / SPEED_KMH) * 60) + 4;
    // Tarifa 1 Madrid (aprox): bajada 2,50 EUR + 1,30 EUR/km.
    const costEur = +(2.5 + 1.3 * distanceKm).toFixed(2);

    return {
      mode: "taxi",
      label: "Taxi / VTC",
      emoji: "🚕",
      durationMin,
      costEur,
      distanceKm,
      co2Grams: Math.round(distanceKm * 130),
      confidence: "estimated",
      dataSource: "Tarifa publica taxi Madrid (estimacion)",
      hint: "Comodo, puerta a puerta",
      warnings: ["Precio real depende de trafico, hora y operador"],
    };
  },
};
