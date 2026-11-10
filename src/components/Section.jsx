import styles from './Section.module.css';

/** Section header (Design-System.md): title, optional count, then actions on the right. */
export function Section({ id, title, count, actions, children, note }) {
  const headingId = `h-${id}`;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId}>{title}</h2>
        {count && <span className={`${styles.count} num`}>{count}</span>}
        <span className={styles.spacer} />
        {actions}
      </div>
      {note}
      {children}
    </section>
  );
}
