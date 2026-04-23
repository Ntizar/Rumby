import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";

// Velocidad efectiva metro puerta-a-puerta (incluye accesos y espera).
const SPEED_KMH = 20;
const WAIT_MIN = 6;
const ACCESS_MIN = 6; // bajar+subir andenes
const TRANSFER_PROB_KM = 4; // a partir de 4 km, probable transbordo

export const metroMode: ModeEstimator = {
  id: "metro",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm < 0.6) return null;

    const transfers = distanceKm > TRANSFER_PROB_KM ? 1 : 0;
    const durationMin =
      Math.round((distanceKm / SPEED_KMH) * 60) +
      WAIT_MIN +
      ACCESS_MIN +
      transfers * 4;

    // Billete sencillo Metro Madrid: 1.50-2.00 EUR.
    const costEur = distanceKm > 5 ? 2.0 : 1.5;

    return {
      mode: "metro",
      label: "Metro",
      emoji: "🚇",
      durationMin,
      costEur,
      distanceKm,
      co2Grams: Math.round(distanceKm * 30),
      confidence: "estimated",
      dataSource: "Tarifa Metro Madrid + estimacion velocidad media",
      hint: transfers > 0 ? "Probable 1 transbordo" : "Directo o casi directo",
      warnings: ["Sin horarios reales hasta integrar GTFS Metro"],
    };
  },
};
