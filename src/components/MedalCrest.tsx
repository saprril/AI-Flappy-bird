import { MEDAL_PALETTES } from '../game/medals';
import type { MedalTier } from '../types/MedalTier';

interface MedalCrestProps {
  tier: MedalTier;
}

export function MedalCrest({ tier }: MedalCrestProps) {
  if (tier === 'none') {
    return (
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500 text-xs font-semibold">
        10+
      </div>
    );
  }

  const palette = MEDAL_PALETTES[tier];

  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16 drop-shadow-md" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill={palette.outer} stroke={palette.rim} strokeWidth="3" />
      <circle cx="32" cy="32" r="21" fill={palette.inner} />
      <polygon
        points="32,16 36.4,25.5 46.8,26.8 39.2,34 41.2,44.4 32,39.2 22.8,44.4 24.8,34 17.2,26.8 27.6,25.5"
        fill={palette.star}
        stroke={palette.rim}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
