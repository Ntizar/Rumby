import type { PlannerSnapshot } from "@/lib/domain/types";

const sol = {
  id: "madrid-sol",
  name: "Puerta del Sol",
  lat: 40.4169,
  lon: -3.7035,
  kind: "origin" as const,
};

const airport = {
  id: "madrid-airport-t4",
  name: "Aeropuerto Adolfo Suarez Madrid-Barajas T4",
  lat: 40.4916,
  lon: -3.5937,
  kind: "destination" as const,
};

export const madridSnapshot: PlannerSnapshot = {
  citySlug: "madrid",
  origin: sol,
  destination: airport,
  incidents: [
    {
      id: "inc-1",
      title: "Incidencia urbana en acceso M-30",
      summary: "Afecta tiempos de carretera hacia el este de Madrid.",
      severity: "medium",
      sourceId: "madrid-traffic-incidents",
      lat: 40.4212,
      lon: -3.6652,
      modes: ["car", "taxi", "moto", "bus"],
    },
    {
      id: "inc-2",
      title: "Contexto DGT en acceso aeroportuario",
      summary: "Riesgo moderado de retencion hacia los accesos del aeropuerto.",
      severity: "low",
      sourceId: "dgt-datex2-incidents",
      lat: 40.4689,
      lon: -3.6111,
      modes: ["car", "taxi", "bus"],
    },
  ],
  alternatives: [
    {
      id: "itinerary-1",
      title: "Opcion recomendada",
      departAt: "2026-04-24T08:15:00+02:00",
      arriveAt: "2026-04-24T08:54:00+02:00",
      durationMinutes: 39,
      reliabilityScore: 88,
      walkingMinutes: 8,
      transfers: 1,
      decisionWhy: "Reduce dependencia de trafico y mantiene mejor resiliencia ante incidencias urbanas.",
      incidents: [],
      legs: [
        {
          id: "leg-1",
          mode: "walk",
          from: sol,
          to: {
            id: "stop-sevilla",
            name: "Sevilla",
            lat: 40.4187,
            lon: -3.6995,
            kind: "stop",
          },
          durationMinutes: 6,
        },
        {
          id: "leg-2",
          mode: "bus",
          from: {
            id: "stop-sevilla",
            name: "Sevilla",
            lat: 40.4187,
            lon: -3.6995,
            kind: "stop",
          },
          to: {
            id: "interchange-avenida-america",
            name: "Avenida de America",
            lat: 40.438,
            lon: -3.6762,
            kind: "stop",
          },
          durationMinutes: 16,
          operator: "EMT Madrid",
          lineName: "Exprs. Aero",
          notes: "Tramo fuerte del MVP por disponibilidad EMT y lectura de estado.",
        },
        {
          id: "leg-3",
          mode: "walk",
          from: {
            id: "interchange-avenida-america",
            name: "Avenida de America",
            lat: 40.438,
            lon: -3.6762,
            kind: "stop",
          },
          to: airport,
          durationMinutes: 17,
          notes: "Placeholder del ultimo tramo hasta integrar motor multimodal real.",
        },
      ],
    },
    {
      id: "itinerary-2",
      title: "Taxi mas directo",
      departAt: "2026-04-24T08:15:00+02:00",
      arriveAt: "2026-04-24T08:49:00+02:00",
      durationMinutes: 34,
      reliabilityScore: 62,
      walkingMinutes: 1,
      transfers: 0,
      decisionWhy: "Es mas directo, pero sensible a incidencias de carretera y picos de demanda.",
      incidents: [
        {
          id: "inc-1",
          title: "Incidencia urbana en acceso M-30",
          summary: "Afecta tiempos de carretera hacia el este de Madrid.",
          severity: "medium",
          sourceId: "madrid-traffic-incidents",
          lat: 40.4212,
          lon: -3.6652,
          modes: ["car", "taxi", "moto", "bus"],
        },
      ],
      legs: [
        {
          id: "leg-4",
          mode: "taxi",
          from: sol,
          to: airport,
          durationMinutes: 34,
          operator: "Taxi/VTC",
          notes: "Mejor alternativa cuando el usuario prioriza puerta a puerta.",
        },
      ],
    },
  ],
};
