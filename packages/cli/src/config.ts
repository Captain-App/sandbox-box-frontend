import Conf from "conf";

export interface Config {
  apiKey?: string;
  baseUrl?: string;
}

const schema = {
  apiKey: {
    type: "string",
  },
  baseUrl: {
    type: "string",
    default: "https://backend.shipbox.dev",
  },
} as const;

export const configStore = new Conf<Config>({
  projectName: "shipbox",
  schema,
});

export function getApiKey(): string | undefined {
  return process.env.SHIPBOX_API_KEY || configStore.get("apiKey");
}

export function getBaseUrl(): string {
  return (
    process.env.SHIPBOX_BASE_URL ||
    configStore.get("baseUrl") ||
    "https://backend.shipbox.dev"
  );
}
