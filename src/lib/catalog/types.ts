export type SourceStatus = "ready" | "planned" | "research";

export type MobilitySource = {
  name: string;
  category: string;
  coverage: string;
  format: string;
  auth: string;
  status: SourceStatus;
  url: string;
  note: string;
};

export type CityDefinition = {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  summary: string;
  modes: string[];
  priorities: string[];
  sources: MobilitySource[];
};
