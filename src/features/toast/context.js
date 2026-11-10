import { createContext, use } from 'react';

export const ToastContext = createContext(null);

/**
 * `const toast = useToast(); toast({ message, variant, action })`.
 * One toast at a time, 5 seconds, at most one action (Undo or Try again).
 */
export function useToast() {
  const value = use(ToastContext);
  if (!value) throw new Error('useToast must be used inside <ToastProvider>');
  return value;
}
