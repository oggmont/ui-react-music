/** Copy rules from Design-System.md § Copy guidelines: "3:05", "35 min", "1 h 12 min", "1 song". */

export function formatTrackTime(ms) {
  const totalSeconds = Math.round((ms ?? 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatTotalTime(ms) {
  const minutes = Math.round((ms ?? 0) / 60000);
  if (minutes >= 60) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return `${minutes} min`;
}

export const songCount = (n) => (n === 1 ? '1 song' : `${n} songs`);

export const favoriteCount = (n) => (n === 1 ? '1 favorite' : `${n} favorites`);

export const artistNames = (artists) => (artists ?? []).join(', ');

/** "Good morning" before noon, "Good afternoon" until 6 pm, "Good evening" after. */
export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "by you" for your own playlists, "by Ana García" otherwise. */
export function byOwner(owner, me) {
  if (me && owner?.username === me.username) return 'by you';
  return `by ${owner?.display_name ?? owner?.username ?? 'someone'}`;
}
