import { createHash } from "node:crypto";
import { AppError } from "../../shared/errors/app-error.js";

interface AttemptWindow {
  failures: number;
  resetsAt: number;
}

interface RequestWindow {
  count: number;
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

class FixedWindowRequests {
  private readonly requests = new Map<string, RequestWindow>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maximumEntries: number,
  ) {}

  consume(key: string, now: Date): number | null {
    const timestamp = now.getTime();
    const current = this.requests.get(key);

    if (!current || current.resetsAt <= timestamp) {
      this.makeRoom(timestamp);
      this.requests.set(key, { count: 1, resetsAt: timestamp + this.windowMs });
      return null;
    }

    if (current.count >= this.limit) {
      return Math.max(1, Math.ceil((current.resetsAt - timestamp) / 1_000));
    }

    current.count += 1;
    return null;
  }

  private makeRoom(now: number): void {
    if (this.requests.size < this.maximumEntries) return;
    for (const [key, entry] of this.requests) {
      if (entry.resetsAt <= now) this.requests.delete(key);
    }
    if (this.requests.size >= this.maximumEntries) {
      const oldestKey = this.requests.keys().next().value;
      if (oldestKey) this.requests.delete(oldestKey);
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
    const accountHash = hashValue(email);
    return { network, pair: network + ":" + accountHash };
  }
}

export class RecoveryRateLimiter {
  private readonly forgotPasswordNetwork = new FixedWindowRequests(20, 15 * 60_000, 10_000);
  private readonly forgotPasswordAccount = new FixedWindowRequests(3, 60 * 60_000, 20_000);
  private readonly resetPasswordNetwork = new FixedWindowRequests(30, 15 * 60_000, 10_000);
  private readonly resetPasswordToken = new FixedWindowRequests(8, 15 * 60_000, 20_000);

  consumeForgotPassword(ipAddress: string, email: string, now = new Date()): void {
    const networkKey = ipAddress || "unknown";
    const accountKey = hashValue(email);
    const retryAfter = Math.max(
      this.forgotPasswordNetwork.consume(networkKey, now) ?? 0,
      this.forgotPasswordAccount.consume(accountKey, now) ?? 0,
    );

    if (retryAfter > 0) {
      throw new AppError(
        429,
        "PASSWORD_RECOVERY_RATE_LIMITED",
        "Too many password recovery requests. Please try again later.",
        { retryAfterSeconds: retryAfter },
      );
    }
  }

  consumeResetPassword(ipAddress: string, token: string, now = new Date()): void {
    const networkKey = ipAddress || "unknown";
    const tokenKey = hashValue(token);
    const retryAfter = Math.max(
      this.resetPasswordNetwork.consume(networkKey, now) ?? 0,
      this.resetPasswordToken.consume(tokenKey, now) ?? 0,
    );

    if (retryAfter > 0) {
      throw new AppError(
        429,
        "PASSWORD_RECOVERY_RATE_LIMITED",
        "Too many password recovery requests. Please try again later.",
        { retryAfterSeconds: retryAfter },
      );
    }
  }
}

function hashValue(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
