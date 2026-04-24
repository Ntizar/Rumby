import { fetchNearbyStops, type NearbyStop } from "@/lib/gtfs/client";
import type { GtfsRouteCategory } from "@/lib/gtfs/loader";
import type { ModeDetail, ModeOption, Place } from "@/lib/domain/types";

type EnrichCategory = Exclude<GtfsRouteCategory, "other">;

/**
 * Enriquece un ModeOption de transporte publico (metro/bus/rail) con paradas
 * reales cercanas a origen y destino tomadas del feed GTFS de la ciudad.
 */
export async function enrichWithStops(
  option: ModeOption,
  origin: Place,
  destination: Place,
  citySlug: string,
  category: EnrichCategory,
): Promise<ModeOption> {
  const [near, far] = await Promise.all([
    fetchNearbyStops({
      city: citySlug,
      lat: origin.lat,
      lon: origin.lon,
      mode: category,
      radius: 700,
      limit: 3,
    }),
    fetchNearbyStops({
      city: citySlug,
      lat: destination.lat,
      lon: destination.lon,
      mode: category,
      radius: 700,
      limit: 3,
    }),
  ]);

  if (near.stops.length === 0 && far.stops.length === 0) {
    return option;
  }

  const details: ModeDetail[] = [];
  const fromStop = near.stops[0];
  const toStop = far.stops[0];

  if (fromStop) {
    details.push({
      label: `Subir en ${fromStop.name}`,
      value: `${fromStop.distance} m a pie · ${formatLines(fromStop)}`,
    });
  }
  if (toStop) {
    details.push({
      label: `Bajar en ${toStop.name}`,
      value: `${toStop.distance} m destino · ${formatLines(toStop)}`,
    });
  }

  // Acumula lineas comunes a origen+destino (probable directo) o solo origen.
  const fromLines = new Set((fromStop?.routes ?? []).map((r) => r.shortName));
  const toLines = new Set((toStop?.routes ?? []).map((r) => r.shortName));
  const commonLines = [...fromLines].filter((l) => toLines.has(l));

  let hint = option.hint;
  if (commonLines.length > 0) {
    hint = `Probable directo · ${categoryLabel(category)} ${commonLines.slice(0, 3).join(", ")}`;
  } else if (fromLines.size > 0 && toLines.size > 0) {
    hint = `Probable transbordo · ${[...fromLines].slice(0, 2).join(", ")} → ${[...toLines].slice(0, 2).join(", ")}`;
  }

  // El warning de "sin GTFS" deja de aplicar.
  const warnings = (option.warnings ?? []).filter((w) => !/GTFS|datos en vivo/i.test(w));

  return {
    ...option,
    hint,
    warnings,
    details: [...(option.details ?? []), ...details],
    dataSource: `${option.dataSource} + paradas reales (GTFS)`,
  };
}

function formatLines(stop: NearbyStop): string {
  if (stop.routes.length === 0) return "—";
  const lines = stop.routes.slice(0, 4).map((r) => r.shortName);
  const more = stop.routes.length > 4 ? ` +${stop.routes.length - 4}` : "";
  return `Líneas: ${lines.join(", ")}${more}`;
}

function categoryLabel(c: EnrichCategory): string {
  if (c === "metro") return "Línea";
  if (c === "bus") return "Línea";
  if (c === "rail") return "Línea";
  if (c === "tram") return "Tranvía";
  return "Línea";
}
