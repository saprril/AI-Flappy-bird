import type { BonusCoin } from '../../types/BonusCoin';
import type { PipePair } from '../../types/PipePair';
import { PLAYABLE_HEIGHT } from '../constants';

export function drawPipePair(ctx: CanvasRenderingContext2D, pipe: PipePair, time: number): void {
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

  // Cylindrical horizontal gradient for arcade depth
  const shaftGrad = ctx.createLinearGradient(x, 0, x + width, 0);
  shaftGrad.addColorStop(0, isMoving ? '#1D6A5E' : '#2E7D32');
  shaftGrad.addColorStop(0.22, isMoving ? '#44B89F' : '#6ED155');
  shaftGrad.addColorStop(0.42, isMoving ? '#7EE4CE' : '#A4EA7B');
  shaftGrad.addColorStop(0.75, isMoving ? '#268776' : '#3E9C3C');
  shaftGrad.addColorStop(1, isMoving ? '#164F45' : '#215B25');

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#16351C';

  // Pipe shaft
  if (bodyH > 0) {
    const shaftY = side === 'top' ? y : y + capH;
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(x, shaftY, width, bodyH);
    ctx.strokeRect(x, shaftY, width, bodyH);
  }

  // Pipe collar cap
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

  // Moving pipe telegraph indicator on collar
  if (isMoving) {
    const pulse = 0.65 + 0.35 * Math.sin(time * 6);
    const cx = capX + capW / 2;
    const cy = capY + capH / 2;

    ctx.fillStyle = `rgba(251, 191, 36, ${pulse.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(cx - 12, cy, 3.2, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy, 3.2, 0, Math.PI * 2);
    ctx.fill();

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

export function drawCoin(ctx: CanvasRenderingContext2D, coin: BonusCoin, time: number): void {
  const spin = Math.cos(time * 5 + coin.spinPhase);
  const rx = Math.max(3, Math.abs(spin) * coin.radius);
  const ry = coin.radius;

  ctx.save();
  ctx.translate(coin.x, coin.y + Math.sin(time * 3.5 + coin.spinPhase) * 4);

  // Soft golden glow
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
