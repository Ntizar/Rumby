"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Place } from "@/lib/domain/types";

type MadridMapProps = {
  origin: Place | null;
  destination: Place | null;
};

export function MadridMap({ origin, destination }: MadridMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-3.7035, 40.4169],
      zoom: 11.6,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    const makeMarker = (color: string, place: Place, label: string) => {
      const popup = new maplibregl.Popup({ offset: 18 }).setHTML(
        `<strong>${label}</strong><br>${place.name}`,
      );

      new maplibregl.Marker({ color, scale: 1.05 })
        .setLngLat([place.lon, place.lat])
        .setPopup(popup)
        .addTo(map);
    };

    if (origin) {
      makeMarker("#2563eb", origin, "Origen");
    }

    if (destination) {
      makeMarker("#f97316", destination, "Destino");
    }

    if (origin && destination) {
      const bounds = new maplibregl.LngLatBounds(
        [origin.lon, origin.lat],
        [destination.lon, destination.lat],
      );

      map.fitBounds(bounds, {
        padding: 64,
        maxZoom: 12.5,
      });
    } else if (origin) {
      map.setCenter([origin.lon, origin.lat]);
      map.setZoom(12.5);
    } else if (destination) {
      map.setCenter([destination.lon, destination.lat]);
      map.setZoom(12.5);
    }

    return () => {
      map.remove();
    };
  }, [destination, origin]);

  return <div ref={mapRef} className="rumby-map-canvas" aria-label="Mapa multimodal de Madrid" />;
}
