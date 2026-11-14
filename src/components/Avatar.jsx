import { avatarColor } from '@/lib/cover';
import { initials } from '@/lib/text';
import styles from './Avatar.module.css';

/** Profile picture, or initials on a color made from the username. Sizes 32, 40, 128. */
export function Avatar({ user, size = 40, className }) {
  const cls = [styles.avatar, className].filter(Boolean).join(' ');
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (user?.avatar_url) {
    return (
      <span className={cls} style={style} aria-hidden="true">
        <img src={user.avatar_url} alt="" />
      </span>
    );
  }
  return (
    <span className={cls} style={{ ...style, background: avatarColor(user?.username) }} aria-hidden="true">
      {initials(user?.display_name ?? user?.username)}
    </span>
  );
}
