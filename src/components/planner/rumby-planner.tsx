"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CityMap } from "@/components/map/city-map";
import { cities, getCity } from "@/lib/catalog/cities";
import { getCurrentLocation } from "@/lib/geocode/geolocation";
import { usePlaceSearch } from "@/lib/geocode/use-place-search";
import type { ModeOption, Place, TripIntent } from "@/lib/domain/types";
import { allModes } from "@/lib/modes/registry";
import { planTrip } from "@/lib/routing/plan-trip";

type ActiveField = "origin" | "destination" | null;
type SheetState = "collapsed" | "half" | "full";

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

  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [activeField, setActiveField] = useState<ActiveField>(null);

  const [enabledModes, setEnabledModes] = useState<Set<string>>(
    () => new Set(allModes.map((m) => m.id)),
  );

  const [results, setResults] = useState<ModeOption[]>([]);
  const [computing, setComputing] = useState(false);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [sheet, setSheet] = useState<SheetState>("collapsed");
  const [locating, setLocating] = useState<ActiveField>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeQuery =
    activeField === "origin" ? originText : activeField === "destination" ? destinationText : "";
  const { results: suggestions, loading: suggestionsLoading } = usePlaceSearch(
    activeQuery,
    city.viewbox,
  );

  const trip: TripIntent | null = useMemo(() => {
    if (!origin || !destination) return null;
    return {
      origin,
      destination,
      when: new Date().toISOString(),
      whenKind: "depart",
    };
  }, [origin, destination]);

  // Solo calcula cuando el usuario pulsa "Buscar ruta".
  useEffect(() => {
    let cancelled = false;
    if (!trip || !searchTriggered) {
      return;
    }
    const startT = window.setTimeout(() => setComputing(true), 0);
    planTrip(trip, { citySlug }, Array.from(enabledModes)).then((opts) => {
      if (!cancelled) {
        setResults(opts);
        setComputing(false);
        setSheet("full");
      }
    });
    return () => {
      cancelled = true;
      window.clearTimeout(startT);
    };
  }, [trip, enabledModes, searchTriggered, citySlug]);

  // Si cambia origen/destino, invalido la busqueda anterior.
  useEffect(() => {
    if (searchTriggered) {
      const t = window.setTimeout(() => setSearchTriggered(false), 0);
      return () => window.clearTimeout(t);
    }
  }, [origin, destination]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cambio de ciudad: limpia.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setOrigin(null);
      setDestination(null);
      setOriginText("");
      setDestinationText("");
      setResults([]);
      setSearchTriggered(false);
      setSheet("collapsed");
    }, 0);
    return () => window.clearTimeout(t);
  }, [citySlug]);

  function pickPlace(p: Place) {
    if (activeField === "origin") {
      setOrigin(p);
      setOriginText(p.name);
    } else if (activeField === "destination") {
      setDestination(p);
      setDestinationText(p.name);
    }
    setActiveField(null);
  }

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
      setOriginText("");
      setOrigin(null);
    } else {
      setDestinationText("");
      setDestination(null);
    }
  }

  async function locateMe(field: "origin" | "destination") {
    setErrorMsg(null);
    setLocating(field);
    try {
      const fix = await getCurrentLocation();
      if (field === "origin") {
        setOrigin(fix.place);
        setOriginText(fix.place.name);
      } else {
        setDestination(fix.place);
        setDestinationText(fix.place.name);
      }
      setActiveField(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al obtener ubicacion");
    } finally {
      setLocating(null);
    }
  }

  function triggerSearch() {
    if (!origin || !destination) return;
    setSearchTriggered(true);
    setSheet("full");
  }

  const showSuggestions = activeField !== null && activeQuery.trim().length >= 3;
  const canSearch = !!(origin && destination);

  return (
    <div className="rumby-shell" data-sheet={sheet}>
      <CityMap origin={origin} destination={destination} center={city.center} zoom={city.zoom} />

      {/* Top: brand + city + search */}
      <div className="rumby-top rumby-glass-strong">
        <div className="rumby-brand">
          <span className="rumby-brand-emoji" aria-hidden>
            🧭
          </span>
          <span>Rumby</span>
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
        </div>

        <div className="rumby-fields">
          <button
            className="rumby-swap"
            type="button"
            onClick={swap}
            aria-label="Intercambiar origen y destino"
          >
            ↕
          </button>

          <FieldRow
            emoji="📍"
            placeholder="Donde estas"
            value={originText}
            onChange={(v) => {
              setOriginText(v);
              setActiveField("origin");
              if (origin && origin.name !== v) setOrigin(null);
            }}
            onFocus={() => setActiveField("origin")}
            onClear={() => clearField("origin")}
            onUseLocation={() => locateMe("origin")}
            locating={locating === "origin"}
          />
          <FieldRow
            emoji="🎯"
            placeholder="A donde vas"
            value={destinationText}
            onChange={(v) => {
              setDestinationText(v);
              setActiveField("destination");
              if (destination && destination.name !== v) setDestination(null);
            }}
            onFocus={() => setActiveField("destination")}
            onClear={() => clearField("destination")}
            onUseLocation={() => locateMe("destination")}
            locating={locating === "destination"}
          />
        </div>

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
                {s.context && <span className="rumby-suggest-context">{s.context}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom sheet con 3 alturas */}
      <div className="rumby-sheet">
        <div className="rumby-sheet-card rumby-glass-strong">
          <button
            type="button"
            className="rumby-sheet-handle-btn"
            onClick={() => setSheet(cycleSheet)}
            aria-label="Cambiar tamano de la lista"
          >
            <div className="rumby-sheet-handle" aria-hidden />
          </button>

          <div className="rumby-sheet-header">
            <div>
              <div className="rumby-sheet-title">
                {searchTriggered
                  ? computing
                    ? "Calculando…"
                    : `${results.length} formas de llegar`
                  : trip
                    ? "Listo para buscar"
                    : "Elige origen y destino"}
              </div>
              <div className="rumby-sheet-sub">
                {searchTriggered && results.length > 0
                  ? "Tocaste algun chip para filtrar"
                  : trip
                    ? "Pulsa Buscar ruta arriba"
                    : `Direcciones reales en ${city.name}`}
              </div>
            </div>
            <button
              type="button"
              className="rumby-sheet-toggle"
              onClick={() => setSheet(cycleSheet)}
            >
              {sheetIcon(sheet)}
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

          <div className="rumby-sheet-body">
            {!searchTriggered && <EmptyState hasTrip={!!trip} cityName={city.name} />}
            {searchTriggered && !computing && results.length === 0 && (
              <div className="rumby-empty">
                <span className="rumby-empty-emoji" aria-hidden>
                  🤷
                </span>
                <div>
                  Ningun modo aplica para esta distancia.
                  <br />
                  Activa mas filtros o cambia el destino.
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
      </div>
    </div>
  );
}

function cycleSheet(s: SheetState): SheetState {
  return s === "collapsed" ? "half" : s === "half" ? "full" : "collapsed";
}

function sheetIcon(s: SheetState) {
  return s === "full" ? "▾" : s === "half" ? "▴" : "▴";
}

function FieldRow({
  emoji,
  placeholder,
  value,
  onChange,
  onFocus,
  onClear,
  onUseLocation,
  locating,
}: {
  emoji: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  onClear: () => void;
  onUseLocation: () => void;
  locating: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rumby-field">
      <span className="rumby-field-emoji" aria-hidden>
        {emoji}
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
        <button type="button" className="rumby-clear" onClick={onClear} aria-label="Limpiar">
          ×
        </button>
      ) : (
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
      )}
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
            Escribe direcciones o usa <strong>📍</strong>.
            <br />
            Rumby compara <strong>todas las formas</strong> de llegar.
          </>
        )}
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
  return (
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
          {option.hint && <span className="rumby-result-hint">{option.hint}</span>}
        </span>
        {option.warnings && option.warnings.length > 0 && (
          <span className="rumby-result-warning">⚠ {option.warnings[0]}</span>
        )}
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
  );
}
