import {
  artistNames,
  byOwner,
  favoriteCount,
  formatTotalTime,
  formatTrackTime,
  greeting,
  songCount,
} from './format';

describe('format', () => {
  it('formats song times as m:ss', () => {
    expect(formatTrackTime(185_000)).toBe('3:05');
    expect(formatTrackTime(59_400)).toBe('0:59');
    expect(formatTrackTime(undefined)).toBe('0:00');
  });

  it('formats playlist totals in minutes, with hours from 60 minutes', () => {
    expect(formatTotalTime(35 * 60_000)).toBe('35 min');
    expect(formatTotalTime(72 * 60_000)).toBe('1 h 12 min');
    expect(formatTotalTime(60 * 60_000)).toBe('1 h 0 min');
  });

  it('pluralizes songs and favorites', () => {
    expect(songCount(1)).toBe('1 song');
    expect(songCount(7)).toBe('7 songs');
    expect(songCount(0)).toBe('0 songs');
    expect(favoriteCount(1)).toBe('1 favorite');
    expect(favoriteCount(3)).toBe('3 favorites');
  });

  it('joins artist names', () => {
    expect(artistNames(['Daft Punk'])).toBe('Daft Punk');
    expect(artistNames(['A', 'B'])).toBe('A, B');
    expect(artistNames(undefined)).toBe('');
  });

  it('greets by the time of day', () => {
    expect(greeting(new Date(2026, 10, 10, 9))).toBe('Good morning');
    expect(greeting(new Date(2026, 10, 10, 14))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 10, 10, 20))).toBe('Good evening');
  });

  it('says "by you" for your own playlists', () => {
    const me = { username: 'ana.garcia' };
    expect(byOwner({ username: 'ana.garcia', display_name: 'Ana García' }, me)).toBe('by you');
    expect(byOwner({ username: 'ben.carter', display_name: 'Ben Carter' }, me)).toBe('by Ben Carter');
    expect(byOwner({ username: 'ben.carter', display_name: 'Ben Carter' }, null)).toBe('by Ben Carter');
  });
});
