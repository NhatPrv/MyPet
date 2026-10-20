import { RigPose } from "../entities/GugugagaRig.ts";

export class PoseAnimator {
  private walkTime: number = 0;
  private sprintTime: number = 0;
  private idleTime: number = 0;
  private turnTime: number = 0;
  private isTurning: boolean = false;
  private turnDuration: number = 0.2;

  public update(
    dt: number,
    stateName: string,
    isGrounded: boolean,
    walkSpeed: number,
    isFacingRight: boolean,
    idleSubAction?: string,
    chaseStage?: string,
    chaseTimer: number = 0,
    spinAngle: number = 0
  ): RigPose {
    this.idleTime += dt;

    if (this.isTurning) {
      this.turnTime += dt;
      if (this.turnTime >= this.turnDuration) {
        this.isTurning = false;
      }
    }

    // 1. Trạng thái rượt bắt bướm điện ảnh (Cinematic Butterfly Chase)
    if (stateName === "CHASE_BUTTERFLY") {
      if (chaseStage === "ANTICIPATION") {
        return this.computeAnticipationWigglePose(chaseTimer);
      } else if (chaseStage === "SPRINT") {
        this.sprintTime += dt * 18;
        return this.computeChaseSprintPose(this.sprintTime, isFacingRight);
      } else if (chaseStage === "POUNCE") {
        return this.computePouncePose(isFacingRight);
      } else if (chaseStage === "CELEBRATE") {
        return this.computeCelebrateSpinPose(chaseTimer, spinAngle);
      }
    }

    // 2. Trạng thái đi dạo tuần tra
    if (stateName === "WALK" && isGrounded) {
      const cadence = Math.abs(walkSpeed) * 0.085;
      this.walkTime += dt * Math.max(6, cadence);
      return this.computeCartoonWalkPose(this.walkTime, isFacingRight);
    }

    // 3. Trạng thái ngủ
    if (stateName === "SLEEP") {
      return this.computeSleepPose(this.idleTime);
    }

    // 4. Mặc định trạng thái rảnh rỗi (Idle)
    this.walkTime = 0;
    this.sprintTime = 0;
    return this.computeCartoonIdlePose(this.idleTime, idleSubAction);
  }

  public triggerTurn(): void {
    this.isTurning = true;
    this.turnTime = 0;
  }

  /**
   * Tư thế lắc mông lấy đà chuẩn bị phóng (Anticipation Wiggle)
   */
  private computeAnticipationWigglePose(timer: number): RigPose {
    const wiggle = Math.sin(timer * 28) * 0.14; // Lắc hông tần số nhanh
    return {
      bodyOffsetY: 6, // Hạ thấp người
      bodyRotation: wiggle,
      headOffsetY: 3,
      headRotation: -wiggle * 0.5,
      leftArmAngle: -0.6 + wiggle,
      rightArmAngle: 0.6 - wiggle,
      leftLegAngle: -0.2,
      rightLegAngle: 0.2,
      leftLegOffsetY: 2,
      rightLegOffsetY: 2,
      scaleX: 1.18, // Nén thấp bè rộng
      scaleY: 0.84,
    };
  }

  /**
   * Tư thế phi nước đại rượt đuổi bướm (Sprint Cycle)
   */
  private computeChaseSprintPose(time: number, isFacingRight: boolean): RigPose {
    const verticalBob = -Math.abs(Math.sin(time)) * 8;
    const forwardLean = (isFacingRight ? 1 : -1) * 0.28; // Lao dốc về trước
    const bodyWaddle = Math.sin(time) * 0.12;

    const leftFootPhase = Math.sin(time);
    const rightFootPhase = Math.sin(time + Math.PI);

    const leftLegOffsetY = leftFootPhase > 0 ? -leftFootPhase * 12 : 0;
    const rightLegOffsetY = rightFootPhase > 0 ? -rightFootPhase * 12 : 0;

    // Cánh vung mạnh như guồng quay
    const leftArmAngle = -leftFootPhase * 1.3;
    const rightArmAngle = -rightFootPhase * 1.3;

    return {
      bodyOffsetY: verticalBob,
      bodyRotation: bodyWaddle + forwardLean,
      headOffsetY: Math.sin(time * 2) * 3,
      headRotation: forwardLean * 0.4,
      leftArmAngle,
      rightArmAngle,
      leftLegAngle: leftFootPhase * 0.7,
      rightLegAngle: rightFootPhase * 0.7,
      leftLegOffsetY,
      rightLegOffsetY,
      scaleX: 0.94,
      scaleY: 1.08,
    };
  }

  /**
   * Tư thế nhảy vồ trên không (Parabolic Pounce Pose)
   */
  private computePouncePose(isFacingRight: boolean): RigPose {
    const jumpLean = (isFacingRight ? 1 : -1) * 0.35;
    return {
      bodyOffsetY: -12,
      bodyRotation: jumpLean,
      headOffsetY: -8,
      headRotation: jumpLean * 0.5,
      leftArmAngle: -2.2, // Hai cánh vươn hết cỡ ra trước để chộp
      rightArmAngle: 2.2,
      leftLegAngle: 0.5, // Chân co lại phía sau
      rightLegAngle: 0.5,
      leftLegOffsetY: -6,
      rightLegOffsetY: -6,
      scaleX: 0.82, // Thân dài người rướn
      scaleY: 1.25,
    };
  }

  /**
   * Tư thế ăn mừng xoay vòng 360 độ (Celebrate Spin)
   */
  private computeCelebrateSpinPose(timer: number, spinAngle: number): RigPose {
    const hop = -Math.abs(Math.sin(timer * 8)) * 12;
    return {
      bodyOffsetY: hop,
      bodyRotation: spinAngle,
      headOffsetY: hop * 0.5,
      headRotation: 0,
      leftArmAngle: -2.4, // Hai cánh giơ cao chữ V chiến thắng
      rightArmAngle: 2.4,
      leftLegAngle: -0.2,
      rightLegAngle: 0.2,
      leftLegOffsetY: hop < -4 ? -8 : 0,
      rightLegOffsetY: hop < -4 ? -8 : 0,
      scaleX: 1.08,
      scaleY: 0.96,
    };
  }

  /**
   * Tư thế ngủ cuộn tròn (Sleep Pose)
   */
  private computeSleepPose(time: number): RigPose {
    // Nhịp thở ngủ chậm sâu 0.4 Hz
    const sleepBreathe = Math.sin(time * 2.5);
    return {
      bodyOffsetY: 8 + sleepBreathe * 1.5,
      bodyRotation: 0.05,
      headOffsetY: 6 + sleepBreathe * 1.2,
      headRotation: 0.12, // Đầu hơi nghiêng tựa má
      leftArmAngle: 0.1,  // Hai cánh ôm trước bụng
      rightArmAngle: -0.1,
      leftLegAngle: 0.3,
      rightLegAngle: 0.3,
      leftLegOffsetY: 4,
      rightLegOffsetY: 4,
      scaleX: 1.08 + sleepBreathe * 0.03,
      scaleY: 0.86 - sleepBreathe * 0.03,
    };
  }

  private computeCartoonWalkPose(time: number, isFacingRight: boolean): RigPose {
    let verticalBob = -Math.abs(Math.sin(time)) * 6.5;

    if (this.isTurning) {
      const turnProgress = this.turnTime / this.turnDuration;
      verticalBob += Math.sin(turnProgress * Math.PI) * 4;
    }

    const leanAngle = (isFacingRight ? 1 : -1) * 0.12;
    const bodyWaddle = Math.sin(time) * 0.09;

    const leftFootPhase = Math.sin(time);
    const rightFootPhase = Math.sin(time + Math.PI);

    const leftLegOffsetY = leftFootPhase > 0 ? -leftFootPhase * 9 : 0;
    const rightLegOffsetY = rightFootPhase > 0 ? -rightFootPhase * 9 : 0;

    const leftLegAngle = leftFootPhase * 0.45;
    const rightLegAngle = rightFootPhase * 0.45;

    const leftArmAngle = -leftFootPhase * 0.75;
    const rightArmAngle = -rightFootPhase * 0.75;

    const headOffsetY = Math.sin(time * 2 - 0.4) * 2.5;
    const headRotation = -bodyWaddle * 0.6;

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
