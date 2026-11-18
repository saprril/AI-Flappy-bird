import { DIFFICULTY_CONFIGS, DifficultyMode, getMedalTier, MedalTier } from '../game/types';

interface GameOverModalProps {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  difficulty: DifficultyMode;
  pipesCleared: number;
  coinsCollected: number;
  onPlayAgain: () => void;
  onTitleMenu: () => void;
}

const MEDAL_LABELS: Record<MedalTier, string> = {
  none: 'No Medal',
  bronze: 'Bronze Medal',
  silver: 'Silver Medal',
  gold: 'Gold Medal',
  platinum: 'Platinum Medal',
};

function MedalCrest({ tier }: { tier: MedalTier }) {
  if (tier === 'none') {
    return (
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500 text-xs font-semibold">
        10+
      </div>
    );
  }

  const palettes: Record<Exclude<MedalTier, 'none'>, { outer: string; inner: string; rim: string; star: string }> = {
    bronze: { outer: '#CD7F32', inner: '#E5A464', rim: '#7C4212', star: '#FFFBEB' },
    silver: { outer: '#CBD5E1', inner: '#F1F5F9', rim: '#475569', star: '#FFFFFF' },
    gold: { outer: '#F59E0B', inner: '#FDE047', rim: '#78350F', star: '#FFFFFF' },
    platinum: { outer: '#38BDF8', inner: '#E0F2FE', rim: '#0C4A6E', star: '#FFFFFF' },
  };
  const p = palettes[tier];

  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16 drop-shadow-md" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill={p.outer} stroke={p.rim} strokeWidth="3" />
      <circle cx="32" cy="32" r="21" fill={p.inner} />
      <polygon
        points="32,16 36.4,25.5 46.8,26.8 39.2,34 41.2,44.4 32,39.2 22.8,44.4 24.8,34 17.2,26.8 27.6,25.5"
        fill={p.star}
        stroke={p.rim}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GameOverModal({
  score,
  bestScore,
  isNewBest,
  difficulty,
  pipesCleared,
  coinsCollected,
  onPlayAgain,
  onTitleMenu,
}: GameOverModalProps) {
  const medal = getMedalTier(score);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
      className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/50 p-5"
    >
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/15 p-6 text-white shadow-2xl">
        <div className="text-center mb-5">
          <h2 id="gameover-title" className="font-display font-extrabold text-3xl tracking-tight text-amber-300">
            Flight Over
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {DIFFICULTY_CONFIGS[difficulty].label} Mode
            {isNewBest && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="text-emerald-400 font-semibold">New Best</span>
              </>
            )}
          </p>
        </div>

        {/* Medal + Primary Score Row */}
        <div className="flex items-center justify-between gap-5 rounded-xl bg-slate-950/60 border border-white/10 p-4 mb-4">
          <div className="flex flex-col items-center gap-1.5 min-w-[76px]">
            <MedalCrest tier={medal} />
            <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{MEDAL_LABELS[medal]}</span>
          </div>

          <div className="flex-1 flex flex-col gap-2 text-right">
            <div>
              <div className="text-xs text-slate-400">Score</div>
              <div className="font-mono-num font-bold text-3xl leading-tight text-white">{score}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Best</div>
              <div className="font-mono-num font-bold text-xl leading-tight text-amber-300">{bestScore}</div>
            </div>
          </div>
        </div>

        {/* Clean unboxed run breakdown */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-300 mb-5">
          <span>
            Pipes <strong className="font-mono-num text-white">{pipesCleared}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Star Coins <strong className="font-mono-num text-amber-300">{coinsCollected}</strong>
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base shadow-[0_3px_0_#14532D] active:translate-y-0.5 transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            Play Again
          </button>

          <button
            type="button"
            onClick={onTitleMenu}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-white/10 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
