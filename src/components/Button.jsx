import { Link } from 'react-router';
import styles from './Button.module.css';
import { buttonClass } from './buttonClass';

/**
 * Button (Design-System.md § Components): primary, secondary, ghost or danger. `disabledReason`
 * keeps the button focusable with `aria-disabled` and explains why in a tooltip.
 */
export function Button({
  variant,
  size,
  className,
  icon: Icon,
  children,
  disabledReason,
  onClick,
  ...props
}) {
  const softDisabled = Boolean(disabledReason);
  return (
    <button
      type="button"
      className={buttonClass({ variant, size, className })}
      aria-disabled={softDisabled || undefined}
      title={disabledReason}
      onClick={softDisabled ? (event) => event.preventDefault() : onClick}
      {...props}
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, icon: Icon, children, ...props }) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </Link>
  );
}

/** 40×40 icon button with a required label. */
export function IconButton({ label, icon: Icon, className, ...props }) {
  return (
    <button
      type="button"
      className={[styles.icon, className].filter(Boolean).join(' ')}
      aria-label={label}
      {...props}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}

/** Text link styled as the accent "See all →". */
export function TextLink({ className, ...props }) {
  return <Link className={[styles.link, className].filter(Boolean).join(' ')} {...props} />;
}
