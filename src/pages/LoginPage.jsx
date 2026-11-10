import { CircleAlert } from 'lucide-react';
import { useState } from 'react';
import { isApiError } from '@/api/client';
import { Button, TextLink } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth } from '@/features/auth/context';
import styles from './Auth.module.css';

const WRONG = "That username and password don't match. Check them and try again.";

/** S1 Login: one step back into the app. After login, AuthLayout sends you where you were going. */
export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = {};
    if (!username.trim()) errors.username = 'Enter your username or email.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      event.currentTarget.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setSubmitting(true);
    setBanner(null);
    try {
      await login(username.trim(), password);
    } catch (error) {
      setSubmitting(false);
      if (isApiError(error, 401)) setBanner({ message: WRONG });
      else if (isApiError(error, 0)) setBanner({ message: "Can't reach Runlist right now.", retry: true });
      else setBanner({ message: error.message, retry: true });
    }
  }

  return (
    <>
      <div className={styles.heading}>
        <h1 className="disp">Log in</h1>
        <p className="muted">Collect songs. Share playlists.</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Log in">
        {banner && (
          <div className={styles.banner} role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <div className={styles.bannerBody}>
              <span>{banner.message}</span>
              {banner.retry && (
                <Button type="submit" size="sm">
                  Try again
                </Button>
              )}
            </div>
          </div>
        )}
        <fieldset className={styles.fieldset} disabled={submitting}>
          <Field
            label="Username or email"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <Button type="submit" variant="primary">
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </fieldset>
      </form>
      <p className={styles.switch}>
        New here? <TextLink to="/signup">Create an account →</TextLink>
      </p>
    </>
  );
}
