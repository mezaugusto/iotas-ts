import type { IotasLogger } from '../logger.js';

import { getWriteBarrierMs } from '../quirks.js';
import { DEFAULT_WRITE_BARRIER_MS } from '../defaults.js';
import type { FeatureCacheOptions, Rooms } from '../types.js';

const DEFAULT_POLL_INTERVAL_MS = 30_000;
const DEFAULT_POLL_BACKOFF_BASE_MS = 5_000;
const DEFAULT_POLL_BACKOFF_MAX_MS = 300_000; // 5 minutes max

export type FeatureChangeCallback = (changed: Map<string, number>) => void;

export type SnapshotFilter = (rooms: Rooms) => Rooms;

/** Internal interface for sending feature updates to the API. */
export interface FeatureUpdater {
  updateFeature(featureId: string, value: number): void;
}

interface WriteBarrier {
  timestamp: number;
  durationMs: number;
  pendingValue: number;
}

interface Subscription {
  featureIds: Set<string>;
  callback: FeatureChangeCallback;
}

/**
 * FeatureCache provides cached feature values with background polling.
 *
 * - Seeded from discovery snapshot (no cold-start defaults)
 * - Single getRooms() call per poll cycle
 * - Per-device write barriers prevent stale poll data overwriting recent writes
 * - Smart pending-value matching: confirming snapshots are accepted early
 * - Subscription model for pushing updates via updateValue
 */
export class FeatureCache {
  private readonly values = new Map<string, number>();
  private readonly writeBarriers = new Map<string, WriteBarrier>();
  private readonly subscriptions = new Set<Subscription>();

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private consecutiveFailures = 0;
  private stopped = false;

  private readonly pollIntervalMs: number;
  private readonly pollBackoffBaseMs: number;
  private readonly pollBackoffMaxMs: number;
  private readonly snapshotFilter?: SnapshotFilter;

  constructor(
    private readonly log: IotasLogger,
    private readonly client: FeatureUpdater & { getRooms(): Promise<Rooms> },
    options?: FeatureCacheOptions,
  ) {
    this.pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.pollBackoffBaseMs = options?.pollBackoffBaseMs ?? DEFAULT_POLL_BACKOFF_BASE_MS;
    this.pollBackoffMaxMs = options?.pollBackoffMaxMs ?? DEFAULT_POLL_BACKOFF_MAX_MS;
    this.snapshotFilter = options?.snapshotFilter;
  }

  seed(rooms: Rooms): void {
    for (const room of rooms) {
      for (const device of room.devices) {
        for (const feature of device.features) {
          if (feature.value !== undefined) {
            this.values.set(feature.id.toString(), feature.value);
          }
        }
      }
    }
    this.log.debug(`FeatureCache seeded with ${this.values.size} feature values`);
  }

  get(featureId: string): number | undefined {
    return this.values.get(featureId);
  }

  set(featureId: string, value: number): void {
    this.values.set(featureId, value);
    this.writeBarriers.set(featureId, {
      timestamp: Date.now(),
      durationMs: DEFAULT_WRITE_BARRIER_MS,
      pendingValue: value,
    });
  }

  /**
   * Write-through: sets cache value with write barrier AND sends the update
   * to the IOTAS API in one call.
   */
  writeThrough(featureId: string, value: number): void {
    this.set(featureId, value);
    this.client.updateFeature(featureId, value);
  }

  /**
   * Subscribe to feature changes. Callback is invoked when any of the
   * specified features are updated by the poller.
   * Returns a dispose function to unsubscribe.
   */
  subscribe(featureIds: string[], callback: FeatureChangeCallback): () => void {
    const subscription: Subscription = {
      featureIds: new Set(featureIds),
      callback,
    };
    this.subscriptions.add(subscription);

    return () => {
      this.subscriptions.delete(subscription);
    };
  }

  start(): void {
    if (this.stopped || this.pollTimer !== null) {
      return; // Already running or stopped
    }
    this.log.debug('FeatureCache polling started');
    this.schedulePoll(this.pollIntervalMs);
  }

  stop(): void {
    this.stopped = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.consecutiveFailures = 0;
    this.log.debug('FeatureCache polling stopped');
  }

  /**
   * Reset for a fresh start (used when re-discovering devices).
   *
   * This clears all cached values, write barriers, and subscriptions.
   * Callers must re-register subscriptions after calling reset().
   *
   * Expected call order:
   * 1) reset()
   * 2) seed(rooms)
   * 3) recreate accessory runtimes (which re-subscribe)
   * 4) start()
   */
  reset(): void {
    this.stop();
    this.stopped = false;
    this.values.clear();
    this.writeBarriers.clear();
    this.subscriptions.clear();
  }

  private schedulePoll(delayMs: number): void {
    if (this.stopped) {
      return;
    }
    this.pollTimer = setTimeout(() => this.poll(), delayMs);
  }

  private async poll(): Promise<void> {
    if (this.stopped) {
      return;
    }

    try {
      let rooms = await this.client.getRooms();
      if (this.snapshotFilter) {
        rooms = this.snapshotFilter(rooms);
      }
      this.updateFromSnapshot(rooms);
      this.consecutiveFailures = 0;
      this.schedulePoll(this.pollIntervalMs);
    } catch (error) {
      this.consecutiveFailures++;
      const backoffMs = Math.min(
        this.pollBackoffBaseMs * Math.pow(2, this.consecutiveFailures - 1),
        this.pollBackoffMaxMs,
      );
      this.log.error(
        `FeatureCache poll failed (attempt ${this.consecutiveFailures}), retrying in ${backoffMs / 1000}s:`,
        error,
      );
      this.schedulePoll(backoffMs);
    }
  }

  private updateFromSnapshot(rooms: Rooms): void {
    const now = Date.now();
    const changedFeatureIds = new Set<string>();

    for (const room of rooms) {
      for (const device of room.devices) {
        const deviceBarrierMs = getWriteBarrierMs(device);

        for (const feature of device.features) {
          if (feature.value === undefined) {
            continue;
          }

          const featureId = feature.id.toString();
          const barrier = this.writeBarriers.get(featureId);

          if (barrier) {
            const effectiveBarrierMs = Math.max(barrier.durationMs, deviceBarrierMs);

            if (feature.value === barrier.pendingValue) {
              // Snapshot confirms our write — accept and clear barrier
              this.writeBarriers.delete(featureId);
            } else if (now - barrier.timestamp < effectiveBarrierMs) {
              // Conflicting value within barrier window — skip stale data
              continue;
            } else {
              // Barrier expired — accept snapshot regardless
              this.writeBarriers.delete(featureId);
            }
          }

          const oldValue = this.values.get(featureId);
          if (oldValue !== feature.value) {
            this.values.set(featureId, feature.value);
            changedFeatureIds.add(featureId);
          }
        }
      }
    }

    // Notify subscribers of changed features
    if (changedFeatureIds.size > 0) {
      this.notifySubscribers(changedFeatureIds);
    }
  }

  private notifySubscribers(changedFeatureIds: Set<string>): void {
    for (const subscription of this.subscriptions) {
      const changed = new Map<string, number>();
      for (const id of subscription.featureIds) {
        if (changedFeatureIds.has(id)) {
          const value = this.values.get(id);
          if (value !== undefined) {
            changed.set(id, value);
          }
        }
      }
      if (changed.size > 0) {
        try {
          subscription.callback(changed);
        } catch (error) {
          this.log.error('FeatureCache subscription callback error:', error);
        }
      }
    }
  }
}
