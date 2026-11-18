import type { DifficultyMode } from './DifficultyMode';

export interface DifficultyConfig {
  id: DifficultyMode;
  label: string;
  gravity: number;
  flapVelocity: number;
  terminalVelocity: number;
  baseSpeed: number;
  maxSpeed: number;
  baseGap: number;
  minGap: number;
  pipeSpacing: number;
  movingPipeStartScore: number;
}
