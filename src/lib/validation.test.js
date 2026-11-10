import { validateSignup } from './validation';

const valid = {
  display_name: 'Sofía López',
  username: 'sofia.lopez',
  email: 'sofia.lopez@example.com',
  password: 'vinyl-sundays',
};

describe('validateSignup (S2 client checks)', () => {
  it('accepts a valid account', () => {
    expect(validateSignup(valid)).toEqual({});
  });

  it('checks each field like the API does', () => {
    const errors = validateSignup({ display_name: ' ', username: 'Ab', email: 'nope', password: 'short' });
    expect(Object.keys(errors).sort()).toEqual(['display_name', 'email', 'password', 'username']);
  });

  it('allows a–z, 0–9, dots and underscores in usernames, 3–30 long', () => {
    expect(validateSignup({ ...valid, username: 'ana_g.2' }).username).toBeUndefined();
    expect(validateSignup({ ...valid, username: 'ana-g' }).username).toBeDefined();
    expect(validateSignup({ ...valid, username: 'a'.repeat(31) }).username).toBeDefined();
  });

  it('limits names to 80 characters and passwords to 72 bytes', () => {
    expect(validateSignup({ ...valid, display_name: 'x'.repeat(81) }).display_name).toBeDefined();
    expect(validateSignup({ ...valid, password: 'ñ'.repeat(37) }).password).toBe(
      'Use at most 72 characters.',
    );
    expect(validateSignup({ ...valid, password: 'x'.repeat(72) }).password).toBeUndefined();
  });
});
