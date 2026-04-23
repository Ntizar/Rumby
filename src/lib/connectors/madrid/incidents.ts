import type { Connector } from "@/lib/connectors/types";

type TrafficIncidentSnapshot = {
  source: string;
  feed: string;
  status: string;
};

export const madridIncidentsConnector: Connector<
  TrafficIncidentSnapshot,
  TrafficIncidentSnapshot
> = {
  id: "madrid-traffic-incidents",
  city: "madrid",
  name: "Ayuntamiento de Madrid Incidents",
  category: "traffic",
  sourceUrl: "http://datos.madrid.es/egob/catalogo/202062-0-trafico-incidencias-viapublica.xml",
  auth: "none",
  status: "ready",
  description: "Conector base para incidencias urbanas de carretera dentro de Madrid.",
  async fetch() {
    return {
      source: "Ayuntamiento de Madrid",
      feed: "traffic-incidents-xml",
      status: "ready-for-live-api",
    };
  },
  async normalize(input) {
    return input;
  },
};

export const dgtIncidentsConnector: Connector<TrafficIncidentSnapshot, TrafficIncidentSnapshot> = {
  id: "dgt-datex2-incidents",
  city: "madrid",
  name: "DGT DATEX II incidents",
  category: "traffic",
  sourceUrl: "https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml",
  auth: "none",
  status: "ready",
  description: "Conector base para incidencias regionales y accesos a Madrid.",
  async fetch() {
    return {
      source: "DGT",
      feed: "datex2-v36",
      status: "ready-for-live-api",
    };
  },
  async normalize(input) {
    return input;
  },
};
