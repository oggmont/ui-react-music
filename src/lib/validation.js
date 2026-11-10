import { DISPLAY_NAME_MAX, EMAIL_MAX, PASSWORD_MAX, PASSWORD_MIN, USERNAME_PATTERN } from './limits';

/** Client checks for sign-up (S2). They match the API, so most errors never reach it. */
export const signupChecks = {
  display_name: (v) => {
    const value = v.trim();
    if (!value) return 'Enter your name.';
    if (value.length > DISPLAY_NAME_MAX) return `Use at most ${DISPLAY_NAME_MAX} characters.`;
    return '';
  },
  username: (v) => (USERNAME_PATTERN.test(v) ? '' : 'Use 3–30 characters: a–z, 0–9, dots and underscores.'),
  email: (v) => {
    const value = v.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > EMAIL_MAX)
      return 'Enter an email address like name@example.com.';
    return '';
  },
  password: (v) => {
    if (v.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
    if (new TextEncoder().encode(v).length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
    return '';
  },
};

export function validateSignup(values) {
  const errors = {};
  for (const [field, check] of Object.entries(signupChecks)) {
    const message = check(values[field] ?? '');
    if (message) errors[field] = message;
  }
  return errors;
}
