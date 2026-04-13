import { GatewayPayload, NormalizedReflectionSubmission } from "../types";

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stripMentions(content: string): string {
  return content
    .replace(/<@!?\w+>/g, "")
    .replace(/^@\S+\s*/u, "")
    .trim();
}

export function isReflectionEvent(payload: GatewayPayload): boolean {
  return payload.t === "GROUP_AT_MESSAGE_CREATE" || payload.t === "AT_MESSAGE_CREATE";
}

export function parseReflectionSubmission(
  payload: GatewayPayload,
): NormalizedReflectionSubmission | null {
  const data = asObject(payload.d);
  if (!data) return null;

  const member = asObject(data.member);
  const author = asObject(data.author);

  const studentName =
    asString(member?.nick) ??
    asString(member?.name) ??
    asString(author?.username) ??
    asString(author?.nick);

  const rawContent = asString(data.content);
  const content = rawContent ? stripMentions(rawContent) : undefined;

  if (!studentName || !content) {
    return null;
  }

  return {
    studentName,
    submitContent: content,
    submitTime: new Date().toISOString(),
    submitChannel: "qq_group_bot",
    sourceGroupId:
      asString(data.group_id) ??
      asString(data.group_openid) ??
      asString(data.channel_id),
    sourceGroupName:
      asString(data.group_name) ??
      asString(data.channel_name) ??
      asString(data.guild_name),
    rawMessageId: asString(data.id) ?? asString(data.message_id),
  };
}

