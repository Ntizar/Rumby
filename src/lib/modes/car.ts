import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

const SPEED_KMH = 20; // trafico Madrid + busqueda de aparcamiento

export const carMode: ModeEstimator = {
  id: "car",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm < 1) return null;

    const durationMin = Math.round((distanceKm / SPEED_KMH) * 60) + 6; // +6 buscar aparcamiento
    // Combustible aprox + posible parking SER.
    const costEur = +(0.18 * distanceKm + 1.5).toFixed(2);

    return {
      mode: "car",
      label: "Coche propio",
      emoji: "🚗",
      durationMin,
      costEur,
      distanceKm,
      co2Grams: Math.round(distanceKm * 150),
      confidence: "estimated",
      dataSource: "Estimacion combustible + parking Madrid",
      hint: "Solo si necesitas coche en destino",
      warnings: ["Madrid Central restringe acceso a no residentes"],
    };
  },
};
