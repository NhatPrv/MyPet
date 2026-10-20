import { RigPose } from "../entities/GugugagaRig.ts";

export class PoseAnimator {
  private walkTime: number = 0;
  private idleTime: number = 0;
  private turnTime: number = 0;
  private isTurning: boolean = false;
  private turnDuration: number = 0.2; // 200ms xoay người mượt mà

  public update(
    dt: number,
    stateName: string,
    isGrounded: boolean,
    walkSpeed: number,
    isFacingRight: boolean,
    idleSubAction?: string
  ): RigPose {
    this.idleTime += dt;

    if (this.isTurning) {
      this.turnTime += dt;
      if (this.turnTime >= this.turnDuration) {
        this.isTurning = false;
      }
    }

    if (stateName === "WALK" && isGrounded) {
      const cadence = Math.abs(walkSpeed) * 0.085;
      this.walkTime += dt * Math.max(6, cadence);
      return this.computeCartoonWalkPose(this.walkTime, isFacingRight);
    } else {
      this.walkTime = 0;
      return this.computeCartoonIdlePose(this.idleTime, idleSubAction);
    }
  }

  public triggerTurn(): void {
    this.isTurning = true;
    this.turnTime = 0;
  }

  /**
   * Tính toán chu kỳ đi bộ hoạt họa 4 pha (Contact -> Down -> Pass -> Up)
   */
  private computeCartoonWalkPose(time: number, isFacingRight: boolean): RigPose {
    // 1. Chuyển động nhấp nhô trọng tâm thân (Head & Body Bobbing)
    let verticalBob = -Math.abs(Math.sin(time)) * 6.5;

    // Hiệu ứng nhún người lấy đà (Anticipation Dip) khi quay đầu
    if (this.isTurning) {
      const turnProgress = this.turnTime / this.turnDuration;
      verticalBob += Math.sin(turnProgress * Math.PI) * 4;
    }

    // 2. Nghiêng mình theo hướng tiến tới (Forward Lean)
    const leanAngle = (isFacingRight ? 1 : -1) * 0.12;
    const bodyWaddle = Math.sin(time) * 0.09;

    // 3. Cử động hai chân vàng chim cánh cụt
    const leftFootPhase = Math.sin(time);
    const rightFootPhase = Math.sin(time + Math.PI);

    const leftLegOffsetY = leftFootPhase > 0 ? -leftFootPhase * 9 : 0;
    const rightLegOffsetY = rightFootPhase > 0 ? -rightFootPhase * 9 : 0;

    const leftLegAngle = leftFootPhase * 0.45;
    const rightLegAngle = rightFootPhase * 0.45;

    // 4. Vung hai cánh chim cánh cụt
    const leftArmAngle = -leftFootPhase * 0.75;
    const rightArmAngle = -rightFootPhase * 0.75;

    // 5. Đầu nhấp nhô với độ trễ
    const headOffsetY = Math.sin(time * 2 - 0.4) * 2.5;
    const headRotation = -bodyWaddle * 0.6;

    // 6. Squash và Stretch theo pha Down và Up
    const squashStretch = Math.sin(time * 2);
    const scaleX = 1 - squashStretch * 0.04;
    const scaleY = 1 + squashStretch * 0.04;

    return {
      bodyOffsetY: verticalBob,
      bodyRotation: bodyWaddle + leanAngle,
      headOffsetY,
      headRotation,
      leftArmAngle,
      rightArmAngle,
      leftLegAngle,
      rightLegAngle,
      leftLegOffsetY,
      rightLegOffsetY,
      scaleX,
      scaleY,
    };
  }

  /**
   * Tính toán tư thế rảnh rỗi (Idle) dợn sóng nhịp thở và chuyển dịch trọng tâm
   */
  private computeCartoonIdlePose(time: number, idleSubAction?: string): RigPose {
    const breatheCycle = time * 3.2;
    const breathe = Math.sin(breatheCycle);

    const weightShiftCycle = time * 1.1;
    const weightShift = Math.sin(weightShiftCycle);

    let bodyOffsetY = breathe * 1.5;
    let bodyRotation = weightShift * 0.04;
    let headOffsetY = breathe * 1.2;
    let headRotation = weightShift * 0.06;
    let leftArmAngle = 0.15 + breathe * 0.05;
    let rightArmAngle = -0.15 - breathe * 0.05;
    let leftLegAngle = 0;
    let rightLegAngle = 0;
    let leftLegOffsetY = 0;
    let rightLegOffsetY = 0;
    let scaleX = 1 + breathe * 0.02;
    let scaleY = 1 - breathe * 0.02;

    if (idleSubAction === "STRETCH") {
      bodyOffsetY = -7;
      headOffsetY = -5;
      headRotation = 0.1;
      leftArmAngle = -1.7;
      rightArmAngle = 1.7;
      scaleX = 0.92;
      scaleY = 1.14;
    } else if (idleSubAction === "YAWN") {
      bodyOffsetY = 3;
      headOffsetY = 2;
      headRotation = -0.12;
      leftArmAngle = -0.4;
      rightArmAngle = 0.4;
      scaleX = 1.05;
      scaleY = 0.95;
    } else if (idleSubAction === "LOOK_AROUND") {
      headRotation = Math.sin(time * 3.5) * 0.18;
      headOffsetY = -2;
    } else if (idleSubAction === "SCRATCH") {
      rightArmAngle = 1.9 + Math.sin(time * 22) * 0.3;
      headRotation = 0.15;
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
      scaleX,
      scaleY,
    };
  }
}
