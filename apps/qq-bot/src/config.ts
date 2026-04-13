import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";

const candidateEnvFiles = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", "..", ".env.local"),
  resolve(process.cwd(), "..", "..", ".env"),
];

candidateEnvFiles.forEach((filePath) => {
  if (existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
});

function readRequired(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.startsWith("replace_")) {
    return undefined;
  }
  return value;
}

export interface BotConfig {
  apiBaseUrl: string;
  internalApiToken: string;
  wsUrl?: string;
  appId?: string;
  token?: string;
  secret?: string;
  identifyPayload?: Record<string, unknown>;
}

export function loadConfig(): BotConfig {
  const identifyPayloadRaw = process.env.QQ_BOT_IDENTIFY_PAYLOAD;

  return {
    apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3000",
    internalApiToken: process.env.INTERNAL_API_TOKEN ?? "",
    wsUrl: readRequired("QQ_WS_URL"),
    appId: readRequired("QQ_BOT_APP_ID"),
    token: readRequired("QQ_BOT_TOKEN"),
    secret: readRequired("QQ_BOT_SECRET"),
    identifyPayload: identifyPayloadRaw ? JSON.parse(identifyPayloadRaw) : undefined,
  };
}
