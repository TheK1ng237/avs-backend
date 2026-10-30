import type { PatternType } from './domain/CulturePattern';

export const STATIC_PATTERN_EXPORTS = {
  'kente-asante': { name: 'Kente Asante', type: 'KENTE', colors: ['#D4A017', '#C0573E', '#4A6741'] },
  'ndop-bamoum': { name: 'Ndop Bamoum', type: 'NDOP', colors: ['#1B2A4A', '#F5EBE0', '#D4A017'] },
  'bogolan-malien': { name: 'Bogolan Malien', type: 'BOGOLAN', colors: ['#241C18', '#D7C4B7', '#8B6914'] },
  'adinkra-akan': { name: 'Adinkra Akan', type: 'ADINKRA', colors: ['#181818', '#D4A017', '#C0573E'] },
  'ndebele-amabhaxa': { name: 'Ndebele Amabhaxa', type: 'NDEBELE', colors: ['#FF0000', '#FFFF00', '#0000FF'] },
  'wax-dakar': { name: 'Wax Dakar', type: 'WAX', colors: ['#FF6B35', '#004E89', '#F7FFF7'] },
  'kuba-kasai': { name: 'Kuba Kasai', type: 'KUBA', colors: ['#8B7355', '#D2B48C', '#241C18'] },
  'berber-amazigh': { name: 'Berber Amazigh', type: 'BERBER', colors: ['#C41E3A', '#FCD116', '#007FFF'] },
} as const satisfies Record<string, { name: string; type: PatternType; colors: readonly string[] }>;

export type StaticPatternSlug = keyof typeof STATIC_PATTERN_EXPORTS;

export function isStaticPatternSlug(value: string): value is StaticPatternSlug {
  return Object.prototype.hasOwnProperty.call(STATIC_PATTERN_EXPORTS, value);
}
