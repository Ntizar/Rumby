import type { ModeOption, TripIntent } from "@/lib/domain/types";

export type ModeContext = {
  /** Slug de ciudad activo, p.ej. "madrid". */
  citySlug: string;
};

export type ModeEstimator = {
  id: string;
  estimate: (trip: TripIntent, ctx: ModeContext) => Promise<ModeOption | null>;
};
