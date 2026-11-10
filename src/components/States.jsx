import { Button } from './Button';
import styles from './States.module.css';

/** Says what goes here, and gives one action to fill it. */
export function EmptyState({ title, children, action, role }) {
  return (
    <div className={styles.empty} role={role}>
      <b>{title}</b>
      {children && <span>{children}</span>}
      {action}
    </div>
  );
}

/** Says what failed, with "Try again". Errors stay inside their section. */
export function ErrorState({ message = "Couldn't load this.", onRetry }) {
  return (
    <div className={styles.error} role="alert">
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" onClick={() => onRetry()}>
          Try again
        </Button>
      )}
    </div>
  );
}
