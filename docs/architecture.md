# Architecture

## Goal

Construir una plataforma de movilidad multimodal que pueda crecer por ciudades, operadores y tipos de datos sin acoplar el producto a un feed concreto.

## Layers

1. `web app`
2. `domain model`
3. `connectors`
4. `routing and scoring`
5. `assistant layer`

## Recommended flow

```text
user intent
  -> location resolution
  -> planner request (depart at / arrive by)
  -> route engine
  -> realtime enrichment
  -> incident enrichment
  -> itinerary scoring
  -> explanation layer
  -> presentation
```

## Domain entities

Las primeras entidades candidatas son:

- `Place`
- `Stop`
- `Station`
- `Route`
- `Trip`
- `Vehicle`
- `Incident`
- `Availability`
- `Itinerary`
- `Leg`

## Connector contract

Cada fuente externa deberia implementarse detras de un contrato comun.

```ts
type Connector = {
  id: string;
  city: string;
  category: "transit-static" | "transit-realtime" | "traffic" | "bike" | "parking" | "taxi" | "other";
  fetch: () => Promise<unknown>;
  normalize: (input: unknown) => Promise<unknown>;
};
```

## Current bootstrap modules

- `src/lib/domain/types.ts`: entidades base del planner
- `src/lib/domain/madrid-snapshot.ts`: snapshot tipado para demos y UI inicial
- `src/lib/connectors/madrid/emt.ts`: conector base EMT
- `src/lib/connectors/madrid/incidents.ts`: conectores base de incidencias Madrid y DGT
- `src/components/map/madrid-map.tsx`: mapa real con MapLibre

## Recommended routing strategy

- `OpenTripPlanner` como primera opcion para planner multimodal con GTFS y GTFS-RT
- `OSM` como base geoespacial
- `MapLibre` para la experiencia de mapa web
- `DATEX II` y feeds municipales como enriquecimiento operacional

## AI boundaries

La IA puede:

- explicar incidencias
- resumir tradeoffs
- comparar itinerarios
- recomendar acciones sobre datos ya calculados

La IA no debe:

- inventar rutas base
- ser la fuente primaria de estado de red
- sustituir la normalizacion de conectores
