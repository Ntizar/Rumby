"use client";

import { useEffect, useMemo, useState } from "react";

import { MadridMap } from "@/components/map/madrid-map";
import type { ModeOption, Place, TripIntent } from "@/lib/domain/types";
import { usePlaceSearch } from "@/lib/geocode/use-place-search";
import { allModes } from "@/lib/modes/registry";
import { planTrip } from "@/lib/routing/plan-trip";

type ActiveField = "origin" | "destination" | null;

const MODE_FILTERS: Array<{ id: string; label: string; emoji: string }> = [
  { id: "walk", label: "A pie", emoji: "🚶" },
  { id: "metro", label: "Metro", emoji: "🚇" },
  { id: "bus", label: "Bus", emoji: "🚌" },
  { id: "rail", label: "Cercanias", emoji: "🚆" },
  { id: "bike", label: "Bici", emoji: "🚲" },
  { id: "scooter", label: "Patinete", emoji: "🛴" },
  { id: "moto", label: "Moto", emoji: "🛵" },
  { id: "taxi", label: "Taxi", emoji: "🚕" },
  { id: "car", label: "Coche", emoji: "🚗" },
];

export function MadridPlanner() {
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

  // Autocomplete activo segun campo enfocado.
  const activeQuery = activeField === "origin" ? originText : activeField === "destination" ? destinationText : "";
  const { results: suggestions, loading: suggestionsLoading } = usePlaceSearch(activeQuery);

  // Recalcular opciones cuando cambian inputs o filtros.
  const trip: TripIntent | null = useMemo(() => {
    if (!origin || !destination) return null;
    return {
      origin,
      destination,
      when: new Date().toISOString(),
      whenKind: "depart",
    };
  }, [origin, destination]);

  useEffect(() => {
    let cancelled = false;
    if (!trip) {
      const t = window.setTimeout(() => setResults([]), 0);
      return () => window.clearTimeout(t);
    }
    const startT = window.setTimeout(() => setComputing(true), 0);
    planTrip(trip, { citySlug: "madrid" }, Array.from(enabledModes)).then((opts) => {
      if (!cancelled) {
        setResults(opts);
        setComputing(false);
      }
    });
    return () => {
      cancelled = true;
      window.clearTimeout(startT);
    };
  }, [trip, enabledModes]);

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

  const showSuggestions = activeField !== null && activeQuery.trim().length >= 3;

  return (
    <div className="rumby-shell">
      <MadridMap origin={origin} destination={destination} />

      {/* Top: brand + search */}
      <div className="rumby-top rumby-glass-strong">
        <div className="rumby-brand">
          <span className="rumby-brand-emoji" aria-hidden>
            🧭
          </span>
          <span>Rumby</span>
          <span className="rumby-brand-tag">Madrid</span>
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
          />
        </div>

        {showSuggestions && (
          <div className="rumby-glass rumby-suggest" role="listbox">
            {suggestionsLoading && suggestions.length === 0 && (
              <div className="rumby-suggest-empty">Buscando…</div>
            )}
            {!suggestionsLoading && suggestions.length === 0 && (
              <div className="rumby-suggest-empty">Sin resultados en Madrid</div>
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

      {/* Bottom sheet: filters + results */}
      <div className="rumby-sheet">
        <div className="rumby-sheet-card rumby-glass-strong">
          <div className="rumby-sheet-handle" aria-hidden />

          <div className="rumby-sheet-header">
            <div>
              <div className="rumby-sheet-title">
                {trip ? "Como llegar" : "Elige origen y destino"}
              </div>
              <div className="rumby-sheet-sub">
                {trip
                  ? computing
                    ? "Calculando opciones…"
                    : `${results.length} opciones disponibles`
                  : "Busca direcciones reales en Madrid"}
              </div>
            </div>
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
            {!trip && <EmptyState />}
            {trip && !computing && results.length === 0 && (
              <div className="rumby-empty">
                <span className="rumby-empty-emoji" aria-hidden>
                  🤷
                </span>
                <div>Ningun modo aplica para esta distancia. Prueba a activar mas filtros.</div>
              </div>
            )}
            {results.map((r) => (
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

function FieldRow({
  emoji,
  placeholder,
  value,
  onChange,
  onFocus,
  onClear,
}: {
  emoji: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rumby-field">
      <span className="rumby-field-emoji" aria-hidden>
        {emoji}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className="rumby-clear"
          onClick={onClear}
          aria-label="Limpiar"
        >
          ×
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rumby-empty">
      <span className="rumby-empty-emoji" aria-hidden>
        🗺️
      </span>
      <div>
        Escribe direcciones reales arriba.
        <br />
        Rumby compara <strong>todas las formas</strong> de llegar.
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
          {option.hint && <span>{option.hint}</span>}
        </span>
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
