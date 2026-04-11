import type { IotasSession } from './session.js';

const DEFAULT_BASE_URL = 'https://api.iotashome.com/api/v1';
const DEFAULT_MAX_REQUEST_AUTH_RETRIES = 1;

export interface IotasTransportOptions {
  session: IotasSession;
  baseUrl?: string;
  maxRequestAuthRetries?: number;
  fetch?: typeof fetch;
}

/**
 * Authenticated HTTP transport for the IOTAS API.
 *
 * Handles bearer token injection, 401 retry with token invalidation,
 * and empty response body parsing.
 */
export class IotasTransport {
  private readonly session: IotasSession;
  private readonly baseUrl: string;
  private readonly maxRequestAuthRetries: number;
  private readonly fetch: typeof globalThis.fetch;

  constructor(options: IotasTransportOptions) {
    this.session = options.session;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.maxRequestAuthRetries = options.maxRequestAuthRetries ?? DEFAULT_MAX_REQUEST_AUTH_RETRIES;
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(path: string, options: RequestInit = {}, authRetryCount = 0): Promise<T> {
    const token = await this.session.getToken();

    const response = await this.fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      if (authRetryCount >= this.maxRequestAuthRetries) {
        throw new Error('API request failed: unauthorized after token refresh retry');
      }

      this.session.invalidateToken();
      return this.request(path, options, authRetryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses (e.g., from PUT/DELETE requests)
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }
}
