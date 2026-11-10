import { MAX_TRACKS } from './limits';
import { normalize, sortByName } from './text';

/**
 * Product rules around favorites and visibility (UI-Design.md BR-12, BR-13, D-10):
 * a playlist is public while anyone has it as a favorite, and private when nobody does.
 */

export const isOwnedBy = (playlist, me) => Boolean(me && playlist?.owner?.username === me.username);

const people = (n) => (n === 1 ? "1 person's" : `${n} people's`);

/** The eyebrow above the playlist name on S7. Owners see the visibility; visitors see "Playlist". */
export function visibilityBadge(playlist, { isOwner, isFavorite }) {
  if (!isOwner) return { text: 'Playlist', locked: false };
  if (isFavorite) return { text: 'Public playlist · on your profile', locked: false };
  if (playlist.visibility === 'public') {
    const others = Math.max(1, playlist.follower_count ?? 0);
    return { text: `Public playlist · in ${people(others)} favorites`, locked: false };
  }
  return { text: 'Private playlist · only you', locked: true };
}

/** People other than me who have the playlist as a favorite (I'm counted if it's one of mine). */
export function othersWithFavorite(playlist, isFavorite) {
  return Math.max(0, (playlist?.follower_count ?? 0) - (isFavorite ? 1 : 0));
}

/** What replacing this favorite does to it (Replace a favorite dialog). */
export function replaceConsequence(favorite, me) {
  const others = othersWithFavorite(favorite, true);
  if (others > 0) return `stays public · ${others === 1 ? '1 other has' : `${others} others have`} it`;
  if (isOwnedBy(favorite, me)) return 'becomes private';
  return "becomes private · you can't open it again";
}

/** BR-13: removing someone else's playlist that only I have makes it private, so ask first. */
export function isLastFavorite(favorite, me) {
  return !isOwnedBy(favorite, me) && othersWithFavorite(favorite, true) === 0;
}

/** Toast after unfavoriting, from the API's answer (`visibility`, `follower_count`). */
export function unfavoriteMessage(name, { isOwn, state }) {
  if (!isOwn) return `Removed ${name} from favorites`;
  if (state?.visibility === 'private') return `${name} is now private`;
  const n = state?.follower_count ?? 0;
  return `${name} left your profile. It stays public while ${n === 1 ? '1 person has' : `${n} people have`} it as a favorite.`;
}

export function favoriteMessage(name, { isOwn, state }) {
  const count = state?.my_favorite_count != null ? ` · ${state.my_favorite_count} of 5` : '';
  return isOwn ? `${name} is now public and on your profile${count}` : `Added ${name} to favorites${count}`;
}

/**
 * The add menu (S4): the last used playlist first (BR-09), then every playlist A–Z. Each item is
 * marked full (BR-03) or already containing the song (BR-11).
 */
export function buildAddMenu(playlists) {
  const items = sortByName(playlists ?? []).map((playlist) => {
    const full = (playlist.track_count ?? 0) >= MAX_TRACKS;
    const added = Boolean(playlist.contains_track);
    return {
      playlist,
      full,
      added,
      disabled: full || added,
      status: full ? 'Full' : added ? '✓ Added' : `${playlist.track_count ?? 0}/${MAX_TRACKS}`,
    };
  });
  const lastUsed = items
    .filter((item) => item.playlist.last_added_at)
    .reduce(
      (best, item) => (!best || item.playlist.last_added_at > best.playlist.last_added_at ? item : best),
      null,
    );
  return { lastUsed, items };
}

export function filterByName(items, query) {
  const q = normalize(query).trim();
  if (!q) return items;
  return items.filter((item) => normalize(item.playlist.name).includes(q));
}
