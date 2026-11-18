import type { RenderContextState } from '../../types/RenderContextState';
import { PLAYABLE_HEIGHT, WORLD_HEIGHT } from '../constants';
import { drawBird } from './bird';
import { drawFloatingTexts, drawParticles, drawReadyHint } from './effects';
import { drawCoin, drawPipePair } from './obstacles';
import { drawClouds, drawGround, drawHills, drawSkyline } from './scenery';
import { drawSkyAndCelestials } from './skyPalette';

export function renderGame(ctx: CanvasRenderingContext2D, state: RenderContextState): void {
  const { worldWidth, time, skyProgress, scrollDistance } = state;

  ctx.save();
  ctx.translate(state.shakeOffsetX, state.shakeOffsetY);

  // 1. Sky backdrop, stars, and sun/moon
  const palette = drawSkyAndCelestials(ctx, worldWidth, time, skyProgress, state.stars);

  // 2. Parallax atmosphere & terrain layers
  drawClouds(ctx, state.clouds, palette.cloudTintRgb);
  drawSkyline(ctx, worldWidth, scrollDistance * 0.14, palette.citySilhouette);
  drawHills(ctx, worldWidth, scrollDistance * 0.24, PLAYABLE_HEIGHT - 56, 26, 0.008, palette.farHill);
  drawHills(ctx, worldWidth, scrollDistance * 0.42, PLAYABLE_HEIGHT - 24, 18, 0.013, palette.midHill);

  // 3. Pipes & collectible bonus coins
  for (let i = 0; i < state.pipes.length; i++) {
    drawPipePair(ctx, state.pipes[i], time);
  }
  for (let i = 0; i < state.coins.length; i++) {
    const coin = state.coins[i];
    if (!coin.collected) {
      drawCoin(ctx, coin, time);
    }
  }

  // 4. Foreground scrolling ground & active actors
  drawGround(ctx, worldWidth, scrollDistance);
  drawParticles(ctx, state.particles);
  drawBird(ctx, state.bird);
  drawFloatingTexts(ctx, state.floatingTexts);

  // 5. Ready launch hint
  if (state.showReadyHint) {
    drawReadyHint(ctx, state.bird.x, state.bird.y, time);
  }

  // 6. Impact flash overlay
  if (state.hitFlashAlpha > 0.005) {
    ctx.fillStyle = `rgba(255, 250, 240, ${state.hitFlashAlpha.toFixed(3)})`;
    ctx.fillRect(-16, -16, worldWidth + 32, WORLD_HEIGHT + 32);
  }

  ctx.restore();
}
