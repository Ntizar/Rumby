export type ConnectorCategory =
  | "transit-static"
  | "transit-realtime"
  | "traffic"
  | "bike"
  | "parking"
  | "taxi"
  | "other";

export type ConnectorDefinition = {
  id: string;
  city: string;
  name: string;
  category: ConnectorCategory;
  sourceUrl: string;
  auth: "none" | "api-key" | "oauth" | "unknown";
  status: "ready" | "planned" | "research";
  description: string;
};

export type Connector<TInput = unknown, TOutput = unknown> = ConnectorDefinition & {
  fetch: () => Promise<TInput>;
  normalize: (input: TInput) => Promise<TOutput>;
};
