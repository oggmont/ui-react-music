import { X } from 'lucide-react';
import { AlertDialog, Dialog } from 'radix-ui';
import { useRef } from 'react';
import { Button, IconButton } from './Button';
import styles from './Modal.module.css';

/** Focus the first field, or the primary action when there's no field (Design-System.md § Dialog). */
function focusFirst(event, container) {
  const target = container?.querySelector(
    '[data-autofocus], input:not([type="radio"]):not([disabled]), textarea, [data-primary]',
  );
  if (target) {
    event.preventDefault();
    target.focus();
  }
}

/**
 * Dialog with a title, a ✕ in the corner and actions on the right. Focus is trapped and returns
 * to the opener on close. Esc closes it through `onOpenChange(false)`.
 */
export function Modal({ open, onOpenChange, title, description, children, closeLabel = 'Close' }) {
  const contentRef = useRef(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          ref={contentRef}
          className={styles.dialog}
          /* Without a Description, tell Radix there's nothing to describe the dialog. */
          {...(description ? {} : { 'aria-describedby': undefined })}
          onOpenAutoFocus={(event) => focusFirst(event, contentRef.current)}
        >
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton icon={X} label={closeLabel} className={styles.close} />
            </Dialog.Close>
          </div>
          {description && <Dialog.Description className="muted">{description}</Dialog.Description>}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ModalActions({ children }) {
  return <div className={styles.actions}>{children}</div>;
}

/**
 * Confirmation (delete, discard, last favorite). Cancel, then the primary action, on the right.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  confirmIcon,
  onConfirm,
  busy = false,
}) {
  const contentRef = useRef(null);
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={styles.overlay} />
        <AlertDialog.Content
          ref={contentRef}
          className={styles.dialog}
          onOpenAutoFocus={(event) => focusFirst(event, contentRef.current)}
        >
          <div className={styles.header}>
            <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>
          </div>
          <AlertDialog.Description asChild>
            <div className={styles.body}>{children}</div>
          </AlertDialog.Description>
          <ModalActions>
            <AlertDialog.Cancel asChild>
              <Button variant="ghost">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <Button
              variant={confirmVariant}
              icon={confirmIcon}
              data-primary
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </ModalActions>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
