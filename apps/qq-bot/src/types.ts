export interface GatewayPayload {
  op?: number;
  s?: number | null;
  t?: string | null;
  id?: string;
  d?: Record<string, unknown> | null;
}

export interface NormalizedReflectionSubmission {
  studentName: string;
  submitContent: string;
  submitTime: string;
  submitChannel: "qq_group_bot";
  sourceGroupId?: string;
  sourceGroupName?: string;
  rawMessageId?: string;
}

