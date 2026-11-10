import { http, HttpResponse } from 'msw/http';
import { api as apiUrl, server } from '@/test/server';
import { ApiError, api, buildUrl, isApiError } from './client';
import { getAccessToken, getRefreshToken, onSessionEnd, saveTokens } from './session';

const expired = () => saveTokens({ access_token: 'old', expires_in: 0, refresh_token: 'refresh-1' });
const fresh = () => saveTokens({ access_token: 'good', expires_in: 900, refresh_token: 'refresh-1' });

describe('buildUrl', () => {
  it('builds an absolute URL and skips empty params; arrays are comma-separated', () => {
    const url = new URL(buildUrl('/tracks/random', { limit: 20, exclude: [1, 2], q: '', x: undefined }));
    expect(url.pathname).toBe('/api/v1/tracks/random');
    expect(url.searchParams.get('limit')).toBe('20');
    expect(url.searchParams.get('exclude')).toBe('1,2');
    expect(url.searchParams.has('q')).toBe(false);
  });
});

describe('api client', () => {
  it('sends the access token and If-Match, and parses JSON', async () => {
    fresh();
    let seen;
    server.use(
      http.post(apiUrl('/playlists/20/tracks'), async ({ request }) => {
        seen = {
          auth: request.headers.get('authorization'),
          ifMatch: request.headers.get('if-match'),
          body: await request.json(),
        };
        return HttpResponse.json({ playlist_id: 20, version: 5 });
      }),
    );
    const data = await api('/playlists/20/tracks', { method: 'POST', body: { track_ids: [1] }, ifMatch: 4 });
    expect(data).toEqual({ playlist_id: 20, version: 5 });
    expect(seen).toEqual({ auth: 'Bearer good', ifMatch: '"4"', body: { track_ids: [1] } });
  });

  it('turns the error envelope into an ApiError', async () => {
    server.use(
      http.post(apiUrl('/playlists'), () =>
        HttpResponse.json(
          {
            error: {
              code: 'validation_failed',
              message: "'name' must not be blank.",
              details: [{ field: 'name', message: 'must not be blank' }],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const error = await api('/playlists', { method: 'POST', body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(isApiError(error, 422, 'validation_failed')).toBe(true);
    expect(error.fieldMessage('name')).toBe('must not be blank');
  });

  it('reports a network failure as status 0', async () => {
    server.use(http.get(apiUrl('/me'), () => HttpResponse.error()));
    const error = await api('/me').catch((e) => e);
    expect(isApiError(error, 0, 'network_error')).toBe(true);
  });

  it('refreshes an expiring token once, even for parallel requests (single-use refresh tokens)', async () => {
    expired();
    let refreshes = 0;
    server.use(
      http.post(apiUrl('/auth/refresh'), async ({ request }) => {
        refreshes += 1;
        expect(await request.json()).toEqual({ refresh_token: 'refresh-1' });
        return HttpResponse.json({ access_token: 'new', expires_in: 900, refresh_token: 'refresh-2' });
      }),
      http.get(apiUrl('/me'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }),
      ),
    );
    const results = await Promise.all([api('/me'), api('/me'), api('/me')]);
    expect(refreshes).toBe(1);
    expect(results.every((r) => r.auth === 'Bearer new')).toBe(true);
    expect(getRefreshToken()).toBe('refresh-2');
  });

  it('retries once after a 401 and a successful refresh', async () => {
    fresh();
    server.use(
      http.post(apiUrl('/auth/refresh'), () =>
        HttpResponse.json({ access_token: 'new', expires_in: 900, refresh_token: 'refresh-2' }),
      ),
      http.get(apiUrl('/me'), ({ request }) =>
        request.headers.get('authorization') === 'Bearer new'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ error: { code: 'invalid_token' } }, { status: 401 }),
      ),
    );
    await expect(api('/me')).resolves.toEqual({ ok: true });
    expect(getAccessToken()).toBe('new');
  });

  it('ends the session when the refresh fails', async () => {
    expired();
    const ended = vi.fn();
    const unsubscribe = onSessionEnd(ended);
    server.use(
      http.post(apiUrl('/auth/refresh'), () =>
        HttpResponse.json({ error: { code: 'invalid_token' } }, { status: 401 }),
      ),
      // Public reads still work without a token.
      http.get(apiUrl('/playlists/20'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }),
      ),
    );
    await expect(api('/playlists/20')).resolves.toEqual({ auth: null });
    expect(ended).toHaveBeenCalledWith('expired');
    expect(getRefreshToken()).toBeNull();
    unsubscribe();
  });

  it('skips the token for auth: false', async () => {
    fresh();
    server.use(
      http.post(apiUrl('/auth/login'), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get('authorization') }),
      ),
    );
    await expect(api('/auth/login', { method: 'POST', body: {}, auth: false })).resolves.toEqual({
      auth: null,
    });
  });

  it('returns null for 204 No Content', async () => {
    fresh();
    server.use(http.delete(apiUrl('/playlists/20'), () => new HttpResponse(null, { status: 204 })));
    await expect(api('/playlists/20', { method: 'DELETE' })).resolves.toBeNull();
  });
});
