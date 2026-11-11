import {
  buildAddMenu,
  favoriteMessage,
  filterByName,
  isLastFavorite,
  othersWithFavorite,
  replaceConsequence,
  unfavoriteMessage,
  visibilityBadge,
} from './rules';

const me = { username: 'ana.garcia' };
const mine = (extra) => ({ name: 'Road Trip', owner: { username: 'ana.garcia' }, ...extra });
const bens = (extra) => ({ name: 'Vinyl Sundays', owner: { username: 'ben.carter' }, ...extra });

describe('visibilityBadge (BR-12)', () => {
  it('shows visitors just "Playlist"', () => {
    expect(visibilityBadge(bens({ visibility: 'public' }), { isOwner: false })).toEqual({
      text: 'Playlist',
      locked: false,
    });
  });

  it('tells the owner whether it is public, and why', () => {
    expect(visibilityBadge(mine({ visibility: 'public' }), { isOwner: true, isFavorite: true }).text).toBe(
      'Public playlist · on your profile',
    );
    expect(
      visibilityBadge(mine({ visibility: 'public', follower_count: 2 }), { isOwner: true, isFavorite: false })
        .text,
    ).toBe("Public playlist · in 2 people's favorites");
    expect(
      visibilityBadge(mine({ visibility: 'public', follower_count: 1 }), { isOwner: true, isFavorite: false })
        .text,
    ).toBe("Public playlist · in 1 person's favorites");
    expect(visibilityBadge(mine({ visibility: 'private' }), { isOwner: true, isFavorite: false })).toEqual({
      text: 'Private playlist · only you',
      locked: true,
    });
  });
});

describe('favorites and visibility', () => {
  it('counts the other people who have it', () => {
    expect(othersWithFavorite({ follower_count: 3 }, true)).toBe(2);
    expect(othersWithFavorite({ follower_count: 3 }, false)).toBe(3);
    expect(othersWithFavorite({ follower_count: 0 }, true)).toBe(0);
  });

  it('says what replacing a favorite does to it', () => {
    expect(replaceConsequence(mine({ follower_count: 3 }), me)).toBe('stays public · 2 others have it');
    expect(replaceConsequence(bens({ follower_count: 2 }), me)).toBe('stays public · 1 other has it');
    expect(replaceConsequence(mine({ follower_count: 1 }), me)).toBe('becomes private');
    expect(replaceConsequence(bens({ follower_count: 1 }), me)).toBe(
      "becomes private · you can't open it again",
    );
  });

  it("asks first only for someone else's playlist that only I have (BR-13)", () => {
    expect(isLastFavorite(bens({ follower_count: 1 }), me)).toBe(true);
    expect(isLastFavorite(bens({ follower_count: 2 }), me)).toBe(false);
    expect(isLastFavorite(mine({ follower_count: 1 }), me)).toBe(false);
  });

  it('words the toasts from the API answer', () => {
    expect(unfavoriteMessage('Road Trip', { isOwn: true, state: { visibility: 'private' } })).toBe(
      'Road Trip is now private',
    );
    expect(
      unfavoriteMessage('Road Trip', { isOwn: true, state: { visibility: 'public', follower_count: 2 } }),
    ).toBe('Road Trip left your profile. It stays public while 2 people have it as a favorite.');
    expect(unfavoriteMessage('Night Drive', { isOwn: false, state: {} })).toBe(
      'Removed Night Drive from favorites',
    );
    expect(favoriteMessage('Road Trip', { isOwn: true, state: { my_favorite_count: 4 } })).toBe(
      'Road Trip is now public and on your profile · 4 of 5',
    );
    expect(favoriteMessage('Night Drive', { isOwn: false, state: { my_favorite_count: 2 } })).toBe(
      'Added Night Drive to favorites · 2 of 5',
    );
  });
});

describe('buildAddMenu (S4)', () => {
  const playlists = [
    { playlist_id: 1, name: 'Workout', track_count: 20, last_added_at: null },
    {
      playlist_id: 2,
      name: 'boleros',
      track_count: 4,
      contains_track: true,
      last_added_at: '2026-11-01T00:00:00Z',
    },
    { playlist_id: 3, name: 'Road Trip', track_count: 7, last_added_at: '2026-11-09T00:00:00Z' },
    { playlist_id: 4, name: 'Night Drive', track_count: 12 },
  ];

  it('lists every playlist A–Z with its count or status', () => {
    const { items } = buildAddMenu(playlists);
    expect(items.map((i) => i.playlist.name)).toEqual(['boleros', 'Night Drive', 'Road Trip', 'Workout']);
    expect(items.map((i) => i.status)).toEqual(['✓ Added', '12/20', '7/20', 'Full']);
    expect(items.filter((i) => i.disabled).map((i) => i.playlist.playlist_id)).toEqual([2, 1]);
  });

  it('puts the most recently added-to playlist first (BR-09)', () => {
    expect(buildAddMenu(playlists).lastUsed.playlist.name).toBe('Road Trip');
    expect(buildAddMenu([{ playlist_id: 9, name: 'New', track_count: 0 }]).lastUsed).toBeNull();
  });

  it('filters by name, ignoring accents', () => {
    const { items } = buildAddMenu([{ name: 'Canción' }, { name: 'Focus' }]);
    expect(filterByName(items, 'cancion').map((i) => i.playlist.name)).toEqual(['Canción']);
    expect(filterByName(items, '  ')).toHaveLength(2);
  });

  it('handles no playlists', () => {
    expect(buildAddMenu(undefined)).toEqual({ lastUsed: null, items: [] });
  });
});
