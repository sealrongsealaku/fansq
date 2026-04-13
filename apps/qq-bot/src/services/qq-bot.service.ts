import { BotConfig } from "../config";
import { GatewayPayload } from "../types";
import { InternalApiService } from "./internal-api.service";
import { logError, logInfo } from "./logger";
import { isReflectionEvent, parseReflectionSubmission } from "./qq-event-parser";

export class QqBotService {
  private readonly internalApi: InternalApiService;

  constructor(private readonly config: BotConfig) {
    this.internalApi = new InternalApiService(config);
  }

  async handleGatewayPayload(payload: GatewayPayload) {
    if (!payload.t) {
      return;
    }

    if (!isReflectionEvent(payload)) {
      return;
    }

    const submission = parseReflectionSubmission(payload);
    if (!submission) {
      logError("received group at message but failed to parse reflection payload", payload);
      return;
    }

    try {
      const result = await this.internalApi.submitReflection(submission);
      logInfo("reflection submitted from gateway event", {
        studentName: submission.studentName,
        rawMessageId: submission.rawMessageId,
        result,
      });
    } catch (error) {
      logError("failed to submit reflection to api-server", error);
    }
  }
}

