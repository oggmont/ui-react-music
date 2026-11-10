import { coverSpec } from '@/lib/cover';
import styles from './Cover.module.css';

function Pattern({ pattern, ink, base }) {
  switch (pattern) {
    case 'rings':
      return (
        <>
          {[44, 32, 20].map((r) => (
            <circle key={r} cx="72" cy="72" r={r} fill="none" stroke={ink} strokeWidth="5" />
          ))}
          <circle cx="72" cy="72" r="6" fill={ink} />
        </>
      );
    case 'stripes':
      return [0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="0" y={50 + i * 11} width="100" height="5" fill={ink} />
      ));
    case 'quarter':
      return (
        <>
          <circle cx="100" cy="100" r="66" fill={ink} />
          <circle cx="100" cy="100" r="34" fill={base} />
        </>
      );
    default:
      return [0, 1, 2, 3].flatMap((i) =>
        [0, 1, 2, 3].map((j) => (
          <circle key={`${i}-${j}`} cx={40 + i * 16} cy={40 + j * 16} r={3 + ((i + j) % 3)} fill={ink} />
        )),
      );
  }
}

/** A playlist cover: `cover_url` when there is one, otherwise generated from the ID. Decorative. */
export function Cover({ playlist, className }) {
  const classes = [styles.cover, className].filter(Boolean).join(' ');
  if (playlist?.cover_url) {
    return (
      <span className={classes} aria-hidden="true">
        <img src={playlist.cover_url} alt="" loading="lazy" />
      </span>
    );
  }
  const spec = coverSpec(playlist?.playlist_id, playlist?.name);
  return (
    <span className={classes} aria-hidden="true" data-pattern={spec.pattern}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <rect width="100" height="100" fill={spec.base} />
        <Pattern {...spec} />
        <text x="10" y="34" fill={spec.ink} fontSize="30" className={styles.letter}>
          {spec.letter}
        </text>
      </svg>
    </span>
  );
}
