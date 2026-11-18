import type { MedalPalette } from '../types/MedalPalette';
import type { MedalTier } from '../types/MedalTier';

export function getMedalTier(score: number): MedalTier {
  if (score >= 50) return 'platinum';
  if (score >= 35) return 'gold';
  if (score >= 20) return 'silver';
  if (score >= 10) return 'bronze';
  return 'none';
}

export const MEDAL_LABELS: Record<MedalTier, string> = {
  none: 'No Medal',
  bronze: 'Bronze Medal',
  silver: 'Silver Medal',
  gold: 'Gold Medal',
  platinum: 'Platinum Medal',
};

export const MEDAL_PALETTES: Record<Exclude<MedalTier, 'none'>, MedalPalette> = {
  bronze: { outer: '#CD7F32', inner: '#E5A464', rim: '#7C4212', star: '#FFFBEB' },
  silver: { outer: '#CBD5E1', inner: '#F1F5F9', rim: '#475569', star: '#FFFFFF' },
  gold: { outer: '#F59E0B', inner: '#FDE047', rim: '#78350F', star: '#FFFFFF' },
  platinum: { outer: '#38BDF8', inner: '#E0F2FE', rim: '#0C4A6E', star: '#FFFFFF' },
};
