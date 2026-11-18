import type { BirdState } from '../types/BirdState';
import type { PipePair } from '../types/PipePair';
import { PLAYABLE_HEIGHT } from './constants';

export function circleIntersectsRect(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  if (rw <= 0 || rh <= 0) return false;

  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;

  return dx * dx + dy * dy < radius * radius;
}

export function checkBirdPipeCollision(bird: BirdState, pipe: PipePair): boolean {
  const topHeight = pipe.gapY - pipe.gapHeight / 2;
  const bottomY = pipe.gapY + pipe.gapHeight / 2;
  const bottomHeight = PLAYABLE_HEIGHT - bottomY;

  const hitTop = circleIntersectsRect(
    bird.x,
    bird.y,
    bird.hitboxRadius,
    pipe.x,
    0,
    pipe.width,
    topHeight
  );
  if (hitTop) return true;

  return circleIntersectsRect(
    bird.x,
    bird.y,
    bird.hitboxRadius,
    pipe.x,
    bottomY,
    pipe.width,
    bottomHeight
  );
}
