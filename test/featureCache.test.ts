import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import { FeatureCache } from '../src/cache/featureCache.js';
import type { IotasClient } from '../src/api/iotasClient.js';
import type { IotasLogger } from '../src/logger.js';
import type { Rooms } from '../src/types.js';

describe('FeatureCache', () => {
  let cache: FeatureCache;
  let mockLog: IotasLogger;
  let mockClient: IotasClient;

  const internals = () =>
    cache as unknown as {
      pollTimer: ReturnType<typeof setTimeout> | null;
      writeTimestamps: Map<string, number>;
      updateFromSnapshot: (rooms: Rooms) => void;
    };

  const createMockRooms = (features: Array<{ id: number; value: number }>): Rooms => [
    {
      id: 1,
      unit: 1,
      name: 'Living Room',
      devices: [
        {
          id: 10,
          room: 1,
          deviceTemplateId: 1,
          deviceType: 1,
          name: 'Light',
          category: 'light',
          active: true,
          movable: false,
          secure: false,
          paired: true,
          features: features.map((f) => ({
            id: f.id,
            device: 10,
            value: f.value,
            featureType: 1,
            featureTypeName: 'Light',
            featureTypeCategory: 'light',
            featureTypeSettable: true,
            name: 'Light',
            isLight: true,
          })),
        },
      ],
    },
  ];

  beforeEach(() => {
    mockLog = {
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
      debug: mock.fn(),
    } as unknown as IotasLogger;

    mockClient = {
      getRooms: mock.fn(),
      updateFeature: mock.fn(),
    } as unknown as IotasClient;

    cache = new FeatureCache(mockLog, mockClient, { pollIntervalMs: 1000 });
  });

  describe('seed', () => {
    it('should populate cache from rooms snapshot', () => {
      const rooms = createMockRooms([
        { id: 100, value: 0.5 },
        { id: 101, value: 72 },
      ]);

      cache.seed(rooms);

      assert.strictEqual(cache.get('100'), 0.5);
      assert.strictEqual(cache.get('101'), 72);
    });

    it('should return undefined for unknown features', () => {
      cache.seed(createMockRooms([]));
      assert.strictEqual(cache.get('999'), undefined);
    });
  });

  describe('set', () => {
    it('should update cached value', () => {
      cache.seed(createMockRooms([{ id: 100, value: 0 }]));

      cache.set('100', 1);

      assert.strictEqual(cache.get('100'), 1);
    });

    it('should set write barrier for subsequent poll updates', () => {
      cache.set('100', 1);
      assert.strictEqual(cache.get('100'), 1);
    });
  });

  describe('subscribe', () => {
    it('should return a disposer function', () => {
      const callback = mock.fn();
      const disposer = cache.subscribe(['100'], callback);

      assert.strictEqual(typeof disposer, 'function');
    });

    it('should unsubscribe when disposer is called', () => {
      const callback = mock.fn();
      const disposer = cache.subscribe(['100'], callback);
      disposer();

      internals().updateFromSnapshot(createMockRooms([{ id: 100, value: 1 }]));

      assert.strictEqual(callback.mock.callCount(), 0);
    });
  });

  describe('start/stop', () => {
    it('should be idempotent for multiple start calls', () => {
      cache.start();
      const firstTimer = internals().pollTimer;

      cache.start();
      const secondTimer = internals().pollTimer;

      assert.ok(firstTimer);
      assert.strictEqual(secondTimer, firstTimer);

      cache.stop();
    });

    it('should be idempotent for multiple stop calls', () => {
      cache.start();
      cache.stop();
      cache.stop();

      assert.strictEqual(internals().pollTimer, null);
    });

    it('should not start after stop', () => {
      cache.stop();
      cache.start();

      assert.strictEqual(internals().pollTimer, null);
    });
  });

  describe('notifications', () => {
    it('should notify subscribers when watched feature changes', () => {
      cache.seed(createMockRooms([{ id: 100, value: 0 }]));
      const callback = mock.fn();
      cache.subscribe(['100'], callback);

      internals().updateFromSnapshot(createMockRooms([{ id: 100, value: 1 }]));

      assert.strictEqual(callback.mock.callCount(), 1);
      const changed = callback.mock.calls[0].arguments[0] as Map<string, number>;
      assert.strictEqual(changed.size, 1);
      assert.strictEqual(changed.get('100'), 1);
    });

    it('should not notify subscribers when watched feature is unchanged', () => {
      cache.seed(createMockRooms([{ id: 100, value: 0 }]));
      const callback = mock.fn();
      cache.subscribe(['100'], callback);

      internals().updateFromSnapshot(createMockRooms([{ id: 100, value: 0 }]));

      assert.strictEqual(callback.mock.callCount(), 0);
    });

    it('should only include relevant changed features in callback payload', () => {
      cache.seed(
        createMockRooms([
          { id: 100, value: 0 },
          { id: 200, value: 0 },
        ]),
      );
      const callback = mock.fn();
      cache.subscribe(['100'], callback);

      internals().updateFromSnapshot(
        createMockRooms([
          { id: 100, value: 1 },
          { id: 200, value: 5 },
        ]),
      );

      assert.strictEqual(callback.mock.callCount(), 1);
      const changed = callback.mock.calls[0].arguments[0] as Map<string, number>;
      assert.strictEqual(changed.size, 1);
      assert.strictEqual(changed.get('100'), 1);
      assert.strictEqual(changed.has('200'), false);
    });
  });

  describe('write barrier', () => {
    it('should ignore poll snapshot within write barrier window', () => {
      cache.seed(createMockRooms([{ id: 100, value: 0 }]));

      cache.set('100', 1);
      internals().updateFromSnapshot(createMockRooms([{ id: 100, value: 0 }]));

      assert.strictEqual(cache.get('100'), 1);
    });

    it('should accept snapshot after write barrier window expires', () => {
      cache.seed(createMockRooms([{ id: 100, value: 0 }]));

      cache.set('100', 1);
      internals().writeTimestamps.set('100', Date.now() - 6_000);
      internals().updateFromSnapshot(createMockRooms([{ id: 100, value: 0 }]));

      assert.strictEqual(cache.get('100'), 0);
    });
  });

  describe('reset', () => {
    it('should clear all state and allow restart', () => {
      cache.seed(createMockRooms([{ id: 100, value: 1 }]));
      cache.start();

      cache.reset();

      // Values should be cleared
      assert.strictEqual(cache.get('100'), undefined);

      // Should be able to start again
      cache.seed(createMockRooms([{ id: 100, value: 0.5 }]));
      cache.start();
      cache.stop();

      assert.strictEqual(cache.get('100'), 0.5);
    });
  });

  describe('writeThrough', () => {
    it('should call both set() and client.updateFeature()', () => {
      cache.seed(createMockRooms([{ id: 100, value: 0 }]));

      cache.writeThrough('100', 1);

      assert.strictEqual(cache.get('100'), 1);

      const updateFeatureMock = (mockClient as unknown as { updateFeature: ReturnType<typeof mock.fn> }).updateFeature;
      assert.strictEqual(updateFeatureMock.mock.callCount(), 1);
      assert.deepStrictEqual(updateFeatureMock.mock.calls[0].arguments, ['100', 1]);
    });

    it('should set write barrier for subsequent poll updates', () => {
      cache.seed(createMockRooms([{ id: 100, value: 0 }]));

      cache.writeThrough('100', 1);

      internals().updateFromSnapshot(createMockRooms([{ id: 100, value: 0 }]));
      assert.strictEqual(cache.get('100'), 1);
    });
  });
});
