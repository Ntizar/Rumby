import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";
import { fetchBiciMadStations, nearestStation } from "@/lib/connectors/madrid/bicimad";

const SPEED_KMH = 14;
const MAX_WALK_TO_STATION_KM = 0.6;

export const bikeMode: ModeEstimator = {
  id: "bike",
  async estimate(trip): Promise<ModeOption | null> {
    const distanceKm = haversineKm(trip.origin, trip.destination);
    if (distanceKm > 15) return null;

    const baseDurationMin = Math.round((distanceKm / SPEED_KMH) * 60) + 3;
    const costEur = distanceKm < 4 ? 0.5 : 2.0;

    // Intento de datos en vivo BiciMAD.
    const stations = await fetchBiciMadStations();
    let confidence: ModeOption["confidence"] = "estimated";
    let dataSource = "Estimacion 14 km/h + tarifa BiciMAD publica";
    const warnings: string[] = [];

    if (stations && stations.length > 0) {
      const fromStation = nearestStation(stations, trip.origin.lat, trip.origin.lon);
      const toStation = nearestStation(
        stations,
        trip.destination.lat,
        trip.destination.lon,
      );

      const fromOk =
        !!fromStation &&
        fromStation.distanceKm <= MAX_WALK_TO_STATION_KM &&
        fromStation.station.bikesAvailable > 0;
      const toOk =
        !!toStation &&
        toStation.distanceKm <= MAX_WALK_TO_STATION_KM &&
        toStation.station.docksAvailable > 0;

      if (fromOk && toOk) {
        confidence = "real";
        dataSource = "GBFS BiciMAD en vivo";
      } else {
        if (!fromStation || fromStation.distanceKm > MAX_WALK_TO_STATION_KM) {
          warnings.push("Estacion BiciMAD lejos del origen");
        } else if (fromStation.station.bikesAvailable === 0) {
          warnings.push(`Sin bicis en ${fromStation.station.name}`);
        }
        if (!toStation || toStation.distanceKm > MAX_WALK_TO_STATION_KM) {
          warnings.push("Estacion BiciMAD lejos del destino");
        } else if (toStation.station.docksAvailable === 0) {
          warnings.push(`Sin huecos en ${toStation.station.name}`);
        }
      }
    } else {
      warnings.push("Sin datos en vivo BiciMAD");
    }

    return {
      mode: "bike",
      label: "BiciMAD",
      emoji: "🚲",
      durationMin: baseDurationMin,
      costEur,
      distanceKm,
      co2Grams: 0,
      confidence,
      dataSource,
      hint: distanceKm < 4 ? "Barato y rapido en centro" : "Carril bici a tramos",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
};
