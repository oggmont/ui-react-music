import { Plus } from 'lucide-react';
import { Children } from 'react';
import { Link } from 'react-router';
import { FavoriteHeart } from '@/features/favorites/FavoriteHeart';
import { Cover } from './Cover';
import { Skeleton } from './Skeleton';
import styles from './PlaylistCard.module.css';

/** Cover, name (two lines at most), meta line. The card is one link; the heart is its own button. */
export function PlaylistCard({ playlist, meta, heart = true }) {
  return (
    <div className={styles.card}>
      <Link to={`/playlists/${playlist.playlist_id}`} className={styles.link} title={playlist.name}>
        <Cover playlist={playlist} />
        <span className={styles.text}>
          <span className={styles.name}>{playlist.name}</span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
      </Link>
      {heart && <FavoriteHeart playlist={playlist} className={styles.heart} />}
    </div>
  );
}

/** Dashed square for an empty favorite slot; only on your own Home and profile. */
export function EmptySlot() {
  return (
    <div className={styles.card}>
      <Link to="/discover" className={styles.slot} aria-label="Empty favorite slot: find a playlist">
        <Plus size={20} aria-hidden="true" />
        <span>Find a playlist</span>
      </Link>
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <Skeleton height="auto" className={styles.coverSkeleton} radius="var(--r-cover)" />
      <Skeleton width="80%" height={14} />
      <Skeleton width="50%" height={12} />
    </div>
  );
}

const VARIANTS = { five: styles.five, shelf: styles.shelf };

/**
 * Card grid. `columns="five"` for the five favorites; `columns="shelf"` for a short row (Home's
 * "Playlists to discover"). On a phone both scroll sideways, and plain grids have two columns.
 */
export function CardGrid({ columns, children, label }) {
  return (
    <div
      className={[styles.grid, VARIANTS[columns]].filter(Boolean).join(' ')}
      role="list"
      aria-label={label}
    >
      {Children.toArray(children).map((child) => (
        <div role="listitem" key={child.key} className={styles.cell}>
          {child}
        </div>
      ))}
    </div>
  );
}
