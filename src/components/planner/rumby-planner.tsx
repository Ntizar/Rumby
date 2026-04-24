"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CityMap } from "@/components/map/city-map";
import { cities, getCity } from "@/lib/catalog/cities";
import { getCurrentLocation, watchCurrentLocation } from "@/lib/geocode/geolocation";
import { reverseGeocode } from "@/lib/geocode/reverse";
import { usePlaceSearch } from "@/lib/geocode/use-place-search";
import type { ModeAction, ModeOption, Place, TripIntent } from "@/lib/domain/types";
import { allModes } from "@/lib/modes/registry";
import { useOperators } from "@/lib/nap/use-operators";
import { planTrip } from "@/lib/routing/plan-trip";

type ActiveFieldId = "origin" | "destination" | `waypoint-${number}`;
type ActiveField = ActiveFieldId | null;
type PanelState = "peek" | "half" | "full" | "hidden";
type PendingClick = { lng: number; lat: number } | null;
type WhenKind = "now" | "depart" | "arrive";

const MODE_COLORS: Record<string, string> = {
  walk: "#10b981",
  bike: "#14b8a6",
  scooter: "#f59e0b",
  moto: "#ef4444",
  taxi: "#eab308",
  car: "#6366f1",
  metro: "#2563eb",
  bus: "#0ea5e9",
  rail: "#8b5cf6",
};

const MODE_FILTERS: Array<{ id: string; label: string; emoji: string }> = [
  { id: "walk", label: "A pie", emoji: "🚶" },
  { id: "metro", label: "Metro", emoji: "🚇" },
  { id: "bus", label: "Bus", emoji: "🚌" },
  { id: "rail", label: "Tren", emoji: "🚆" },
  { id: "bike", label: "Bici", emoji: "🚲" },
  { id: "scooter", label: "Patinete", emoji: "🛴" },
  { id: "moto", label: "Moto", emoji: "🛵" },
  { id: "taxi", label: "Taxi", emoji: "🚕" },
  { id: "car", label: "Coche", emoji: "🚗" },
];

export function RumbyPlanner() {
  const [citySlug, setCitySlug] = useState("madrid");
  const city = getCity(citySlug);

  const [origin, setOrigin] = useState<Place | null>(null);
  const [originText, setOriginText] = useState("");
  const [destination, setDestination] = useState<Place | null>(null);
  const [destinationText, setDestinationText] = useState("");
  const [waypoints, setWaypoints] = useState<Place[]>([]);
  const [waypointTexts, setWaypointTexts] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const [whenKind, setWhenKind] = useState<WhenKind>("now");
  const [whenValue, setWhenValue] = useState<string>(() => localDateTimeInput(new Date()));
  const [showTime, setShowTime] = useState(false);

  const [enabledModes, setEnabledModes] = useState<Set<string>>(
    () => new Set(allModes.map((m) => m.id)),
  );

  const [results, setResults] = useState<ModeOption[]>([]);
  const [computing, setComputing] = useState(false);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [panel, setPanel] = useState<PanelState>("peek");
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingClick, setPendingClick] = useState<PendingClick>(null);
  const [me, setMe] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [collapsedTop, setCollapsedTop] = useState(false);

  const activeQuery = getActiveQuery(activeField, originText, destinationText, waypointTexts);
  const { results: suggestions, loading: suggestionsLoading } = usePlaceSearch(
    activeQuery,
    city.viewbox,
  );
  const { operators } = useOperators(city.napAreaUrbanaId);

  const trip: TripIntent | null = useMemo(() => {
    if (!origin || !destination) return null;
    const when = whenKind === "now" ? new Date().toISOString() : new Date(whenValue).toISOString();
    return {
      origin,
      destination,
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      when,
      whenKind: whenKind === "arrive" ? "arrive" : "depart",
    };
  }, [origin, destination, waypoints, whenKind, whenValue]);

  // Calcular rutas al pulsar buscar
  useEffect(() => {
    let cancelled = false;
    if (!trip || !searchTriggered) return;
    const startT = window.setTimeout(() => {
      if (!cancelled) setComputing(true);
    }, 0);
    planTrip(trip, { citySlug }, Array.from(enabledModes)).then((opts) => {
      if (cancelled) return;
      setResults(opts);
      setComputing(false);
      setPanel("half");
      if (opts.length > 0) setSelectedModeId(opts[0].mode);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(startT);
    };
  }, [trip, enabledModes, searchTriggered, citySlug]);

  // Invalida busqueda si cambian puntos
  useEffect(() => {
    if (searchTriggered) {
      const t = window.setTimeout(() => {
        setSearchTriggered(false);
        setSelectedModeId(null);
      }, 0);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, waypoints, whenKind, whenValue]);

  // Cambio de ciudad
  useEffect(() => {
    const t = window.setTimeout(() => {
      setOrigin(null);
      setDestination(null);
      setWaypoints([]);
      setOriginText("");
      setDestinationText("");
      setWaypointTexts([]);
      setResults([]);
      setSearchTriggered(false);
      setSelectedModeId(null);
      setPanel("peek");
    }, 0);
    return () => window.clearTimeout(t);
  }, [citySlug]);

  // Watch ubicacion en vivo una vez el usuario lo pide
  const [watching, setWatching] = useState(false);
  useEffect(() => {
    if (!watching) return;
    const stop = watchCurrentLocation(
      (lat, lon, accuracy) => setMe({ lat, lon, accuracy }),
      (err) => setErrorMsg(err.message),
    );
    return stop;
  }, [watching]);

  const pickPlace = useCallback(
    (p: Place) => {
      if (activeField === "origin") {
        setOrigin(p);
        setOriginText(p.name);
      } else if (activeField === "destination") {
        setDestination(p);
        setDestinationText(p.name);
      } else if (activeField?.startsWith("waypoint-")) {
        const i = Number(activeField.split("-")[1]);
        setWaypoints((prev) => {
          const next = [...prev];
          next[i] = p;
          return next;
        });
        setWaypointTexts((prev) => {
          const next = [...prev];
          next[i] = p.name;
          return next;
        });
      }
      setActiveField(null);
    },
    [activeField],
  );

  function swap() {
    setOrigin(destination);
    setDestination(origin);
    setOriginText(destinationText);
    setDestinationText(originText);
  }

  function toggleMode(id: string) {
    setEnabledModes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearField(field: "origin" | "destination") {
    if (field === "origin") {
      setOrigin(null);
      setOriginText("");
    } else {
      setDestination(null);
      setDestinationText("");
    }
  }

  function addWaypoint() {
    setWaypoints((prev) => [...prev, blankPlace()]);
    setWaypointTexts((prev) => [...prev, ""]);
    setActiveField(`waypoint-${waypoints.length}`);
  }

  function removeWaypoint(i: number) {
    setWaypoints((prev) => prev.filter((_, idx) => idx !== i));
    setWaypointTexts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateWaypointText(i: number, v: string) {
    setWaypointTexts((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    setWaypoints((prev) => {
      const next = [...prev];
      if (next[i] && next[i].name !== v) next[i] = blankPlace();
      return next;
    });
    setActiveField(`waypoint-${i}`);
  }

  async function locateMe(target: "origin" | "destination" | "watch") {
    setErrorMsg(null);
    setLocating(true);
    try {
      const fix = await getCurrentLocation();
      setMe({ lat: fix.place.lat, lon: fix.place.lon, accuracy: fix.accuracyMeters });
      setWatching(true);
      if (target === "origin") {
        setOrigin(fix.place);
        setOriginText(fix.place.name);
      } else if (target === "destination") {
        setDestination(fix.place);
        setDestinationText(fix.place.name);
      }
      setActiveField(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al obtener ubicacion");
    } finally {
      setLocating(false);
    }
  }

  async function setFromMapClick(
    field: "origin" | "destination" | `waypoint-${number}`,
    lng: number,
    lat: number,
  ) {
    setPendingClick(null);
    const place = (await reverseGeocode(lat, lng)) ?? {
      id: `${lat.toFixed(5)},${lng.toFixed(5)}`,
      name: `Ubicacion ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lon: lng,
      kind: "address" as const,
    };
    if (field === "origin") {
      setOrigin(place);
      setOriginText(place.name);
    } else if (field === "destination") {
      setDestination(place);
      setDestinationText(place.name);
    } else if (field.startsWith("waypoint-")) {
      const i = Number(field.split("-")[1]);
      setWaypoints((prev) => {
        const next = [...prev];
        next[i] = place;
        return next;
      });
      setWaypointTexts((prev) => {
        const next = [...prev];
        next[i] = place.name;
        return next;
      });
    }
  }

  async function onPinDragEnd(
    which: "origin" | "destination" | `waypoint-${number}`,
    lngLat: { lng: number; lat: number },
  ) {
    await setFromMapClick(which, lngLat.lng, lngLat.lat);
  }

  function triggerSearch() {
    if (!origin || !destination) return;
    setSearchTriggered(true);
    setPanel("half");
  }

  const showSuggestions = activeField !== null && activeQuery.trim().length >= 3;
  const canSearch = !!(origin && destination);
  const selectedOption =
    selectedModeId !== null ? results.find((r) => r.mode === selectedModeId) ?? null : null;
  const routeGeometry = selectedOption?.geometry ?? null;
  const routeColor = selectedOption ? MODE_COLORS[selectedOption.mode] ?? "#2563eb" : "#2563eb";

  return (
    <div className="rumby-shell" data-panel={panel}>
      <CityMap
        origin={origin}
        destination={destination}
        waypoints={waypoints.filter((wp) => wp.lat !== 0 || wp.lon !== 0)}
        center={city.center}
        zoom={city.zoom}
        routeGeometry={routeGeometry}
        routeColor={routeColor}
        me={me}
        onMapClick={(ll) => setPendingClick(ll)}
        onPinDragEnd={onPinDragEnd}
        onLocateMe={() => locateMe("watch")}
      />

      {/* Popup al tapear mapa */}
      {pendingClick && (
        <div className="rumby-pinpop rumby-glass-strong" role="dialog">
          <div className="rumby-pinpop-title">¿Qué hago con este punto?</div>
          <div className="rumby-pinpop-coords">
            {pendingClick.lat.toFixed(4)}, {pendingClick.lng.toFixed(4)}
          </div>
          <div className="rumby-pinpop-row">
            <button
              type="button"
              className="rumby-pinpop-btn"
              onClick={() => setFromMapClick("origin", pendingClick.lng, pendingClick.lat)}
            >
              📍 Origen
            </button>
            <button
              type="button"
              className="rumby-pinpop-btn"
              onClick={() => setFromMapClick("destination", pendingClick.lng, pendingClick.lat)}
            >
              🎯 Destino
            </button>
          </div>
          {waypoints.length < 5 && (
            <button
              type="button"
              className="rumby-pinpop-btn rumby-pinpop-btn-ghost"
              onClick={async () => {
                const click = pendingClick;
                setPendingClick(null);
                setWaypoints((prev) => [...prev, blankPlace()]);
                setWaypointTexts((prev) => [...prev, ""]);
                await setFromMapClick(
                  `waypoint-${waypoints.length}`,
                  click.lng,
                  click.lat,
                );
              }}
            >
              ➕ Parada intermedia
            </button>
          )}
          <button
            type="button"
            className="rumby-pinpop-cancel"
            onClick={() => setPendingClick(null)}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Barra top */}
      <div className="rumby-top rumby-glass-strong" data-collapsed={collapsedTop}>
        <div className="rumby-brand-row">
          <div className="rumby-brand">
            <span className="rumby-brand-emoji" aria-hidden>
              🧭
            </span>
            <span>Rumby</span>
          </div>
          <select
            className="rumby-city-select"
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            aria-label="Cambiar ciudad"
          >
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rumby-collapse-top"
            onClick={() => setCollapsedTop((v) => !v)}
            aria-label={collapsedTop ? "Mostrar buscador" : "Ocultar buscador"}
            title={collapsedTop ? "Mostrar buscador" : "Ocultar buscador"}
          >
            {collapsedTop ? "▾" : "▴"}
          </button>
        </div>

        {!collapsedTop && (
          <>
            <div className="rumby-fields">
              <FieldRow
                letter="A"
                color="#2563eb"
                placeholder="Desde (origen)"
                value={originText}
                locating={locating && activeField === "origin"}
                onChange={(v) => {
                  setOriginText(v);
                  setActiveField("origin");
                  if (origin && origin.name !== v) setOrigin(null);
                }}
                onFocus={() => setActiveField("origin")}
                onClear={() => clearField("origin")}
                onUseLocation={() => locateMe("origin")}
              />

              {waypoints.map((wp, i) => (
                <FieldRow
                  key={i}
                  letter={String.fromCharCode(67 + i)}
                  color="#8b5cf6"
                  placeholder={`Parada ${i + 1}`}
                  value={waypointTexts[i] ?? ""}
                  locating={false}
                  onChange={(v) => updateWaypointText(i, v)}
                  onFocus={() => setActiveField(`waypoint-${i}`)}
                  onClear={() => removeWaypoint(i)}
                  clearIcon="✕"
                />
              ))}

              <FieldRow
                letter="B"
                color="#f97316"
                placeholder="A dónde (destino)"
                value={destinationText}
                locating={locating && activeField === "destination"}
                onChange={(v) => {
                  setDestinationText(v);
                  setActiveField("destination");
                  if (destination && destination.name !== v) setDestination(null);
                }}
                onFocus={() => setActiveField("destination")}
                onClear={() => clearField("destination")}
                onUseLocation={() => locateMe("destination")}
              />

              <button
                type="button"
                className="rumby-swap"
                onClick={swap}
                aria-label="Intercambiar origen y destino"
              >
                ↕
              </button>
            </div>

            <div className="rumby-actions-row">
              <button
                type="button"
                className="rumby-minor-btn"
                onClick={addWaypoint}
                disabled={waypoints.length >= 5}
                title="Añadir parada intermedia"
              >
                ➕ Parada
              </button>
              <button
                type="button"
                className="rumby-minor-btn"
                onClick={() => setShowTime((v) => !v)}
                aria-pressed={showTime}
                title="Programar viaje"
              >
                🕐 {whenLabel(whenKind, whenValue)}
              </button>
            </div>

            {showTime && (
              <div className="rumby-time-panel">
                <div className="rumby-time-tabs">
                  {(["now", "depart", "arrive"] as WhenKind[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className="rumby-time-tab"
                      data-active={whenKind === k}
                      onClick={() => setWhenKind(k)}
                    >
                      {k === "now" ? "Ahora" : k === "depart" ? "Salir a" : "Llegar a"}
                    </button>
                  ))}
                </div>
                {whenKind !== "now" && (
                  <input
                    type="datetime-local"
                    className="rumby-time-input"
                    value={whenValue}
                    onChange={(e) => setWhenValue(e.target.value)}
                  />
                )}
              </div>
            )}

            {errorMsg && <div className="rumby-error">⚠ {errorMsg}</div>}

            <button
              type="button"
              className="rumby-search-btn"
              onClick={triggerSearch}
              disabled={!canSearch}
            >
              {canSearch ? "🔍 Buscar ruta" : "Elige origen y destino"}
            </button>

            {showSuggestions && (
              <div className="rumby-glass rumby-suggest" role="listbox">
                {suggestionsLoading && suggestions.length === 0 && (
                  <div className="rumby-suggest-empty">Buscando…</div>
                )}
                {!suggestionsLoading && suggestions.length === 0 && (
                  <div className="rumby-suggest-empty">Sin resultados</div>
                )}
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="rumby-suggest-item"
                    onClick={() => pickPlace(s)}
                  >
                    <span className="rumby-suggest-name">{s.name}</span>
                    {s.context && (
                      <span className="rumby-suggest-context">{s.context}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel inferior: peek minimo, half compartido, full lista completa, hidden = solo mapa */}
      <div className="rumby-panel">
        <div className="rumby-panel-card rumby-glass-strong">
          <button
            type="button"
            className="rumby-panel-handle-btn"
            onClick={() => setPanel(cyclePanel)}
            aria-label="Cambiar tamaño del panel"
          >
            <div className="rumby-panel-handle" aria-hidden />
          </button>

          <div className="rumby-panel-header">
            <div>
              <div className="rumby-panel-title">
                {searchTriggered
                  ? computing
                    ? "Calculando rutas…"
                    : `${results.length} formas de llegar`
                  : trip
                    ? "Listo para buscar"
                    : `Rumby · ${city.name}`}
              </div>
              <div className="rumby-panel-sub">
                {searchTriggered && results.length > 0
                  ? `Pulsa una opción · ${whenLabelShort(whenKind, whenValue)}`
                  : trip
                    ? "Pulsa Buscar ruta arriba"
                    : "Toca el mapa o escribe direcciones"}
              </div>
            </div>
            <button
              type="button"
              className="rumby-panel-toggle"
              onClick={() => setPanel(cyclePanel)}
              aria-label="Alternar tamaño"
            >
              {panelIcon(panel)}
            </button>
          </div>

          <div className="rumby-filter-row" role="group" aria-label="Filtrar por modo">
            {MODE_FILTERS.map((m) => {
              const active = enabledModes.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className="rumby-filter-chip"
                  data-active={active}
                  onClick={() => toggleMode(m.id)}
                  aria-pressed={active}
                >
                  <span aria-hidden>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rumby-panel-body">
            {!searchTriggered && (
              <>
                <EmptyState hasTrip={!!trip} cityName={city.name} />
                {operators.length > 0 && (
                  <OperatorsPanel cityName={city.name} operators={operators} />
                )}
              </>
            )}
            {searchTriggered && !computing && results.length === 0 && (
              <div className="rumby-empty">
                <span className="rumby-empty-emoji" aria-hidden>
                  🤷
                </span>
                <div>
                  Ningún modo aplica para esta distancia.
                  <br />
                  Activa más filtros o cambia el destino.
                </div>
              </div>
            )}
            {searchTriggered &&
              results.map((r) => (
                <ResultCard
                  key={r.mode}
                  option={r}
                  selected={selectedModeId === r.mode}
                  onSelect={() => setSelectedModeId(r.mode)}
                />
              ))}
          </div>
        </div>

        <button
          type="button"
          className="rumby-hide-panel-fab"
          onClick={() => setPanel(panel === "hidden" ? "peek" : "hidden")}
          aria-label={panel === "hidden" ? "Mostrar panel" : "Ocultar panel"}
          title={panel === "hidden" ? "Mostrar panel" : "Ver solo mapa"}
        >
          {panel === "hidden" ? "▴" : "▾"}
        </button>
      </div>
    </div>
  );
}

// ---------- helpers ----------

function cyclePanel(s: PanelState): PanelState {
  if (s === "hidden") return "peek";
  if (s === "peek") return "half";
  if (s === "half") return "full";
  return "peek";
}

function panelIcon(s: PanelState) {
  return s === "full" ? "▾" : "▴";
}

function localDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function whenLabel(kind: WhenKind, value: string) {
  if (kind === "now") return "Ahora";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Programar";
  const date = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  const hour = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${kind === "arrive" ? "Llegar" : "Salir"} ${date} ${hour}`;
}

function whenLabelShort(kind: WhenKind, value: string) {
  if (kind === "now") return "ahora";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "programado";
  return `${kind === "arrive" ? "llegar" : "salir"} ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

function blankPlace(): Place {
  return { id: `wp-${Date.now()}-${Math.random()}`, name: "", lat: 0, lon: 0, kind: "stop" };
}

function getActiveQuery(
  field: ActiveField,
  origin: string,
  destination: string,
  waypoints: string[],
): string {
  if (field === "origin") return origin;
  if (field === "destination") return destination;
  if (field?.startsWith("waypoint-")) {
    const i = Number(field.split("-")[1]);
    return waypoints[i] ?? "";
  }
  return "";
}

// ---------- subcomponents ----------

function FieldRow({
  letter,
  color,
  placeholder,
  value,
  locating,
  onChange,
  onFocus,
  onClear,
  onUseLocation,
  clearIcon,
}: {
  letter: string;
  color: string;
  placeholder: string;
  value: string;
  locating: boolean;
  onChange: (v: string) => void;
  onFocus: () => void;
  onClear: () => void;
  onUseLocation?: () => void;
  clearIcon?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rumby-field">
      <span
        className="rumby-field-badge"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        {letter}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        autoComplete="off"
        spellCheck={false}
      />
      {value ? (
        <button
          type="button"
          className="rumby-clear"
          onClick={onClear}
          aria-label="Limpiar"
        >
          {clearIcon ?? "×"}
        </button>
      ) : onUseLocation ? (
        <button
          type="button"
          className="rumby-locate"
          onClick={onUseLocation}
          aria-label="Usar mi ubicacion"
          disabled={locating}
          title="Usar mi ubicacion"
        >
          {locating ? "…" : "📍"}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ hasTrip, cityName }: { hasTrip: boolean; cityName: string }) {
  return (
    <div className="rumby-empty">
      <span className="rumby-empty-emoji" aria-hidden>
        {hasTrip ? "🚀" : "🗺️"}
      </span>
      <div>
        {hasTrip ? (
          <>
            Todo listo en <strong>{cityName}</strong>.
            <br />
            Pulsa <strong>Buscar ruta</strong> arriba.
          </>
        ) : (
          <>
            Toca el mapa o usa <strong>📍</strong> para empezar.
            <br />
            Rumby compara <strong>todas las formas</strong> de llegar.
          </>
        )}
      </div>
    </div>
  );
}

function OperatorsPanel({
  cityName,
  operators,
}: {
  cityName: string;
  operators: { id: number; name: string; url: string | null; modes: string[] }[];
}) {
  return (
    <div className="rumby-operators">
      <div className="rumby-operators-title">
        Operadores en {cityName}{" "}
        <span className="rumby-chip" data-tone="ok">
          NAP en vivo
        </span>
      </div>
      <div className="rumby-operators-grid">
        {operators.slice(0, 8).map((op) => {
          const inner = (
            <>
              <span className="rumby-operator-name">{op.name}</span>
              {op.modes.length > 0 && (
                <span className="rumby-operator-modes">
                  {op.modes.slice(0, 2).join(", ")}
                </span>
              )}
            </>
          );
          return op.url ? (
            <a
              key={op.id}
              className="rumby-operator-card"
              href={op.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {inner}
            </a>
          ) : (
            <div key={op.id} className="rumby-operator-card">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultCard({
  option,
  selected,
  onSelect,
}: {
  option: ModeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const actions = option.actions ?? [];
  const primary = actions[0];
  const rest = actions.slice(1);

  return (
    <div className="rumby-result-wrap" data-selected={selected}>
      <button
        type="button"
        className="rumby-result"
        data-selected={selected}
        onClick={onSelect}
      >
        <span className="rumby-result-emoji" aria-hidden>
          {option.emoji}
        </span>
        <span className="rumby-result-main">
          <span className="rumby-result-label">{option.label}</span>
          <span className="rumby-result-meta">
            <span className="rumby-chip">{option.distanceKm.toFixed(1)} km</span>
            <span
              className="rumby-chip"
              data-tone={option.confidence === "real" ? "ok" : "warn"}
            >
              {option.confidence === "real" ? "en vivo" : "estimado"}
            </span>
          </span>
          {option.hint && <span className="rumby-result-hint">{option.hint}</span>}
          {option.warnings && option.warnings.length > 0 && (
            <span className="rumby-result-warning">⚠ {option.warnings[0]}</span>
          )}
          <span className="rumby-result-source">📊 {option.dataSource}</span>
        </span>
        <span className="rumby-result-side">
          <span className="rumby-result-time">{option.durationMin} min</span>
          <span className="rumby-result-cost">
            {option.costEur === null
              ? "—"
              : option.costEur === 0
                ? "Gratis"
                : `${option.costEur.toFixed(2)} €`}
          </span>
        </span>
      </button>
      {selected && option.details && option.details.length > 0 && (
        <div className="rumby-result-details">
          {option.details.map((d, i) => (
            <div key={i} className="rumby-result-detail">
              <span className="rumby-result-detail-label">{d.label}</span>
              <span className="rumby-result-detail-value">{d.value}</span>
            </div>
          ))}
        </div>
      )}
      {selected && actions.length > 0 && (
        <div className="rumby-result-actions">
          {primary && <ActionLink action={primary} primary />}
          {rest.map((a, i) => (
            <ActionLink key={`${a.label}-${i}`} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionLink({ action, primary }: { action: ModeAction; primary?: boolean }) {
  return (
    <a
      className="rumby-action"
      data-primary={primary ? "true" : "false"}
      href={action.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span aria-hidden>{action.icon}</span>
      <span>{action.label}</span>
    </a>
  );
}
