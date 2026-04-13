import WebSocket from "ws";
import { BotConfig } from "../config";
import { GatewayPayload } from "../types";
import { HeartbeatManager } from "../services/heartbeat";
import { logError, logInfo } from "../services/logger";

type PayloadHandler = (payload: GatewayPayload) => Promise<void> | void;

export class GatewayClient {
  private socket: WebSocket | null = null;
  private heartbeat = new HeartbeatManager();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelayMs = 3000;
  private sequence: number | null = null;

  constructor(
    private readonly config: BotConfig,
    private readonly onPayload: PayloadHandler,
  ) {}

  connect() {
    if (!this.config.wsUrl) {
      logInfo("QQ_WS_URL not configured, websocket client will stay idle");
      return;
    }

    logInfo(`connecting to gateway: ${this.config.wsUrl}`);
    this.socket = new WebSocket(this.config.wsUrl);

    this.socket.on("open", () => {
      logInfo("gateway connected");
    });

    this.socket.on("message", async (message: WebSocket.RawData) => {
      try {
        const payload = JSON.parse(message.toString()) as GatewayPayload;

        if (typeof payload.s === "number") {
          this.sequence = payload.s;
        }

        if (payload.op === 10) {
          this.handleHello(payload);
        }

        await this.onPayload(payload);
      } catch (error) {
        logError("failed to process gateway payload", error);
      }
    });

    this.socket.on("close", () => {
      logError("gateway connection closed");
      this.heartbeat.stop();
      this.scheduleReconnect();
    });

    this.socket.on("error", (error: Error) => {
      logError("gateway error", error);
    });
  }

  private handleHello(payload: GatewayPayload) {
    const interval = Number(
      (payload.d as Record<string, unknown> | null | undefined)?.heartbeat_interval ?? 30000,
    );

    this.heartbeat.start(interval, () => {
      this.send({
        op: 1,
        d: this.sequence,
      });
    });

    if (this.config.identifyPayload) {
      this.send(this.config.identifyPayload);
      logInfo("identify payload sent from QQ_BOT_IDENTIFY_PAYLOAD");
      return;
    }

    logInfo(
      "received hello payload; heartbeat started. identify payload is not configured, so only passive event logging is active",
    );
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelayMs);
  }

  private send(payload: unknown) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(payload));
  }
}
