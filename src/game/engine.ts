import type { BirdState } from '../types/BirdState';
import type { BonusCoin } from '../types/BonusCoin';
import type { Cloud } from '../types/Cloud';
import type { DifficultyMode } from '../types/DifficultyMode';
import type { FloatingText } from '../types/FloatingText';
import type { GameState } from '../types/GameState';
import type { HudSnapshot } from '../types/HudSnapshot';
import type { Particle } from '../types/Particle';
import type { ParticleKind } from '../types/ParticleKind';
import type { PipePair } from '../types/PipePair';
import type { Star } from '../types/Star';
import { soundEngine } from './audio';
import { checkBirdPipeCollision } from './collision';
import {
  DIFFICULTY_CONFIGS,
  FLOATING_TEXT_POOL_SIZE,
  PARTICLE_POOL_SIZE,
  PLAYABLE_HEIGHT,
  WORLD_HEIGHT,
} from './constants';
import { renderGame } from './render/renderGame';
import { loadBestScores, saveBestScores } from './storage';

export class SunwingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudChange: (snapshot: HudSnapshot) => void;

  private rafId = 0;
  private lastTimestamp = 0;
  private elapsedTime = 0;
  private dpr = 1;
  private worldWidth = 960;

  private gameState: GameState = 'TITLE_MENU';
  private difficulty: DifficultyMode = 'classic';
  private score = 0;
  private pipesCleared = 0;
  private coinsCollected = 0;
  private bestScores: Record<DifficultyMode, number>;
  private isNewBest = false;
  private gameOverAt = 0;

  // Input buffering & impact feel
  private bufferedFlapUntil = 0;
  private hitstopTimer = 0;
  private shakeTime = 0;
  private shakeIntensity = 0;
  private hitFlashAlpha = 0;

  // World progression
  private scrollDistance = 0;
  private skyProgress = 0;
  private nextPipeId = 1;
  private nextCoinId = 1;

  // Entities & pre-allocated pools
  private bird: BirdState;
  private pipes: PipePair[] = [];
  private coins: BonusCoin[] = [];
  private clouds: Cloud[] = [];
  private stars: Star[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  constructor(canvas: HTMLCanvasElement, onHudChange: (snapshot: HudSnapshot) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not acquire 2D canvas context');
    }

    this.ctx = context;
    this.onHudChange = onHudChange;
    this.bestScores = loadBestScores();

    this.bird = this.createInitialBird();
    this.initPools();
    this.initAtmosphere();
    this.resize();
    this.emitHud();
  }

  private createInitialBird(): BirdState {
    return {
      x: Math.min(240, this.worldWidth * 0.28),
      y: PLAYABLE_HEIGHT * 0.46,
      vy: 0,
      radius: 17,
      hitboxRadius: 13.2,
      rotation: 0,
      wingPhase: 0,
      scaleX: 1,
      scaleY: 1,
      blinkTimer: 2.2,
      isBlinking: false,
      dead: false,
    };
  }

  private initPools(): void {
    this.particles = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      kind: 'feather',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      alpha: 1,
      life: 0,
      maxLife: 0.5,
      rotation: 0,
      vRot: 0,
      color: '#FDE047',
    }));

    this.floatingTexts = Array.from({ length: FLOATING_TEXT_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: -40,
      text: '+1',
      color: '#FFFFFF',
      life: 0,
      maxLife: 0.7,
    }));
  }

  private initAtmosphere(): void {
    this.clouds = Array.from({ length: 8 }, (_, i) => ({
      x: (i * 220) % 1600,
      y: 55 + ((i * 67) % 190),
      scale: 0.72 + (i % 4) * 0.22,
      speedFactor: 0.08 + (i % 3) * 0.04,
      alpha: 0.65 + (i % 2) * 0.2,
    }));

    this.stars = Array.from({ length: 36 }, (_, i) => ({
      xNorm: ((i * 73 + 19) % 100) / 100,
      yNorm: ((i * 41 + 7) % 100) / 100,
      size: 1 + (i % 3) * 0.6,
      twinkleOffset: i * 0.9,
    }));
  }

  public startLoop(): void {
    if (this.rafId) return;
    this.lastTimestamp = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt, now);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  public resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const cssWidth = rect ? rect.width : window.innerWidth;
    const cssHeight = rect ? rect.height : window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.max(1, Math.floor(cssWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(cssHeight * this.dpr));

    const aspect = cssWidth / Math.max(1, cssHeight);
    this.worldWidth = Math.max(360, WORLD_HEIGHT * aspect);

    const targetBirdX = Math.min(260, Math.max(96, this.worldWidth * 0.28));
    if (this.gameState === 'TITLE_MENU' || this.gameState === 'READY') {
      this.bird.x = targetBirdX;
    }
  }

  public setDifficulty(mode: DifficultyMode): void {
    this.difficulty = mode;
    soundEngine.playClick();
    this.emitHud();
  }

  public startNewRun(): void {
    soundEngine.unlock();
    soundEngine.playClick();
    this.resetWorldEntities();
    this.gameState = 'READY';
    this.emitHud();
  }

  public goToTitle(): void {
    soundEngine.playClick();
    this.resetWorldEntities();
    this.gameState = 'TITLE_MENU';
    this.emitHud();
  }

  public togglePause(): void {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      soundEngine.playClick();
      this.emitHud();
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      soundEngine.playClick();
      this.emitHud();
    }
  }

  public pauseIfPlaying(): void {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.emitHud();
    }
  }

  public handleFlapAction(nowMs = performance.now()): void {
    soundEngine.unlock();

    if (this.gameState === 'READY') {
      this.gameState = 'PLAYING';
      this.executeFlap();
      this.spawnInitialPipes();
      this.emitHud();
      return;
    }

    if (this.gameState === 'PLAYING') {
      if (this.hitstopTimer > 0) {
        this.bufferedFlapUntil = nowMs + 100;
        return;
      }
      this.executeFlap();
      return;
    }

    if (this.gameState === 'GAME_OVER' && nowMs - this.gameOverAt > 380) {
      this.startNewRun();
    }
  }

  private resetWorldEntities(): void {
    this.score = 0;
    this.pipesCleared = 0;
    this.coinsCollected = 0;
    this.isNewBest = false;
    this.pipes = [];
    this.coins = [];
    this.hitstopTimer = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.hitFlashAlpha = 0;
    this.skyProgress = 0;
    this.bufferedFlapUntil = 0;

    this.bird = this.createInitialBird();
    this.bird.x = Math.min(260, Math.max(96, this.worldWidth * 0.28));

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false;
    }
    for (let i = 0; i < this.floatingTexts.length; i++) {
      this.floatingTexts[i].active = false;
    }
  }

  private executeFlap(): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    this.bird.vy = cfg.flapVelocity;
    this.bird.rotation = -0.46;
    this.bird.scaleX = 0.85;
    this.bird.scaleY = 1.2;
    this.bird.wingPhase = 0;
    soundEngine.playFlap();

    for (let i = 0; i < 4; i++) {
      this.spawnParticle(
        'feather',
        this.bird.x - 10,
        this.bird.y + 4,
        -60 - Math.random() * 70,
        40 + (Math.random() - 0.5) * 90,
        3.5 + Math.random() * 2,
        0.42 + Math.random() * 0.18,
        i % 2 === 0 ? '#FEF08A' : '#FBBF24'
      );
    }
  }

  private spawnInitialPipes(): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const firstX = Math.max(this.worldWidth * 0.72, this.bird.x + 340);
    this.spawnPipeAt(firstX);
    this.spawnPipeAt(firstX + cfg.pipeSpacing);
    this.spawnPipeAt(firstX + cfg.pipeSpacing * 2);
  }

  private getCurrentPipeSpeed(): number {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const ramp = Math.min(1, this.pipesCleared / 38);
    return cfg.baseSpeed + (cfg.maxSpeed - cfg.baseSpeed) * ramp;
  }

  private getCurrentGapHeight(): number {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const ramp = Math.min(1, this.pipesCleared / 34);
    return cfg.baseGap - (cfg.baseGap - cfg.minGap) * ramp;
  }

  private spawnPipeAt(x: number): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const gapHeight = this.getCurrentGapHeight();
    const minMargin = 74 + gapHeight / 2;
    const maxMargin = PLAYABLE_HEIGHT - 74 - gapHeight / 2;

    let gapY = minMargin + Math.random() * Math.max(20, maxMargin - minMargin);
    if (this.pipes.length > 0) {
      const prevGapY = this.pipes[this.pipes.length - 1].baseGapY;
      const maxStep = 195;
      gapY = Math.max(minMargin, Math.min(maxMargin, prevGapY + (Math.random() * 2 - 1) * maxStep));
    }

    const canMove = this.score >= cfg.movingPipeStartScore;
    const isMoving = canMove && Math.random() < 0.34;
    const moveAmplitude = isMoving ? Math.min(38, (maxMargin - minMargin) * 0.28) : 0;

    const pipe: PipePair = {
      id: this.nextPipeId++,
      x,
      width: 68,
      gapY,
      baseGapY: gapY,
      gapHeight,
      scored: false,
      isMoving,
      moveAmplitude,
      moveSpeed: 1.7 + Math.random() * 0.9,
      movePhase: Math.random() * Math.PI * 2,
    };
    this.pipes.push(pipe);

    if (pipe.id % 3 === 0) {
      const coinOffset = (Math.random() - 0.5) * (gapHeight * 0.36);
      this.coins.push({
        id: this.nextCoinId++,
        x: x + pipe.width / 2,
        y: gapY + coinOffset,
        radius: 11,
        collected: false,
        spinPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private update(dt: number, nowMs: number): void {
    this.elapsedTime += dt;

    if (this.hitFlashAlpha > 0) {
      this.hitFlashAlpha = Math.max(0, this.hitFlashAlpha - dt * 4.5);
    }
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    if (this.gameState === 'PAUSED') {
      return;
    }

    if (this.gameState === 'PLAYING' && this.bufferedFlapUntil > nowMs) {
      this.bufferedFlapUntil = 0;
      this.executeFlap();
    }

    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateBirdCosmetics(dt);
    this.updateClouds(dt);

    if (this.gameState === 'TITLE_MENU') {
      this.scrollDistance += 110 * dt;
      this.skyProgress = (this.elapsedTime * 0.03) % 3;
      this.bird.y = PLAYABLE_HEIGHT * 0.46 + Math.sin(this.elapsedTime * 3.2) * 12;
      this.bird.rotation = Math.cos(this.elapsedTime * 3.2) * 0.08;
      this.bird.wingPhase += dt * 13;
      return;
    }

    if (this.gameState === 'READY') {
      const cfg = DIFFICULTY_CONFIGS[this.difficulty];
      this.scrollDistance += cfg.baseSpeed * 0.65 * dt;
      this.bird.y = PLAYABLE_HEIGHT * 0.46 + Math.sin(this.elapsedTime * 3.8) * 10;
      this.bird.rotation = 0;
      this.bird.wingPhase += dt * 12;
      return;
    }

    if (this.gameState === 'GAME_OVER') {
      if (this.bird.y + this.bird.radius < PLAYABLE_HEIGHT) {
        this.bird.vy = Math.min(720, this.bird.vy + 1650 * dt);
        this.bird.y = Math.min(PLAYABLE_HEIGHT - this.bird.radius, this.bird.y + this.bird.vy * dt);
        this.bird.rotation = Math.min(Math.PI / 2, this.bird.rotation + dt * 5.2);
      }
      return;
    }

    this.stepActiveFlight(dt, nowMs);
  }

  private updateBirdCosmetics(dt: number): void {
    this.bird.scaleX += (1 - this.bird.scaleX) * Math.min(1, dt * 14);
    this.bird.scaleY += (1 - this.bird.scaleY) * Math.min(1, dt * 14);

    this.bird.blinkTimer -= dt;
    if (this.bird.blinkTimer <= 0) {
      if (this.bird.isBlinking) {
        this.bird.isBlinking = false;
        this.bird.blinkTimer = 2.0 + Math.random() * 2.5;
      } else {
        this.bird.isBlinking = true;
        this.bird.blinkTimer = 0.11;
      }
    }
  }

  private updateClouds(dt: number): void {
    const baseDrift = this.gameState === 'GAME_OVER' ? 10 : 32;
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i];
      cloud.x -= baseDrift * cloud.speedFactor * dt * 2.2;
      if (cloud.x < -120) {
        cloud.x = this.worldWidth + 120;
      }
    }
  }

  private stepActiveFlight(dt: number, nowMs: number): void {
    const cfg = DIFFICULTY_CONFIGS[this.difficulty];
    const speed = this.getCurrentPipeSpeed();
    this.scrollDistance += speed * dt;

    // Smooth atmospheric sky cycle driven by score
    const targetSky = (this.score / 15) % 3;
    let diff = targetSky - this.skyProgress;
    if (diff < -1.5) diff += 3;
    this.skyProgress = (this.skyProgress + diff * Math.min(1, dt * 1.4)) % 3;

    // Vertical gravity & velocity
    this.bird.vy = Math.min(cfg.terminalVelocity, this.bird.vy + cfg.gravity * dt);
    this.bird.y += this.bird.vy * dt;
    this.bird.wingPhase += dt * (this.bird.vy < 0 ? 22 : 10);

    // Velocity-reactive pitch rotation
    if (this.bird.vy < 90) {
      this.bird.rotation += (-0.42 - this.bird.rotation) * Math.min(1, dt * 12);
    } else {
      const fallFactor = Math.min(1, (this.bird.vy - 90) / (cfg.terminalVelocity - 90));
      const targetRot = -0.42 + fallFactor * 1.72;
      this.bird.rotation += (targetRot - this.bird.rotation) * Math.min(1, dt * 8.5);
    }

    // Soft ceiling clamp
    if (this.bird.y - this.bird.radius < 0) {
      this.bird.y = this.bird.radius;
      this.bird.vy = Math.max(0, this.bird.vy);
    }

    // Ground collision
    if (this.bird.y + this.bird.hitboxRadius >= PLAYABLE_HEIGHT) {
      this.bird.y = PLAYABLE_HEIGHT - this.bird.hitboxRadius;
      this.triggerCrash(nowMs);
      return;
    }

    // Update pipes & check collisions
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= speed * dt;

      if (pipe.isMoving) {
        pipe.movePhase += pipe.moveSpeed * dt;
        pipe.gapY = pipe.baseGapY + Math.sin(pipe.movePhase) * pipe.moveAmplitude;
      }

      if (!pipe.scored && pipe.x + pipe.width / 2 < this.bird.x) {
        pipe.scored = true;
        this.pipesCleared += 1;
        this.addScore(1, pipe.x + pipe.width / 2, pipe.gapY, '#FFFFFF');
      }

      if (checkBirdPipeCollision(this.bird, pipe)) {
        this.triggerCrash(nowMs);
        return;
      }

      if (pipe.x + pipe.width < -60) {
        this.pipes.splice(i, 1);
      }
    }

    // Spawn ahead pipe
    const lastPipe = this.pipes[this.pipes.length - 1];
    if (!lastPipe || lastPipe.x < this.worldWidth + 80) {
      const nextX = lastPipe ? lastPipe.x + cfg.pipeSpacing : this.worldWidth + 80;
      this.spawnPipeAt(nextX);
    }

    // Update & collect bonus coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= speed * dt;

      if (!coin.collected) {
        const dx = this.bird.x - coin.x;
        const dy = this.bird.y - coin.y;
        const hitDist = this.bird.radius + coin.radius;

        if (dx * dx + dy * dy <= hitDist * hitDist) {
          coin.collected = true;
          this.coinsCollected += 1;
          soundEngine.playCoin();
          this.addScore(2, coin.x, coin.y - 12, '#FDE047', true);
          this.emitCoinBurst(coin.x, coin.y);
        }
      }

      if (coin.collected || coin.x < -40) {
        this.coins.splice(i, 1);
      }
    }
  }

  private emitCoinBurst(x: number, y: number): void {
    this.spawnParticle('ring', x, y, 0, 0, 12, 0.35, '#FDE047');
    for (let k = 0; k < 10; k++) {
      const ang = (Math.PI * 2 * k) / 10;
      this.spawnParticle(
        'spark',
        x,
        y,
        Math.cos(ang) * (90 + Math.random() * 50),
        Math.sin(ang) * (90 + Math.random() * 50),
        5,
        0.42,
        k % 2 === 0 ? '#FEF08A' : '#F59E0B'
      );
    }
  }

  private addScore(points: number, fxX: number, fxY: number, color: string, isCoin = false): void {
    const prevTen = Math.floor(this.score / 10);
    this.score += points;
    const newTen = Math.floor(this.score / 10);

    if (this.score > this.bestScores[this.difficulty]) {
      this.bestScores[this.difficulty] = this.score;
      this.isNewBest = true;
      saveBestScores(this.bestScores);
    }

    if (!isCoin) {
      if (newTen > prevTen) {
        soundEngine.playMilestone();
        this.spawnFloatingText(this.bird.x, this.bird.y - 28, `${this.score}!`, '#A7F3D0');
      } else {
        soundEngine.playScore();
      }
    } else {
      this.spawnFloatingText(fxX, fxY, `+${points}`, color);
    }

    this.emitHud();
  }

  private triggerCrash(nowMs: number): void {
    this.bird.dead = true;
    this.bird.scaleX = 1.24;
    this.bird.scaleY = 0.78;
    this.gameState = 'GAME_OVER';
    this.gameOverAt = nowMs;

    this.hitstopTimer = 0.045;
    this.shakeTime = 0.28;
    this.shakeIntensity = 11;
    this.hitFlashAlpha = 0.72;
    soundEngine.playHit();

    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 190;
      this.spawnParticle(
        i % 3 === 0 ? 'dust' : 'feather',
        this.bird.x,
        this.bird.y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd - 40,
        4 + Math.random() * 4,
        0.5 + Math.random() * 0.35,
        i % 3 === 0 ? '#FFFFFF' : i % 2 === 0 ? '#F59E0B' : '#FEF08A'
      );
    }

    this.emitHud();
  }

  private spawnParticle(
    kind: ParticleKind,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    maxLife: number,
    color: string
  ): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.kind = kind;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.size = size;
        p.alpha = 1;
        p.life = 0;
        p.maxLife = maxLife;
        p.rotation = Math.random() * Math.PI * 2;
        p.vRot = (Math.random() - 0.5) * 8;
        p.color = color;
        return;
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      const progress = p.life / p.maxLife;
      if (p.kind === 'ring') {
        p.size += dt * 78;
        p.alpha = 1 - progress;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.kind === 'feather' ? 160 : 280) * dt;
        p.rotation += p.vRot * dt;
        p.alpha = 1 - progress * progress;
      }
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) {
        ft.active = true;
        ft.x = x;
        ft.y = y;
        ft.vy = -48;
        ft.text = text;
        ft.color = color;
        ft.life = 0;
        ft.maxLife = 0.75;
        return;
      }
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) continue;

      ft.life += dt;
      if (ft.life >= ft.maxLife) {
        ft.active = false;
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  private emitHud(): void {
    this.onHudChange({
      gameState: this.gameState,
      score: this.score,
      bestScore: this.bestScores[this.difficulty],
      isNewBest: this.isNewBest,
      difficulty: this.difficulty,
      pipesCleared: this.pipesCleared,
      coinsCollected: this.coinsCollected,
    });
  }

  private render(): void {
    const scale = this.canvas.height / WORLD_HEIGHT;
    this.ctx.save();
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const shakeMag = this.shakeTime > 0 ? this.shakeIntensity * (this.shakeTime / 0.28) : 0;
    const shakeOffsetX = shakeMag > 0 ? (Math.random() * 2 - 1) * shakeMag : 0;
    const shakeOffsetY = shakeMag > 0 ? (Math.random() * 2 - 1) * shakeMag : 0;

    renderGame(this.ctx, {
      worldWidth: this.worldWidth,
      time: this.elapsedTime,
      skyProgress: this.skyProgress,
      scrollDistance: this.scrollDistance,
      shakeOffsetX,
      shakeOffsetY,
      hitFlashAlpha: this.hitFlashAlpha,
      bird: this.bird,
      pipes: this.pipes,
      coins: this.coins,
      clouds: this.clouds,
      stars: this.stars,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      showReadyHint: this.gameState === 'READY',
    });

    this.ctx.restore();
  }
}
