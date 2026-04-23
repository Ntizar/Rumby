# Rumby · Arquitectura v1

Rumby es un comparador multimodal honesto. Para un origen y un destino reales,
muestra **todas las formas plausibles de llegar** con tiempo, coste y nivel de
confianza por cada modo. Lo que no es real, va etiquetado como `estimado`.

## Capas

```
src/
  app/                         Next.js (export estatico, GitHub Pages)
  components/
    map/                       Mapa MapLibre (fondo a pantalla completa)
    planner/                   UI mobile-first del planner (search + sheet)
  lib/
    domain/                    Tipos puros: Place, TripIntent, ModeOption, ...
    geocode/                   Geocoder + hook de busqueda (Nominatim por ahora)
    connectors/                Adaptadores a fuentes externas (GBFS, EMT, ...)
    modes/                     Un archivo por modo de transporte
    routing/                   Compone los modos en una lista comparable
    catalog/                   Definicion de ciudades soportadas
```

## Pieza central: el "modo"

Cada modo de transporte vive aislado en `src/lib/modes/<id>.ts` y solo expone:

```ts
export const xMode: ModeEstimator = {
  id: "x",
  estimate(trip, ctx) { ... return ModeOption | null }
};
```

`null` significa "este modo no aplica para este viaje". La UI no lo pinta.

`ModeOption` siempre incluye:

- `durationMin`, `costEur`, `distanceKm`, `co2Grams`
- `confidence`: `real` (motor o API en vivo), `estimated` (heuristica) o `unavailable`
- `dataSource`: explica de donde sale el dato
- `warnings?`: avisos honestos al usuario

## Pieza central: el "conector"

Los conectores viven en `src/lib/connectors/<city>/<source>.ts` y abstraen
una fuente externa concreta (BiciMAD GBFS, EMT MobilityLabs, DGT DATEX II,
etc.). Tienen `fetch` + cache propio y devuelven datos normalizados que
los modos consumen.

Los conectores fallan silenciosamente: si una fuente no responde, devuelven
`null` y el modo cae a su estimacion. La app nunca se rompe por una API caida.

## Compose

`lib/routing/plan-trip.ts` corre todos los modos en paralelo, descarta los que
devuelven `null` y los ordena por duracion. Esa lista alimenta el bottom sheet.

## Por que es facil hacerlo crecer

- **Anadir un modo** -> archivo nuevo en `lib/modes/` + 1 linea en `registry.ts`.
- **Anadir una API real** -> archivo nuevo en `lib/connectors/<city>/` y
  consumirlo desde el modo correspondiente.
- **Anadir una ciudad** -> archivo nuevo en `lib/catalog/cities/<slug>.ts` y un
  `<slug>-planner.tsx` que reuse `MadridPlanner` como referencia.

La UI no se toca al anadir conectores: solo cambia `confidence` y `dataSource`.
