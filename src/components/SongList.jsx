import { Skeleton } from './Skeleton';
import styles from './SongList.module.css';

/**
 * Song rows: number, title, artist, album, time and one action (Add, or ⋯ for the owner on S7).
 * `rows` is `[{ key, number, track }]`; `renderAction(row)` draws the last cell.
 */
export function SongList({ label, rows, renderAction, dimmed = false, footer, showHeader = true }) {
  return (
    <div
      className={`${styles.list} ${dimmed ? styles.dimmed : ''}`}
      role="table"
      aria-label={label}
      aria-busy={dimmed}
    >
      {showHeader && (
        <div className={`${styles.row} ${styles.head}`} role="row">
          <span className={styles.n} role="columnheader">
            #
          </span>
          <span role="columnheader">Title</span>
          <span role="columnheader">Artist</span>
          <span role="columnheader">Album</span>
          <span className={styles.d} role="columnheader">
            Time
          </span>
          <span role="columnheader">
            <span className="visually-hidden">Actions</span>
          </span>
        </div>
      )}
      {rows.map((row) => (
        <SongRow key={row.key} row={row} action={renderAction?.(row)} />
      ))}
      {footer}
    </div>
  );
}

function SongRow({ row, action }) {
  const { track, number } = row;
  const artists = (track.artists ?? []).join(', ');
  return (
    <div className={`${styles.row} ${row.highlight ? styles.just : ''}`} role="row">
      <span className={`${styles.n} num`} role="cell">
        {number}
      </span>
      <span className={styles.t} role="cell">
        <b>{track.name}</b>
      </span>
      <span className={styles.a} role="cell" title={artists}>
        {artists}
      </span>
      <span className={styles.a} role="cell" title={track.album?.title}>
        {track.album?.title}
      </span>
      <span className={`${styles.d} num`} role="cell">
        {track.duration}
      </span>
      <span className={styles.act} role="cell">
        {action}
      </span>
    </div>
  );
}

export function SongListSkeleton({ count = 6 }) {
  return (
    <div className={styles.list} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className={styles.row} key={i}>
          <Skeleton width={16} height={12} />
          <Skeleton width="70%" />
          <Skeleton width="60%" height={12} />
          <Skeleton width="60%" height={12} />
          <Skeleton width={32} height={12} />
          <Skeleton width={64} height={30} radius={999} />
        </div>
      ))}
    </div>
  );
}
