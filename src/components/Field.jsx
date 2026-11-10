import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { IconButton } from './Button';
import styles from './Field.module.css';

/**
 * Text field: label above, input, hint or error below, optional counter. Errors are linked with
 * `aria-describedby` and mark the input `aria-invalid`.
 */
export function Field({
  label,
  optional,
  hint,
  error,
  counter,
  multiline,
  type = 'text',
  ref,
  ...inputProps
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';

  const shared = {
    id,
    ref,
    className: styles.input,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
    ...inputProps,
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      {multiline ? (
        <textarea {...shared} />
      ) : isPassword ? (
        <div className={styles.password}>
          <input {...shared} type={revealed ? 'text' : 'password'} />
          <IconButton
            className={styles.peek}
            icon={revealed ? EyeOff : Eye}
            label={revealed ? 'Hide password' : 'Show password'}
            onClick={() => setRevealed((value) => !value)}
          />
        </div>
      ) : (
        <input {...shared} type={type} />
      )}
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
      {counter && (
        <span className={`${styles.counter} num`} aria-hidden="true">
          {counter}
        </span>
      )}
    </div>
  );
}

export function SelectField({ label, optional, children, ...props }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      <select id={id} className={styles.input} {...props}>
        {children}
      </select>
    </div>
  );
}
