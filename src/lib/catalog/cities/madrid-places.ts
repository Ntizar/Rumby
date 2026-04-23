import type { Place } from "@/lib/domain/types";

export const madridPlaces: Place[] = [
  { id: "sol", name: "Puerta del Sol", lat: 40.4169, lon: -3.7035, kind: "poi" },
  { id: "atocha", name: "Atocha", lat: 40.4066, lon: -3.689, kind: "poi" },
  { id: "chamartin", name: "Chamartin", lat: 40.4722, lon: -3.6826, kind: "poi" },
  { id: "nuevos-ministerios", name: "Nuevos Ministerios", lat: 40.4462, lon: -3.6924, kind: "poi" },
  { id: "plaza-castilla", name: "Plaza de Castilla", lat: 40.4667, lon: -3.6892, kind: "poi" },
  { id: "moncloa", name: "Moncloa", lat: 40.4342, lon: -3.7194, kind: "poi" },
  {
    id: "aeropuerto-t4",
    name: "Aeropuerto Adolfo Suarez Madrid-Barajas T4",
    lat: 40.4916,
    lon: -3.5937,
    kind: "poi",
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function resolveMadridPlace(query: string) {
  const normalized = normalizeText(query);

  if (!normalized) {
    return null;
  }

  return madridPlaces.find((place) => normalizeText(place.name) === normalized) ?? null;
}
