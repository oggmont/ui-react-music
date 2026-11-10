import styles from './Button.module.css';

/** Class names for a button look (primary, secondary, ghost, danger; `size: 'sm'`). */
export function buttonClass({ variant = 'secondary', size, className } = {}) {
  return [styles.btn, styles[variant], size === 'sm' && styles.sm, className].filter(Boolean).join(' ');
}
