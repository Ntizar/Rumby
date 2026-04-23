import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

const SPEED_KMH = 14; // velocidad efectiva con paradas y trafico
const WAIT_MIN = 8;
const ACCESS_MIN = 4;

export const busMode: ModeEstimator = {
  id: "bus",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm < 0.6 || distanceKm > 18) return null;

    const durationMin =
      Math.round((distanceKm / SPEED_KMH) * 60) + WAIT_MIN + ACCESS_MIN;

    return {
      mode: "bus",
      label: "Bus EMT",
      emoji: "🚌",
      durationMin,
      costEur: 1.5,
      distanceKm,
      co2Grams: Math.round(distanceKm * 60),
      confidence: "estimated",
      dataSource: "Tarifa EMT Madrid + estimacion velocidad media",
      hint: "Util si vas a una linea directa",
      warnings: ["Sin tiempos reales hasta conectar EMT MobilityLabs"],
    };
  },
};
