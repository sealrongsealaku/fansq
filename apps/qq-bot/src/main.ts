import { loadConfig } from "./config";
import { GatewayClient } from "./client/gateway-client";
import { logInfo } from "./services/logger";
import { QqBotService } from "./services/qq-bot.service";

const config = loadConfig();
const botService = new QqBotService(config);
const gatewayClient = new GatewayClient(config, (payload) =>
  botService.handleGatewayPayload(payload),
);

logInfo("service bootstrapped");
logInfo(`api base url: ${config.apiBaseUrl}`);
logInfo(`ws url: ${config.wsUrl ?? "not-configured"}`);

gatewayClient.connect();
