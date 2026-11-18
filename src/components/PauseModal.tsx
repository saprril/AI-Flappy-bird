interface PauseModalProps {
  score: number;
  onResume: () => void;
  onRestart: () => void;
  onTitleMenu: () => void;
}

export function PauseModal({ score, onResume, onRestart, onTitleMenu }: PauseModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/55 p-5"
    >
      <div className="w-full max-w-xs rounded-2xl bg-slate-900 border border-white/15 p-6 text-center text-white shadow-2xl">
        <h2 id="pause-title" className="font-display font-bold text-2xl tracking-tight mb-1">
          Paused
        </h2>
        <p className="text-sm text-slate-300 mb-5">
          Current Score <span aria-hidden="true">·</span>{' '}
          <span className="font-mono-num font-bold text-amber-300">{score}</span>
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base shadow-[0_3px_0_#14532D] active:translate-y-0.5 transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            Resume
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-white/10 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            Restart
          </button>

          <button
            type="button"
            onClick={onTitleMenu}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            Title Menu
          </button>
        </div>
      </div>
    </div>
  );
}
