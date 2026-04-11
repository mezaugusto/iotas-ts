import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import { IotasSession } from '../src/api/session.js';
import type { IotasLogger } from '../src/logger.js';
import type { IotasSessionOptions } from '../src/api/session.js';

describe('IotasSession', () => {
  let mockLog: IotasLogger;
  let mockFetch: ReturnType<typeof mock.fn<typeof fetch>>;

  const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature';

  const createOptions = (overrides?: Partial<IotasSessionOptions>): IotasSessionOptions => ({
    log: mockLog,
    email: 'test@example.com',
    authenticate: async () => ({ username: 'test@example.com', password: 'password123' }),
    fetch: mockFetch as typeof fetch,
    delay: async () => {},
    ...overrides,
  });

  beforeEach(() => {
    mockLog = {
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
      debug: mock.fn(),
    } as unknown as IotasLogger;
    mockFetch = mock.fn<typeof fetch>();
  });

  describe('getToken', () => {
    it('should authenticate and return a token', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
      });

      const session = new IotasSession(createOptions());
      const token = await session.getToken();

      assert.strictEqual(token, mockJwt);
      assert.strictEqual(mockFetch.mock.callCount(), 1);
      const url = mockFetch.mock.calls[0].arguments[0] as string;
      assert.ok(url.includes('/auth/tokenwithrefresh'));
    });

    it('should use Basic auth for initial authentication', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
      });

      const session = new IotasSession(createOptions());
      await session.getToken();

      const options = mockFetch.mock.calls[0].arguments[1] as RequestInit;
      assert.ok((options.headers as Record<string, string>).Authorization.startsWith('Basic '));
    });

    it('should return cached token when not expired', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
      });

      const session = new IotasSession(createOptions());
      await session.getToken();
      mockFetch.mock.resetCalls();

      const token = await session.getToken();

      assert.strictEqual(token, mockJwt);
      assert.strictEqual(mockFetch.mock.callCount(), 0);
    });
  });

  describe('initialTokens', () => {
    it('should skip authentication when valid tokens are provided', async () => {
      const session = new IotasSession(
        createOptions({
          initialTokens: { jwt: mockJwt, refresh: 'cached-refresh' },
        }),
      );

      const token = await session.getToken();

      assert.strictEqual(token, mockJwt);
      assert.strictEqual(mockFetch.mock.callCount(), 0);
    });
  });

  describe('onTokensChanged', () => {
    it('should be called after successful authentication', async () => {
      const onTokensChanged = mock.fn();
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
      });

      const session = new IotasSession(createOptions({ onTokensChanged }));
      await session.getToken();

      assert.strictEqual(onTokensChanged.mock.callCount(), 1);
      const tokens = onTokensChanged.mock.calls[0].arguments[0];
      assert.strictEqual(tokens.jwt, mockJwt);
      assert.strictEqual(tokens.refresh, 'refresh-token');
    });
  });

  describe('invalidateToken', () => {
    it('should force re-authentication on next getToken call', async () => {
      let callCount = 0;
      mockFetch.mock.mockImplementation(async () => {
        callCount++;
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: `refresh-${callCount}` }), { status: 200 });
      });

      const session = new IotasSession(createOptions());
      await session.getToken();
      session.invalidateToken();
      await session.getToken();

      assert.strictEqual(mockFetch.mock.callCount(), 2);
    });
  });
});
