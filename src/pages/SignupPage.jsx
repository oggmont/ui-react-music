import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { isApiError } from '@/api/client';
import { getCountries } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Button, TextLink } from '@/components/Button';
import { Field, SelectField } from '@/components/Field';
import { useAuth } from '@/features/auth/context';
import { DISPLAY_NAME_MAX } from '@/lib/limits';
import { suggestUsername } from '@/lib/text';
import { signupChecks, validateSignup } from '@/lib/validation';
import styles from './Auth.module.css';

const EMPTY = { display_name: '', username: '', email: '', password: '', country_code: '' };

/** Map an API error from POST /users onto the form's fields (S2 § Errors). */
function errorsFromApi(error, values) {
  if (isApiError(error, 409, 'username_taken'))
    return { username: `That username is taken. Try ${values.username}2.` };
  if (isApiError(error, 409, 'email_taken')) return { email: 'email_taken' };
  if (isApiError(error, 422, 'weak_password') || isApiError(error, 422, 'password_too_long'))
    return { password: error.message };
  if (isApiError(error, 422) && error.details.length) {
    const errors = {};
    for (const { field, message } of error.details) {
      if (field in EMPTY) errors[field] = message;
    }
    if (Object.keys(errors).length) return errors;
  }
  return { form: error.message };
}

/** S2 Sign up: as few fields as possible. After sign-up you're logged in and go Home. */
export default function SignupPage() {
  const { signup } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const countries = useQuery({
    queryKey: queryKeys.countries,
    queryFn: ({ signal }) => getCountries({ signal }),
    staleTime: Infinity,
  });

  function set(field, value) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      // The username is suggested from the name until the person edits it.
      if (field === 'display_name' && !usernameTouched) next.username = suggestUsername(value);
      return next;
    });
  }

  function checkOnBlur(field) {
    const message = signupChecks[field]?.(values[field]) ?? '';
    setErrors((current) => ({ ...current, [field]: message || undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validateSignup(values);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => form.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setSubmitting(true);
    try {
      await signup({
        username: values.username,
        display_name: values.display_name.trim(),
        email: values.email.trim(),
        password: values.password,
        country_code: values.country_code || undefined,
      });
    } catch (error) {
      setSubmitting(false);
      setErrors(errorsFromApi(error, values));
    }
  }

  const emailError =
    errors.email === 'email_taken' ? (
      <>
        An account with this email exists.{' '}
        <TextLink to="/login" className={styles.inlineLink}>
          Log in instead?
        </TextLink>
      </>
    ) : (
      errors.email
    );

  return (
    <>
      <div className={styles.heading}>
        <h1 className="disp">Create your account</h1>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Create your account">
        {errors.form && (
          <div className={styles.banner} role="alert">
            {errors.form}
          </div>
        )}
        <fieldset className={styles.fieldset} disabled={submitting}>
          <Field
            label="Name"
            autoComplete="name"
            maxLength={DISPLAY_NAME_MAX}
            value={values.display_name}
            onChange={(e) => set('display_name', e.target.value)}
            onBlur={() => checkOnBlur('display_name')}
            error={errors.display_name}
          />
          <Field
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            autoCapitalize="none"
            spellCheck={false}
            value={values.username}
            onChange={(e) => {
              setUsernameTouched(true);
              set('username', e.target.value);
            }}
            onBlur={() => checkOnBlur('username')}
            hint="3–30 characters: a–z, 0–9, . and _. You can't change it later."
            error={errors.username}
          />
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => checkOnBlur('email')}
            error={emailError}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => set('password', e.target.value)}
            onBlur={() => checkOnBlur('password')}
            hint="At least 8 characters"
            error={errors.password}
          />
          <SelectField
            label="Country"
            optional
            value={values.country_code}
            onChange={(e) => set('country_code', e.target.value)}
          >
            <option value="">Choose a country</option>
            {(countries.data ?? []).map((c) => (
              <option key={c.code} value={c.code}>
                {c.description}
              </option>
            ))}
          </SelectField>
          <Button type="submit" variant="primary">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </fieldset>
      </form>
      <p className={styles.switch}>
        Already have an account? <TextLink to="/login">Log in →</TextLink>
      </p>
    </>
  );
}
