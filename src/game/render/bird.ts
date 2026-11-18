import type { BirdState } from '../../types/BirdState';

export function drawBird(ctx: CanvasRenderingContext2D, bird: BirdState): void {
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

  drawBirdEye(ctx, bird);
  drawBirdBeak(ctx, r);
  drawBirdWing(ctx, bird.wingPhase);

  ctx.restore();
}

function drawBirdEye(ctx: CanvasRenderingContext2D, bird: BirdState): void {
  const eyeX = 7;
  const eyeY = -4;

  if (bird.dead) {
    ctx.strokeStyle = '#1E1B18';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(eyeX - 3.5, eyeY - 3.5);
    ctx.lineTo(eyeX + 3.5, eyeY + 3.5);
    ctx.moveTo(eyeX + 3.5, eyeY - 3.5);
    ctx.lineTo(eyeX - 3.5, eyeY + 3.5);
    ctx.stroke();
    return;
  }

  if (bird.isBlinking) {
    ctx.strokeStyle = '#1E1B18';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(eyeX - 4, eyeY);
    ctx.lineTo(eyeX + 4, eyeY);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#3B1907';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.arc(eyeX + 1.8, eyeY, 2.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX + 2.6, eyeY - 1.1, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawBirdBeak(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.fillStyle = '#FB7185';
  ctx.strokeStyle = '#3B1907';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(radius - 2, -1);
  ctx.lineTo(radius + 12, 2.5);
  ctx.lineTo(radius - 2, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.moveTo(radius - 2, 5.5);
  ctx.lineTo(radius + 9, 5.5);
  ctx.lineTo(radius - 2, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBirdWing(ctx: CanvasRenderingContext2D, wingPhase: number): void {
  const wingOffset = Math.sin(wingPhase) * 6;
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
}
