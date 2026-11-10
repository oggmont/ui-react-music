import { createContext, use } from 'react';

export const AuthContext = createContext(null);

/** `{ user, status, login, signup, logout, retry }`. `status` is loading, signedIn, signedOut or error. */
export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
