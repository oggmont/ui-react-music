import { Heart } from 'lucide-react';
import { buttonClass } from '@/components/buttonClass';
import { useFavorites } from './context';
import styles from './FavoriteHeart.module.css';

/** Heart toggle on cards: `aria-pressed`, and a label that names the playlist. */
export function FavoriteHeart({ playlist, className }) {
  const { isFavorite, isPending, toggle } = useFavorites();
  const on = isFavorite(playlist.playlist_id);
  return (
    <button
      type="button"
      className={[styles.heart, className].filter(Boolean).join(' ')}
      aria-pressed={on}
      aria-label={on ? `Remove ${playlist.name} from favorites` : `Favorite ${playlist.name}`}
      data-pending={isPending(playlist.playlist_id) || undefined}
      onClick={() => toggle(playlist)}
    >
      <Heart size={20} fill={on ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}

/** "♥ Favorited" / "♡ Favorite" on the playlist page (S7). */
export function FavoriteButton({ playlist }) {
  const { isFavorite, isPending, toggle } = useFavorites();
  const on = isFavorite(playlist.playlist_id);
  return (
    <button
      type="button"
      className={`${buttonClass({ variant: 'secondary' })} ${on ? styles.on : ''}`}
      aria-pressed={on}
      data-pending={isPending(playlist.playlist_id) || undefined}
      onClick={() => toggle(playlist)}
    >
      <Heart size={18} fill={on ? 'currentColor' : 'none'} aria-hidden="true" />
      {on ? 'Favorited' : 'Favorite'}
    </button>
  );
}
