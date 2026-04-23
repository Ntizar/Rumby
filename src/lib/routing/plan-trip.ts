import { allModes } from "@/lib/modes/registry";
import type { ModeContext } from "@/lib/modes/types";
import type { ModeOption, TripIntent } from "@/lib/domain/types";

/**
 * Ejecuta todos los estimadores de modos para un trip y devuelve la lista
 * filtrada (solo modos aplicables) y ordenada por duracion ascendente.
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
    .sort((a, b) => a.durationMin - b.durationMin);
}
