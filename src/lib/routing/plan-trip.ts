import { allModes } from "@/lib/modes/registry";
import type { ModeContext } from "@/lib/modes/types";
import type { ModeOption, TripIntent } from "@/lib/domain/types";
import { buildActions } from "@/lib/deeplinks";
import { enrichWithStops } from "@/lib/gtfs/enrich";

const TRANSIT_CATEGORY: Partial<Record<string, "metro" | "bus" | "rail" | "tram">> = {
  metro: "metro",
  bus: "bus",
  rail: "rail",
};

/**
 * Ejecuta todos los estimadores de modos para un trip y devuelve la lista
 * filtrada (solo modos aplicables) y ordenada por duracion ascendente.
 *
 * Adjunta deep-links a apps reales por modo y, para modos de transporte
 * publico, intenta enriquecer con paradas reales del feed GTFS de la ciudad.
 */
export async function planTrip(
  trip: TripIntent,
  ctx: ModeContext,
  allowedModeIds?: string[],
): Promise<ModeOption[]> {
  const modes = allowedModeIds
    ? allModes.filter((m) => allowedModeIds.includes(m.id))
    : allModes;

  const estimates = await Promise.all(modes.map((m) => m.estimate(trip, ctx)));
  const valid = estimates.filter((option): option is ModeOption => option !== null);

  // Enriquecer modos de transporte publico con GTFS en paralelo. Falla limpio.
  const enriched = await Promise.all(
    valid.map(async (option) => {
      const cat = TRANSIT_CATEGORY[option.mode];
      if (!cat) return option;
      try {
        return await enrichWithStops(option, trip.origin, trip.destination, ctx.citySlug, cat);
      } catch {
        return option;
      }
    }),
  );

  return enriched
    .map((option) => ({
      ...option,
      actions: buildActions(option.mode, trip.origin, trip.destination, ctx.citySlug),
    }))
    .sort((a, b) => a.durationMin - b.durationMin);
}
