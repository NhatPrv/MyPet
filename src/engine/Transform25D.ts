import { Spring1D } from "./SpringPhysics.ts";

export type FacingDirection =
  | "SIDE_LEFT"
  | "THREE_QUARTER_LEFT"
  | "FRONT"
  | "THREE_QUARTER_RIGHT"
  | "SIDE_RIGHT";

export interface ParallaxOffset {
  featureX: number;     // Độ lệch X cho mắt, mũi, miệng, mỏ
  featureY: number;     // Độ lệch Y
  depthScale: number;   // Tỉ lệ phối cảnh bề rộng
  backLimbScale: number;// Tỉ lệ thu nhỏ chi phía sau
  frontLimbScale: number;// Tỉ lệ chi phía trước
  isBackArmBehind: boolean;
  facingDir: FacingDirection;
}

export class FacingController {
  // Góc nhìn ngang: -1 (Nghiêng hẳn trái), 0 (Chính diện), +1 (Nghiêng hẳn phải)
  public angleXSpring: Spring1D;
  // Góc nhìn dọc: -1 (Cúi nhìn xuống), 0 (Nhìn thẳng), +1 (Ngước nhìn lên)
  public angleYSpring: Spring1D;

  private headRadius: number = 36;

  constructor() {
    // Lò xo với độ cứng 260 và giảm chấn 22 tạo độ xoay mượt mà không rung gắt
    this.angleXSpring = new Spring1D(0, 260, 22);
    this.angleYSpring = new Spring1D(0, 260, 22);
  }

  public setTargetFacing(targetX: number, targetY: number = 0): void {
    const clampedX = Math.max(-1, Math.min(1, targetX));
    const clampedY = Math.max(-1, Math.min(1, targetY));
    this.angleXSpring.setTarget(clampedX);
    this.angleYSpring.setTarget(clampedY);
  }

  public update(dt: number): void {
    this.angleXSpring.update(dt);
    this.angleYSpring.update(dt);
  }

  public get currentAngleX(): number {
    return this.angleXSpring.value;
  }

  public get currentAngleY(): number {
    return this.angleYSpring.value;
  }

  public getParallax(): ParallaxOffset {
    const ax = this.currentAngleX;
    const ay = this.currentAngleY;

    // Chiếu lượng giác thị sai (Spherical/Cylindrical Projection)
    const featureX = Math.sin((ax * Math.PI) / 2.2) * this.headRadius * 0.75;
    const featureY = Math.sin((ay * Math.PI) / 2.2) * this.headRadius * 0.45;

    // Phối cảnh bề rộng khi quay nghiêng
    const depthScale = 1 - Math.abs(ax) * 0.08;

    // Tỉ lệ tay/chân trước và sau
    const backLimbScale = 1 - Math.abs(ax) * 0.15;
    const frontLimbScale = 1 + Math.abs(ax) * 0.08;

    let facingDir: FacingDirection = "FRONT";
    if (ax > 0.65) facingDir = "SIDE_RIGHT";
    else if (ax > 0.2) facingDir = "THREE_QUARTER_RIGHT";
    else if (ax < -0.65) facingDir = "SIDE_LEFT";
    else if (ax < -0.2) facingDir = "THREE_QUARTER_LEFT";

    return {
      featureX,
      featureY,
      depthScale,
      backLimbScale,
      frontLimbScale,
      isBackArmBehind: Math.abs(ax) > 0.15,
      facingDir,
    };
  }
}
