/**
 * Generated playlist covers (Design-System.md § Iconography and covers): a color pair chosen by
 * `id mod 6`, one of four patterns by `id mod 4`, and the first letter of the name. Deterministic,
 * so the same playlist looks the same everywhere.
 */
export const COVER_PALETTE = [
  ['#2445E0', '#9DB0FF'],
  ['#E0365A', '#FFC2CE'],
  ['#1F8A5B', '#A9E8C9'],
  ['#C77800', '#FFD99A'],
  ['#5B36C9', '#D2C4FF'],
  ['#0E7C86', '#A3E6EC'],
];

export const COVER_PATTERNS = ['rings', 'stripes', 'quarter', 'dots'];

const mod = (n, m) => ((n % m) + m) % m;

export function coverSpec(id, name) {
  const n = Number.isFinite(Number(id)) ? Math.trunc(Number(id)) : 0;
  const [base, ink] = COVER_PALETTE[mod(n, COVER_PALETTE.length)];
  return {
    base,
    ink,
    pattern: COVER_PATTERNS[mod(n, COVER_PATTERNS.length)],
    letter: (String(name ?? '').trim()[0] ?? '?').toUpperCase(),
  };
}

/** Avatar background made from the username (S8). */
export function avatarColor(username) {
  const sum = [...String(username ?? '')].reduce((acc, ch) => acc + ch.codePointAt(0), 0);
  return COVER_PALETTE[mod(sum, COVER_PALETTE.length)][0];
}
