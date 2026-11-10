import { api } from './client';

/*
 * Every API call the UI makes, by area. Words follow the API (track, follow); the UI says
 * song and favorite (UI-Design.md § Vocabulary).
 */

// Auth (S1, S2) ---------------------------------------------------------------------------------

export const login = (username, password) =>
  api('/auth/login', { method: 'POST', body: { username, password }, auth: false });

export const logout = (refreshToken) =>
  api('/auth/logout', { method: 'POST', body: { refresh_token: refreshToken }, auth: false });

export const signUp = (account) => api('/users', { method: 'POST', body: account, auth: false });

// Me ----------------------------------------------------------------------------------------------

export const getMe = ({ signal } = {}) => api('/me', { signal });

/** My playlists. `role=owner` for the add menu (G-09); `contains_track` marks "✓ Added" (G-08). */
export const getMyPlaylists = (
  { role = 'owner', sort = 'created', containsTrack, limit = 100 } = {},
  signal,
) => api('/me/playlists', { query: { role, sort, contains_track: containsTrack, limit }, signal });

/** My favorites, A–Z (D-04). The API answers `{ items: [{ followed_at, playlist }] }`. */
export const getMyFavorites = async ({ signal } = {}) => {
  const page = await api('/me/following/playlists', { query: { sort: 'name', limit: 100 }, signal });
  return page.items.map(({ followed_at, playlist }) => ({ ...playlist, favorited_at: followed_at }));
};

/** Favorite a playlist; `replaces` swaps one out in the same transaction (G-01). */
export const favoritePlaylist = (playlistId, replaces) =>
  api(`/me/following/playlists/${playlistId}`, {
    method: 'PUT',
    body: replaces != null ? { replaces } : undefined,
  });

export const unfavoritePlaylist = (playlistId) =>
  api(`/me/following/playlists/${playlistId}`, { method: 'DELETE' });

// Catalog -----------------------------------------------------------------------------------------

/** Random songs (G-05). `exclude` leaves out songs already on screen. */
export const getRandomTracks = ({ limit = 20, exclude } = {}, signal) =>
  api('/tracks/random', { query: { limit, exclude }, signal });

/** Song search over title, artist and album, ignoring case and accents (G-12). */
export const searchTracks = ({ q, limit = 20, offset = 0 }, signal) =>
  api('/tracks', { query: { q, limit, offset }, signal });

export const getCountries = ({ signal } = {}) => api('/reference/countries', { signal, auth: false });

// Playlists ---------------------------------------------------------------------------------------

/** Random public playlists by other people that I haven't favorited (G-06, BR-07). */
export const getRandomPlaylists = ({ limit = 12, exclude } = {}, signal) =>
  api('/playlists/random', { query: { limit, exclude }, signal });

export const getPlaylist = (playlistId, { signal } = {}) => api(`/playlists/${playlistId}`, { signal });

export const getPlaylistTracks = (playlistId, { signal } = {}) =>
  api(`/playlists/${playlistId}/tracks`, { query: { limit: 100 }, signal });

/** New playlists are always private (G-10): the body never carries `visibility`. */
export const createPlaylist = ({ name, description, trackIds }) =>
  api('/playlists', {
    method: 'POST',
    body: { name, description: description || undefined, track_ids: trackIds?.length ? trackIds : undefined },
  });

/** Only the changed fields, with `If-Match` (BR-15). */
export const updatePlaylist = (playlistId, changes, version) =>
  api(`/playlists/${playlistId}`, { method: 'PATCH', body: changes, ifMatch: version });

export const deletePlaylist = (playlistId) => api(`/playlists/${playlistId}`, { method: 'DELETE' });

export const addTracks = (playlistId, trackIds, version, position) =>
  api(`/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: { track_ids: trackIds, position },
    ifMatch: version,
  });

export const removeTrackAt = (playlistId, position, version) =>
  api(`/playlists/${playlistId}/tracks/${position}`, { method: 'DELETE', ifMatch: version });

// Users -------------------------------------------------------------------------------------------

export const getUser = (username, { signal } = {}) =>
  api(`/users/${encodeURIComponent(username)}`, { signal });

/** Someone's favorites, A–Z (G-02). Favorites are always public (D-05). */
export const getUserFavorites = async (username, { signal } = {}) => {
  const list = await api(`/users/${encodeURIComponent(username)}/favorites`, {
    query: { sort: 'name' },
    signal,
  });
  return list.items;
};
