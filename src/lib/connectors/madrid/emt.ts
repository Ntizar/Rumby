import type { Connector } from "@/lib/connectors/types";

type EmtTransitSnapshot = {
  line: string;
  operator: string;
  status: string;
};

export const emtConnector: Connector<EmtTransitSnapshot, EmtTransitSnapshot> = {
  id: "emt-mobilitylabs",
  city: "madrid",
  name: "EMT MobilityLabs",
  category: "transit-realtime",
  sourceUrl: "https://mobilitylabs.emtmadrid.es/",
  auth: "api-key",
  status: "ready",
  description: "Conector base para tiempo real EMT y enriquecimiento operativo.",
  async fetch() {
    return {
      line: "Exprs. Aero",
      operator: "EMT Madrid",
      status: "ready-for-live-api",
    };
  },
  async normalize(input) {
    return input;
  },
};
