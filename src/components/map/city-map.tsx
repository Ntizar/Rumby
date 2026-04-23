"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Place } from "@/lib/domain/types";

type CityMapProps = {
  origin: Place | null;
  destination: Place | null;
  /** Centro inicial [lon, lat]. */
  center: [number, number];
  zoom: number;
};

export function CityMap({ origin, destination, center, zoom }: CityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center,
      zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
    // Init solo una vez. Cambios de center/zoom se aplican abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambio de ciudad -> mover camara.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!origin && !destination) {
      map.flyTo({ center, zoom, duration: 700 });
    }
  }, [center, zoom, origin, destination]);

  // Marcadores y encuadre.
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
      map.fitBounds(bounds, {
        padding: { top: 240, bottom: 360, left: 40, right: 40 },
        maxZoom: 14,
        duration: 700,
      });
    } else if (origin) {
      map.flyTo({ center: [origin.lon, origin.lat], zoom: 14, duration: 600 });
    } else if (destination) {
      map.flyTo({ center: [destination.lon, destination.lat], zoom: 14, duration: 600 });
    }
  }, [origin, destination]);

  return <div ref={containerRef} className="rumby-map-layer" aria-label="Mapa" />;
}
