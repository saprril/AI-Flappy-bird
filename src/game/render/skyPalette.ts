import type { BlendedSkyColors } from '../../types/BlendedSkyColors';
import type { PalettePhase } from '../../types/PalettePhase';
import type { Star } from '../../types/Star';
import { PLAYABLE_HEIGHT, WORLD_HEIGHT } from '../constants';

const SKY_PHASES: PalettePhase[] = [
  // Sunlit Morning
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
  // Golden Hour Sunset
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
  // Starlit Twilight
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

function lerpRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
  alpha = 1
): string {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha.toFixed(3)})` : `rgb(${r},${g},${b})`;
}

export function drawSkyAndCelestials(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  time: number,
  skyProgress: number,
  stars: Star[]
): BlendedSkyColors {
  const wrapped = ((skyProgress % SKY_PHASES.length) + SKY_PHASES.length) % SKY_PHASES.length;
  const idxA = Math.floor(wrapped);
  const idxB = (idxA + 1) % SKY_PHASES.length;
  const blend = wrapped - idxA;
  const phaseA = SKY_PHASES[idxA];
  const phaseB = SKY_PHASES[idxB];

  // Sky gradient backdrop
  const skyGrad = ctx.createLinearGradient(0, 0, 0, PLAYABLE_HEIGHT);
  skyGrad.addColorStop(0, lerpRgb(phaseA.skyTop, phaseB.skyTop, blend));
  skyGrad.addColorStop(1, lerpRgb(phaseA.skyBottom, phaseB.skyBottom, blend));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-16, -16, worldWidth + 32, WORLD_HEIGHT + 32);

  // Twinkling stars during golden hour & twilight
  const starAlpha = lerp(phaseA.starAlpha, phaseB.starAlpha, blend);
  if (starAlpha > 0.02) {
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const twinkle = 0.55 + 0.45 * Math.sin(time * 2.4 + star.twinkleOffset);
      ctx.fillStyle = `rgba(255, 250, 230, ${(starAlpha * twinkle).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(star.xNorm * worldWidth, star.yNorm * (PLAYABLE_HEIGHT * 0.65), star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sun / Moon disc with soft atmospheric glow
  const sunX = worldWidth * 0.76;
  const sunY = PLAYABLE_HEIGHT * 0.24;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 96);
  sunGlow.addColorStop(0, lerpRgb(phaseA.sunColor, phaseB.sunColor, blend, 0.55));
  sunGlow.addColorStop(1, lerpRgb(phaseA.sunColor, phaseB.sunColor, blend, 0));

  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 96, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = lerpRgb(phaseA.sunColor, phaseB.sunColor, blend);
  ctx.beginPath();
  ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
  ctx.fill();

  return {
    farHill: lerpRgb(phaseA.farHill, phaseB.farHill, blend),
    midHill: lerpRgb(phaseA.midHill, phaseB.midHill, blend),
    citySilhouette: lerpRgb(phaseA.citySilhouette, phaseB.citySilhouette, blend, 0.65),
    cloudTintRgb: [
      Math.round(lerp(phaseA.cloudTint[0], phaseB.cloudTint[0], blend)),
      Math.round(lerp(phaseA.cloudTint[1], phaseB.cloudTint[1], blend)),
      Math.round(lerp(phaseA.cloudTint[2], phaseB.cloudTint[2], blend)),
    ],
  };
}
