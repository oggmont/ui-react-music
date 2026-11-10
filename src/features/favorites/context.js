import { createContext, use } from 'react';

export const FavoritesContext = createContext(null);

/**
 * `{ favorites, count, isFavorite(id), isPending(id), toggle(playlist) }`. The only place that
 * favorites and unfavorites (UI-Design.md § Implementation notes: `<FavoriteHeart>`).
 */
export function useFavorites() {
  const value = use(FavoritesContext);
  if (!value) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return value;
}
