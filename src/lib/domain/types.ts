// Tipos puros del dominio Rumby. No dependen de UI ni de proveedores.

export type TransportMode =
  | "walk"
  | "bike"
  | "scooter"
  | "moto"
  | "taxi"
  | "metro"
  | "bus"
  | "rail"
  | "car";

export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Etiqueta corta para UI (barrio, ciudad, "Estacion", etc.). */
  context?: string;
  kind?: "origin" | "destination" | "stop" | "poi" | "address";
};

export type TripIntent = {
  origin: Place;
  destination: Place;
  /** ISO datetime local. */
  when: string;
  /** "depart": salgo a esa hora. "arrive": quiero llegar antes. */
  whenKind: "depart" | "arrive";
};

export type Confidence = "real" | "estimated" | "unavailable";

export type ModeOption = {
  mode: TransportMode;
  /** Etiqueta humana corta ("Metro", "Taxi", "BiciMAD"). */
  label: string;
  /** Emoji representativo del modo. */
  emoji: string;
  /** Minutos puerta-a-puerta. */
  durationMin: number;
  /** Coste estimado en EUR (puerta-a-puerta). null = no aplica / no calculable. */
  costEur: number | null;
  /** Distancia total estimada en km. */
  distanceKm: number;
  /** Co2 estimado en gramos. null si no aplica. */
  co2Grams: number | null;
  /** "real" cuando viene de un motor de rutas o API en vivo. */
  confidence: Confidence;
  /** Fuente/origen del dato ("estimacion haversine", "BiciMAD API", etc.). */
  dataSource: string;
  /** Frase corta para usuario ("Rapido pero caro", "Mas barato"). */
  hint?: string;
  /** Avisos honestos ("Sin datos en vivo", "Requiere abono"). */
  warnings?: string[];
  /** Detalles desplegables (paradas, lineas, links). */
  details?: ModeDetail[];
};

export type ModeDetail = {
  label: string;
  value: string;
};

export type IncidentSeverity = "low" | "medium" | "high";

export type Incident = {
  id: string;
  title: string;
  summary: string;
  severity: IncidentSeverity;
  source: string;
  modes: TransportMode[];
  lat?: number;
  lon?: number;
};
