import { compareNames, firstName, initials, normalize, sortByName, suggestUsername } from './text';

describe('text', () => {
  it('suggests a username from a name: lower case, no accents, dots for spaces', () => {
    expect(suggestUsername('Sofía López')).toBe('sofia.lopez');
    expect(suggestUsername('  José  José ')).toBe('jose.jose');
    expect(suggestUsername("Renée O'Brien-Smith")).toBe('renee.obriensmith');
    expect(suggestUsername('a'.repeat(40))).toHaveLength(30);
  });

  it('normalizes case and accents', () => {
    expect(normalize('José')).toBe('jose');
    expect(normalize(null)).toBe('');
  });

  it('sorts A–Z ignoring case and accents', () => {
    const sorted = sortByName([{ name: 'road trip' }, { name: 'Álbum' }, { name: 'Boleros' }]);
    expect(sorted.map((p) => p.name)).toEqual(['Álbum', 'Boleros', 'road trip']);
    expect(compareNames('a', 'A')).toBe(0);
  });

  it('gets first names and initials', () => {
    expect(firstName('Ana García')).toBe('Ana');
    expect(initials('Ana García')).toBe('AG');
    expect(initials('kenji')).toBe('K');
    expect(initials('')).toBe('');
  });
});
