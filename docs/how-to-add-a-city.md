# How To Add A City

## Goal

Anadir una ciudad nueva sin acoplarla a Madrid ni romper el producto base.

## Steps

1. crea un archivo nuevo en `src/lib/catalog/cities/`
2. exporta una `CityDefinition`
3. anadela al catalogo en `src/lib/catalog/index.ts`
4. documenta las fuentes oficiales de la ciudad en `docs/`
5. clasifica cada fuente como `ready`, `research` o `planned`

## Minimum checklist

- nombre de la ciudad
- pais
- resumen corto
- modos iniciales
- prioridades de producto
- lista de fuentes con url, formato, auth y nota de uso

## Rules

- no mezcles feeds no verificados con feeds listos para MVP
- no metas claves ni secretos en el repo
- no copies conectores de otra ciudad si el contrato del proveedor cambia
- deja clara la licencia y la atribucion requerida cuando exista

## When a city is ready for MVP

Una ciudad esta lista para MVP cuando tiene como minimo:

- una fuente estatica de transporte fiable
- una fuente de contexto o incidencia util
- una historia de producto clara sobre por que esa ciudad merece ser la siguiente
