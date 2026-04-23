import type { ModeAction, Place, TransportMode } from "@/lib/domain/types";

/**
 * Genera deep-links a apps reales para cada modo.
 *
 * Reglas:
 * - URLs universales (web). En movil, el sistema operativo abre la app si esta instalada.
 * - Sin afiliacion ni tracking.
 * - Operadores priorizados como "primary"; mapas/agregadores como "secondary".
 */

export function buildActions(
  mode: TransportMode,
  origin: Place,
  destination: Place,
  citySlug: string,
): ModeAction[] {
  const o = `${origin.lat},${origin.lon}`;
  const d = `${destination.lat},${destination.lon}`;
  const oName = encodeURIComponent(origin.name);
  const dName = encodeURIComponent(destination.name);

  const gmaps = (travelmode: string): ModeAction => ({
    label: "Google Maps",
    icon: "🗺️",
    url: `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${travelmode}`,
    kind: "secondary",
  });

  const amaps = (mode: "w" | "d" | "r"): ModeAction => ({
    label: "Apple Maps",
    icon: "🍎",
    url: `https://maps.apple.com/?saddr=${o}&daddr=${d}&dirflg=${mode}`,
    kind: "secondary",
  });

  const citymapper: ModeAction = {
    label: "Citymapper",
    icon: "🚇",
    url: `https://citymapper.com/directions?startcoord=${o}&endcoord=${d}&startname=${oName}&endname=${dName}`,
    kind: "secondary",
  };

  switch (mode) {
    case "walk":
      return [gmaps("walking"), amaps("w")];

    case "bike":
      return [
        ...bikeShareActions(citySlug),
        gmaps("bicycling"),
      ];

    case "scooter":
      return [
        { label: "Lime", icon: "🛴", url: "https://www.li.me/", kind: "primary" },
        { label: "Dott", icon: "🛴", url: "https://ridedott.com/", kind: "primary" },
        { label: "Voi", icon: "🛴", url: "https://www.voi.com/", kind: "primary" },
        gmaps("bicycling"),
      ];

    case "moto":
      return [
        { label: "Cooltra", icon: "🛵", url: "https://cooltra.com/es/", kind: "primary" },
        { label: "Acciona", icon: "🛵", url: "https://www.acciona.com/movilidad/", kind: "primary" },
        gmaps("driving"),
      ];

    case "taxi":
      return [
        {
          label: "Cabify",
          icon: "🚕",
          url: `https://cabify.com/es/madrid?ll=${d}`,
          kind: "primary",
        },
        {
          label: "Free Now",
          icon: "🚖",
          url: `https://free-now.com/es/`,
          kind: "primary",
        },
        {
          label: "Uber",
          icon: "🚗",
          url: `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${origin.lat}&pickup[longitude]=${origin.lon}&dropoff[latitude]=${destination.lat}&dropoff[longitude]=${destination.lon}`,
          kind: "primary",
        },
        {
          label: "Bolt",
          icon: "⚡",
          url: `https://bolt.eu/`,
          kind: "primary",
        },
      ];

    case "metro":
      return [
        ...metroOperatorActions(citySlug),
        citymapper,
        gmaps("transit"),
      ];

    case "bus":
      return [
        ...busOperatorActions(citySlug),
        citymapper,
        gmaps("transit"),
      ];

    case "rail":
      return [
        {
          label: "Renfe Cercanías",
          icon: "🚆",
          url: "https://www.renfe.com/es/es/cercanias",
          kind: "primary",
        },
        citymapper,
        gmaps("transit"),
      ];

    case "car":
      return [gmaps("driving"), amaps("d")];
  }
}

function bikeShareActions(citySlug: string): ModeAction[] {
  switch (citySlug) {
    case "madrid":
      return [
        { label: "BiciMAD", icon: "🚲", url: "https://www.bicimad.com/", kind: "primary" },
      ];
    case "barcelona":
      return [
        { label: "Bicing", icon: "🚲", url: "https://www.bicing.barcelona/", kind: "primary" },
      ];
    case "valencia":
      return [
        { label: "Valenbisi", icon: "🚲", url: "https://www.valenbisi.es/", kind: "primary" },
      ];
    case "sevilla":
      return [
        { label: "Sevici", icon: "🚲", url: "https://www.sevici.es/", kind: "primary" },
      ];
    default:
      return [];
  }
}

function metroOperatorActions(citySlug: string): ModeAction[] {
  switch (citySlug) {
    case "madrid":
      return [
        {
          label: "Metro Madrid",
          icon: "Ⓜ️",
          url: "https://www.metromadrid.es/",
          kind: "primary",
        },
      ];
    case "barcelona":
      return [
        { label: "TMB", icon: "Ⓜ️", url: "https://www.tmb.cat/", kind: "primary" },
      ];
    case "valencia":
      return [
        {
          label: "Metrovalencia",
          icon: "Ⓜ️",
          url: "https://www.metrovalencia.es/",
          kind: "primary",
        },
      ];
    case "bilbao":
      return [
        {
          label: "Metro Bilbao",
          icon: "Ⓜ️",
          url: "https://www.metrobilbao.eus/",
          kind: "primary",
        },
      ];
    default:
      return [];
  }
}

function busOperatorActions(citySlug: string): ModeAction[] {
  switch (citySlug) {
    case "madrid":
      return [
        { label: "EMT Madrid", icon: "🚌", url: "https://www.emtmadrid.es/", kind: "primary" },
      ];
    case "barcelona":
      return [
        { label: "TMB", icon: "🚌", url: "https://www.tmb.cat/", kind: "primary" },
      ];
    case "valencia":
      return [
        { label: "EMT Valencia", icon: "🚌", url: "https://www.emtvalencia.es/", kind: "primary" },
      ];
    case "sevilla":
      return [
        { label: "Tussam", icon: "🚌", url: "https://www.tussam.es/", kind: "primary" },
      ];
    case "bilbao":
      return [
        { label: "Bilbobus", icon: "🚌", url: "https://www.bilbao.eus/bilbobus/", kind: "primary" },
      ];
    default:
      return [];
  }
}
