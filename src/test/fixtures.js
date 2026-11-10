/** Sample data shaped like the API's responses (music-db seed names). */

export const ana = {
  user_id: 2,
  username: 'ana.garcia',
  display_name: 'Ana García',
  country_code: 'MX',
  bio: 'Road trips and Sunday boleros.',
  avatar_url: null,
  owned_playlist_count: 9,
  favorite_count: 3,
  role: 'listener',
};

export const ben = { user_id: 3, username: 'ben.carter', display_name: 'Ben Carter' };
export const diego = { user_id: 4, username: 'diego.ramos', display_name: 'Diego Ramos' };

const ref = ({ user_id, username, display_name }) => ({ user_id, username, display_name });

export function playlist(overrides = {}) {
  return {
    playlist_id: 20,
    name: 'Road Trip',
    description: 'Songs for the drive. Add yours!',
    visibility: 'public',
    cover_url: null,
    owner: ref(ana),
    is_collaborative: false,
    track_count: 7,
    duration_ms: 2_100_000,
    follower_count: 3,
    version: 4,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    ...overrides,
  };
}

export function track(overrides = {}) {
  return {
    track_id: 4199,
    name: 'One More Time',
    duration_ms: 320_000,
    duration: '5:20',
    artists: ['Daft Punk'],
    album: { album_id: 412, title: 'Discovery', slug: 'discovery', artist_slug: 'daft-punk' },
    ...overrides,
  };
}

export const tokens = {
  access_token: 'access-1',
  token_type: 'Bearer',
  expires_in: 900,
  refresh_token: 'refresh-1',
  refresh_token_expires_in: 1_209_600,
};

/** `GET /me/following/playlists` shape. */
export const followedPage = (playlists) => ({
  items: playlists.map((p) => ({ followed_at: '2026-11-02T10:00:00Z', playlist: p })),
  limit: 100,
  offset: 0,
  total: playlists.length,
});

export { ref };
