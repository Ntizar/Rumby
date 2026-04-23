import { haversineKm } from "@/lib/domain/distance";
import type { ModeOption } from "@/lib/domain/types";
import type { ModeEstimator } from "@/lib/modes/types";
import { fetchBiciMadStations, nearestStation } from "@/lib/connectors/madrid/bicimad";
import { osrmRoute } from "@/lib/connectors/osrm";

const SPEED_KMH = 14;
const MAX_WALK_TO_STATION_KM = 0.6;

export const bikeMode: ModeEstimator = {
  id: "bike",
  async estimate(trip, ctx): Promise<ModeOption | null> {
    const fallbackKm = haversineKm(trip.origin, trip.destination);
    if (fallbackKm > 15) return null;

    // OSRM cycling para distancia y geometria reales.
    const route = await osrmRoute("cycling", trip.origin, trip.destination);
    const distanceKm = route ? route.distanceM / 1000 : fallbackKm;
    const baseDurationMin = route
      ? Math.max(1, Math.round(route.durationS / 60)) + 3 // +3 desbloqueo + ajuste
      : Math.round((fallbackKm / SPEED_KMH) * 60) + 3;

    const costEur = distanceKm < 4 ? 0.5 : 2.0;
    const warnings: string[] = [];
    let confidence: ModeOption["confidence"] = route ? "real" : "estimated";
    let dataSource = route
      ? "OSRM cycling + tarifa BiciMAD publica"
      : "Estimacion 14 km/h + tarifa BiciMAD publica";

    // Si estamos en Madrid, intentamos cruzar con datos en vivo BiciMAD.
    if (ctx.citySlug === "madrid") {
      const stations = await fetchBiciMadStations();
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
          dataSource = route
            ? "OSRM cycling + GBFS BiciMAD en vivo"
            : "GBFS BiciMAD en vivo (sin OSRM)";
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
      }
    }

    return {
      mode: "bike",
      label: ctx.citySlug === "madrid" ? "BiciMAD" : "Bici",
      emoji: "🚲",
      durationMin: baseDurationMin,
      costEur,
      distanceKm,
      co2Grams: 0,
      confidence,
      dataSource,
      hint: distanceKm < 4 ? "Barato y rapido en centro" : "Carril bici a tramos",
      warnings: warnings.length > 0 ? warnings : undefined,
      geometry: route?.coordinates ?? null,
    };
  },
};
