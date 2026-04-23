/**
 * Definicion minima de ciudad para Rumby.
 *
 * - `viewbox`: caja para acotar geocoding (Nominatim format: left,top,right,bottom).
 * - `center` y `zoom`: vista inicial del mapa.
 * - `connectors`: ids de conectores reales activos para esa ciudad.
 */
export type CityProfile = {
  slug: string;
  name: string;
  region: string;
  emoji: string;
  center: [number, number]; // lon, lat
  zoom: number;
  viewbox: string; // left,top,right,bottom
  connectors: string[];
};

export const cities: CityProfile[] = [
  {
    slug: "madrid",
    name: "Madrid",
    region: "Comunidad de Madrid",
    emoji: "🟥",
    center: [-3.7035, 40.4169],
    zoom: 11.6,
    viewbox: "-3.9,40.6,-3.5,40.3",
    connectors: ["bicimad-gbfs", "nominatim"],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    region: "Cataluna",
    emoji: "🟦",
    center: [2.1734, 41.3851],
    zoom: 12,
    viewbox: "2.05,41.5,2.3,41.32",
    connectors: ["bicing-gbfs", "nominatim"],
  },
  {
    slug: "valencia",
    name: "Valencia",
    region: "Comunidad Valenciana",
    emoji: "🟧",
    center: [-0.3763, 39.4699],
    zoom: 12,
    viewbox: "-0.45,39.55,-0.3,39.4",
    connectors: ["valenbisi-gbfs", "nominatim"],
  },
  {
    slug: "sevilla",
    name: "Sevilla",
    region: "Andalucia",
    emoji: "🟨",
    center: [-5.9845, 37.3886],
    zoom: 12,
    viewbox: "-6.05,37.45,-5.9,37.32",
    connectors: ["sevici-gbfs", "nominatim"],
  },
  {
    slug: "bilbao",
    name: "Bilbao",
    region: "Pais Vasco",
    emoji: "🟩",
    center: [-2.935, 43.263],
    zoom: 12,
    viewbox: "-3.0,43.32,-2.85,43.22",
    connectors: ["nominatim"],
  },
];

export const citiesBySlug = new Map(cities.map((c) => [c.slug, c]));

export function getCity(slug: string): CityProfile {
  return citiesBySlug.get(slug) ?? cities[0];
}
