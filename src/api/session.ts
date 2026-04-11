import type { IotasLogger } from '../logger.js';

import type { AuthResponse, IotasTokens } from '../types.js';
import { isTokenExpired } from './jwt.js';

const DEFAULT_BASE_URL = 'https://api.iotashome.com/api/v1';
const DEFAULT_AUTH_RETRY_DELAYS_MS = [60_000, 300_000, 600_000] as const;

const defaultDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export interface IotasSessionOptions {
  log: IotasLogger;
  email: string;
  authenticate: () => Promise<{ username: string; password: string }>;
  onTokensChanged?: (tokens: IotasTokens) => void;
  initialTokens?: IotasTokens;
  baseUrl?: string;
  authRetryDelaysMs?: number[];
  /** Injected fetch function for testing. Default: globalThis.fetch */
  fetch?: typeof fetch;
  /** Injected delay function for testing. Default: setTimeout-based sleep */
  delay?: (ms: number) => Promise<void>;
}

/**
 * Manages authentication and token lifecycle for the IOTAS API.
 *
 * Handles initial auth, token refresh, JWT expiry checks,
 * retry with backoff, and request deduplication.
 */
export class IotasSession {
  private token: string | null = null;
  private refreshToken = '';
  private authenticateRequest: Promise<string> | null = null;

  private readonly log: IotasLogger;
  private readonly email: string;
  private readonly authenticateFn: () => Promise<{ username: string; password: string }>;
  private readonly onTokensChanged?: (tokens: IotasTokens) => void;
  private readonly baseUrl: string;
  private readonly authRetryDelaysMs: readonly number[];
  private readonly fetch: typeof globalThis.fetch;
  private readonly delay: (ms: number) => Promise<void>;

  constructor(options: IotasSessionOptions) {
    this.log = options.log;
    this.email = options.email;
    this.authenticateFn = options.authenticate;
    this.onTokensChanged = options.onTokensChanged;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.authRetryDelaysMs = options.authRetryDelaysMs ?? DEFAULT_AUTH_RETRY_DELAYS_MS;
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.delay = options.delay ?? defaultDelay;

    if (options.initialTokens) {
      this.token = options.initialTokens.jwt;
      this.refreshToken = options.initialTokens.refresh;
    }
  }

  async getToken(): Promise<string> {
    if (this.token === null) {
      return this.authenticate();
    }

    try {
      if (isTokenExpired(this.token)) {
        return this.refreshAccessToken();
      }
      return this.token;
    } catch {
      return this.authenticate();
    }
  }

  invalidateToken(): void {
    this.token = null;
  }

  private async authenticate(): Promise<string> {
    if (this.authenticateRequest !== null) {
      return this.authenticateRequest;
    }

    this.authenticateRequest = this.authenticateWithRetry();
    this.authenticateRequest.finally(() => {
      this.authenticateRequest = null;
    });

    return this.authenticateRequest;
  }

  private async authenticateWithRetry(): Promise<string> {
    let lastError: unknown;
    const maxRetries = this.authRetryDelaysMs.length;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { username, password } = await this.authenticateFn();
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        const response = await this.fetch(`${this.baseUrl}/auth/tokenwithrefresh`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as AuthResponse;
        this.refreshToken = data.refresh;
        this.token = data.jwt;
        this.onTokensChanged?.({ jwt: this.token, refresh: this.refreshToken });
        return this.token;
      } catch (error) {
        lastError = error;

        if (attempt >= maxRetries) {
          break;
        }

        const delayMs = this.authRetryDelaysMs[attempt];
        this.log.error('Authentication error:', error instanceof Error ? error.message : String(error));
        this.log.warn(
          `Authentication retry ${attempt + 1}/${maxRetries} scheduled in ${Math.round(delayMs / 1000)} seconds.`,
        );
        await this.delay(delayMs);
      }
    }

    throw new Error(`Authentication failed after ${maxRetries + 1} attempts: ${String(lastError)}`);
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.authenticateRequest !== null) {
      return this.authenticateRequest;
    }

    this.authenticateRequest = (async () => {
      try {
        const response = await this.fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: this.refreshToken,
            email: this.email,
          }),
        });

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = (await response.json()) as { jwt: string };
        this.token = data.jwt;
        this.onTokensChanged?.({ jwt: this.token, refresh: this.refreshToken });
        return this.token;
      } catch (error) {
        this.log.error('Token refresh error:', error instanceof Error ? error.message : String(error));
        this.authenticateRequest = null;
        return this.authenticateWithRetry();
      }
    })();

    this.authenticateRequest.finally(() => {
      this.authenticateRequest = null;
    });

    return this.authenticateRequest;
  }
}
