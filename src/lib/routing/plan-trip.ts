import { allModes } from "@/lib/modes/registry";
import type { ModeContext } from "@/lib/modes/types";
import type { ModeOption, TripIntent } from "@/lib/domain/types";
import { buildActions } from "@/lib/deeplinks";

/**
 * Ejecuta todos los estimadores de modos para un trip y devuelve la lista
 * filtrada (solo modos aplicables) y ordenada por duracion ascendente.
 *
 * Adjunta deep-links a apps reales por modo despues de calcular.
 */
export async function planTrip(
  trip: TripIntent,
  ctx: ModeContext,
  allowedModeIds?: string[],
): Promise<ModeOption[]> {
  const modes = allowedModeIds
    ? allModes.filter((m) => allowedModeIds.includes(m.id))
    : allModes;

  const results = await Promise.all(modes.map((m) => m.estimate(trip, ctx)));

  return results
    .filter((option): option is ModeOption => option !== null)
    .map((option) => ({
      ...option,
      actions: buildActions(option.mode, trip.origin, trip.destination, ctx.citySlug),
    }))
    .sort((a, b) => a.durationMin - b.durationMin);
}
