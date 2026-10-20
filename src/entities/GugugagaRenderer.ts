import { ParticleSystem } from "./Particle.ts";
import { GugugagaRig, RigPose } from "./GugugagaRig.ts";

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
  // Tọa độ mục tiêu nhìn của con ngươi (bướm hoặc chuột)
  lookTarget?: { x: number; y: number };
  // Khung xương tùy biến từ PoseAnimator
  customPose?: RigPose;
}

export class GugugagaRenderer {
  public width: number = 92;
  public height: number = 96;

  public rig: GugugagaRig;
  public particles: ParticleSystem;

  private breathePhase: number = 0;
  private walkCycle: number = 0;

  constructor() {
    this.rig = new GugugagaRig();
    this.particles = new ParticleSystem();
  }

  public update(dt: number, state: RenderState): void {
    this.breathePhase += dt * 3.5;
    this.particles.update(dt);
    this.rig.update(dt);

    // 1. Cập nhật góc nhìn 2.5D của Rig
    const targetFacingX = state.isFacingRight ? 0.75 : -0.75;
    this.rig.facing.setTargetFacing(targetFacingX, 0);

    // 2. Cập nhật biểu cảm khuôn mặt & Target tracking
    if (state.isStartled) {
      this.rig.facial.setExpression("STARTLED");
    } else if (state.stateName === "SLEEP") {
      this.rig.facial.setExpression("SLEEPY");
    } else if (state.mood === "excited" || state.stateName === "CHASE_BUTTERFLY") {
      this.rig.facial.setExpression("EXCITED_STAR_EYES");
    } else if (state.mood === "happy") {
      this.rig.facial.setExpression("HAPPY");
    } else {
      this.rig.facial.setExpression("NORMAL");
    }

    if (state.lookTarget) {
      this.rig.facial.setLookTarget(state.lookTarget.x - state.x, state.lookTarget.y - state.y);
    }

    // 3. Quản lý Squash & Stretch tự nhiên bằng Spring Physics
    if (state.isStartled) {
      this.rig.scaleSpring.setTarget(0.82, 1.25);
    } else if (state.isDragged) {
      this.rig.scaleSpring.setTarget(0.88, 1.15);
    } else if (state.stateName === "SLEEP") {
      this.rig.scaleSpring.setTarget(1.06, 0.94);
    } else if (!state.isGrounded) {
      if (state.vy < -50) {
        this.rig.scaleSpring.setTarget(0.86, 1.18);
      } else if (state.vy > 100) {
        this.rig.scaleSpring.setTarget(0.92, 1.1);
      }
    } else {
      const b = Math.sin(this.breathePhase) * 0.025;
      this.rig.scaleSpring.setTarget(1 + b, 1 - b);
    }

    // 4. Phát hạt bụi khi đi bộ
    if (state.stateName === "WALK" && state.isGrounded) {
      this.walkCycle += dt * 11;
      if (Math.sin(this.walkCycle) > 0.88) {
        this.particles.emitDust(state.x + (state.isFacingRight ? -20 : 20), state.y + 42);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, state: RenderState): void {
    // 1. Vẽ các hạt bay
    this.particles.render(ctx);

    ctx.save();

    // Rung lắc giật mình (Shiver Effect)
    let renderX = state.x;
    let renderY = state.y;
    if (state.isStartled) {
      renderX += Math.sin(this.breathePhase * 25) * 3;
    }

    ctx.translate(renderX, renderY);

    // Tính toán tư thế RigPose mặc định nếu chưa có PoseAnimator
    const pose: RigPose = state.customPose || this.computeDefaultPose(state);

    // Vẽ Rig chim cánh cụt bé gái
    this.rig.render(ctx, pose, state.isStartled);

    ctx.restore();
  }

  private computeDefaultPose(state: RenderState): RigPose {
    let bodyOffsetY = 0;
    let bodyRotation = 0;
    let headOffsetY = 0;
    let headRotation = 0;
    let leftArmAngle = 0.2;
    let rightArmAngle = -0.2;
    let leftLegAngle = 0;
    let rightLegAngle = 0;
    let leftLegOffsetY = 0;
    let rightLegOffsetY = 0;

    if (state.stateName === "WALK" && state.isGrounded) {
      const swing = Math.sin(this.walkCycle);
      bodyOffsetY = -Math.abs(swing) * 4;
      bodyRotation = swing * 0.08;
      headOffsetY = Math.sin(this.walkCycle * 2) * 2;
      leftArmAngle = -swing * 0.6;
      rightArmAngle = swing * 0.6;
      leftLegOffsetY = -Math.max(0, swing) * 8;
      rightLegOffsetY = -Math.max(0, -swing) * 8;
      leftLegAngle = swing * 0.35;
      rightLegAngle = -swing * 0.35;
    } else if (state.isDragged) {
      leftArmAngle = -1.2;
      rightArmAngle = 1.2;
      leftLegOffsetY = 4;
      rightLegOffsetY = 6;
      headOffsetY = 2;
    } else if (state.stateName === "SLEEP") {
      bodyOffsetY = 6;
      headOffsetY = 4;
      leftArmAngle = 0.1;
      rightArmAngle = -0.1;
    } else if (state.idleSubAction === "STRETCH") {
      bodyOffsetY = -6;
      headOffsetY = -4;
      leftArmAngle = -1.6;
      rightArmAngle = 1.6;
    } else if (state.idleSubAction === "YAWN") {
      bodyOffsetY = 2;
      leftArmAngle = -0.5;
      rightArmAngle = 0.5;
    } else {
      // Đứng thở nhịp nhàng
      const breathe = Math.sin(this.breathePhase) * 1.5;
      bodyOffsetY = breathe;
      headOffsetY = breathe * 0.8;
    }

    return {
      bodyOffsetY,
      bodyRotation,
      headOffsetY,
      headRotation,
      leftArmAngle,
      rightArmAngle,
      leftLegAngle,
      rightLegAngle,
      leftLegOffsetY,
      rightLegOffsetY,
      scaleX: 1,
      scaleY: 1,
    };
  }
}
