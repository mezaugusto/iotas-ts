import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import { IotasClient } from '../src/api/iotasClient.js';
import type { IotasLogger } from '../src/logger.js';
import type { IotasClientOptions } from '../src/types.js';

describe('IotasClient', () => {
  let client: IotasClient;
  let mockLog: IotasLogger;
  let mockFetch: ReturnType<typeof mock.fn<typeof fetch>>;

  const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature';

  const createOptions = (overrides?: Partial<IotasClientOptions>): IotasClientOptions => ({
    log: mockLog,
    email: 'test@example.com',
    authenticate: async () => ({ username: 'test@example.com', password: 'password123' }),
    fetch: mockFetch as typeof fetch,
    delay: async () => {},
    ...overrides,
  });

  const setupStandardMock = () => {
    let callIndex = 0;
    mockFetch.mock.mockImplementation(async () => {
      callIndex++;
      if (callIndex === 1) {
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
      } else if (callIndex === 2) {
        return new Response(JSON.stringify({ id: 123, email: 'test@example.com' }), { status: 200 });
      } else if (callIndex === 3) {
        return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
      } else {
        return new Response(JSON.stringify([{ id: 1, name: 'Living Room', devices: [] }]), { status: 200 });
      }
    });
  };

  beforeEach(() => {
    mockLog = {
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
      debug: mock.fn(),
    } as unknown as IotasLogger;

    mockFetch = mock.fn<typeof fetch>();
    client = new IotasClient(createOptions());
  });

  describe('getRooms', () => {
    it('should authenticate, resolve unit, and return rooms', async () => {
      setupStandardMock();

      const rooms = await client.getRooms();

      assert.strictEqual(mockFetch.mock.callCount(), 4);
      assert.strictEqual(rooms.length, 1);
      assert.strictEqual(rooms[0].name, 'Living Room');
    });
  });

  describe('unit resolution', () => {
    it('should use custom unit when specified', async () => {
      const clientWithUnit = new IotasClient(createOptions({ unitName: 'Custom Unit' }));

      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(
            JSON.stringify([
              { unit: 1, unitName: 'Unit 1' },
              { unit: 2, unitName: 'Custom Unit' },
            ]),
            { status: 200 },
          );
        } else {
          return new Response(JSON.stringify([]), { status: 200 });
        }
      });

      await clientWithUnit.getRooms();

      const infoMock = mockLog.info as unknown as ReturnType<typeof mock.fn>;
      assert.ok(
        infoMock.mock.calls.some(
          (call) => call.arguments[0] === 'Using custom unit:' && call.arguments[1] === 'Custom Unit',
        ),
      );
    });

    it('should fall back to first unit when custom unit not found', async () => {
      const clientWithUnit = new IotasClient(createOptions({ unitName: 'Nonexistent' }));

      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(JSON.stringify([]), { status: 200 });
        }
      });

      await clientWithUnit.getRooms();

      const warnMock = mockLog.warn as unknown as ReturnType<typeof mock.fn>;
      assert.ok(
        warnMock.mock.calls.some(
          (call) => call.arguments[0] === 'Could not find unit' && call.arguments[1] === 'Nonexistent',
        ),
      );
    });
  });

  describe('getFeature', () => {
    it('should find feature by ID', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(
            JSON.stringify([
              {
                id: 1,
                name: 'Living Room',
                devices: [
                  {
                    id: 10,
                    features: [
                      { id: 100, value: 1, eventTypeName: 'OnOff' },
                      { id: 101, value: 72, eventTypeName: 'Temperature' },
                    ],
                  },
                ],
              },
            ]),
            { status: 200 },
          );
        }
      });

      const feature = await client.getFeature('101');
      assert.ok(feature !== null);
      assert.strictEqual(feature.value, 72);
    });

    it('should return null when feature is not found', async () => {
      setupStandardMock();

      const feature = await client.getFeature('999');
      assert.strictEqual(feature, null);
    });

    it('should use cached index without extra HTTP calls', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(
            JSON.stringify([
              {
                id: 1,
                name: 'Room',
                devices: [
                  {
                    id: 10,
                    features: [
                      { id: 100, value: 1 },
                      { id: 200, value: 2 },
                    ],
                  },
                ],
              },
            ]),
            { status: 200 },
          );
        }
      });

      const f1 = await client.getFeature('100');
      const callsAfterFirst = mockFetch.mock.callCount();
      const f2 = await client.getFeature('200');
      const callsAfterSecond = mockFetch.mock.callCount();

      assert.ok(f1 !== null);
      assert.strictEqual(f1.value, 1);
      assert.ok(f2 !== null);
      assert.strictEqual(f2.value, 2);
      assert.strictEqual(
        callsAfterSecond,
        callsAfterFirst,
        'Second getFeature should not trigger additional HTTP calls',
      );
    });
  });

  describe('updateFeature', () => {
    it('should make PUT request with correct body', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else {
          return new Response(JSON.stringify({}), { status: 200 });
        }
      });

      await client.updateFeature('100', 1);

      const putCall = mockFetch.mock.calls[1];
      const url = putCall.arguments[0] as string;
      const options = putCall.arguments[1] as RequestInit;
      assert.ok(url.includes('/feature/100/value'));
      assert.strictEqual(options.method, 'PUT');
      assert.deepStrictEqual(JSON.parse(options.body as string), { value: 1 });
    });

    it('should handle empty response body (HTTP 202)', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else {
          return new Response('', { status: 202, headers: { 'Content-Length': '0' } });
        }
      });

      await assert.doesNotReject(async () => {
        await client.updateFeature('100', 0.5);
      });
    });
  });

  describe('updateFeatureReliable', () => {
    it('should send redundant updates for Z-Wave reliability', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else {
          return new Response(JSON.stringify({}), { status: 200 });
        }
      });

      await client.updateFeatureReliable('100', 0);

      assert.strictEqual(mockFetch.mock.callCount(), 4);

      for (let i = 1; i <= 3; i++) {
        const call = mockFetch.mock.calls[i];
        const url = call.arguments[0] as string;
        const options = call.arguments[1] as RequestInit;
        assert.ok(url.includes('/feature/100/value'), `Call ${i} should target feature endpoint`);
        assert.strictEqual(options.method, 'PUT');
        assert.deepStrictEqual(JSON.parse(options.body as string), { value: 0 });
      }
    });
  });

  describe('withCredentials factory', () => {
    it('should create a functional client', async () => {
      const factoryClient = IotasClient.withCredentials(mockLog, 'test@example.com', 'password123', undefined, {
        fetch: mockFetch as typeof fetch,
      });

      setupStandardMock();

      await factoryClient.getRooms();
      assert.strictEqual(mockFetch.mock.callCount(), 4);
    });
  });
});
