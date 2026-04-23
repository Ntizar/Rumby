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
  /** Geometria GeoJSON LineString [lon,lat][] para dibujar la ruta seleccionada. */
  routeGeometry: [number, number][] | null;
  /** Click en el mapa: el padre decide si lo asigna a origen o destino. */
  onMapClick: (lngLat: { lng: number; lat: number }) => void;
  /** Drag de pin terminado: el padre reverse-geocodea. */
  onPinDragEnd: (which: "origin" | "destination", lngLat: { lng: number; lat: number }) => void;
  /** Click en boton flotante "centrar en mi". */
  onLocateMe: () => void;
};

const ROUTE_SOURCE = "rumby-route";
const ROUTE_LAYER = "rumby-route-line";

export function CityMap({
  origin,
  destination,
  center,
  zoom,
  routeGeometry,
  onMapClick,
  onPinDragEnd,
  onLocateMe,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  // Refs vivos a los callbacks para no re-bindear el listener en cada render.
  const onMapClickRef = useRef(onMapClick);
  const onPinDragEndRef = useRef(onPinDragEnd);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onPinDragEndRef.current = onPinDragEnd;
  }, [onPinDragEnd]);

  // Init unico.
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

    map.on("load", () => {
      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#2563eb",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
    });

    map.on("click", (e) => {
      onMapClickRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mover camara cuando cambia ciudad (sin pines puestos).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!origin && !destination) {
      map.flyTo({ center, zoom, duration: 700 });
    }
  }, [center, zoom, origin, destination]);

  // Marcador origen (azul, draggable).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }
    if (origin) {
      const m = new maplibregl.Marker({ color: "#2563eb", scale: 1, draggable: true })
        .setLngLat([origin.lon, origin.lat])
        .addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        onPinDragEndRef.current("origin", { lng: ll.lng, lat: ll.lat });
      });
      originMarkerRef.current = m;
    }
  }, [origin]);

  // Marcador destino (naranja, draggable).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
    if (destination) {
      const m = new maplibregl.Marker({ color: "#f97316", scale: 1, draggable: true })
        .setLngLat([destination.lon, destination.lat])
        .addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        onPinDragEndRef.current("destination", { lng: ll.lng, lat: ll.lat });
      });
      destMarkerRef.current = m;
    }
  }, [destination]);

  // Encuadre cuando cambian origen/destino.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (origin && destination) {
      const bounds = new maplibregl.LngLatBounds(
        [origin.lon, origin.lat],
        [destination.lon, destination.lat],
      );
      map.fitBounds(bounds, {
        padding: { top: 280, bottom: 360, left: 40, right: 40 },
        maxZoom: 14,
        duration: 700,
      });
    } else if (origin) {
      map.flyTo({ center: [origin.lon, origin.lat], zoom: 14, duration: 600 });
    } else if (destination) {
      map.flyTo({ center: [destination.lon, destination.lat], zoom: 14, duration: 600 });
    }
  }, [origin, destination]);

  // Dibujar geometria de la ruta seleccionada.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const src = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeGeometry ?? [],
        },
      });
    };

    if (map.isStyleLoaded() && map.getSource(ROUTE_SOURCE)) {
      update();
    } else {
      map.once("load", update);
    }
  }, [routeGeometry]);

  return (
    <>
      <div ref={containerRef} className="rumby-map-layer" aria-label="Mapa" />
      <button
        type="button"
        className="rumby-locate-fab"
        onClick={onLocateMe}
        aria-label="Centrar en mi ubicacion"
        title="Centrar en mi ubicacion"
      >
        🎯
      </button>
    </>
  );
}
