import styles from './Skeleton.module.css';

/** Gray placeholder the size of the real content (no spinners in lists). */
export function Skeleton({ width, height = 16, radius, className }) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function PageLoader() {
  return (
    <div className={styles.page} role="status">
      <span className="visually-hidden">Loading…</span>
      <Skeleton width="40%" height={40} />
      <Skeleton width="70%" />
      <Skeleton width="55%" />
    </div>
  );
}
