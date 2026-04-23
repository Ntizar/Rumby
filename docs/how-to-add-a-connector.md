# Como anadir un conector real

Un "conector" es un adaptador a una fuente externa (API publica, GBFS, GTFS,
DATEX II, etc.). Esta guia describe el patron que ya usan BiciMAD y Nominatim.

## 1. Crea el archivo

`src/lib/connectors/<city>/<source>.ts`

```ts
let cache: { ts: number; data: T } | null = null;
const TTL_MS = 60_000;

export async function fetchX(): Promise<T | null> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;
  try {
    const res = await fetch("https://...");
    if (!res.ok) return null;
    const data = await res.json();
    cache = { ts: Date.now(), data: normalize(data) };
    return cache.data;
  } catch {
    return null;
  }
}
```

Reglas:

- Cache en memoria con TTL razonable (30s-5min).
- Devuelve `null` si la fuente falla. **Nunca lances**.
- Normaliza al tipo del dominio antes de cachear.

## 2. Conectalo a un modo

Edita `src/lib/modes/<modo>.ts` para llamar al conector y subir
`confidence` a `"real"` cuando los datos lo permitan:

```ts
const data = await fetchX();
let confidence: ModeOption["confidence"] = "estimated";
if (data && condicionRealCubierta(data, trip)) {
  confidence = "real";
  dataSource = "Nombre real de la fuente";
}
```

## 3. CORS y secretos

- Si la fuente bloquea por CORS desde el navegador y la app es estatica, no
  podras consumirla sin proxy. Documentalo en el conector y deja la
  estimacion como fallback hasta que haya backend.
- Si la fuente requiere clave (API key), **no la metas en el cliente**. Anade
  el conector, pero deja un TODO claro hasta que exista backend.

## 4. UI

No hace falta tocar UI. La etiqueta cambia automaticamente a "en vivo" cuando
`confidence === "real"`. Los avisos del conector se muestran como warnings.
