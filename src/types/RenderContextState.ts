import type { BirdState } from './BirdState';
import type { BonusCoin } from './BonusCoin';
import type { Cloud } from './Cloud';
import type { FloatingText } from './FloatingText';
import type { Particle } from './Particle';
import type { PipePair } from './PipePair';
import type { Star } from './Star';

export interface RenderContextState {
  worldWidth: number;
  time: number;
  skyProgress: number;
  scrollDistance: number;
  shakeOffsetX: number;
  shakeOffsetY: number;
  hitFlashAlpha: number;
  bird: BirdState;
  pipes: PipePair[];
  coins: BonusCoin[];
  clouds: Cloud[];
  stars: Star[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  showReadyHint: boolean;
}
