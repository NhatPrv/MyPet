import { RigPose } from "../entities/GugugagaRig.ts";

export class PoseAnimator {
  private walkTime: number = 0;
  private sprintTime: number = 0;
  private idleTime: number = 0;
  private notifyTime: number = 0;
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
    spinAngle: number = 0,
    pendulumAngle: number = 0,
    isDraggedFast: boolean = false
  ): RigPose {
    this.idleTime += dt;

    if (this.isTurning) {
      this.turnTime += dt;
      if (this.turnTime >= this.turnDuration) {
        this.isTurning = false;
      }
    }

    // 1. Trạng thái bị kéo thả (DRAGGED) với con lắc vật lý
    if (stateName === "DRAGGED") {
      return this.computeDraggedPose(this.idleTime, pendulumAngle, isDraggedFast);
    }

    // 2. Trạng thái thông báo mới (NOTIFY)
    if (stateName === "NOTIFY") {
      this.notifyTime += dt;
      return this.computeNotifyPose(this.notifyTime);
    } else {
      this.notifyTime = 0;
    }

    // 3. Trạng thái rượt bắt bướm điện ảnh
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

    // 4. Trạng thái đi dạo tuần tra
    if (stateName === "WALK" && isGrounded) {
      const cadence = Math.abs(walkSpeed) * 0.085;
      this.walkTime += dt * Math.max(6, cadence);
      return this.computeCartoonWalkPose(this.walkTime, isFacingRight);
    }

    // 5. Trạng thái ngủ
    if (stateName === "SLEEP") {
      return this.computeSleepPose(this.idleTime);
    }

    // 6. Mặc định trạng thái rảnh rỗi (Idle)
    this.walkTime = 0;
    this.sprintTime = 0;
    return this.computeCartoonIdlePose(this.idleTime, idleSubAction);
  }

  public triggerTurn(): void {
    this.isTurning = true;
    this.turnTime = 0;
  }

  /**
   * Tư thế bị nhấc bổng kéo thả (Dragged Pendulum Physics)
   */
  private computeDraggedPose(time: number, pendulumAngle: number, isFast: boolean): RigPose {
    const limbFlailSpeed = isFast ? 24 : 12;
    const limbFlail = Math.sin(time * limbFlailSpeed);

    return {
      bodyOffsetY: 4,
      bodyRotation: pendulumAngle, // Thân nghiêng theo góc lắc của con lắc
      headOffsetY: -2,
      headRotation: -pendulumAngle * 0.6,
      leftArmAngle: -1.4 + limbFlail * (isFast ? 0.7 : 0.3), // Hai cánh vung vẫy bám víu
      rightArmAngle: 1.4 - limbFlail * (isFast ? 0.7 : 0.3),
      leftLegAngle: pendulumAngle * 0.5 + limbFlail * 0.2, // Chân buông thõng theo góc lắc
      rightLegAngle: pendulumAngle * 0.5 - limbFlail * 0.2,
      leftLegOffsetY: 6,
      rightLegOffsetY: 6,
      scaleX: 0.88,
      scaleY: 1.15,
    };
  }

  /**
   * Tư thế thông báo mới: Giơ hai cánh vẫy chào mừng hướng mặt về người dùng (Notify Wave)
   */
  private computeNotifyPose(time: number): RigPose {
    const hop = -Math.abs(Math.sin(time * 7)) * 8;
    const waveSpeed = time * 16;
    const waveLeft = Math.sin(waveSpeed) * 0.5;
    const waveRight = Math.cos(waveSpeed) * 0.5;

    return {
      bodyOffsetY: hop,
      bodyRotation: 0,
      headOffsetY: hop * 0.5,
      headRotation: Math.sin(time * 8) * 0.08,
      leftArmAngle: -2.1 + waveLeft, // Hai cánh vẫy chào rộn ràng
      rightArmAngle: 2.1 - waveRight,
      leftLegAngle: -0.15,
      rightLegAngle: 0.15,
      leftLegOffsetY: hop < -3 ? -6 : 0,
      rightLegOffsetY: hop < -3 ? -6 : 0,
      scaleX: 1.05,
      scaleY: 0.98,
    };
  }

  private computeAnticipationWigglePose(timer: number): RigPose {
    const wiggle = Math.sin(timer * 28) * 0.14;
    return {
      bodyOffsetY: 6,
      bodyRotation: wiggle,
      headOffsetY: 3,
      headRotation: -wiggle * 0.5,
      leftArmAngle: -0.6 + wiggle,
      rightArmAngle: 0.6 - wiggle,
      leftLegAngle: -0.2,
      rightLegAngle: 0.2,
      leftLegOffsetY: 2,
      rightLegOffsetY: 2,
      scaleX: 1.18,
      scaleY: 0.84,
    };
  }

  private computeChaseSprintPose(time: number, isFacingRight: boolean): RigPose {
    const verticalBob = -Math.abs(Math.sin(time)) * 8;
    const forwardLean = (isFacingRight ? 1 : -1) * 0.28;
    const bodyWaddle = Math.sin(time) * 0.12;

    const leftFootPhase = Math.sin(time);
    const rightFootPhase = Math.sin(time + Math.PI);

    const leftLegOffsetY = leftFootPhase > 0 ? -leftFootPhase * 12 : 0;
    const rightLegOffsetY = rightFootPhase > 0 ? -rightFootPhase * 12 : 0;

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

  private computePouncePose(isFacingRight: boolean): RigPose {
    const jumpLean = (isFacingRight ? 1 : -1) * 0.35;
    return {
      bodyOffsetY: -12,
      bodyRotation: jumpLean,
      headOffsetY: -8,
      headRotation: jumpLean * 0.5,
      leftArmAngle: -2.2,
      rightArmAngle: 2.2,
      leftLegAngle: 0.5,
      rightLegAngle: 0.5,
      leftLegOffsetY: -6,
      rightLegOffsetY: -6,
      scaleX: 0.82,
      scaleY: 1.25,
    };
  }

  private computeCelebrateSpinPose(timer: number, spinAngle: number): RigPose {
    const hop = -Math.abs(Math.sin(timer * 8)) * 12;
    return {
      bodyOffsetY: hop,
      bodyRotation: spinAngle,
      headOffsetY: hop * 0.5,
      headRotation: 0,
      leftArmAngle: -2.4,
      rightArmAngle: 2.4,
      leftLegAngle: -0.2,
      rightLegAngle: 0.2,
      leftLegOffsetY: hop < -4 ? -8 : 0,
      rightLegOffsetY: hop < -4 ? -8 : 0,
      scaleX: 1.08,
      scaleY: 0.96,
    };
  }

  private computeSleepPose(time: number): RigPose {
    const sleepBreathe = Math.sin(time * 2.5);
    return {
      bodyOffsetY: 8 + sleepBreathe * 1.5,
      bodyRotation: 0.05,
      headOffsetY: 6 + sleepBreathe * 1.2,
      headRotation: 0.12,
      leftArmAngle: 0.1,
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
