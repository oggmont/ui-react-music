import { Navigate, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Cover } from '@/components/Cover';
import { Logo } from '@/components/Logo';
import { PageLoader } from '@/components/Skeleton';
import { ErrorState } from '@/components/States';
import { useAuth } from '@/features/auth/context';
import { FavoritesProvider } from '@/features/favorites/FavoritesProvider';
import { CreatePlaylistProvider } from '@/features/playlists/CreatePlaylistProvider';
import { GuestHeader, Header } from './Header';
import { TabBar } from './TabBar';
import styles from './Layouts.module.css';

/** Providers that need the router (they navigate), around every route. */
export function RootLayout() {
  return (
    <FavoritesProvider>
      <CreatePlaylistProvider>
        <Outlet />
        <ScrollRestoration />
      </CreatePlaylistProvider>
    </FavoritesProvider>
  );
}

function SessionError() {
  const { retry, error } = useAuth();
  return (
    <main className={styles.main}>
      <div className={styles.screen}>
        <ErrorState message={`We couldn't check your session. ${error?.message ?? ''}`} onRetry={retry} />
      </div>
    </main>
  );
}

/**
 * Header + content area (max 1200 px), plus the tab bar on a phone when signed in. Public routes
 * render here signed in or out.
 */
export function AppLayout() {
  const { status } = useAuth();
  if (status === 'loading') return <PageLoader />;
  if (status === 'error') return <SessionError />;
  const signedIn = status === 'signedIn';
  return (
    <>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      {signedIn ? <Header /> : <GuestHeader />}
      <main id="main" className={`${styles.main} ${signedIn ? styles.withTabs : ''}`} tabIndex={-1}>
        <Outlet />
      </main>
      {signedIn && <TabBar />}
    </>
  );
}

/** Signed-in routes. Signed out: go to Login, and come back here after. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status !== 'signedIn') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

const MOSAIC = [
  'Road Trip',
  'Boleros',
  'Night Drive',
  'Coding Focus',
  'Mexican 80s',
  'Vinyl Sundays',
  'Tokyo Commute',
  'Space Rock',
  'Wedding Dance',
  'Study Beats',
  'Golden Oldies',
  'Analog Love',
  'Rainy Day',
  'Focus',
  'Workout',
  'Sunday Morning',
].map((name, i) => ({ playlist_id: i + 20, name }));

/** S1 / S2 frame: art on the left, the form on the right. Signed-in people go Home. */
export function AuthLayout() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (status === 'signedIn') {
    // After login: the page the person was trying to reach, or Home.
    const from = location.state?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  }
  return (
    <div className={styles.auth}>
      <div className={styles.art} aria-hidden="true">
        <div className={styles.mosaic}>
          {MOSAIC.map((p) => (
            <Cover key={p.playlist_id} playlist={p} />
          ))}
        </div>
        <div className={styles.tag}>
          <div className="disp">Five playlists say who you are.</div>
          <p className="muted">
            Collect songs into playlists, favorite the best ones, keep five on your profile.
          </p>
        </div>
      </div>
      <main className={styles.form}>
        <Logo large />
        <Outlet />
      </main>
    </div>
  );
}

export function Screen({ children, className }) {
  return <div className={[styles.screen, className].filter(Boolean).join(' ')}>{children}</div>;
}
