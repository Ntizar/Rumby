import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

const SPEED_KMH = 26;

export const motoMode: ModeEstimator = {
  id: "moto",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm > 25) return null;

    const durationMin = Math.round((distanceKm / SPEED_KMH) * 60) + 3;
    // Acciona/Cooltra: ~0,28 EUR/min sin desbloqueo.
    const costEur = +(0.28 * durationMin).toFixed(2);

    return {
      mode: "moto",
      label: "Moto sharing",
      emoji: "🛵",
      durationMin,
      costEur,
      distanceKm,
      co2Grams: 0, // electricas en Madrid
      confidence: "estimated",
      dataSource: "Tarifa media Acciona/Cooltra Madrid",
      hint: "Esquiva trafico y aparca facil",
      warnings: ["Requiere carnet y app del operador"],
    };
  },
};
