/** TanStack Query keys, in one place so invalidation stays consistent. */
export const queryKeys = {
  me: ['me'],
  myPlaylists: ['me', 'playlists'],
  myPlaylistsFor: (params) => ['me', 'playlists', params],
  myFavorites: ['me', 'favorites'],
  randomTracks: (limit, seed) => ['tracks', 'random', { limit, seed }],
  searchTracks: (q) => ['tracks', 'search', q],
  randomPlaylists: (limit, seed) => ['playlists', 'random', { limit, seed }],
  playlist: (id) => ['playlists', 'detail', String(id)],
  playlistTracks: (id) => ['playlists', 'detail', String(id), 'tracks'],
  user: (username) => ['users', username],
  userFavorites: (username) => ['users', username, 'favorites'],
  countries: ['reference', 'countries'],
};
