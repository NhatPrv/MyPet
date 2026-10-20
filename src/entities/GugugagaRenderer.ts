/**
 * GugugagaRenderer.ts — v3.0
 * Renderer sử dụng SpriteAnimator cho animation frame-by-frame thực sự.
 * Hỗ trợ: squash-stretch, crossfade, shadow, pendulum, particles.
 */
import { ParticleSystem } from "./Particle.ts";
import { GugugagaRig, RigPose } from "./GugugagaRig.ts";
import { SpriteAnimator } from "../animation/SpriteAnimator.ts";
import { FrameMeta } from "../animation/GugugagaAnimDefs.ts";

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
  lookTarget?: { x: number; y: number };
  customPose?: RigPose;
  chaseStage?: string;
  isDraggedFast?: boolean;
  pendulumAngle?: number;
}

export class GugugagaRenderer {
  public width: number = 96;
  public height: number = 100;

  public rig: GugugagaRig;
  public particles: ParticleSystem;
  public animator: SpriteAnimator;

  private breathePhase: number = 0;
  private dustTimer: number = 0;

  constructor() {
    this.rig = new GugugagaRig();
    this.particles = new ParticleSystem();
    this.animator = new SpriteAnimator();

    // Bắt đầu với idle
    this.animator.play("idle");
  }

  // ── UPDATE ────────────────────────────────────────────────

  public update(dt: number, state: RenderState): void {
    this.breathePhase += dt * 3.5;
    this.particles.update(dt);
    this.rig.update(dt);

    // Chọn animation clip phù hợp với state
    this.selectAnimation(state);

    this.animator.update(dt);
    if ((state.stateName === "WALK" || state.stateName === "CHASE_BUTTERFLY") && state.isGrounded) {
      this.dustTimer += dt;
      if (this.dustTimer > 0.18) {
        this.dustTimer = 0;
        this.particles.emitDust(
          state.x + (state.isFacingRight ? -22 : 22),
          state.y + 44
        );
      }
    } else {
      this.dustTimer = 0;
    }



  }

  /** Ánh xạ game-state sang animation clip name */
  private selectAnimation(state: RenderState): void {
    const s = state.stateName;

    // Giật mình — ưu tiên cao nhất
    if (state.isStartled) {
      this.animator.play("startled", 0.05);
      return;
    }

    // Bị kéo
    if (state.isDragged) {
      this.animator.play(state.isDraggedFast ? "dragged_fast" : "dragged", 0.08);
      return;
    }

    // Ngủ
    if (s === "SLEEP") {
      this.animator.play("sleep", 0.15);
      return;
    }

    // Nhận thông báo
    if (s === "NOTIFY") {
      this.animator.play("notify", 0.1);
      return;
    }

    // Rượt bắt bướm
    if (s === "CHASE_BUTTERFLY") {
      const stage = state.chaseStage ?? "";
      if (stage === "ANTICIPATION") {
        this.animator.play("chase_crouch", 0.08);
      } else if (stage === "SPRINT") {
        this.animator.play("chase_run", 0.06);
      } else if (stage === "POUNCE") {
        this.animator.play("chase_jump", 0.05, true);
      } else if (stage === "CELEBRATE") {
        this.animator.play("chase_celebrate", 0.1);
      }
      return;
    }

    // Đi bộ tuần tra
    if (s === "WALK") {
      this.animator.play("walk", 0.08);
      return;
    }

    // Idle với sub-action
    if (s === "IDLE") {
      const sub = state.idleSubAction ?? "NONE";
      if (sub === "LOOK_AROUND" || sub === "BOUNCE" || sub === "SCRATCH") {
        this.animator.play("idle_wave", 0.12);
      } else {
        this.animator.play("idle", 0.12);
      }
      return;
    }

    // Default
    this.animator.play("idle", 0.12);
  }

  // ── RENDER ────────────────────────────────────────────────

  public render(ctx: CanvasRenderingContext2D, state: RenderState): void {
    // 1. Vẽ particles
    this.particles.render(ctx);

    ctx.save();

    // Hiệu ứng rung khi startled
    let renderX = state.x;
    let renderY = state.y;
    if (state.isStartled) {
      renderX += Math.sin(this.breathePhase * 22) * 3;
    }

    ctx.translate(renderX, renderY);

    const img = this.animator.currentImage;
    const meta = this.animator.currentMeta;

    if (img) {
      // Vẽ crossfade clip cũ trước (dưới lớp)
      const prevImg = this.animator.crossfadeImage;
      if (prevImg) {
        ctx.save();
        ctx.globalAlpha = this.animator.crossfadeAlpha;
        this.drawSprite(ctx, prevImg, {}, state);
        ctx.restore();
      }

      // Vẽ clip hiện tại
      this.drawSprite(ctx, img, meta, state);
    } else {
      // Fallback rig vector
      const pose = state.customPose || this.computeDefaultPose(state);
      this.rig.render(ctx, pose, state.isStartled);
    }

    ctx.restore();
  }

  private drawSprite(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    meta: FrameMeta,
    state: RenderState
  ): void {
    ctx.save();

    // 1. Flip hướng
    const flipX = state.isFacingRight ? 1 : -1;
    // meta.scaleX = -1 được dùng cho một số frame đặc biệt (dragged_fast)
    const msx = meta.scaleX === -1 ? -flipX : flipX;
    ctx.scale(msx, 1);

    // 2. Pendulum tilt khi kéo
    if (state.isDragged && state.pendulumAngle) {
      ctx.rotate(state.pendulumAngle * (state.isFacingRight ? 1 : -1));
    }

    // 3. Squash-stretch từ meta
    const baseScaleX = Math.abs(meta.scaleX ?? 1);
    const baseScaleY = meta.scaleY ?? 1;

    // 4. Nhịp thở cho IDLE / SLEEP
    let breathX = 1;
    let breathY = 1;
    if (state.stateName === "IDLE" && !state.isStartled) {
      const b = Math.sin(this.breathePhase) * 0.022;
      breathX = 1 + b;
      breathY = 1 - b;
    } else if (state.stateName === "SLEEP") {
      const b = Math.sin(this.breathePhase * 0.55) * 0.028;
      breathX = 1 + b;
      breathY = 1 - b;
    }

    ctx.scale(baseScaleX * breathX, baseScaleY * breathY);

    // 5. Shadow dưới chân
    if (state.isGrounded && !state.isDragged && state.stateName !== "SLEEP") {
      ctx.save();
      ctx.fillStyle = "rgba(10, 20, 40, 0.2)";
      ctx.beginPath();
      ctx.ellipse(0, 48, 36, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Kích thước render theo state
    let targetW: number;
    let targetH: number;
    let offsetY: number = meta.offsetY ?? 0;

    if (state.stateName === "SLEEP") {
      targetW = 130;
      targetH = 90;
      offsetY += -26;
    } else if (state.chaseStage === "POUNCE") {
      targetW = 110;
      targetH = 120;
      offsetY += -62;
    } else if (state.isStartled) {
      targetW = 100;
      targetH = 115;
      offsetY += -60;
    } else if (state.stateName === "NOTIFY") {
      targetW = 108;
      targetH = 118;
      offsetY += -62;
    } else if (state.isDragged) {
      targetW = 96;
      targetH = 108;
      offsetY += -52;
    } else if (state.stateName === "WALK" || state.stateName === "CHASE_BUTTERFLY") {
      targetW = 92;
      targetH = 104;
      offsetY += -52;
    } else {
      // IDLE / default
      targetW = 96;
      targetH = 106;
      offsetY += -52;
    }

    ctx.drawImage(img, -targetW / 2 + (meta.offsetX ?? 0), offsetY, targetW, targetH);

    ctx.restore();
  }

  private computeDefaultPose(state: RenderState): RigPose {
    return {
      bodyOffsetY: 0,
      bodyRotation: state.pendulumAngle || 0,
      headOffsetY: 0,
      headRotation: 0,
      leftArmAngle: 0.2,
      rightArmAngle: -0.2,
      leftLegAngle: 0,
      rightLegAngle: 0,
      leftLegOffsetY: 0,
      rightLegOffsetY: 0,
      scaleX: 1,
      scaleY: 1,
    };
  }
}
