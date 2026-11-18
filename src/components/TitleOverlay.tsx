import { Volume2, VolumeX } from 'lucide-react';
import { DIFFICULTY_CONFIGS, DifficultyMode } from '../game/types';

interface TitleOverlayProps {
  difficulty: DifficultyMode;
  bestScore: number;
  muted: boolean;
  onSelectDifficulty: (mode: DifficultyMode) => void;
  onStart: () => void;
  onToggleMute: () => void;
}

const MODES: DifficultyMode[] = ['breezy', 'classic', 'turbo'];

export function TitleOverlay({
  difficulty,
  bestScore,
  muted,
  onSelectDifficulty,
  onStart,
  onToggleMute,
}: TitleOverlayProps) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between pointer-events-none p-5 sm:p-8">
      {/* Top utility row */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          className="pointer-events-auto inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900/75 text-white border border-white/20 shadow-md hover:bg-slate-900/90 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Center-top calm sky lockup & action panel */}
      <div className="flex flex-col items-center text-center my-auto max-w-md mx-auto w-full">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-5">
          <svg
            viewBox="0 0 340 96"
            className="w-72 sm:w-88 h-auto drop-shadow-[0_6px_14px_rgba(15,23,42,0.35)]"
            role="img"
            aria-label="Sunwing"
          >
            <defs>
              <linearGradient id="sunwingTitleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF9C3" />
                <stop offset="48%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            {/* Wing crest emblem left of wordmark */}
            <g transform="translate(18, 22)">
              <path
                d="M4 28 C12 8, 36 4, 52 10 C38 16, 30 24, 24 34 C34 26, 46 24, 56 26 C40 34, 26 42, 10 44 Z"
                fill="#FEF08A"
                stroke="#431407"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              <circle cx="44" cy="14" r="3" fill="#EA580C" />
            </g>
            <text
              x="196"
              y="66"
              textAnchor="middle"
              fill="url(#sunwingTitleGrad)"
              stroke="#431407"
              strokeWidth="7"
              paintOrder="stroke"
              strokeLinejoin="round"
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 800,
                fontSize: '54px',
                letterSpacing: '-0.02em',
              }}
            >
              SUNWING
            </text>
          </svg>
        </div>

        {/* Clean tactile launch card */}
        <div className="pointer-events-auto w-full rounded-2xl bg-slate-900/80 border border-white/15 p-5 sm:p-6 shadow-xl text-white">
          {/* Difficulty segmented selector */}
          <div className="mb-4">
            <div
              role="group"
              aria-label="Flight speed mode"
              className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/10"
            >
              {MODES.map((mode) => {
                const active = mode === difficulty;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSelectDifficulty(mode)}
                    className={`min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-amber-300 ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {DIFFICULTY_CONFIGS[mode].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unboxed clean best score metadata */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-200 mb-5">
            <span>Best Score</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num font-bold text-amber-300">{bestScore}</span>
            <span aria-hidden="true">·</span>
            <span>{DIFFICULTY_CONFIGS[difficulty].label}</span>
          </div>

          {/* Primary Start CTA */}
          <button
            type="button"
            onClick={onStart}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-0.5 text-slate-950 font-display font-bold text-lg tracking-tight shadow-[0_4px_0_#14532D] transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Start Game
          </button>
        </div>
      </div>

      {/* Single flat control-hint line */}
      <div className="text-center pb-1">
        <p className="inline-block text-xs sm:text-sm font-medium text-white drop-shadow-[0_2px_4px_rgba(15,23,42,0.85)] tracking-wide">
          Space / Click Flap · P / Esc Pause · M Mute
        </p>
      </div>
    </div>
  );
}
