import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { GameState } from '../game/types';

interface HudOverlayProps {
  gameState: GameState;
  score: number;
  bestScore: number;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export function HudOverlay({
  gameState,
  score,
  bestScore,
  muted,
  onTogglePause,
  onToggleMute,
}: HudOverlayProps) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top perimeter HUD */}
      <div className="relative flex items-start justify-between">
        {/* Left: compact unboxed best score */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/55 text-white text-xs sm:text-sm font-medium">
          <span className="text-slate-200">Best</span>
          <span className="font-mono-num font-bold text-amber-300">{bestScore}</span>
        </div>

        {/* Center: crisp tabular score counter */}
        <div
          aria-live="polite"
          className="absolute left-1/2 -translate-x-1/2 top-1 sm:top-0 text-center"
        >
          <span className="font-mono-num font-bold text-5xl sm:text-6xl text-white drop-shadow-[0_4px_0_rgba(15,23,42,0.75)] select-none">
            {score}
          </span>
        </div>

        {/* Right: Mute & Pause buttons (>=44px touch targets) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900/65 text-white border border-white/15 hover:bg-slate-900/85 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <button
              type="button"
              onClick={onTogglePause}
              aria-label={gameState === 'PAUSED' ? 'Resume game' : 'Pause game'}
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900/65 text-white border border-white/15 hover:bg-slate-900/85 active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              {gameState === 'PAUSED' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <div />
    </div>
  );
}
