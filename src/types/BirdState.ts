export interface BirdState {
  x: number;
  y: number;
  vy: number;
  radius: number;
  hitboxRadius: number;
  rotation: number;
  wingPhase: number;
  scaleX: number;
  scaleY: number;
  blinkTimer: number;
  isBlinking: boolean;
  dead: boolean;
}
