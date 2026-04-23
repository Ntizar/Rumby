# Rumby

Rumby es una web de movilidad multimodal pensada para responder bien cuatro preguntas del viajero:

- donde estoy
- a donde quiero ir
- cuando quiero salir
- cuando quiero llegar

Y una quinta, que es la que da valor real al producto:

- que opcion me conviene mas ahora mismo

La idea no es construir otro visor de rutas. La apuesta es crear una plataforma tipo `Flighty` aplicada al transporte urbano y metropolitano: una experiencia que combine planificacion, contexto en tiempo real, incidencias explicadas y una arquitectura abierta para crecer por ciudades y por proveedores.

## Vision

Rumby arranca en **Madrid** porque permite validar una primera capa potente con:

- bus urbano oficial
- bici publica
- incidencias municipales
- incidencias DGT en accesos y contexto regional
- parking y conexiones futuras a taxi, moto sharing y otros operadores

La meta es que Madrid sea la primera ciudad de un sistema replicable. El repo se prepara desde el inicio para que otra persona pueda anadir una ciudad nueva o un proveedor nuevo sin rehacer el core.

## Principios de producto

1. El producto responde primero a la necesidad humana, no al dataset.
2. La multimodalidad se trata como un sistema abierto, no como una lista cerrada de medios.
3. La IA explica y recomienda, pero no sustituye al motor de rutas ni inventa datos.
4. Cada fuente externa entra por un conector modular con contratos claros.
5. El MVP debe resolver un flujo real antes de ampliar cobertura.

## Ambito inicial

- ciudad semilla: `Madrid`
- interfaz inicial: `web-first`
- experiencia visual: `Ntizar Aurora` con tono premium, clara y cinematica inspirada en `Flighty`
- scope MVP:
  - origen y destino
  - salir a una hora o llegar antes de una hora
  - planner multimodal base
  - capas de incidencias y contexto
  - estructura lista para micromovilidad y asistentes IA

## Fuentes iniciales de Madrid

Las fuentes priorizadas actualmente son estas:

| Fuente | Tipo | Estado | Uso inicial |
| --- | --- | --- | --- |
| `GTFS EMT Madrid` | transit static | ready | base para rutas EMT |
| `EMT MobilityLabs API` | transit realtime | ready | tiempos reales y datos EMT |
| `BiciMAD stations` | bike sharing | ready | first/last mile y disponibilidad de red |
| `Aparcamientos EMT` | parking | ready | park and ride y contexto coche + transporte |
| `Incidencias Ayuntamiento de Madrid` | traffic incidents | ready | afectaciones urbanas y M-30 |
| `DGT DATEX II incidents` | regional traffic | ready | accesos a Madrid y contexto regional |
| `CRTM open data` | regional transit | research | expansion a red regional |
| `Taxi / moto sharing / otros` | extended mobility | planned | conectores posteriores |

Notas importantes:

- No se ha cerrado aun una fuente oficial reutilizable de alta confianza para `Metro de Madrid` o `Cercanias Madrid` dentro de este primer arranque.
- La API externa del NAP y otros credenciales se trataran como integraciones configurables, no embebidas en el repo.
- No se deben versionar claves, tokens ni secretos.

## Arquitectura recomendada

La arquitectura objetivo es modular y orientada a conectores.

### Capas

1. `app web`
2. `domain core`
3. `connectors`
4. `routing and scoring`
5. `assistant layer`

### Flujo conceptual

```text
User intent
  -> geocoding / location context
  -> trip request (depart / arrive by)
  -> routing engine
  -> realtime enrichers
  -> incident enrichers
  -> scoring and explanation
  -> UI recommendation
```

### Contrato de conectores

Cada fuente deberia entrar por un contrato parecido a este:

```ts
type Connector = {
  id: string;
  city: string;
  category: "transit-static" | "transit-realtime" | "traffic" | "bike" | "parking" | "taxi" | "other";
  fetch: () => Promise<unknown>;
  normalize: (input: unknown) => Promise<unknown>;
};
```

La regla clave es esta:

- la app nunca depende directamente del shape crudo de una API externa
- todo pasa por una capa de normalizacion

## Estructura actual del repo

```text
docs/
  architecture.md
  how-to-add-a-city.md
  madrid-data-sources.md
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    planner/page.tsx
  components/
    map/madrid-map.tsx
  lib/
    catalog/
    connectors/
    domain/
```

Esto ya deja una base mas real. Aun falta anadir:

- motor de rutas
- pantallas de planner
- estrategia de caching e ingesta

## Diseno

La guia visual para este proyecto es:

- identidad base: `Ntizar Aurora`
- tono de experiencia: `Flighty`

Eso significa:

- superficies premium, limpias y orientadas a decision
- foco en lectura rapida de estado y riesgo
- composicion clara sobre fondo atmosferico
- no convertir Aurora en una capa decorativa sin informacion

Regla importante:

- si mas adelante se integra `ntizar.css` completo o sus packs, debe hacerse respetando la regla del control plane: usar Aurora como sistema o como tokens segun el contexto, no por copia indiscriminada

## Como arrancar

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Publicacion en GitHub Pages

El proyecto ya esta preparado para `static export`:

- `output: "export"`
- `trailingSlash: true`
- `basePath` y `assetPrefix` ajustados automaticamente cuando corre en GitHub Actions

Para publicar en Pages faltan solo:

1. crear el repo remoto en GitHub
2. hacer push
3. anadir el workflow de deploy
4. activar Pages sobre GitHub Actions

## Como contribuir

Si quieres anadir una ciudad nueva:

1. crea una entrada en `src/lib/cities.ts`
2. documenta las fuentes oficiales y su estado real
3. separa lo `ready`, `research` y `planned`
4. no acoples la ciudad nueva a decisiones especificas de Madrid
5. documenta restricciones de licencia, auth y cobertura

Si quieres anadir una fuente nueva:

1. identifica si es estatica, realtime o contextual
2. documenta URL oficial, auth, formato y limites
3. crea su conector aislado
4. normaliza la salida antes de tocar UI o scoring
5. no metas claves en el repo

Si quieres trabajar en IA:

1. parte de datos ya calculados por el sistema
2. usa la IA para explicar, comparar o recomendar
3. no la uses como fuente primaria de rutas o incidencias
4. deja claro que modelo y prompts estan en capa opcional

## Siguientes hitos recomendados

1. integrar mapa con `MapLibre`
2. definir el modelo de dominio (`Place`, `Stop`, `Leg`, `Itinerary`, `Incident`)
3. introducir el primer conector real de EMT y otro de incidencias Madrid
4. evaluar `OpenTripPlanner` como motor base de rutas multimodales
5. preparar ingesta incremental y cacheo por fuente

## Licencias y datos

Antes de integrar cualquier fuente nueva, revisar siempre:

- licencia de reutilizacion
- necesidad de atribucion
- restricciones comerciales
- limites de peticion
- permisos de cache o redistribucion

## Estado actual

Estado: `bootstrap`

El repo ya deja listo:

- proyecto real `Rumby` separado del control plane
- base web con Next.js
- primera homepage de vision
- catalogo inicial de Madrid
- README preparado para crecer por ciudades y conectores
