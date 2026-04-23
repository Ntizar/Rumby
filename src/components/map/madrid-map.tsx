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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Init una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-3.7035, 40.4169],
      zoom: 11.6,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Reaccionar a cambios de origin/destination sin recrear el mapa.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (origin) {
      const m = new maplibregl.Marker({ color: "#2563eb", scale: 0.95 })
        .setLngLat([origin.lon, origin.lat])
        .addTo(map);
      markersRef.current.push(m);
    }

    if (destination) {
      const m = new maplibregl.Marker({ color: "#f97316", scale: 0.95 })
        .setLngLat([destination.lon, destination.lat])
        .addTo(map);
      markersRef.current.push(m);
    }

    if (origin && destination) {
      const bounds = new maplibregl.LngLatBounds(
        [origin.lon, origin.lat],
        [destination.lon, destination.lat],
      );
      map.fitBounds(bounds, { padding: { top: 220, bottom: 320, left: 40, right: 40 }, maxZoom: 13.5, duration: 600 });
    } else if (origin) {
      map.flyTo({ center: [origin.lon, origin.lat], zoom: 13.5, duration: 600 });
    } else if (destination) {
      map.flyTo({ center: [destination.lon, destination.lat], zoom: 13.5, duration: 600 });
    }
  }, [origin, destination]);

  return <div ref={containerRef} className="rumby-map-layer" aria-label="Mapa de Madrid" />;
}
