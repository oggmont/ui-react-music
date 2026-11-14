import { Compass, Home, LogOut, Music, Plus, User } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { Link, NavLink, useNavigate } from 'react-router';
import { Avatar } from '@/components/Avatar';
import { Button, ButtonLink } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/features/auth/context';
import { useCreatePlaylist } from '@/features/playlists/context';
import styles from './Header.module.css';

const LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/songs', label: 'Songs', icon: Music },
  { to: '/discover', label: 'Discover', icon: Compass },
];

/**
 * One header on every signed-in screen, with New playlist so you can create from anywhere. On a
 * phone (under 640 px) the links move to the bottom <TabBar> and the bar keeps the logo and +.
 */
export function Header() {
  const { user, logout } = useAuth();
  const { open: openCreate, atLimit } = useCreatePlaylist();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className={styles.bar}>
      <Link to="/" className={styles.logo} aria-label="Runlist, Home">
        <Logo />
      </Link>
      <nav aria-label="Main" className={styles.nav}>
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={styles.navLink}>
            <Icon size={20} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <span className={styles.spacer} />
      {/* On a phone only the + shows; the label stays for screen readers. */}
      <Button
        variant="primary"
        icon={Plus}
        className={styles.newButton}
        onClick={() => openCreate()}
        disabledReason={
          atLimit ? 'You have 20 playlists, the most allowed. Delete one to make a new one.' : undefined
        }
      >
        <span className={styles.newLabel}>New playlist</span>
      </Button>
      {/* On a phone the account menu gives way to the Me tab (log out is on your profile). */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={styles.me} aria-label="Account menu">
            <Avatar user={user} size={36} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.menu} align="end" sideOffset={8}>
            <DropdownMenu.Label className={styles.menuLabel}>
              <b>{user.display_name}</b>
              <span className="muted">@{user.username}</span>
            </DropdownMenu.Label>
            <DropdownMenu.Separator className={styles.separator} />
            <DropdownMenu.Item className={styles.menuItem} onSelect={() => navigate(`/u/${user.username}`)}>
              <User size={20} aria-hidden="true" />
              My profile
            </DropdownMenu.Item>
            <DropdownMenu.Item className={styles.menuItem} onSelect={handleLogout}>
              <LogOut size={20} aria-hidden="true" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}

/** Signed out on a public page (a shared playlist or a profile). */
export function GuestHeader() {
  return (
    <header className={styles.bar}>
      <Link to="/login" className={styles.logo} aria-label="Runlist">
        <Logo />
      </Link>
      <span className={styles.spacer} />
      <ButtonLink variant="ghost" size="sm" to="/login">
        Log in
      </ButtonLink>
      <ButtonLink variant="primary" size="sm" to="/signup">
        Sign up
      </ButtonLink>
    </header>
  );
}
