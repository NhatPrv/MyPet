import { ParticleSystem } from "./Particle.ts";
import { GugugagaRig, RigPose } from "./GugugagaRig.ts";
import { SpriteLoader, SpriteKey } from "./SpriteLoader.ts";

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
  private spriteLoader: SpriteLoader;

  private breathePhase: number = 0;
  private walkCycle: number = 0;

  constructor() {
    this.rig = new GugugagaRig();
    this.particles = new ParticleSystem();
    this.spriteLoader = SpriteLoader.getInstance();
  }

  public update(dt: number, state: RenderState): void {
    this.breathePhase += dt * 3.5;
    this.particles.update(dt);
    this.rig.update(dt);

    if (state.stateName === "WALK" && state.isGrounded) {
      this.walkCycle += dt * 9.5; // Tần số chu kỳ 4 frame bước đi
      if (Math.sin(this.walkCycle * Math.PI) > 0.85) {
        this.particles.emitDust(state.x + (state.isFacingRight ? -22 : 22), state.y + 44);
      }
    } else {
      this.walkCycle = 0;
    }
  }

  public render(ctx: CanvasRenderingContext2D, state: RenderState): void {
    // 1. Vẽ các hạt bay
    this.particles.render(ctx);

    ctx.save();

    let renderX = state.x;
    let renderY = state.y;

    if (state.isStartled) {
      renderX += Math.sin(this.breathePhase * 25) * 3.5;
    }

    ctx.translate(renderX, renderY);

    // Xác định frame sprite tương ứng từ bộ asset chính thức
    const spriteKey = this.determineSpriteKey(state);
    const spriteImg = this.spriteLoader.getSprite(spriteKey);

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      this.renderSpriteFrame(ctx, spriteImg, state);
    } else {
      // Fallback vẽ vector rig nếu ảnh đang tải
      const pose = state.customPose || this.computeDefaultPose(state);
      this.rig.render(ctx, pose, state.isStartled);
    }

    ctx.restore();
  }

  private renderSpriteFrame(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    state: RenderState
  ): void {
    ctx.save();

    // 1. Lật hướng trái/phải mượt mà
    if (!state.isFacingRight) {
      ctx.scale(-1, 1);
    }

    // 2. Góc nghiêng theo con lắc khi kéo thả
    if (state.isDragged && state.pendulumAngle) {
      ctx.rotate(state.pendulumAngle);
    }

    // 3. Hiệu ứng nhịp thở nhẹ nhàng khi đứng yên
    let scaleX = 1;
    let scaleY = 1;
    if (state.stateName === "IDLE" && !state.isStartled) {
      const b = Math.sin(this.breathePhase) * 0.025;
      scaleX += b;
      scaleY -= b;
    } else if (state.stateName === "SLEEP") {
      const b = Math.sin(this.breathePhase * 0.6) * 0.03;
      scaleX += b;
      scaleY -= b;
    }

    ctx.scale(scaleX, scaleY);

    // 4. Vẽ bóng đổ dưới chân
    if (state.isGrounded && !state.isDragged && state.stateName !== "SLEEP") {
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
      ctx.beginPath();
      ctx.ellipse(0, 48, 38, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Căn chỉnh kích thước và trọng tâm sprite
    let targetW = 96;
    let targetH = 100;
    let offsetY = -50;

    if (state.stateName === "SLEEP") {
      targetW = 125;
      targetH = 88;
      offsetY = -28;
    } else if (state.chaseStage === "POUNCE" || state.chaseStage === "JUMP") {
      targetW = 100;
      targetH = 112;
      offsetY = -60;
    } else if (state.isStartled) {
      targetW = 98;
      targetH = 110;
      offsetY = -58;
    }

    ctx.drawImage(img, -targetW / 2, offsetY, targetW, targetH);

    ctx.restore();
  }

  private determineSpriteKey(state: RenderState): SpriteKey {
    // 1. Giật mình thót tim
    if (state.isStartled) {
      return "alert_startled";
    }

    // 2. Bị kéo thả chuột (Dragged)
    if (state.isDragged) {
      return state.isDraggedFast ? "dragged_dizzy" : "dragged_scared";
    }

    // 3. Đang ngủ
    if (state.stateName === "SLEEP") {
      return "sleep";
    }

    // 4. Thông báo mới (Notify)
    if (state.stateName === "NOTIFY") {
      return "alert_happy";
    }

    // 5. Rượt bắt bướm
    if (state.stateName === "CHASE_BUTTERFLY") {
      if (state.chaseStage === "ANTICIPATION") return "chase_crouch";
      if (state.chaseStage === "SPRINT") return "chase_run";
      if (state.chaseStage === "POUNCE") return "chase_jump";
      if (state.chaseStage === "CELEBRATE") return "chase_celebrate";
      return "chase_run";
    }

    // 6. Đi bộ tuần tra (Walk cycle 4 frame)
    if (state.stateName === "WALK" && state.isGrounded) {
      const frameIdx = Math.floor(this.walkCycle) % 4;
      if (frameIdx === 0) return "walk_1";
      if (frameIdx === 1) return "walk_2";
      if (frameIdx === 2) return "walk_3";
      return "walk_4";
    }

    // 7. Đứng chơi (Idle)
    if (state.idleSubAction === "LOOK_AROUND" || state.idleSubAction === "BOUNCE") {
      return "idle_wave";
    }

    return "turn_front";
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
