import Link from "next/link";

import { cities, madrid } from "@/lib/catalog";

const pillars = [
  {
    title: "Donde estoy",
    body: "Ubicacion, contexto cercano y movilidad disponible en una sola vista.",
  },
  {
    title: "A donde quiero ir",
    body: "Origen y destino abiertos a transporte publico, bici, taxi y nuevas capas futuras.",
  },
  {
    title: "Cuando quiero salir o llegar",
    body: "Consultas por salida y llegada como parte del flujo central, no como extra secundario.",
  },
  {
    title: "Que opcion me conviene",
    body: "Lectura tipo Flighty: fiabilidad, riesgo y mejor alternativa actual antes de perder tiempo.",
  },
];

const roadmap = [
  "MVP Madrid con GTFS EMT, realtime EMT y capas de incidencias urbanas y DGT.",
  "Conectores modulares para anadir nuevas APIs sin contaminar el core del producto.",
  "Expansion ciudad a ciudad con catalogo declarativo de fuentes, modos y restricciones.",
  "Capa IA opcional con OpenRouter para explicar y recomendar sobre datos ya calculados.",
];

export default function Home() {
  const readySources = madrid.sources.filter((source) => source.status === "ready").length;

  return (
    <main>
      <section className="nz-aurora-mesh nz-aurora-mesh--animated nz-aurora-mesh--glass nz-aurora-mesh--hero">
        <div className="nz-container">
          <div className="nz-hero nz-hero--split" style={{ paddingBlock: "var(--nz-space-8)" }}>
            <div className="nz-hero__inner">
              <span className="nz-hero__eyebrow">Madrid first · Ntizar Aurora · Flighty mindset</span>
              <h1 className="nz-hero__title">
                La macro web para decidir la <span className="nz-accent">movilidad multimodal</span>.
              </h1>
              <p className="nz-hero__sub">
                Rumby nace para explicar mejor el viaje: ruta, contexto, incidencias, riesgo y
                mejor alternativa actual. Empieza en Madrid y se prepara desde el dia uno para crecer
                por ciudades y conectores.
              </p>
              <div className="nz-hero__cta">
                <Link className="nz-btn nz-btn--primary nz-btn--lg" href="/planner">
                  Abrir planner Madrid
                </Link>
                <a className="nz-btn nz-btn--glass-liquid nz-btn--glass-liquid-aurora" data-liquid href="#sources">
                  Ver stack de datos
                </a>
              </div>
            </div>

            <div className="nz-hero__visual">
              <div className="nz-stack nz-stack--md">
                <article className="nz-card--glass-liquid nz-card--glass-liquid-aurora" data-liquid>
                  <div className="nz-stack nz-stack--sm">
                    <span className="nz-badge nz-badge--glass-brand nz-badge--no-dot">Launch city</span>
                    <h2 className="nz-text-h3">{madrid.name}</h2>
                    <p className="nz-text-muted">{madrid.summary}</p>
                    <div className="nz-cluster">
                      {madrid.modes.slice(0, 4).map((mode) => (
                        <span key={mode} className="nz-badge nz-badge--brand nz-badge--no-dot">
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>

                <div className="nz-stat-grid nz-stat-grid--2">
                  <article className="nz-kpi nz-kpi--aurora">
                    <span className="nz-kpi__label">Sources ready</span>
                    <strong className="nz-kpi__value">{readySources}</strong>
                    <span className="nz-kpi__delta">Madrid MVP</span>
                  </article>
                  <article className="nz-kpi nz-kpi--accent">
                    <span className="nz-kpi__label">Cities in catalog</span>
                    <strong className="nz-kpi__value">{cities.length}</strong>
                    <span className="nz-kpi__delta">Escalable</span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nz-section">
        <div className="nz-container nz-stack nz-stack--lg">
          <div className="nz-feature-grid">
            {pillars.map((pillar, index) => (
              <article
                key={pillar.title}
                className={index === 1 || index === 3 ? "nz-feature nz-feature--accent" : "nz-feature"}
              >
                <div className="nz-feature__icon">0{index + 1}</div>
                <h2 className="nz-feature__title">{pillar.title}</h2>
                <p className="nz-feature__body">{pillar.body}</p>
              </article>
            ))}
          </div>

          <div className="nz-grid nz-grid--2" style={{ alignItems: "start" }}>
            <article className="nz-card">
              <div className="nz-stack nz-stack--md">
                  <span className="nz-badge nz-badge--accent nz-badge--no-dot">Product vision</span>
                  <h2 className="nz-text-h2">Una UX que piense como copiloto del viaje</h2>
                  <p className="nz-text-muted">
                  Rumby no quiere listar opciones sin criterio. Quiere decirte cual parece mas
                  fiable, que esta cambiando ahora mismo y por que te conviene salir, esperar o
                  cambiar de modo antes de llegar tarde.
                </p>
                <div className="nz-stack nz-stack--sm">
                  {madrid.priorities.map((priority) => (
                    <div key={priority} className="nz-callout nz-callout--info">
                      {priority}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="nz-card--glass-liquid nz-card--glass-liquid-brand" data-liquid>
              <div className="nz-stack nz-stack--md">
                <span className="nz-badge nz-badge--primary nz-badge--no-dot">Architecture first</span>
                <h2 className="nz-text-h2">Base modular para nuevas ciudades y nuevas APIs</h2>
                <p className="nz-text-muted">
                  El repositorio ya separa ciudad, fuentes y documentacion para que cualquier mejora
                  futura entre como capa nueva y no como parche local de Madrid.
                </p>
                <div className="nz-stack nz-stack--sm">
                  {roadmap.map((item, index) => (
                    <div key={item} className="nz-alert">
                      <strong>Step 0{index + 1}</strong>
                      <div>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="nz-section" id="sources">
        <div className="nz-container nz-stack nz-stack--lg">
          <div className="nz-cluster" style={{ justifyContent: "space-between", alignItems: "end" }}>
            <div className="nz-stack nz-stack--sm">
              <span className="nz-badge nz-badge--glass-brand nz-badge--no-dot">Madrid source stack</span>
              <h2 className="nz-text-h2">Fuentes iniciales ya priorizadas</h2>
              <p className="nz-text-muted">
                Este es el bloque de datos de mayor confianza para arrancar el MVP de Madrid sin
                depender de promesas vagas ni feeds dudosos.
              </p>
            </div>
            <Link className="nz-btn nz-btn--ghost" href="/planner">
              Ver planner conceptual
            </Link>
          </div>

          <div className="nz-grid nz-grid--2" style={{ alignItems: "start" }}>
            {madrid.sources.map((source) => (
              <article key={source.name} className="nz-card">
                <div className="nz-stack nz-stack--sm">
                  <div className="nz-cluster" style={{ justifyContent: "space-between", alignItems: "start" }}>
                    <div className="nz-stack nz-stack--sm">
                      <h3 className="nz-text-h4">{source.name}</h3>
                      <p className="nz-text-muted">{source.category}</p>
                    </div>
                    <span className="nz-badge nz-badge--brand nz-badge--no-dot">{source.status}</span>
                  </div>
                  <div className="nz-grid nz-grid--2">
                    <div>
                      <div className="u-nz-text-mono">Coverage</div>
                      <p>{source.coverage}</p>
                    </div>
                    <div>
                      <div className="u-nz-text-mono">Format</div>
                      <p>{source.format}</p>
                    </div>
                  </div>
                  <div>
                    <div className="u-nz-text-mono">Auth</div>
                    <p>{source.auth}</p>
                  </div>
                  <p className="nz-text-muted">{source.note}</p>
                  <a className="nz-btn nz-btn--secondary" href={source.url} target="_blank" rel="noreferrer">
                    Ver fuente oficial
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="nz-cta-banner">
            <div>
              <h3 className="nz-cta-banner__title">Repositorio listo para crecer ciudad a ciudad</h3>
              <p className="nz-cta-banner__sub">
                El siguiente paso natural es conectar el mapa real, el primer conector EMT y la capa
                de incidencias Madrid sin mezclar producto, datos y visual en el mismo bloque.
              </p>
            </div>
            <div className="nz-cluster">
              <Link className="nz-btn nz-btn--primary" href="/planner">
                Ir al planner
              </Link>
              <a className="nz-btn nz-btn--glass" href="https://github.com/Ntizar/Ntizar-Aurora" target="_blank" rel="noreferrer">
                Ver Aurora
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
