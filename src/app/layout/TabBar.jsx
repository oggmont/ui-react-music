import { Compass, Home, Music, User } from 'lucide-react';
import { NavLink } from 'react-router';
import { useAuth } from '@/features/auth/context';
import styles from './TabBar.module.css';

/**
 * Bottom tab bar on a phone (UI-Design.md § Navigation): Home · Songs · Discover · Me. Hidden from
 * 640 px up, where the header's links take over. "Me" is your own profile, and the current tab
 * gets `aria-current="page"` from NavLink.
 */
export function TabBar() {
  const { user } = useAuth();
  const tabs = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/songs', label: 'Songs', icon: Music },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: `/u/${user.username}`, label: 'Me', icon: User, end: true },
  ];
  return (
    <nav aria-label="Tabs" className={styles.bar}>
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={label} to={to} end={end} className={styles.tab}>
          <Icon size={22} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
