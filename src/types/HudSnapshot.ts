import type { DifficultyMode } from './DifficultyMode';
import type { GameState } from './GameState';

export interface HudSnapshot {
  gameState: GameState;
  score: number;
  bestScore: number;
  isNewBest: boolean;
  difficulty: DifficultyMode;
  pipesCleared: number;
  coinsCollected: number;
}
