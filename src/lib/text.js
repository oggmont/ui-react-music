/** Locale-aware, accent- and case-insensitive comparison for A–Z lists (S4 add menu, D-04). */
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export const compareNames = (a, b) => collator.compare(a ?? '', b ?? '');

export function sortByName(items, getName = (item) => item.name) {
  return [...items].sort((a, b) => compareNames(getName(a), getName(b)));
}

/** Lower case without accents: "José" → "jose". */
export function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Username suggested from a name (S2): "Sofía López" → "sofia.lopez". */
export function suggestUsername(name) {
  return normalize(name)
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 30);
}

export function firstName(displayName) {
  return (
    String(displayName ?? '')
      .trim()
      .split(/\s+/)[0] ?? ''
  );
}

export function initials(displayName) {
  return String(displayName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
