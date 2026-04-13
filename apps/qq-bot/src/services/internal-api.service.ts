import axios from "axios";
import { BotConfig } from "../config";
import { NormalizedReflectionSubmission } from "../types";

export class InternalApiService {
  private readonly client;

  constructor(private readonly config: BotConfig) {
    this.client = axios.create({
      baseURL: `${config.apiBaseUrl}/api`,
      headers: {
        "X-Internal-Token": config.internalApiToken,
      },
      timeout: 10000,
    });
  }

  async submitReflection(payload: NormalizedReflectionSubmission) {
    const response = await this.client.post("/internal/reflections/qq-submit", {
      student_name: payload.studentName,
      submit_content: payload.submitContent,
      submit_time: payload.submitTime,
      submit_channel: payload.submitChannel,
      source_group_id: payload.sourceGroupId,
      source_group_name: payload.sourceGroupName,
      raw_message_id: payload.rawMessageId,
    });

    return response.data;
  }
}

