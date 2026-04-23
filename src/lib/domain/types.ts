export type TransportMode =
  | "walk"
  | "bus"
  | "metro"
  | "rail"
  | "bike"
  | "moto"
  | "taxi"
  | "car"
  | "parking";

export type Place = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: "origin" | "destination" | "stop" | "poi";
};

export type IncidentSeverity = "low" | "medium" | "high";

export type Incident = {
  id: string;
  title: string;
  summary: string;
  severity: IncidentSeverity;
  sourceId: string;
  lat: number;
  lon: number;
  modes: TransportMode[];
};

export type Leg = {
  id: string;
  mode: TransportMode;
  from: Place;
  to: Place;
  durationMinutes: number;
  operator?: string;
  lineName?: string;
  notes?: string;
};

export type Itinerary = {
  id: string;
  title: string;
  departAt: string;
  arriveAt: string;
  durationMinutes: number;
  reliabilityScore: number;
  walkingMinutes: number;
  transfers: number;
  decisionWhy: string;
  legs: Leg[];
  incidents: Incident[];
};

export type PlannerSnapshot = {
  citySlug: string;
  origin: Place;
  destination: Place;
  alternatives: Itinerary[];
  incidents: Incident[];
};
