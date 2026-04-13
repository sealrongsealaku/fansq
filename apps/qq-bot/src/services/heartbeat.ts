export class HeartbeatManager {
  private timer: NodeJS.Timeout | null = null;

  start(intervalMs: number, callback: () => void) {
    this.stop();
    this.timer = setInterval(callback, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

