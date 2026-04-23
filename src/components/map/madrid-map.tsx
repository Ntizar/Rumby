"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Incident, Place } from "@/lib/domain/types";

type MadridMapProps = {
  origin: Place;
  destination: Place;
  incidents: Incident[];
};

export function MadridMap({ origin, destination, incidents }: MadridMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-3.6762, 40.438],
      zoom: 10.3,
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

    makeMarker("#4f8cff", origin, "Origen");
    makeMarker("#ff8b38", destination, "Destino");

    incidents.forEach((incident) => {
      const color = incident.severity === "high" ? "#ef4444" : incident.severity === "medium" ? "#f97316" : "#10b981";
      new maplibregl.Marker({ color, scale: 0.85 })
        .setLngLat([incident.lon, incident.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<strong>${incident.title}</strong><br>${incident.summary}`,
          ),
        )
        .addTo(map);
    });

    map.on("load", () => {
      map.addSource("travely-route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [origin.lon, origin.lat],
              [-3.6995, 40.4187],
              [-3.6762, 40.438],
              [-3.6111, 40.4689],
              [destination.lon, destination.lat],
            ],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: "travely-route-line",
        type: "line",
        source: "travely-route",
        paint: {
          "line-color": "#7c4dff",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });
    });

    return () => {
      map.remove();
    };
  }, [destination, incidents, origin]);

  return <div ref={mapRef} className="travely-map-canvas" aria-label="Mapa multimodal de Madrid" />;
}
