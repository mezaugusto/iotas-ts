import type { IotasLogger } from '../logger.js';

import type { AccountResponse, Feature, IotasClientOptions, Residency, Rooms } from '../types.js';
import { IotasSession } from './session.js';
import { IotasTransport } from './transport.js';

const DEFAULT_RELIABLE_UPDATE_ATTEMPTS = 3;
const DEFAULT_RELIABLE_UPDATE_DELAY_MS = 500;

const defaultDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * High-level IOTAS API client.
 *
 * Provides unit resolution, room/device discovery, and feature operations.
 * Delegates authentication to IotasSession and HTTP to IotasTransport.
 */
export class IotasClient {
  private readonly log: IotasLogger;
  private readonly unitName?: string;
  private readonly transport: IotasTransport;
  private readonly reliableUpdateAttempts: number;
  private readonly reliableUpdateDelayMs: number;
  private readonly delay: (ms: number) => Promise<void>;

  private unitRequest: Promise<Rooms> | null = null;
  private featureIndex: Map<string, Feature> | null = null;
  private unit = 0;

  constructor(options: IotasClientOptions) {
    this.log = options.log;
    this.unitName = options.unitName;
    this.reliableUpdateAttempts = options.reliableUpdate?.attempts ?? DEFAULT_RELIABLE_UPDATE_ATTEMPTS;
    this.reliableUpdateDelayMs = options.reliableUpdate?.delayMs ?? DEFAULT_RELIABLE_UPDATE_DELAY_MS;
    this.delay = options.delay ?? defaultDelay;

    const session = new IotasSession({
      log: options.log,
      email: options.email,
      authenticate: options.authenticate,
      onTokensChanged: options.onTokensChanged,
      initialTokens: options.initialTokens,
      baseUrl: options.baseUrl,
      authRetryDelaysMs: options.authRetryDelaysMs,
      fetch: options.fetch,
      delay: options.delay,
    });
    this.transport = new IotasTransport({
      session,
      baseUrl: options.baseUrl,
      maxRequestAuthRetries: options.maxRequestAuthRetries,
      fetch: options.fetch,
    });
  }

  static withCredentials(
    log: IotasLogger,
    email: string,
    password: string,
    unitName?: string,
    options?: Pick<IotasClientOptions, 'fetch' | 'delay'>,
  ): IotasClient {
    return new IotasClient({
      log,
      email,
      unitName,
      authenticate: async () => ({ username: email, password }),
      ...options,
    });
  }

  async initialize(): Promise<void> {
    if (this.unit !== 0) {
      return;
    }

    const account = await this.transport.request<AccountResponse>('/account/me');
    this.log.info('Found account id', account.id);

    const residencies = await this.transport.request<Residency[]>(`/account/${account.id}/residency`);

    if (residencies.length === 0) {
      this.log.error('Unable to find any units. Abandoning...');
      throw new Error('Unable to find any units');
    }

    this.log.info('Found unit(s):', residencies.map((r) => r.unitName).join(', '));

    if (this.unitName) {
      const customUnit = residencies.find((r) => r.unitName === this.unitName);
      if (customUnit) {
        this.unit = customUnit.unit;
        this.log.info('Using custom unit:', this.unitName);
        return;
      }
      this.log.warn('Could not find unit', this.unitName, ', using default');
    }

    this.unit = residencies[0].unit;
    this.log.info(
      'Using first unit found:',
      residencies[0].unitName,
      '. If you would like to use a custom unit, please set the "unit" property in the config.',
    );
  }

  async getRooms(): Promise<Rooms> {
    await this.initialize();

    if (this.unitRequest !== null) {
      return this.unitRequest;
    }

    this.unitRequest = this.transport.request<Rooms>(`/unit/${this.unit}/rooms`);
    this.unitRequest.finally(() => {
      this.unitRequest = null;
    });

    const rooms = await this.unitRequest;
    this.buildFeatureIndex(rooms);
    return rooms;
  }

  async getFeature(featureId: string): Promise<Feature | null> {
    if (!this.featureIndex) {
      await this.getRooms();
    }
    return this.featureIndex?.get(featureId) ?? null;
  }

  private buildFeatureIndex(rooms: Rooms): void {
    this.featureIndex = new Map();
    for (const room of rooms) {
      for (const device of room.devices) {
        for (const feature of device.features) {
          this.featureIndex.set(feature.id.toString(), feature);
        }
      }
    }
  }

  async updateFeature(featureId: string, value: number): Promise<void> {
    await this.transport.request(`/feature/${encodeURIComponent(featureId)}/value`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  async updateFeatureReliable(featureId: string, value: number): Promise<void> {
    for (let attempt = 0; attempt < this.reliableUpdateAttempts; attempt++) {
      await this.updateFeature(featureId, value);
      if (attempt < this.reliableUpdateAttempts - 1) {
        await this.delay(this.reliableUpdateDelayMs);
      }
    }
  }
}
