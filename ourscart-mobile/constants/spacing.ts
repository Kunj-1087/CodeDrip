// 4px base spacing scale. Keys are the multiplier (Space[4] === 16px) so the math
// stays legible at call sites.
export const Space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpaceKey = keyof typeof Space;
