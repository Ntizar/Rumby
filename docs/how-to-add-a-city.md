# Como anadir una ciudad

Rumby empieza por Madrid pero la arquitectura ya esta lista para crecer.

## 1. Define la ciudad

`src/lib/catalog/cities/<slug>.ts` con bbox, centro y modos activos.

## 2. Geocoder

Si reutilizas Nominatim, copia el patron de `madrid` y cambia el `viewbox`
para acotar al area de la ciudad nueva. Si la ciudad tiene un geocoder
oficial mejor (p.ej. CartoBCN), crea un conector aparte y un nuevo
`searchPlaces<X>` paralelo a `searchPlacesMadrid`.

## 3. Conectores de movilidad

Anade los conectores reales que existan para esa ciudad bajo
`src/lib/connectors/<slug>/`. Cada modo decidira si los usa.

## 4. Modos especificos

La mayoria de los modos (caminar, bici, taxi, coche, scooter, moto) son
genericos y reutilizables. Si una ciudad tiene un modo unico (vaporetto,
funicular, etc.), crea `src/lib/modes/<modo>.ts` y registralo en `registry.ts`.

## 5. UI

Reusa `MadridPlanner` como referencia. La UI es agnostica: solo necesita un
`citySlug` y un geocoder. La proxima evolucion natural es extraer un
`<CityPlanner city="..." />` configurable.
