import { Vector2D } from "../engine/Vector2D.ts";
import { StateMachine, StateType } from "../ai/StateMachine.ts";
import { GugugagaRenderer, IdleSubAction, PetMood, RenderState } from "./GugugagaRenderer.ts";
import { Butterfly } from "./Butterfly.ts";
import { PoseAnimator } from "../animation/PoseAnimator.ts";

export type ChaseStage = "ANTICIPATION" | "SPRINT" | "POUNCE" | "CELEBRATE";

export class Gugugaga {
  public position: Vector2D;
  public velocity: Vector2D;
  public stateMachine: StateMachine;
  public renderer: GugugagaRenderer;
  public poseAnimator: PoseAnimator;

  public isFacingRight: boolean = true;
  public isGrounded: boolean = true;
  public isDragged: boolean = false;
  public mood: PetMood = "happy";

  // PHẠM VI DI CHUYỂN GIỚI HẠN NHỎ GỌN (Cozy Home Territory)
  public homeX: number;

  // Dữ liệu con lắc vật lý khi kéo thả
  public pendulumAngle: number = 0;
  public isDraggedFast: boolean = false;

  // Kích thước & mặt sàn
  public width: number = 96;
  public height: number = 100;
  public groundY: number;
  private gravity: number = 1800; // px/s^2

  // Hành động rảnh rỗi tự động
  public idleSubAction: IdleSubAction = "NONE";
  private idleSubTimer: number = 0;
  private idleSubDuration: number = 0;
  private nextIdleActionTimer: number = 1.8;
  private autoButterflyTimer: number = 0;

  // Hoạt cảnh giật mình khi có thông báo
  public isStartled: boolean = false;
  private startledTimer: number = 0;
  private startledDuration: number = 0.65;

  // Chuỗi rượt bắt bướm đa giai đoạn
  public chaseStage: ChaseStage = "ANTICIPATION";
  private chaseStageTimer: number = 0;
  private spinAngle: number = 0;

  // Timers
  private zzzEmitTimer: number = 0;

  constructor() {
    this.groundY = window.innerHeight - 84;
    // Mặc định đặt pet ở góc phải dưới thanh taskbar hoặc giữa màn hình
    this.homeX = Math.min(window.innerWidth - 220, Math.max(220, window.innerWidth * 0.75));
    this.position = new Vector2D(this.homeX, this.groundY);
    this.velocity = new Vector2D(0, 0);
    this.stateMachine = new StateMachine();
    this.renderer = new GugugagaRenderer();
    this.poseAnimator = new PoseAnimator();

    window.addEventListener("resize", () => {
      this.groundY = window.innerHeight - 84;
      if (this.position.y > this.groundY) {
        this.position.y = this.groundY;
      }
    });
  }

  public get currentState(): StateType {
    return this.stateMachine.currentState;
  }

  public triggerStartledAlert(): void {
    this.isStartled = true;
    this.startledTimer = this.startledDuration;
    this.mood = "startled";
    this.idleSubAction = "NONE";

    // Chỉ nhảy thẳng lên, KHÔNG di chuyển ngang
    this.velocity.y = -280;
    this.velocity.x = 0;
    this.isGrounded = false;

    this.renderer.particles.emitExclamation(this.position.x, this.position.y - 30);
    this.renderer.particles.emitSweat(this.position.x, this.position.y);
  }

  public update(dt: number, butterfly?: Butterfly): void {
    const ctx = this.stateMachine.getContext();
    this.stateMachine.update(dt);

    if (butterfly) {
      butterfly.updateHome(this.homeX);
    }

    // 1. Phản ứng giật mình
    if (this.isStartled) {
      this.startledTimer -= dt;
      if (this.startledTimer <= 0) {
        this.isStartled = false;
        this.startledTimer = 0;
        this.stateMachine.setState("NOTIFY");
        this.mood = "excited";
      }
    }

    // 2. Tự động gọi bướm khi rảnh rỗi
    if (butterfly && !butterfly.isActive && !this.isDragged && this.stateMachine.currentState !== "SLEEP") {
      this.autoButterflyTimer += dt;
      if (this.autoButterflyTimer >= 24) {
        this.autoButterflyTimer = 0;
        butterfly.spawn(this.homeX);
      }
    } else {
      this.autoButterflyTimer = 0;
    }

    // 3. Phản xạ AI theo trạng thái
    switch (this.stateMachine.currentState) {
      case "IDLE":
        this.velocity.x = 0;
        // Hard-lock vị trí X về homeX khi đứng trên sàn — KHÔNG bao giờ di chuyển ngang
        if (this.isGrounded) {
          this.position.x = this.homeX;
        }

        if (butterfly && butterfly.isActive && !butterfly.isCaught) {
          const dist = this.position.dist(butterfly.position);
          if (dist < 320) {
            this.stateMachine.setState("CHASE_BUTTERFLY");
            this.chaseStage = "ANTICIPATION";
            this.chaseStageTimer = 0.35;
            this.mood = "excited";
            this.idleSubAction = "NONE";
            break;
          }
        }

        if (!this.isStartled) {
          if (this.idleSubAction === "NONE") {
            this.nextIdleActionTimer -= dt;
            if (this.nextIdleActionTimer <= 0) {
              const actions: IdleSubAction[] = ["LOOK_AROUND", "STRETCH", "YAWN", "BOUNCE", "SCRATCH"];
              this.idleSubAction = actions[Math.floor(Math.random() * actions.length)];
              this.idleSubTimer = 0;

              if (this.idleSubAction === "LOOK_AROUND") {
                this.idleSubDuration = 1.6;
                this.mood = "curious";
              } else if (this.idleSubAction === "STRETCH") {
                this.idleSubDuration = 1.8;
                this.mood = "happy";
              } else if (this.idleSubAction === "YAWN") {
                this.idleSubDuration = 1.6;
                this.mood = "sleepy";
              } else if (this.idleSubAction === "BOUNCE") {
                this.idleSubDuration = 1.1;
                this.mood = "excited";
                if (this.isGrounded) {
                  this.velocity.y = -220;
                  this.isGrounded = false;
                }
              } else if (this.idleSubAction === "SCRATCH") {
                this.idleSubDuration = 1.5;
                this.mood = "happy";
              }
            }
          } else {
            this.idleSubTimer += dt;
            if (this.idleSubTimer >= this.idleSubDuration) {
              this.idleSubAction = "NONE";
              this.mood = "happy";
              this.nextIdleActionTimer = 1.8 + Math.random() * 2.2;
            }
          }
        }

        // Idle kéo dài vô hạn — không tự chuyển sang WALK
        break;


      case "CHASE_BUTTERFLY":
        this.idleSubAction = "NONE";
        if (!butterfly || !butterfly.isActive || butterfly.isCaught) {
          if (this.chaseStage !== "CELEBRATE") {
            this.stateMachine.setState("IDLE");
            this.mood = "happy";
            break;
          }
        }

        if (this.chaseStage === "ANTICIPATION") {
          this.velocity.set(0, 0);
          this.chaseStageTimer -= dt;
          if (butterfly) {
            this.isFacingRight = butterfly.position.x > this.position.x;
          }
          if (this.chaseStageTimer <= 0) {
            this.chaseStage = "SPRINT";
            this.renderer.particles.emitDust(this.position.x, this.position.y + 38);
          }
        } else if (this.chaseStage === "SPRINT") {
          if (butterfly) {
            const bDist = this.position.dist(butterfly.position);
            const dx = butterfly.position.x - this.position.x;
            const dy = butterfly.position.y - this.position.y;
            this.isFacingRight = dx > 0;

            const sprintSpeed = 220;
            this.velocity.x = (dx > 0 ? 1 : -1) * sprintSpeed;

            if (dy < -45 && this.isGrounded && Math.abs(dx) < 120) {
              this.chaseStage = "POUNCE";
              this.velocity.y = -580;
              this.isGrounded = false;
            }

            if (bDist < 42) {
              butterfly.catch();
              this.renderer.particles.emitSparkle(this.position.x, this.position.y);
              this.chaseStage = "CELEBRATE";
              this.chaseStageTimer = 2.2;
              this.spinAngle = 0;
              this.velocity.set(0, -250);
              this.isGrounded = false;
            }
          }
        } else if (this.chaseStage === "POUNCE") {
          if (butterfly) {
            const bDist = this.position.dist(butterfly.position);
            if (bDist < 45) {
              butterfly.catch();
              this.renderer.particles.emitSparkle(this.position.x, this.position.y);
              this.chaseStage = "CELEBRATE";
              this.chaseStageTimer = 2.2;
              this.spinAngle = 0;
              this.velocity.set(0, -250);
              this.isGrounded = false;
            }
          }
          if (this.isGrounded) {
            this.chaseStage = "SPRINT";
          }
        } else if (this.chaseStage === "CELEBRATE") {
          this.velocity.x = 0;
          this.spinAngle += dt * 10;
          this.chaseStageTimer -= dt;
          if (this.chaseStageTimer <= 0) {
            this.stateMachine.setState("IDLE");
            this.mood = "happy";
          }
        }

        if (ctx.stateTimer > 10 && this.chaseStage !== "CELEBRATE") {
          this.stateMachine.setState("IDLE");
          this.mood = "happy";
        }
        break;

      case "SLEEP":
        this.idleSubAction = "NONE";
        this.velocity.set(0, 0);
        this.mood = "sleepy";
        this.zzzEmitTimer += dt;
        if (this.zzzEmitTimer >= 1.2) {
          this.renderer.particles.emitZzz(this.position.x + (this.isFacingRight ? 24 : -24), this.position.y - 20);
          this.zzzEmitTimer = 0;
        }
        break;

      case "DRAGGED":
        this.idleSubAction = "NONE";
        this.isGrounded = false;
        break;

      case "FALLING":
        this.idleSubAction = "NONE";
        this.velocity.y += this.gravity * dt;
        this.mood = "surprised";
        break;

      case "NOTIFY":
        this.idleSubAction = "NONE";
        this.velocity.x = 0; // Không di chuyển ngang
        if (this.isGrounded && ctx.stateTimer < 0.2) {
          this.velocity.y = -300;
          this.isGrounded = false;
        }
        this.mood = "excited";
        break;

    }

    // 4. Tích phân vật lý vị trí
    if (!this.isDragged) {
      const state = this.stateMachine.currentState;
      // Chỉ cho phép di chuyển ngang khi chase bướm hoặc đang rơi
      const canMoveX = state === "CHASE_BUTTERFLY" || state === "FALLING";

      if (canMoveX) {
        this.position.x += this.velocity.x * dt;
      } else {
        this.velocity.x = 0; // Reset velocity.x trong tất cả state khác
      }
      this.position.y += this.velocity.y * dt;

      if (!this.isGrounded) {
        this.velocity.y += this.gravity * dt;
      }

      if (this.position.y >= this.groundY) {
        this.position.y = this.groundY;
        if (!this.isGrounded) {
          if (this.velocity.y > 300) {
            this.velocity.y = -this.velocity.y * 0.35;
            this.renderer.particles.emitDust(this.position.x, this.position.y + 40);
          } else {
            this.velocity.y = 0;
            this.isGrounded = true;
            if (state === "FALLING") {
              // Cập nhật vị trí thả mới làm homeX
              this.homeX = this.position.x;
              this.stateMachine.setState("IDLE");
              this.mood = "happy";
            }
          }
        }
      } else {
        this.isGrounded = false;
      }

      // Giới hạn màn hình (chỉ khi chase/falling)
      if (canMoveX) {
        const screenPadding = 50;
        if (this.position.x < screenPadding) {
          this.position.x = screenPadding;
          this.velocity.x = 0;
        } else if (this.position.x > window.innerWidth - screenPadding) {
          this.position.x = window.innerWidth - screenPadding;
          this.velocity.x = 0;
        }
      }
    }

    // 5. Cập nhật tư thế từ PoseAnimator
    const customPose = this.poseAnimator.update(
      dt,
      this.stateMachine.currentState,
      this.isGrounded,
      this.velocity.x,
      this.isFacingRight,
      this.idleSubAction,
      this.chaseStage,
      this.chaseStageTimer,
      this.spinAngle,
      this.pendulumAngle,
      this.isDraggedFast
    );

    const idleSubProgress = this.idleSubDuration > 0 ? this.idleSubTimer / this.idleSubDuration : 0;
    const startledProgress = this.startledDuration > 0 ? (this.startledDuration - this.startledTimer) / this.startledDuration : 0;

    const renderState: RenderState = {
      x: this.position.x,
      y: this.position.y,
      vx: this.velocity.x,
      vy: this.velocity.y,
      isFacingRight: this.isFacingRight,
      stateName: this.stateMachine.currentState,
      isGrounded: this.isGrounded,
      isDragged: this.isDragged,
      mood: this.mood,
      idleSubAction: this.idleSubAction,
      idleSubProgress,
      isStartled: this.isStartled,
      startledProgress,
      lookTarget: butterfly && butterfly.isActive ? { x: butterfly.position.x, y: butterfly.position.y } : undefined,
      customPose,
      chaseStage: this.chaseStage,
      isDraggedFast: this.isDraggedFast,
      pendulumAngle: this.pendulumAngle,
    };

    this.renderer.update(dt, renderState);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const idleSubProgress = this.idleSubDuration > 0 ? this.idleSubTimer / this.idleSubDuration : 0;
    const startledProgress = this.startledDuration > 0 ? (this.startledDuration - this.startledTimer) / this.startledDuration : 0;

    const renderState: RenderState = {
      x: this.position.x,
      y: this.position.y,
      vx: this.velocity.x,
      vy: this.velocity.y,
      isFacingRight: this.isFacingRight,
      stateName: this.stateMachine.currentState,
      isGrounded: this.isGrounded,
      isDragged: this.isDragged,
      mood: this.mood,
      idleSubAction: this.idleSubAction,
      idleSubProgress,
      isStartled: this.isStartled,
      startledProgress,
      chaseStage: this.chaseStage,
      isDraggedFast: this.isDraggedFast,
      pendulumAngle: this.pendulumAngle,
    };

    this.renderer.render(ctx, renderState);
  }

  public wakeUp(): void {
    this.isStartled = false;
    this.stateMachine.registerUserActivity();
  }

  public toggleSleep(): void {
    if (this.stateMachine.currentState === "SLEEP") {
      this.stateMachine.setState("IDLE");
      this.mood = "happy";
    } else {
      this.stateMachine.setState("SLEEP");
    }
  }

  public resetPosition(): void {
    this.homeX = Math.min(window.innerWidth - 220, Math.max(220, window.innerWidth * 0.75));
    this.position.set(this.homeX, this.groundY);
    this.velocity.set(0, 0);
    this.isGrounded = true;
    this.isStartled = false;
    this.idleSubAction = "NONE";
    this.chaseStage = "ANTICIPATION";
    this.stateMachine.setState("IDLE");
    this.mood = "happy";
  }
}
