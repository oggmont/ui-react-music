import { CircleAlert, Check, Info } from 'lucide-react';
import { Toast } from 'radix-ui';
import { useState } from 'react';
import { ToastContext } from './context';
import styles from './Toast.module.css';

const ICONS = { success: Check, error: CircleAlert, info: Info };
export const TOAST_DURATION_MS = 5000;

/** Toasts (UI-Design.md § Toasts): bottom center, one at a time, 5 s, paused while hovered or focused. */
export function ToastProvider({ children }) {
  const [current, setCurrent] = useState(null);

  function show({ message, variant = 'success', action }) {
    setCurrent((previous) => ({ id: (previous?.id ?? 0) + 1, message, variant, action, open: true }));
  }

  function handleOpenChange(open) {
    if (!open) setCurrent((previous) => (previous ? { ...previous, open: false } : previous));
  }

  const Icon = current ? ICONS[current.variant] : null;

  return (
    <ToastContext value={show}>
      <Toast.Provider duration={TOAST_DURATION_MS} swipeDirection="down" label="Notification">
        {children}
        {current && (
          <Toast.Root
            key={current.id}
            className={styles.toast}
            open={current.open}
            onOpenChange={handleOpenChange}
            type={current.variant === 'error' ? 'foreground' : 'background'}
            data-variant={current.variant}
          >
            <Icon className={styles.icon} size={20} aria-hidden="true" />
            <Toast.Description className={styles.message}>{current.message}</Toast.Description>
            {current.action && (
              <Toast.Action altText={current.action.label} asChild>
                <button type="button" className={styles.action} onClick={current.action.onAction}>
                  {current.action.label}
                </button>
              </Toast.Action>
            )}
          </Toast.Root>
        )}
        <Toast.Viewport className={styles.viewport} />
      </Toast.Provider>
    </ToastContext>
  );
}
