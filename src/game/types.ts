export type GameState = 'TITLE_MENU' | 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type DifficultyMode = 'breezy' | 'classic' | 'turbo';

export type MedalTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

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

export const WORLD_HEIGHT = 640;
export const GROUND_HEIGHT = 96;
export const PLAYABLE_HEIGHT = WORLD_HEIGHT - GROUND_HEIGHT;

export const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  breezy: {
    id: 'breezy',
    label: 'Breezy',
    gravity: 1280,
    flapVelocity: -425,
    terminalVelocity: 560,
    baseSpeed: 185,
    maxSpeed: 245,
    baseGap: 168,
    minGap: 142,
    pipeSpacing: 285,
    movingPipeStartScore: 12,
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    gravity: 1520,
    flapVelocity: -465,
    terminalVelocity: 620,
    baseSpeed: 215,
    maxSpeed: 295,
    baseGap: 148,
    minGap: 122,
    pipeSpacing: 262,
    movingPipeStartScore: 8,
  },
  turbo: {
    id: 'turbo',
    label: 'Turbo',
    gravity: 1820,
    flapVelocity: -515,
    terminalVelocity: 700,
    baseSpeed: 260,
    maxSpeed: 355,
    baseGap: 138,
    minGap: 114,
    pipeSpacing: 248,
    movingPipeStartScore: 5,
  },
};

export interface BirdState {
  x: number;
  y: number;
  vy: number;
  radius: number;
  hitboxRadius: number;
  rotation: number;
  wingPhase: number;
  scaleX: number;
  scaleY: number;
  blinkTimer: number;
  isBlinking: boolean;
  dead: boolean;
}

export interface PipePair {
  id: number;
  x: number;
  width: number;
  gapY: number;
  baseGapY: number;
  gapHeight: number;
  scored: boolean;
  isMoving: boolean;
  moveAmplitude: number;
  moveSpeed: number;
  movePhase: number;
}

export interface BonusCoin {
  id: number;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  spinPhase: number;
}

export type ParticleKind = 'feather' | 'spark' | 'dust' | 'ring';

export interface Particle {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  color: string;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speedFactor: number;
  alpha: number;
}

export interface Star {
  xNorm: number;
  yNorm: number;
  size: number;
  twinkleOffset: number;
}

export interface HudSnapshot {
  gameState: GameState;
  score: number;
  bestScore: number;
  isNewBest: boolean;
  difficulty: DifficultyMode;
  pipesCleared: number;
  coinsCollected: number;
}

export function getMedalTier(score: number): MedalTier {
  if (score >= 50) return 'platinum';
  if (score >= 35) return 'gold';
  if (score >= 20) return 'silver';
  if (score >= 10) return 'bronze';
  return 'none';
}
