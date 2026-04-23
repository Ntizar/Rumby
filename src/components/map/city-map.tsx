"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Place } from "@/lib/domain/types";

type CityMapProps = {
  origin: Place | null;
  destination: Place | null;
  waypoints: Place[];
  /** Centro inicial [lon, lat]. */
  center: [number, number];
  zoom: number;
  /** Geometria GeoJSON LineString [lon,lat][] para dibujar la ruta seleccionada. */
  routeGeometry: [number, number][] | null;
  /** Color de la ruta (por modo). */
  routeColor?: string;
  /** Mi ubicacion en vivo. */
  me: { lat: number; lon: number; accuracy: number } | null;
  /** Click en el mapa. */
  onMapClick: (lngLat: { lng: number; lat: number }) => void;
  /** Drag de pin terminado. */
  onPinDragEnd: (
    which: "origin" | "destination" | `waypoint-${number}`,
    lngLat: { lng: number; lat: number },
  ) => void;
  /** Click en boton flotante "centrar en mi". */
  onLocateMe: () => void;
};

const ROUTE_SOURCE = "rumby-route";
const ROUTE_LAYER = "rumby-route-line";
const ROUTE_CASING = "rumby-route-casing";
const ME_SOURCE = "rumby-me";

export function CityMap({
  origin,
  destination,
  waypoints,
  center,
  zoom,
  routeGeometry,
  routeColor = "#2563eb",
  me,
  onMapClick,
  onPinDragEnd,
  onLocateMe,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const waypointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const meMarkerRef = useRef<maplibregl.Marker | null>(null);
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
      dragRotate: false,
      pitchWithRotate: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      // Ruta: casing (halo blanco) + linea principal
      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: emptyLine(),
      });
      map.addLayer({
        id: ROUTE_CASING,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 9,
          "line-opacity": 0.9,
        },
      });
      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": routeColor,
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });

      // Ubicacion del usuario: punto + halo de precision
      map.addSource(ME_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "rumby-me-accuracy",
        type: "circle",
        source: ME_SOURCE,
        paint: {
          "circle-radius": ["get", "accuracyPx"],
          "circle-color": "#2563eb",
          "circle-opacity": 0.12,
          "circle-stroke-color": "#2563eb",
          "circle-stroke-opacity": 0.35,
          "circle-stroke-width": 1,
        },
        filter: ["==", "$type", "Point"],
      });
      map.addLayer({
        id: "rumby-me-dot",
        type: "circle",
        source: ME_SOURCE,
        paint: {
          "circle-radius": 7,
          "circle-color": "#2563eb",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
        filter: ["==", "$type", "Point"],
      });
    });

    map.on("click", (e) => {
      // Ignorar clicks sobre markers (maplibre los pone fuera del canvas, pero por si acaso)
      onMapClickRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      waypointMarkersRef.current = [];
      meMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ciudad: si no hay nada puesto, volar.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!origin && !destination && waypoints.length === 0) {
      map.flyTo({ center, zoom, duration: 700 });
    }
  }, [center, zoom, origin, destination, waypoints.length]);

  // Pin origen
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    originMarkerRef.current?.remove();
    originMarkerRef.current = null;
    if (origin) {
      const el = makePinEl("A", "#2563eb");
      const m = new maplibregl.Marker({ element: el, draggable: true, anchor: "bottom" })
        .setLngLat([origin.lon, origin.lat])
        .addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        onPinDragEndRef.current("origin", { lng: ll.lng, lat: ll.lat });
      });
      originMarkerRef.current = m;
    }
  }, [origin]);

  // Pin destino
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    destMarkerRef.current?.remove();
    destMarkerRef.current = null;
    if (destination) {
      const el = makePinEl("B", "#f97316");
      const m = new maplibregl.Marker({ element: el, draggable: true, anchor: "bottom" })
        .setLngLat([destination.lon, destination.lat])
        .addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        onPinDragEndRef.current("destination", { lng: ll.lng, lat: ll.lat });
      });
      destMarkerRef.current = m;
    }
  }, [destination]);

  // Pines waypoints
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = [];
    waypoints.forEach((wp, i) => {
      const label = String.fromCharCode(67 + i); // C, D, E...
      const el = makePinEl(label, "#8b5cf6");
      const m = new maplibregl.Marker({ element: el, draggable: true, anchor: "bottom" })
        .setLngLat([wp.lon, wp.lat])
        .addTo(map);
      const key: `waypoint-${number}` = `waypoint-${i}`;
      m.on("dragend", () => {
        const ll = m.getLngLat();
        onPinDragEndRef.current(key, { lng: ll.lng, lat: ll.lat });
      });
      waypointMarkersRef.current.push(m);
    });
  }, [waypoints]);

  // Encuadre bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pts: [number, number][] = [];
    if (origin) pts.push([origin.lon, origin.lat]);
    waypoints.forEach((wp) => pts.push([wp.lon, wp.lat]));
    if (destination) pts.push([destination.lon, destination.lat]);
    if (pts.length >= 2) {
      const bounds = pts.reduce(
        (b, p) => b.extend(p as [number, number]),
        new maplibregl.LngLatBounds(pts[0], pts[0]),
      );
      map.fitBounds(bounds, {
        padding: { top: 180, bottom: 260, left: 40, right: 40 },
        maxZoom: 14,
        duration: 700,
      });
    } else if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 14, duration: 600 });
    }
  }, [origin, destination, waypoints]);

  // Geometria ruta
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const src = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: routeGeometry ?? [] },
      });
      // color dinamico
      if (map.getLayer(ROUTE_LAYER)) {
        map.setPaintProperty(ROUTE_LAYER, "line-color", routeColor);
      }
    };
    if (map.isStyleLoaded() && map.getSource(ROUTE_SOURCE)) update();
    else map.once("load", update);
  }, [routeGeometry, routeColor]);

  // Marcador yo
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const src = map.getSource(ME_SOURCE) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      if (!me) {
        src.setData({ type: "FeatureCollection", features: [] });
        return;
      }
      // Convertir accuracy (metros) a pixeles al zoom actual
      const meters = Math.max(5, Math.min(200, me.accuracy || 30));
      const metersPerPixel =
        (156543.03392 * Math.cos((me.lat * Math.PI) / 180)) / Math.pow(2, map.getZoom());
      const accuracyPx = meters / metersPerPixel;
      src.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { accuracyPx },
            geometry: { type: "Point", coordinates: [me.lon, me.lat] },
          },
        ],
      });
    };
    if (map.isStyleLoaded() && map.getSource(ME_SOURCE)) update();
    else map.once("load", update);
    map.on("zoom", update);
    return () => {
      map.off("zoom", update);
    };
  }, [me]);

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

function emptyLine(): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: [] },
  };
}

function makePinEl(letter: string, color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "rumby-pin";
  el.style.setProperty("--pin-color", color);
  el.innerHTML = `
    <div class="rumby-pin-dot">${letter}</div>
    <div class="rumby-pin-tail"></div>
  `;
  return el;
}
