import type { FloatingText } from '../../types/FloatingText';
import type { Particle } from '../../types/Particle';
import { PLAYABLE_HEIGHT } from '../constants';

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
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

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < texts.length; i++) {
    const ft = texts[i];
    if (!ft.active) continue;

    const progress = ft.life / ft.maxLife;
    ctx.globalAlpha = Math.max(0, 1 - progress * progress);
    ctx.font = '800 18px "Bricolage Grotesque", sans-serif';
    ctx.strokeStyle = 'rgba(24, 24, 27, 0.75)';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore();
}

export function drawReadyHint(
  ctx: CanvasRenderingContext2D,
  birdX: number,
  birdY: number,
  time: number
): void {
  const pulse = 0.75 + 0.25 * Math.sin(time * 4.2);
  const labelY = Math.min(PLAYABLE_HEIGHT - 54, birdY + 72);

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 18px "Bricolage Grotesque", sans-serif';
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.lineWidth = 4;
  ctx.strokeText('Tap or press Space to fly', birdX + 36, labelY);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Tap or press Space to fly', birdX + 36, labelY);
  ctx.restore();
}
