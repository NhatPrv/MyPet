import { ParticleSystem } from "./Particle.ts";

export type PetMood = "happy" | "sleepy" | "curious" | "excited" | "surprised" | "startled";
export type IdleSubAction = "NONE" | "LOOK_AROUND" | "STRETCH" | "YAWN" | "BOUNCE" | "SCRATCH";

export interface RenderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isFacingRight: boolean;
  stateName: string;
  isGrounded: boolean;
  isDragged: boolean;
  mood: PetMood;
  idleSubAction?: IdleSubAction;
  idleSubProgress?: number;
  isStartled?: boolean;
  startledProgress?: number;
}

export class GugugagaRenderer {
  public width: number = 84;
  public height: number = 80;

  // Hoạt cảnh mắt & nhịp thở
  private breathePhase: number = 0;
  private blinkTimer: number = 2.5;
  private isBlinking: boolean = false;
  private blinkProgress: number = 0;

  // Lắc lư tai & chân (Secondary motion)
  private earSway: number = 0;
  private walkCycle: number = 0;

  // Squash & Stretch
  private currentScaleX: number = 1;
  private currentScaleY: number = 1;

  // Hệ thống hạt gắn kèm
  public particles: ParticleSystem;

  // Hỗ trợ nạp sprite sheet tùy biến từ bên ngoài
  private customSpriteSheet: HTMLImageElement | null = null;

  constructor() {
    this.particles = new ParticleSystem();
  }

  public setCustomSpriteSheet(img: HTMLImageElement | null): void {
    this.customSpriteSheet = img;
  }

  public update(dt: number, state: RenderState): void {
    this.breathePhase += dt * 3.5;
    this.particles.update(dt);

    // 1. Logic chớp mắt (không chớp khi giật mình)
    if (!state.isStartled) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        this.blinkProgress = 0;
        this.blinkTimer = 2.5 + Math.random() * 3.5;
      }
      if (this.isBlinking) {
        this.blinkProgress += dt * 10;
        if (this.blinkProgress >= 1) {
          this.isBlinking = false;
        }
      }
    } else {
      this.isBlinking = false;
    }

    // 2. Logic chu kỳ đi bộ & lắc lư tai
    if (state.stateName === "WALK" && state.isGrounded) {
      this.walkCycle += dt * 12;
      this.earSway = Math.sin(this.walkCycle) * 0.25;

      // Phát hạt bụi bước chân
      if (Math.sin(this.walkCycle) > 0.9) {
        this.particles.emitDust(state.x + (state.isFacingRight ? -15 : 15), state.y + this.height * 0.45);
      }
    } else if (state.isStartled) {
      // Giật mình: Tai rung bần bật
      this.earSway = Math.sin(this.breathePhase * 18) * 0.35;
    } else if (state.idleSubAction === "SCRATCH") {
      // Gãi tai: Tai bên gãi rung nhanh
      this.earSway = Math.sin(this.breathePhase * 24) * 0.4;
    } else {
      this.walkCycle = 0;
      this.earSway = Math.sin(this.breathePhase * 0.8) * 0.08;
    }

    // 3. Tính toán Squash & Stretch theo trạng thái & idle sub-action
    let targetScaleX = 1;
    let targetScaleY = 1;

    if (state.isStartled) {
      // Giật mình: người thon cao vọt lên
      targetScaleX = 0.78;
      targetScaleY = 1.28;
    } else if (state.isDragged) {
      targetScaleX = 0.88;
      targetScaleY = 1.15;
      this.earSway = (state.vx * 0.002);
    } else if (state.stateName === "SLEEP") {
      targetScaleX = 1.08 + Math.sin(this.breathePhase * 0.5) * 0.03;
      targetScaleY = 0.85 - Math.sin(this.breathePhase * 0.5) * 0.03;
    } else if (state.idleSubAction === "STRETCH") {
      // Vươn vai duỗi người
      targetScaleX = 0.82;
      targetScaleY = 1.24;
    } else if (state.idleSubAction === "YAWN") {
      // Ngáp
      targetScaleX = 1.05;
      targetScaleY = 0.95;
    } else if (state.idleSubAction === "BOUNCE") {
      // Nhún nhảy
      const bounce = Math.abs(Math.sin((state.idleSubProgress || 0) * Math.PI * 4));
      targetScaleX = 1 - bounce * 0.12;
      targetScaleY = 1 + bounce * 0.18;
    } else if (!state.isGrounded) {
      if (state.vy < -50) {
        targetScaleX = 0.85;
        targetScaleY = 1.18;
      } else if (state.vy > 100) {
        targetScaleX = 0.92;
        targetScaleY = 1.1;
      }
    } else {
      const breathe = Math.sin(this.breathePhase) * 0.03;
      targetScaleX = 1 + breathe;
      targetScaleY = 1 - breathe;
    }

    // Nội suy mượt mà Scale
    this.currentScaleX += (targetScaleX - this.currentScaleX) * Math.min(1, dt * 18);
    this.currentScaleY += (targetScaleY - this.currentScaleY) * Math.min(1, dt * 18);
  }

  public render(ctx: CanvasRenderingContext2D, state: RenderState): void {
    this.particles.render(ctx);

    ctx.save();

    // Rung lắc giật mình (Shiver effect)
    let renderX = state.x;
    let renderY = state.y;
    if (state.isStartled) {
      const shiver = Math.sin(this.breathePhase * 25) * 3;
      renderX += shiver;
    }

    ctx.translate(renderX, renderY);

    if (!state.isFacingRight) {
      ctx.scale(-1, 1);
    }

    ctx.scale(this.currentScaleX, this.currentScaleY);

    if (this.customSpriteSheet) {
      ctx.drawImage(
        this.customSpriteSheet,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      this.drawProceduralGugugaga(ctx, state);
    }

    ctx.restore();
  }

  private drawProceduralGugugaga(ctx: CanvasRenderingContext2D, state: RenderState): void {
    const isSleeping = state.stateName === "SLEEP";
    const isExcited = state.stateName === "CHASE_BUTTERFLY" || state.mood === "excited";
    const isDragged = state.isDragged;

    if (state.isGrounded && !isDragged && !state.isStartled) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.beginPath();
      ctx.ellipse(0, 36, 32 * this.currentScaleX, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.drawFeet(ctx, state);
    this.drawEars(ctx, isSleeping, state.isStartled);
    this.drawBody(ctx, isSleeping, state.isStartled);
    this.drawFace(ctx, state, isSleeping, isExcited, isDragged);
    this.drawHands(ctx, state);
  }

  private drawEars(ctx: CanvasRenderingContext2D, isSleeping: boolean, isStartled?: boolean): void {
    ctx.save();
    const earOffsetY = isSleeping ? 6 : (isStartled ? -6 : 0);

    // Tai trái
    ctx.save();
    ctx.translate(-22, -26 + earOffsetY);
    ctx.rotate(isStartled ? -0.05 + this.earSway : -0.25 + this.earSway);
    this.drawSingleEar(ctx);
    ctx.restore();

    // Tai phải
    ctx.save();
    ctx.translate(22, -26 + earOffsetY);
    ctx.rotate(isStartled ? 0.05 - this.earSway : 0.25 - this.earSway);
    this.drawSingleEar(ctx);
    ctx.restore();

    ctx.restore();
  }

  private drawSingleEar(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, -28);
    grad.addColorStop(0, "#fb923c");
    grad.addColorStop(1, "#f97316");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-14, -20, 0, -32);
    ctx.quadraticCurveTo(14, -20, 10, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.quadraticCurveTo(-8, -16, 0, -24);
    ctx.quadraticCurveTo(8, -16, 6, -2);
    ctx.closePath();
    ctx.fill();
  }

  private drawBody(ctx: CanvasRenderingContext2D, isSleeping: boolean, isStartled?: boolean): void {
    ctx.save();

    const bodyGrad = ctx.createRadialGradient(-8, -8, 8, 0, 4, 44);
    if (isSleeping) {
      bodyGrad.addColorStop(0, "#fed7aa");
      bodyGrad.addColorStop(1, "#f97316");
    } else if (isStartled) {
      bodyGrad.addColorStop(0, "#fff7ed");
      bodyGrad.addColorStop(0.3, "#fdba74");
      bodyGrad.addColorStop(1, "#ea580c");
    } else {
      bodyGrad.addColorStop(0, "#ffedd5");
      bodyGrad.addColorStop(0.4, "#fb923c");
      bodyGrad.addColorStop(1, "#ea580c");
    }

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 38, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawFace(
    ctx: CanvasRenderingContext2D,
    state: RenderState,
    isSleeping: boolean,
    isExcited: boolean,
    isDragged: boolean
  ): void {
    ctx.save();

    // 1. Má hồng
    ctx.fillStyle = "rgba(244, 63, 94, 0.45)";
    ctx.beginPath();
    ctx.ellipse(-23, 8, 7, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(23, 8, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Mắt (Eyes)
    if (state.isStartled) {
      // MẮT GIẬT MÌNH KINH NGẠC (Shocked wide eyes with tiny pinpoint pupils)
      this.drawShockedEye(ctx, -14, -1);
      this.drawShockedEye(ctx, 14, -1);
    } else if (isSleeping) {
      ctx.strokeStyle = "#431407";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-14, 2, 7, 0.2, Math.PI - 0.2, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(14, 2, 7, 0.2, Math.PI - 0.2, false);
      ctx.stroke();
    } else if (state.idleSubAction === "YAWN") {
      // Mắt híp lại khi ngáp (^ ^)
      ctx.strokeStyle = "#431407";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-14, 4, 6, Math.PI + 0.3, -0.3, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(14, 4, 6, Math.PI + 0.3, -0.3, false);
      ctx.stroke();
    } else if (this.isBlinking) {
      ctx.strokeStyle = "#431407";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-20, 2);
      ctx.lineTo(-8, 2);
      ctx.moveTo(8, 2);
      ctx.lineTo(20, 2);
      ctx.stroke();
    } else if (isExcited) {
      this.drawStarEye(ctx, -14, 0);
      this.drawStarEye(ctx, 14, 0);
    } else {
      this.drawNormalEye(ctx, -14, 0, state);
      this.drawNormalEye(ctx, 14, 0, state);
    }

    // 3. Miệng (Mouth)
    ctx.fillStyle = "#7f1d1d";
    ctx.strokeStyle = "#431407";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (state.isStartled) {
      // Miệng giật mình há hốc chữ O rung rinh
      ctx.beginPath();
      ctx.ellipse(0, 16, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isDragged) {
      ctx.beginPath();
      ctx.ellipse(0, 16, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (state.idleSubAction === "YAWN") {
      // Miệng ngáp to tròn
      ctx.beginPath();
      ctx.arc(0, 14, 8, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.stroke();
    } else if (isExcited || state.stateName === "NOTIFY") {
      ctx.beginPath();
      ctx.arc(0, 11, 8, 0, Math.PI, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.arc(0, 16, 5, Math.PI, 0, false);
      ctx.fill();
    } else if (isSleeping) {
      ctx.beginPath();
      ctx.arc(0, 10, 4, 0.2, Math.PI - 0.2, false);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-3, 10, 4, 0, Math.PI * 0.8, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3, 10, 4, Math.PI * 0.2, Math.PI, false);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawShockedEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    // Mắt to tròn màu trắng trợn ngược
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#431407";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Đồng tử co nhỏ xíu kinh ngạc
    ctx.fillStyle = "#1e1b4b";
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawNormalEye(ctx: CanvasRenderingContext2D, x: number, y: number, state: RenderState): void {
    ctx.save();
    ctx.fillStyle = "#1e1b4b";
    ctx.beginPath();
    ctx.ellipse(x, y, 7.5, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đồng tử liếc khi LOOK_AROUND
    let pupilShiftX = state.isFacingRight ? 1.5 : -1.5;
    if (state.idleSubAction === "LOOK_AROUND") {
      const shift = Math.sin((state.idleSubProgress || 0) * Math.PI * 2) * 4;
      pupilShiftX = shift;
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - 2 + pupilShiftX, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 2.5 + pupilShiftX, y + 2.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawStarEye(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = cx + Math.cos(outerAngle) * 9;
      const oy = cy + Math.sin(outerAngle) * 9;
      const ix = cx + Math.cos(innerAngle) * 4;
      const iy = cy + Math.sin(innerAngle) * 4;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawFeet(ctx: CanvasRenderingContext2D, state: RenderState): void {
    ctx.save();
    ctx.fillStyle = "#ea580c";

    let leftFootY = 32;
    let rightFootY = 32;

    if (state.stateName === "WALK" && state.isGrounded) {
      leftFootY += Math.sin(this.walkCycle) * 7;
      rightFootY += Math.sin(this.walkCycle + Math.PI) * 7;
    } else if (state.isStartled) {
      // Co giật chân lên khi giật mình
      leftFootY += 4;
      rightFootY += 4;
    } else if (state.isDragged) {
      leftFootY += Math.sin(this.breathePhase * 3) * 5;
      rightFootY += Math.cos(this.breathePhase * 3) * 5;
    }

    ctx.beginPath();
    ctx.ellipse(-18, leftFootY, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(18, rightFootY, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawHands(ctx: CanvasRenderingContext2D, state: RenderState): void {
    ctx.save();
    ctx.fillStyle = "#fb923c";

    if (state.isStartled) {
      // Giơ hai tay co rúm lại giật mình
      ctx.beginPath();
      ctx.ellipse(-26, -12, 7, 7, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(26, -12, 7, 7, 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.idleSubAction === "STRETCH") {
      // Vươn hai tay lên cao duỗi người
      ctx.beginPath();
      ctx.ellipse(-22, -18, 7, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(22, -18, 7, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.idleSubAction === "SCRATCH") {
      // Tay phải giơ lên gãi tai
      ctx.beginPath();
      ctx.ellipse(-14, 16, 6, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(24, -20, 7, 6, 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.isDragged || state.stateName === "NOTIFY") {
      ctx.beginPath();
      ctx.ellipse(-24, -2, 7, 6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(24, -2, 7, 6, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(-14, 16, 6, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(14, 16, 6, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
