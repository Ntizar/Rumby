"use client";

import { useMemo, useState } from "react";

import { MadridMap } from "@/components/map/madrid-map";
import { madridPlaces, resolveMadridPlace } from "@/lib/catalog/cities/madrid-places";

type PlanningMode = "depart" | "arrive";
type FavoriteMode = "walk" | "bus" | "metro" | "rail" | "bike" | "taxi" | "moto";

const favoriteModeOptions: Array<{ id: FavoriteMode; label: string }> = [
  { id: "walk", label: "Caminar" },
  { id: "bus", label: "Bus / EMT" },
  { id: "metro", label: "Metro" },
  { id: "rail", label: "Cercanias" },
  { id: "bike", label: "Bici" },
  { id: "taxi", label: "Taxi / VTC" },
  { id: "moto", label: "Moto sharing" },
];

const initialModes: Record<FavoriteMode, boolean> = {
  walk: true,
  bus: true,
  metro: false,
  rail: false,
  bike: false,
  taxi: false,
  moto: false,
};

export function MadridPlanner() {
  const [originInput, setOriginInput] = useState("Puerta del Sol");
  const [destinationInput, setDestinationInput] = useState(
    "Aeropuerto Adolfo Suarez Madrid-Barajas T4",
  );
  const [planningMode, setPlanningMode] = useState<PlanningMode>("depart");
  const [dateTime, setDateTime] = useState("2026-04-24T08:15");
  const [favoriteModes, setFavoriteModes] = useState(initialModes);

  const origin = useMemo(() => resolveMadridPlace(originInput), [originInput]);
  const destination = useMemo(() => resolveMadridPlace(destinationInput), [destinationInput]);
  const selectedModes = favoriteModeOptions.filter((mode) => favoriteModes[mode.id]);
  const readyForRealRouting = Boolean(origin && destination && selectedModes.length > 0);

  function toggleMode(mode: FavoriteMode) {
    setFavoriteModes((current) => ({
      ...current,
      [mode]: !current[mode],
    }));
  }

  function swapPlaces() {
    setOriginInput(destinationInput);
    setDestinationInput(originInput);
  }

  return (
    <main className="rumby-page">
      <section className="nz-section">
        <div className="nz-container nz-stack nz-stack--lg">
          <header className="rumby-topbar">
            <div className="nz-stack nz-stack--sm">
              <div className="nz-cluster">
                <span className="nz-badge nz-badge--brand nz-badge--no-dot">Rumby</span>
                <span className="nz-badge nz-badge--accent nz-badge--no-dot">Madrid</span>
              </div>
              <div>
                <h1 className="nz-text-h2">Planner primero</h1>
                <p className="nz-text-muted">
                  El foco ahora es preparar bien la consulta del viaje. Sin rutas inventadas y con
                  tema claro por defecto.
                </p>
              </div>
            </div>
          </header>

          <div className="rumby-planner-layout">
            <section className="nz-card">
              <form className="nz-form-grid nz-form-grid--2" onSubmit={(event) => event.preventDefault()}>
                <h2 className="nz-text-h4 nz-field--full">Configura tu viaje</h2>

                <label className="nz-field nz-field--full">
                  <span className="nz-field__label">Donde estas</span>
                  <input
                    className="nz-input nz-search"
                    list="madrid-places"
                    value={originInput}
                    onChange={(event) => setOriginInput(event.target.value)}
                    placeholder="Ejemplo: Puerta del Sol"
                  />
                </label>

                <label className="nz-field nz-field--full">
                  <span className="nz-field__label">A donde quieres ir</span>
                  <input
                    className="nz-input nz-search"
                    list="madrid-places"
                    value={destinationInput}
                    onChange={(event) => setDestinationInput(event.target.value)}
                    placeholder="Ejemplo: Atocha"
                  />
                </label>

                <div className="nz-field nz-field--full">
                  <button className="nz-btn nz-btn--ghost" type="button" onClick={swapPlaces}>
                    Intercambiar origen y destino
                  </button>
                </div>

                <div className="nz-field nz-field--full">
                  <span className="nz-field__label">Quiero</span>
                  <div className="nz-segmented">
                    <label className="nz-segmented__option">
                      <input
                        type="radio"
                        name="planning-mode"
                        checked={planningMode === "depart"}
                        onChange={() => setPlanningMode("depart")}
                      />
                      <span>Salir a esta hora</span>
                    </label>
                    <label className="nz-segmented__option">
                      <input
                        type="radio"
                        name="planning-mode"
                        checked={planningMode === "arrive"}
                        onChange={() => setPlanningMode("arrive")}
                      />
                      <span>Llegar antes de esta hora</span>
                    </label>
                  </div>
                </div>

                <label className="nz-field nz-field--full">
                  <span className="nz-field__label">
                    {planningMode === "depart" ? "Hora de salida" : "Hora limite de llegada"}
                  </span>
                  <input
                    className="nz-input"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(event) => setDateTime(event.target.value)}
                  />
                </label>

                <div className="nz-field nz-field--full">
                  <span className="nz-field__label">Metodos favoritos</span>
                  <div className="rumby-mode-grid">
                    {favoriteModeOptions.map((mode) => (
                      <label key={mode.id} className="nz-check nz-check--accent">
                        <input
                          type="checkbox"
                          checked={favoriteModes[mode.id]}
                          onChange={() => toggleMode(mode.id)}
                        />
                        <span>{mode.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="nz-callout nz-callout--info nz-field--full">
                  Puedes escribir libremente. El mapa se actualiza cuando el texto coincide con uno de
                  los lugares conocidos de Madrid. El siguiente paso real es conectar geocoding y
                  routing, no inventar una ruta.
                </div>

                <datalist id="madrid-places">
                  {madridPlaces.map((place) => (
                    <option key={place.id} value={place.name} />
                  ))}
                </datalist>
              </form>
            </section>

            <div className="nz-stack nz-stack--md">
              <section className="nz-map nz-map--hero rumby-map-shell">
                <MadridMap origin={origin} destination={destination} />

                <div className="nz-map__overlay nz-map__overlay--top-left">
                  <article className="nz-card">
                    <strong>Estado de lugares</strong>
                    <p className="nz-text-muted">
                      {origin ? `Origen resuelto: ${origin.name}` : "Origen pendiente de resolver"}
                    </p>
                    <p className="nz-text-muted">
                      {destination
                        ? `Destino resuelto: ${destination.name}`
                        : "Destino pendiente de resolver"}
                    </p>
                  </article>
                </div>
              </section>

              <article className="nz-card">
                <div className="nz-stack nz-stack--sm">
                  <span className="nz-badge nz-badge--accent nz-badge--no-dot">Resultado honesto</span>
                  <h2 className="nz-text-h4">La mejor manera exacta de ir aun no esta calculada</h2>
                  <p className="nz-text-muted">
                    Este planner ya recoge bien la intencion del viaje, tus preferencias y la vista de
                    mapa. Pero hasta conectar un motor de rutas real, Rumby no te va a inventar una
                    recomendacion exacta.
                  </p>
                  <div className="nz-stack nz-stack--sm">
                    <div className="nz-alert">
                      <strong>Origen</strong>
                      <div>{origin ? origin.name : "Pendiente de geocoding real"}</div>
                    </div>
                    <div className="nz-alert">
                      <strong>Destino</strong>
                      <div>{destination ? destination.name : "Pendiente de geocoding real"}</div>
                    </div>
                    <div className="nz-alert">
                      <strong>Favoritos</strong>
                      <div>
                        {selectedModes.length > 0
                          ? selectedModes.map((mode) => mode.label).join(", ")
                          : "Selecciona al menos un metodo favorito"}
                      </div>
                    </div>
                    <div className={readyForRealRouting ? "nz-callout nz-callout--tip" : "nz-callout nz-callout--warn"}>
                      {readyForRealRouting
                        ? "La consulta ya esta bien formada para conectarla al routing real. El siguiente paso es integrar geocoding y un motor multimodal para darte la mejor opcion de verdad."
                        : "Todavia falta resolver origen y destino conocidos, o elegir al menos un metodo favorito, antes de poder lanzar una consulta real."}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
