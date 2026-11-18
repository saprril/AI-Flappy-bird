import { useCallback, useEffect, useRef, useState } from 'react';
import { GameOverModal } from './components/GameOverModal';
import { HudOverlay } from './components/HudOverlay';
import { PauseModal } from './components/PauseModal';
import { TitleOverlay } from './components/TitleOverlay';
import { soundEngine } from './game/audio';
import { SunwingEngine } from './game/engine';
import { DifficultyMode, HudSnapshot } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  gameState: 'TITLE_MENU',
  score: 0,
  bestScore: 0,
  isNewBest: false,
  difficulty: 'classic',
  pipesCleared: 0,
  coinsCollected: 0,
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SunwingEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SunwingEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    engine.startLoop();

    const handleResize = () => engine.resize();
    const handleBlur = () => engine.pauseIfPlaying();

    window.addEventListener('resize', handleResize);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', handleBlur);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyM' && !e.repeat) {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
        if (hud.gameState === 'PLAYING' || hud.gameState === 'PAUSED') {
          e.preventDefault();
          engine.togglePause();
        }
        return;
      }

      const isFlapKey = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
      const isStartKey = e.code === 'Enter' || e.code === 'Space';

      if (hud.gameState === 'TITLE_MENU') {
        if (isStartKey && !e.repeat) {
          // Avoid hijacking Enter/Space if user focused a specific difficulty button
          const activeTag = document.activeElement?.tagName;
          if (activeTag === 'BUTTON') return;
          e.preventDefault();
          engine.startNewRun();
        }
        return;
      }

      if (hud.gameState === 'READY' || hud.gameState === 'PLAYING') {
        if (isFlapKey && !e.repeat) {
          e.preventDefault();
          engine.handleFlapAction();
        }
        return;
      }

      if (hud.gameState === 'GAME_OVER') {
        if (isStartKey && !e.repeat) {
          const activeTag = document.activeElement?.tagName;
          if (activeTag === 'BUTTON') return;
          e.preventDefault();
          engine.handleFlapAction();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hud.gameState, handleToggleMute]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (hud.gameState === 'READY' || hud.gameState === 'PLAYING') {
      engineRef.current?.handleFlapAction();
    }
  };

  const handleSelectDifficulty = (mode: DifficultyMode) => {
    engineRef.current?.setDifficulty(mode);
  };

  const handleStart = () => {
    engineRef.current?.startNewRun();
  };

  const handleTogglePause = () => {
    engineRef.current?.togglePause();
  };

  const handleTitleMenu = () => {
    engineRef.current?.goToTitle();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#1B3B5A]">
      {/* Isolated full-viewport game canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        className="block w-full h-full cursor-pointer touch-manipulation"
      />

      {hud.gameState === 'TITLE_MENU' && (
        <TitleOverlay
          difficulty={hud.difficulty}
          bestScore={hud.bestScore}
          muted={muted}
          onSelectDifficulty={handleSelectDifficulty}
          onStart={handleStart}
          onToggleMute={handleToggleMute}
        />
      )}

      {(hud.gameState === 'READY' || hud.gameState === 'PLAYING' || hud.gameState === 'PAUSED') && (
        <HudOverlay
          gameState={hud.gameState}
          score={hud.score}
          bestScore={hud.bestScore}
          muted={muted}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
        />
      )}

      {hud.gameState === 'PAUSED' && (
        <PauseModal
          score={hud.score}
          onResume={handleTogglePause}
          onRestart={handleStart}
          onTitleMenu={handleTitleMenu}
        />
      )}

      {hud.gameState === 'GAME_OVER' && (
        <GameOverModal
          score={hud.score}
          bestScore={hud.bestScore}
          isNewBest={hud.isNewBest}
          difficulty={hud.difficulty}
          pipesCleared={hud.pipesCleared}
          coinsCollected={hud.coinsCollected}
          onPlayAgain={handleStart}
          onTitleMenu={handleTitleMenu}
        />
      )}
    </main>
  );
}

export default App;
