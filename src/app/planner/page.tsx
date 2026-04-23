"use client";

import Link from "next/link";

import { MadridMap } from "@/components/map/madrid-map";
import { madrid } from "@/lib/catalog";
import { dgtIncidentsConnector, emtConnector, madridIncidentsConnector } from "@/lib/connectors";
import { madridSnapshot } from "@/lib/domain/madrid-snapshot";

const connectors = [emtConnector, madridIncidentsConnector, dgtIncidentsConnector];

export default function PlannerPage() {
  const bestOption = madridSnapshot.alternatives[0];

  return (
    <main className="nz-app-shell rumby-shell" style={{ minHeight: "100vh" }}>
      <aside className="nz-app-shell__sidebar">
        <strong>Rumby</strong>
        <nav className="nz-stack">
          <span className="nz-nav-section">Madrid</span>
          <Link className="nz-nav-item is-active" href="/planner">
            Planner
          </Link>
          <Link className="nz-nav-item" href="/">
            Vision
          </Link>
          <a className="nz-nav-item" href="https://mobilitylabs.emtmadrid.es/" target="_blank" rel="noreferrer">
            EMT data
          </a>
        </nav>
      </aside>

      <div className="nz-app-shell__main">
        <header className="nz-app-shell__header">
          <div>
            <h1 className="nz-text-h4">Planner Madrid</h1>
            <p className="nz-text-muted">Salida, llegada, mapa real y contexto multimodal en un mismo flujo.</p>
          </div>
          <div className="nz-cluster">
            <Link className="nz-btn nz-btn--ghost" href="/">
              Volver
            </Link>
            <a
              className="nz-btn nz-btn--primary"
              href="https://datos.emtmadrid.es/dataset/gtfs-de-emtmadrid"
              target="_blank"
              rel="noreferrer"
            >
              GTFS EMT
            </a>
          </div>
        </header>

        <div className="nz-stack nz-stack--lg">
          <div className="nz-grid nz-grid--2" style={{ alignItems: "start" }}>
            <form className="nz-card nz-form-grid nz-form-grid--2">
              <h2 className="nz-text-h4 nz-field--full">Configura el trayecto</h2>

              <label className="nz-field nz-field--full">
                <span className="nz-field__label">Donde estas</span>
                <input className="nz-input nz-search" defaultValue={madridSnapshot.origin.name} />
              </label>

              <label className="nz-field nz-field--full">
                <span className="nz-field__label">A donde quieres ir</span>
                <input className="nz-input nz-search" defaultValue={madridSnapshot.destination.name} />
              </label>

              <label className="nz-field">
                <span className="nz-field__label">Salir a las</span>
                <input className="nz-input" type="datetime-local" defaultValue="2026-04-24T08:15" />
              </label>

              <label className="nz-field">
                <span className="nz-field__label">Llegar antes de</span>
                <input className="nz-input" type="datetime-local" defaultValue="2026-04-24T09:00" />
              </label>

              <div className="nz-field nz-field--full">
                <span className="nz-field__label">Modos previstos para el MVP</span>
                <div className="nz-cluster">
                  {madrid.modes.map((mode) => (
                    <span key={mode} className="nz-chip nz-chip--neutral">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>

              <div className="nz-field nz-field--full">
                <span className="nz-field__label">Decision engine</span>
                <div className="nz-callout nz-callout--tip">
                  La recomendacion final mezcla duracion, transbordos, caminata, incidencias y
                  fiabilidad observada por fuente.
                </div>
              </div>

              <button className="nz-btn nz-btn--primary nz-btn--block nz-field--full" type="submit">
                Calcular rutas
              </button>
            </form>

            <section className="nz-map nz-map--hero nz-map--glass rumby-map-shell">
              <MadridMap
                destination={madridSnapshot.destination}
                incidents={madridSnapshot.incidents}
                origin={madridSnapshot.origin}
              />

              <div className="nz-map__overlay nz-map__overlay--top-left">
                <article className="nz-card">
                  <strong>{bestOption.title}</strong>
                  <p className="nz-text-muted">
                    {madridSnapshot.origin.name} → {madridSnapshot.destination.name}
                  </p>
                  <p>
                    {bestOption.durationMinutes} min · {bestOption.transfers} transbordo · {bestOption.walkingMinutes} min caminando
                  </p>
                </article>
              </div>

              <div className="nz-map__overlay nz-map__overlay--top-right">
                <article className="nz-card--glass-liquid nz-card--glass-liquid-brand" data-liquid>
                  <div className="nz-stack nz-stack--sm">
                    <span className="nz-badge nz-badge--primary nz-badge--no-dot">Why this route</span>
                    <strong>{bestOption.reliabilityScore}/100 de fiabilidad</strong>
                    <p className="nz-text-muted">{bestOption.decisionWhy}</p>
                  </div>
                </article>
              </div>

              <div className="nz-map__legend nz-map__overlay--bottom-right">
                <span>
                  <i className="nz-map__pin"></i> Origen / intercambio
                </span>
                <span>
                  <i className="nz-map__pin nz-map__pin--accent"></i> Incidencia con riesgo
                </span>
                <span>
                  <i className="nz-map__pin nz-map__pin--success"></i> Opcion recomendada
                </span>
              </div>
            </section>
          </div>

          <div className="nz-stat-grid nz-stat-grid--4">
            <article className="nz-kpi nz-kpi--aurora">
              <span className="nz-kpi__label">Transit static</span>
              <strong className="nz-kpi__value">GTFS</strong>
              <span className="nz-kpi__delta">EMT ready</span>
            </article>
            <article className="nz-kpi nz-kpi--accent">
              <span className="nz-kpi__label">Realtime</span>
              <strong className="nz-kpi__value">API</strong>
              <span className="nz-kpi__delta">MobilityLabs</span>
            </article>
            <article className="nz-kpi">
              <span className="nz-kpi__label">Traffic city</span>
              <strong className="nz-kpi__value">XML</strong>
              <span className="nz-kpi__delta">Ayuntamiento</span>
            </article>
            <article className="nz-kpi">
              <span className="nz-kpi__label">Regional traffic</span>
              <strong className="nz-kpi__value">DATEX II</strong>
              <span className="nz-kpi__delta">DGT</span>
            </article>
          </div>

          <div className="nz-grid nz-grid--2" style={{ alignItems: "start" }}>
            <article className="nz-card">
              <div className="nz-stack nz-stack--sm">
                <h2 className="nz-text-h4">Alternativas de ejemplo</h2>
                {madridSnapshot.alternatives.map((itinerary) => (
                  <div key={itinerary.id} className="nz-alert">
                    <strong>{itinerary.title}</strong>
                    <div>
                      {itinerary.durationMinutes} min · score {itinerary.reliabilityScore} · {itinerary.transfers} transbordos
                    </div>
                    <div>{itinerary.decisionWhy}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="nz-card">
              <div className="nz-stack nz-stack--sm">
                <h2 className="nz-text-h4">Conectores de arranque</h2>
                {connectors.map((connector) => (
                  <div key={connector.id} className="nz-callout nz-callout--info">
                    <strong>{connector.name}</strong>
                    <div>{connector.description}</div>
                    <div className="nz-text-muted">
                      {connector.category} · auth {connector.auth} · {connector.status}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  );
}
