import type { DifficultyConfig } from '../types/DifficultyConfig';
import type { DifficultyMode } from '../types/DifficultyMode';

export const WORLD_HEIGHT = 640;
export const GROUND_HEIGHT = 96;
export const PLAYABLE_HEIGHT = WORLD_HEIGHT - GROUND_HEIGHT;

export const PARTICLE_POOL_SIZE = 120;
export const FLOATING_TEXT_POOL_SIZE = 16;

export const DIFFICULTY_MODES: DifficultyMode[] = ['breezy', 'classic', 'turbo'];

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
