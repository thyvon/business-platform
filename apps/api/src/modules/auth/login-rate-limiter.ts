import { createHash } from "node:crypto";
import { AppError } from "../../shared/errors/app-error.js";

interface AttemptWindow {
  failures: number;
  resetsAt: number;
}

class FixedWindowFailures {
  private readonly attempts = new Map<string, AttemptWindow>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maximumEntries: number,
  ) {}

  retryAfterSeconds(key: string, now: Date): number | null {
    const entry = this.attempts.get(key);
    if (!entry) return null;
    if (entry.resetsAt <= now.getTime()) {
      this.attempts.delete(key);
      return null;
    }
    return entry.failures >= this.limit
      ? Math.max(1, Math.ceil((entry.resetsAt - now.getTime()) / 1_000))
      : null;
  }

  recordFailure(key: string, now: Date): void {
    const timestamp = now.getTime();
    const current = this.attempts.get(key);
    if (!current || current.resetsAt <= timestamp) {
      this.makeRoom(timestamp);
      this.attempts.set(key, { failures: 1, resetsAt: timestamp + this.windowMs });
      return;
    }
    current.failures += 1;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  private makeRoom(now: number): void {
    if (this.attempts.size < this.maximumEntries) return;
    for (const [key, entry] of this.attempts) {
      if (entry.resetsAt <= now) this.attempts.delete(key);
    }
    if (this.attempts.size >= this.maximumEntries) {
      const oldestKey = this.attempts.keys().next().value;
      if (oldestKey) this.attempts.delete(oldestKey);
    }
  }
}

export class LoginRateLimiter {
  private readonly network = new FixedWindowFailures(30, 15 * 60_000, 10_000);
  private readonly networkAndAccount = new FixedWindowFailures(5, 15 * 60_000, 20_000);

  assertAllowed(ipAddress: string, email: string, now = new Date()): void {
    const keys = this.keys(ipAddress, email);
    const retryAfter = Math.max(
      this.network.retryAfterSeconds(keys.network, now) ?? 0,
      this.networkAndAccount.retryAfterSeconds(keys.pair, now) ?? 0,
    );

    if (retryAfter > 0) {
      throw new AppError(
        429,
        "LOGIN_RATE_LIMITED",
        "Too many login attempts. Please try again later.",
        { retryAfterSeconds: retryAfter },
      );
    }
  }

  recordFailure(ipAddress: string, email: string, now = new Date()): void {
    const keys = this.keys(ipAddress, email);
    this.network.recordFailure(keys.network, now);
    this.networkAndAccount.recordFailure(keys.pair, now);
  }

  recordSuccess(ipAddress: string, email: string): void {
    const keys = this.keys(ipAddress, email);
    this.networkAndAccount.reset(keys.pair);
  }

  private keys(ipAddress: string, email: string) {
    const network = ipAddress || "unknown";
    const accountHash = createHash("sha256").update(email, "utf8").digest("hex");
    return { network, pair: network + ":" + accountHash };
  }
}