export function logInfo(message: string, extra?: unknown) {
  if (extra !== undefined) {
    console.log(`[qq-bot] ${message}`, extra);
    return;
  }
  console.log(`[qq-bot] ${message}`);
}

export function logError(message: string, extra?: unknown) {
  if (extra !== undefined) {
    console.error(`[qq-bot] ${message}`, extra);
    return;
  }
  console.error(`[qq-bot] ${message}`);
}

