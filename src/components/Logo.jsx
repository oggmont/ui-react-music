import styles from './Logo.module.css';

export function LogoMark({ size = 26 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="var(--c-text)" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--c-bg)" strokeOpacity=".25" />
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="var(--c-bg)" strokeOpacity=".25" />
      <circle cx="16" cy="16" r="4" fill="var(--c-accent)" />
      <circle cx="16" cy="16" r="1.2" fill="var(--c-bg)" />
    </svg>
  );
}

/** "◉ Runlist". The name is a placeholder from the design. */
export function Logo({ large = false }) {
  return (
    <span className={`${styles.logo} ${large ? styles.large : ''}`}>
      <LogoMark size={large ? 30 : 26} />
      <span>Runlist</span>
    </span>
  );
}
