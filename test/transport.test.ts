import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import { IotasTransport } from '../src/api/transport.js';
import type { IotasSession } from '../src/api/session.js';

describe('IotasTransport', () => {
  let mockSession: IotasSession;
  let mockFetch: ReturnType<typeof mock.fn<typeof fetch>>;
  let transport: IotasTransport;

  const mockToken = 'mock-bearer-token';

  beforeEach(() => {
    mockFetch = mock.fn<typeof fetch>();
    mockSession = {
      getToken: mock.fn(async () => mockToken),
      invalidateToken: mock.fn(),
    } as unknown as IotasSession;

    transport = new IotasTransport({ session: mockSession, fetch: mockFetch as typeof fetch });
  });

  describe('request', () => {
    it('should make authenticated requests with Bearer token', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ id: 1 }), { status: 200 });
      });

      const result = await transport.request<{ id: number }>('/account/me');

      assert.deepStrictEqual(result, { id: 1 });
      const reqInit = mockFetch.mock.calls[0].arguments[1] as RequestInit;
      const headers = new Headers(reqInit.headers);
      assert.strictEqual(headers.get('Authorization'), `Bearer ${mockToken}`);
    });

    it('should handle empty response body', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response('', { status: 202, headers: { 'Content-Length': '0' } });
      });

      await assert.doesNotReject(async () => {
        await transport.request('/feature/100/value', { method: 'PUT', body: '{}' });
      });
    });

    it('should retry once on 401 after invalidating token', async () => {
      let callCount = 0;
      mockFetch.mock.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response('Unauthorized', { status: 401 });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      const result = await transport.request<{ ok: boolean }>('/test');

      assert.deepStrictEqual(result, { ok: true });
      assert.strictEqual(mockFetch.mock.callCount(), 2);
      const invalidateMock = mockSession.invalidateToken as unknown as ReturnType<typeof mock.fn>;
      assert.strictEqual(invalidateMock.mock.callCount(), 1);
    });

    it('should throw after exhausting 401 retries', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response('Unauthorized', { status: 401 });
      });

      await assert.rejects(async () => transport.request('/test'), {
        message: 'API request failed: unauthorized after token refresh retry',
      });
    });

    it('should throw on non-401 error responses', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });

      await assert.rejects(async () => transport.request('/test'), {
        message: 'API request failed: 500 Internal Server Error',
      });
    });
    it('should preserve headers passed as Headers instance', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      await transport.request('/test', {
        headers: new Headers({ 'X-Custom': 'custom-value' }),
      });

      const options = mockFetch.mock.calls[0].arguments[1] as RequestInit;
      const headers = new Headers(options.headers);
      assert.strictEqual(headers.get('X-Custom'), 'custom-value');
      assert.strictEqual(headers.get('Authorization'), `Bearer ${mockToken}`);
    });

    it('should not allow callers to override Authorization header', async () => {
      mockFetch.mock.mockImplementation(async () => {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      });

      await transport.request('/test', {
        headers: { Authorization: 'Basic evil' },
      });

      const options = mockFetch.mock.calls[0].arguments[1] as RequestInit;
      const headers = new Headers(options.headers);
      assert.strictEqual(headers.get('Authorization'), `Bearer ${mockToken}`);
    });
  });
});
