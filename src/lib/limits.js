/** Product limits from UI-Design.md (BR-02, BR-03, BR-04). The API enforces them too. */
export const MAX_FAVORITES = 5;
export const MAX_PLAYLISTS = 20;
export const MAX_TRACKS = 20;

/** Field limits shared with the API (S2, S5, BR-15). */
export const PLAYLIST_NAME_MAX = 120;
export const PLAYLIST_DESCRIPTION_MAX = 2000;
export const DISPLAY_NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

/** Search starts at 2 characters, 300 ms after the last keystroke (S4). */
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 300;
export const PAGE_SIZE = 20;
