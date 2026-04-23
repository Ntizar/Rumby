import type { ModeEstimator } from "@/lib/modes/types";
import { walkMode } from "@/lib/modes/walk";
import { bikeMode } from "@/lib/modes/bike";
import { scooterMode } from "@/lib/modes/scooter";
import { motoMode } from "@/lib/modes/moto";
import { taxiMode } from "@/lib/modes/taxi";
import { metroMode } from "@/lib/modes/metro";
import { busMode } from "@/lib/modes/bus";
import { railMode } from "@/lib/modes/rail";
import { carMode } from "@/lib/modes/car";

/**
 * Lista plana de todos los modos soportados por la app.
 * Para anadir un modo nuevo: crea un archivo en `lib/modes/<id>.ts`,
 * exporta un `ModeEstimator` y registralo aqui.
 */
export const allModes: ModeEstimator[] = [
  walkMode,
  bikeMode,
  scooterMode,
  motoMode,
  taxiMode,
  metroMode,
  busMode,
  railMode,
  carMode,
];

export const modesById = new Map(allModes.map((m) => [m.id, m]));
