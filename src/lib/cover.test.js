import { avatarColor, COVER_PALETTE, coverSpec } from './cover';

describe('coverSpec', () => {
  it('picks the palette by id mod 6 and the pattern by id mod 4', () => {
    expect(coverSpec(20, 'Road Trip')).toEqual({
      base: COVER_PALETTE[2][0],
      ink: COVER_PALETTE[2][1],
      pattern: 'rings',
      letter: 'R',
    });
    expect(coverSpec(21, 'x').pattern).toBe('stripes');
    expect(coverSpec(22, 'x').pattern).toBe('quarter');
    expect(coverSpec(23, 'x').pattern).toBe('dots');
  });

  it('is deterministic', () => {
    expect(coverSpec(42, 'Rainy Day')).toEqual(coverSpec(42, 'Rainy Day'));
  });

  it('copes with missing names and ids', () => {
    expect(coverSpec(undefined, '').letter).toBe('?');
    expect(coverSpec('abc', 'night').letter).toBe('N');
  });
});

describe('avatarColor', () => {
  it('is stable for a username and comes from the palette', () => {
    const color = avatarColor('ana.garcia');
    expect(color).toBe(avatarColor('ana.garcia'));
    expect(COVER_PALETTE.map((pair) => pair[0])).toContain(color);
  });
});
