import {
  BirdState,
  BonusCoin,
  Cloud,
  FloatingText,
  GROUND_HEIGHT,
  Particle,
  PipePair,
  PLAYABLE_HEIGHT,
  Star,
  WORLD_HEIGHT,
} from './types';

export interface RenderContextState {
  worldWidth: number;
  time: number;
  skyProgress: number; // smoothly interpolates 0..3 cycle
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

interface PalettePhase {
  skyTop: [number, number, number];
  skyBottom: [number, number, number];
  sunColor: [number, number, number];
  farHill: [number, number, number];
  midHill: [number, number, number];
  citySilhouette: [number, number, number];
  cloudTint: [number, number, number];
  starAlpha: number;
}

const PHASES: PalettePhase[] = [
  // 0: Crisp Sunlit Morning
  {
    skyTop: [74, 178, 232],
    skyBottom: [197, 238, 250],
    sunColor: [255, 241, 168],
    farHill: [122, 198, 212],
    midHill: [88, 174, 130],
    citySilhouette: [139, 206, 222],
    cloudTint: [255, 255, 255],
    starAlpha: 0,
  },
  // 1: Golden Hour Sunset
  {
    skyTop: [96, 98, 184],
    skyBottom: [250, 176, 114],
    sunColor: [255, 198, 102],
    farHill: [148, 118, 152],
    midHill: [106, 122, 92],
    citySilhouette: [164, 130, 156],
    cloudTint: [255, 228, 204],
    starAlpha: 0.2,
  },
  // 2: Starlit Twilight
  {
    skyTop: [22, 34, 68],
    skyBottom: [64, 96, 148],
    sunColor: [228, 236, 255],
    farHill: [46, 70, 108],
    midHill: [38, 92, 86],
    citySilhouette: [52, 78, 120],
    cloudTint: [176, 196, 228],
    starAlpha: 0.85,
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(c1: [number, number, number], c2: [number, number, number], t: number, alpha = 1): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha.toFixed(3)})` : `rgb(${r},${g},${b})`;
}

export function renderGame(ctx: CanvasRenderingContext2D, state: RenderContextState): void {
  const { worldWidth, time, skyProgress, scrollDistance } = state;

  // Determine interpolated atmospheric phase (loops smoothly 0 -> 1 -> 2 -> 0)
  const wrapped = ((skyProgress % PHASES.length) + PHASES.length) % PHASES.length;
  const idxA = Math.floor(wrapped);
  const idxB = (idxA + 1) % PHASES.length;
  const blend = wrapped - idxA;
  const phaseA = PHASES[idxA];
  const phaseB = PHASES[idxB];

  ctx.save();
  ctx.translate(state.shakeOffsetX, state.shakeOffsetY);

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, PLAYABLE_HEIGHT);
  skyGrad.addColorStop(0, lerpRgb(phaseA.skyTop, phaseB.skyTop, blend));
  skyGrad.addColorStop(1, lerpRgb(phaseA.skyBottom, phaseB.skyBottom, blend));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-16, -16, worldWidth + 32, WORLD_HEIGHT + 32);

  // 2. Stars (visible during sunset/twilight)
  const starAlpha = lerp(phaseA.starAlpha, phaseB.starAlpha, blend);
  if (starAlpha > 0.02) {
    for (let i = 0; i < state.stars.length; i++) {
      const s = state.stars[i];
      const twinkle = 0.55 + 0.45 * Math.sin(time * 2.4 + s.twinkleOffset);
      ctx.fillStyle = `rgba(255, 250, 230, ${(starAlpha * twinkle).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.xNorm * worldWidth, s.yNorm * (PLAYABLE_HEIGHT * 0.65), s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Sun / Moon Celestial Body
  const sunX = worldWidth * 0.76;
  const sunY = PLAYABLE_HEIGHT * 0.24;
  const sunColor = lerpRgb(phaseA.sunColor, phaseB.sunColor, blend);
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 96);
  sunGlow.addColorStop(0, lerpRgb(phaseA.sunColor, phaseB.sunColor, blend, 0.55));
  sunGlow.addColorStop(1, lerpRgb(phaseA.sunColor, phaseB.sunColor, blend, 0));
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 96, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
  ctx.fill();

  // 4. Drifting Parallax Clouds
  const cloudColorBase = [
    Math.round(lerp(phaseA.cloudTint[0], phaseB.cloudTint[0], blend)),
    Math.round(lerp(phaseA.cloudTint[1], phaseB.cloudTint[1], blend)),
    Math.round(lerp(phaseA.cloudTint[2], phaseB.cloudTint[2], blend)),
  ] as [number, number, number];

  for (let i = 0; i < state.clouds.length; i++) {
    const c = state.clouds[i];
    drawCloud(ctx, c.x, c.y, c.scale, `rgba(${cloudColorBase[0]},${cloudColorBase[1]},${cloudColorBase[2]},${c.alpha})`);
  }

  // 5. Distant Skyline Silhouette (0.14x parallax)
  drawSkyline(ctx, worldWidth, scrollDistance * 0.14, lerpRgb(phaseA.citySilhouette, phaseB.citySilhouette, blend, 0.65));

  // 6. Far Rolling Hills (0.24x parallax)
  drawHills(
    ctx,
    worldWidth,
    scrollDistance * 0.24,
    PLAYABLE_HEIGHT - 56,
    26,
    0.008,
    lerpRgb(phaseA.farHill, phaseB.farHill, blend)
  );

  // 7. Mid Lush Foliage Hills (0.42x parallax)
  drawHills(
    ctx,
    worldWidth,
    scrollDistance * 0.42,
    PLAYABLE_HEIGHT - 24,
    18,
    0.013,
    lerpRgb(phaseA.midHill, phaseB.midHill, blend)
  );

  // 8. Pipes
  for (let i = 0; i < state.pipes.length; i++) {
    drawPipePair(ctx, state.pipes[i], time);
  }

  // 9. Bonus Coins
  for (let i = 0; i < state.coins.length; i++) {
    const coin = state.coins[i];
    if (!coin.collected) {
      drawCoin(ctx, coin, time);
    }
  }

  // 10. Scrolling Ground Track
  drawGround(ctx, worldWidth, scrollDistance);

  // 11. Particles (behind & around bird)
  drawParticles(ctx, state.particles);

  // 12. Bird
  drawBird(ctx, state.bird);

  // 13. Floating Score Texts
  drawFloatingTexts(ctx, state.floatingTexts);

  // 14. Ready Prompt inside Canvas World
  if (state.showReadyHint) {
    drawReadyHint(ctx, state.bird.x, state.bird.y, time);
  }

  // 15. Hit Flash Overlay
  if (state.hitFlashAlpha > 0.005) {
    ctx.fillStyle = `rgba(255, 250, 240, ${state.hitFlashAlpha.toFixed(3)})`;
    ctx.fillRect(-16, -16, worldWidth + 32, WORLD_HEIGHT + 32);
  }

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, fill: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.arc(22, -6, 26, 0, Math.PI * 2);
  ctx.arc(48, 0, 20, 0, Math.PI * 2);
  ctx.arc(-20, 4, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSkyline(ctx: CanvasRenderingContext2D, worldWidth: number, offset: number, fill: string): void {
  const blockW = 44;
  const patternCount = 9;
  const heights = [62, 92, 54, 108, 76, 84, 48, 98, 68];
  const cycleW = blockW * patternCount;
  const startX = -((offset % cycleW) + cycleW) % cycleW;

  ctx.fillStyle = fill;
  for (let x = startX - cycleW; x < worldWidth + cycleW; x += blockW) {
    const idx = Math.abs(Math.round((x - startX) / blockW)) % patternCount;
    const h = heights[idx];
    const y = PLAYABLE_HEIGHT - h - 24;
    ctx.fillRect(x, y, blockW - 4, h + 24);
  }
}

function drawHills(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  offset: number,
  baseY: number,
  amp: number,
  freq: number,
  fill: string
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-16, PLAYABLE_HEIGHT + 4);
  const step = 18;
  for (let x = -16; x <= worldWidth + 32; x += step) {
    const wx = x + offset;
    const y = baseY - Math.abs(Math.sin(wx * freq) * amp + Math.cos(wx * freq * 0.5) * (amp * 0.55));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(worldWidth + 32, PLAYABLE_HEIGHT + 4);
  ctx.closePath();
  ctx.fill();
}

function drawPipePair(ctx: CanvasRenderingContext2D, pipe: PipePair, time: number): void {
  const topHeight = Math.max(0, pipe.gapY - pipe.gapHeight / 2);
  const bottomY = pipe.gapY + pipe.gapHeight / 2;
  const bottomHeight = Math.max(0, PLAYABLE_HEIGHT - bottomY);

  if (topHeight > 0) {
    drawSinglePipe(ctx, pipe.x, 0, pipe.width, topHeight, 'top', pipe.isMoving, time);
  }
  if (bottomHeight > 0) {
    drawSinglePipe(ctx, pipe.x, bottomY, pipe.width, bottomHeight, 'bottom', pipe.isMoving, time);
  }
}

function drawSinglePipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  side: 'top' | 'bottom',
  isMoving: boolean,
  time: number
): void {
  const capH = 26;
  const capOverhang = 5;
  const capX = x - capOverhang;
  const capW = width + capOverhang * 2;
  const bodyH = Math.max(0, height - capH);

  // Horizontal cylindrical gradient for tactile arcade depth
  const grad = ctx.createLinearGradient(x, 0, x + width, 0);
  grad.addColorStop(0, isMoving ? '#1D6A5E' : '#2E7D32');
  grad.addColorStop(0.22, isMoving ? '#44B89F' : '#6ED155');
  grad.addColorStop(0.42, isMoving ? '#7EE4CE' : '#A4EA7B');
  grad.addColorStop(0.75, isMoving ? '#268776' : '#3E9C3C');
  grad.addColorStop(1, isMoving ? '#164F45' : '#215B25');

  const outlineColor = '#16351C';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = outlineColor;

  // Pipe shaft
  if (bodyH > 0) {
    const shaftY = side === 'top' ? y : y + capH;
    ctx.fillStyle = grad;
    ctx.fillRect(x, shaftY, width, bodyH);
    ctx.strokeRect(x, shaftY, width, bodyH);
  }

  // Pipe collar/cap
  const capY = side === 'top' ? y + height - capH : y;
  const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
  capGrad.addColorStop(0, isMoving ? '#1D6A5E' : '#2E7D32');
  capGrad.addColorStop(0.22, isMoving ? '#56C8AF' : '#7FE065');
  capGrad.addColorStop(0.42, isMoving ? '#95EFE0' : '#B5F28D');
  capGrad.addColorStop(0.78, isMoving ? '#268776' : '#3E9C3C');
  capGrad.addColorStop(1, isMoving ? '#164F45' : '#215B25');

  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.roundRect(capX, capY, capW, capH, 4);
  ctx.fill();
  ctx.stroke();

  // Moving pipe telegraph indicator: subtle amber beacon chevron on collar
  if (isMoving) {
    const pulse = 0.65 + 0.35 * Math.sin(time * 6);
    ctx.fillStyle = `rgba(251, 191, 36, ${pulse.toFixed(2)})`;
    const cx = capX + capW / 2;
    const cy = capY + capH / 2;
    ctx.beginPath();
    ctx.arc(cx - 12, cy, 3.2, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Up/down arrow glyph in center of collar
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 2);
    ctx.lineTo(cx, cy - 6);
    ctx.lineTo(cx + 4, cy - 2);
    ctx.moveTo(cx - 4, cy + 2);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx + 4, cy + 2);
    ctx.stroke();
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: BonusCoin, time: number): void {
  const spin = Math.cos(time * 5 + coin.spinPhase);
  const rx = Math.max(3, Math.abs(spin) * coin.radius);
  const ry = coin.radius;

  ctx.save();
  ctx.translate(coin.x, coin.y + Math.sin(time * 3.5 + coin.spinPhase) * 4);

  // Soft golden aura
  ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, coin.radius + 6, 0, Math.PI * 2);
  ctx.fill();

  // Outer coin rim
  ctx.fillStyle = '#F59E0B';
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner gleaming face
  if (rx > 5) {
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.65, ry * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, worldWidth: number, scrollDistance: number): void {
  const y = PLAYABLE_HEIGHT;

  // Top grass turf strip
  ctx.fillStyle = '#5EC242';
  ctx.fillRect(-16, y, worldWidth + 32, 18);

  // Diagonal chevron turf stripes for palpable speed feel
  const stripeW = 28;
  const offset = ((scrollDistance % (stripeW * 2)) + stripeW * 2) % (stripeW * 2);
  ctx.fillStyle = '#79DA5A';
  for (let x = -stripeW * 2 - offset; x < worldWidth + stripeW * 2; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + stripeW, y + 2);
    ctx.lineTo(x + stripeW - 10, y + 16);
    ctx.lineTo(x - 10, y + 16);
    ctx.closePath();
    ctx.fill();
  }

  // Turf highlight & border line
  ctx.fillStyle = '#9CF07E';
  ctx.fillRect(-16, y, worldWidth + 32, 3);
  ctx.fillStyle = '#2B5B22';
  ctx.fillRect(-16, y + 17, worldWidth + 32, 3);

  // Warm earth base
  const earthGrad = ctx.createLinearGradient(0, y + 20, 0, WORLD_HEIGHT);
  earthGrad.addColorStop(0, '#DFBE7E');
  earthGrad.addColorStop(1, '#BA9152');
  ctx.fillStyle = earthGrad;
  ctx.fillRect(-16, y + 20, worldWidth + 32, GROUND_HEIGHT - 20 + 16);

  // Subtle pebble texture
  const pebbleCycle = 64;
  const pebbleOffset = ((scrollDistance % pebbleCycle) + pebbleCycle) % pebbleCycle;
  ctx.fillStyle = 'rgba(138, 99, 44, 0.25)';
  for (let x = -pebbleCycle - pebbleOffset; x < worldWidth + pebbleCycle; x += pebbleCycle) {
    ctx.beginPath();
    ctx.ellipse(x + 18, y + 40, 8, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 48, y + 60, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBird(ctx: CanvasRenderingContext2D, bird: BirdState): void {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);
  ctx.scale(bird.scaleX, bird.scaleY);

  const r = bird.radius;

  // Tail feathers
  ctx.fillStyle = '#EA580C';
  ctx.strokeStyle = '#3B1907';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-r + 2, -2);
  ctx.lineTo(-r - 10, -8);
  ctx.lineTo(-r - 7, 0);
  ctx.lineTo(-r - 11, 6);
  ctx.lineTo(-r + 2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Main body
  const bodyGrad = ctx.createRadialGradient(-4, -6, 2, 0, 0, r + 2);
  bodyGrad.addColorStop(0, '#FDE047');
  bodyGrad.addColorStop(0.55, '#F59E0B');
  bodyGrad.addColorStop(1, '#D97706');

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r + 2, r - 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cream belly highlight
  ctx.fillStyle = '#FEF3C7';
  ctx.beginPath();
  ctx.ellipse(2, 6, r * 0.65, r * 0.45, -0.1, 0, Math.PI);
  ctx.fill();

  // Top head crest feather
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.moveTo(-2, -r + 2);
  ctx.quadraticCurveTo(-8, -r - 9, 2, -r - 5);
  ctx.quadraticCurveTo(4, -r - 1, 5, -r + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Expressive eye
  const eyeX = 7;
  const eyeY = -4;
  if (bird.dead) {
    // Classic X eye on collision
    ctx.strokeStyle = '#1E1B18';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(eyeX - 3.5, eyeY - 3.5);
    ctx.lineTo(eyeX + 3.5, eyeY + 3.5);
    ctx.moveTo(eyeX + 3.5, eyeY - 3.5);
    ctx.lineTo(eyeX - 3.5, eyeY + 3.5);
    ctx.stroke();
  } else if (bird.isBlinking) {
    ctx.strokeStyle = '#1E1B18';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(eyeX - 4, eyeY);
    ctx.lineTo(eyeX + 4, eyeY);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#3B1907';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil + glint
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.arc(eyeX + 1.8, eyeY, 2.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX + 2.6, eyeY - 1.1, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted beak
  ctx.fillStyle = '#FB7185';
  ctx.strokeStyle = '#3B1907';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r - 2, -1);
  ctx.lineTo(r + 12, 2.5);
  ctx.lineTo(r - 2, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.moveTo(r - 2, 5.5);
  ctx.lineTo(r + 9, 5.5);
  ctx.lineTo(r - 2, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Articulated flapping wing
  const wingOffset = Math.sin(bird.wingPhase) * 6;
  ctx.save();
  ctx.translate(-4, 2 + wingOffset * 0.25);
  ctx.rotate(wingOffset * 0.06);
  ctx.fillStyle = '#FEF08A';
  ctx.strokeStyle = '#3B1907';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.5, 6.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.active) continue;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'feather') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'spark') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.45, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.45, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < texts.length; i++) {
    const ft = texts[i];
    if (!ft.active) continue;
    const progress = ft.life / ft.maxLife;
    const alpha = Math.max(0, 1 - progress * progress);
    ctx.globalAlpha = alpha;
    ctx.font = '800 18px "Bricolage Grotesque", sans-serif';
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.75)';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.restore();
}

function drawReadyHint(ctx: CanvasRenderingContext2D, birdX: number, birdY: number, time: number): void {
  const pulse = 0.75 + 0.25 * Math.sin(time * 4.2);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const labelY = Math.min(PLAYABLE_HEIGHT - 54, birdY + 72);
  ctx.font = '700 18px "Bricolage Grotesque", sans-serif';
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.lineWidth = 4;
  ctx.strokeText('Tap or press Space to fly', birdX + 36, labelY);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Tap or press Space to fly', birdX + 36, labelY);
  ctx.restore();
}
