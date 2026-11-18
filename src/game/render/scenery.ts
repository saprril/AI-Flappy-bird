import type { Cloud } from '../../types/Cloud';
import { GROUND_HEIGHT, PLAYABLE_HEIGHT, WORLD_HEIGHT } from '../constants';

const SKYLINE_HEIGHTS = [62, 92, 54, 108, 76, 84, 48, 98, 68];

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  tintRgb: [number, number, number]
): void {
  const [r, g, b] = tintRgb;

  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i];
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);
    ctx.fillStyle = `rgba(${r},${g},${b},${cloud.alpha})`;

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.arc(22, -6, 26, 0, Math.PI * 2);
    ctx.arc(48, 0, 20, 0, Math.PI * 2);
    ctx.arc(-20, 4, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawSkyline(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  offset: number,
  fill: string
): void {
  const blockW = 44;
  const patternCount = SKYLINE_HEIGHTS.length;
  const cycleW = blockW * patternCount;
  const startX = -((offset % cycleW) + cycleW) % cycleW;

  ctx.fillStyle = fill;
  for (let x = startX - cycleW; x < worldWidth + cycleW; x += blockW) {
    const idx = Math.abs(Math.round((x - startX) / blockW)) % patternCount;
    const h = SKYLINE_HEIGHTS[idx];
    const y = PLAYABLE_HEIGHT - h - 24;
    ctx.fillRect(x, y, blockW - 4, h + 24);
  }
}

export function drawHills(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  offset: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  fill: string
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-16, PLAYABLE_HEIGHT + 4);

  const step = 18;
  for (let x = -16; x <= worldWidth + 32; x += step) {
    const worldX = x + offset;
    const y =
      baseY -
      Math.abs(Math.sin(worldX * frequency) * amplitude + Math.cos(worldX * frequency * 0.5) * (amplitude * 0.55));
    ctx.lineTo(x, y);
  }

  ctx.lineTo(worldWidth + 32, PLAYABLE_HEIGHT + 4);
  ctx.closePath();
  ctx.fill();
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  scrollDistance: number
): void {
  const y = PLAYABLE_HEIGHT;

  // Top grass turf strip
  ctx.fillStyle = '#5EC242';
  ctx.fillRect(-16, y, worldWidth + 32, 18);

  // Diagonal chevron turf stripes for palpable ground speed
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

  // Subtle scrolling pebble texture
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
