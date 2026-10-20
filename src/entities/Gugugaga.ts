import { Vector2D } from "../engine/Vector2D.ts";
import { StateMachine, StateType } from "../ai/StateMachine.ts";
import { GugugagaRenderer, PetMood, RenderState } from "./GugugagaRenderer.ts";
import { Butterfly } from "./Butterfly.ts";

export class Gugugaga {
  public position: Vector2D;
  public velocity: Vector2D;
  public stateMachine: StateMachine;
  public renderer: GugugagaRenderer;

  public isFacingRight: boolean = true;
  public isGrounded: boolean = true;
  public isDragged: boolean = false;
  public mood: PetMood = "happy";

  // Thông số vật lý & kích thước
  public width: number = 84;
  public height: number = 80;
  public groundY: number;
  private gravity: number = 1800; // px/s^2

  // Timers cho hành vi
  private zzzEmitTimer: number = 0;
  private celebrateTimer: number = 0;

  constructor() {
    this.groundY = window.innerHeight - 80;
    this.position = new Vector2D(window.innerWidth * 0.5, this.groundY);
    this.velocity = new Vector2D(0, 0);
    this.stateMachine = new StateMachine();
    this.renderer = new GugugagaRenderer();

    window.addEventListener("resize", () => {
      this.groundY = window.innerHeight - 80;
      if (this.position.y > this.groundY) {
        this.position.y = this.groundY;
      }
    });
  }

  public get currentState(): StateType {
    return this.stateMachine.currentState;
  }

  public update(dt: number, butterfly?: Butterfly): void {
    const ctx = this.stateMachine.getContext();
    this.stateMachine.update(dt);

    // Xử lý hoạt cảnh ăn mừng sau khi bắt bướm
    if (this.celebrateTimer > 0) {
      this.celebrateTimer -= dt;
      this.mood = "excited";
      if (this.celebrateTimer <= 0) {
        this.mood = "happy";
        this.stateMachine.setState("IDLE");
      }
    }

    // 1. Phản xạ AI theo từng trạng thái
    switch (this.stateMachine.currentState) {
      case "IDLE":
        this.velocity.set(0, 0);
        // Kiểm tra phát hiện bướm
        if (butterfly && butterfly.isActive && !butterfly.isCaught) {
          const dist = this.position.dist(butterfly.position);
          if (dist < 450) {
            this.stateMachine.setState("CHASE_BUTTERFLY");
            this.mood = "excited";
            break;
          }
        }

        if (ctx.stateTimer > ctx.idleDuration) {
          this.stateMachine.setState("WALK");
        }
        break;

      case "WALK":
        const walkSpeed = 100 * ctx.targetDirection;
        this.velocity.x = walkSpeed;
        this.isFacingRight = ctx.targetDirection > 0;

        // Kiểm tra phát hiện bướm
        if (butterfly && butterfly.isActive && !butterfly.isCaught) {
          const dist = this.position.dist(butterfly.position);
          if (dist < 450) {
            this.stateMachine.setState("CHASE_BUTTERFLY");
            this.mood = "excited";
            break;
          }
        }

        // Chạm mép màn hình thì đổi hướng
        const padding = 60;
        if (this.position.x < padding) {
          this.position.x = padding;
          ctx.targetDirection = 1;
        } else if (this.position.x > window.innerWidth - padding) {
          this.position.x = window.innerWidth - padding;
          ctx.targetDirection = -1;
        }

        if (ctx.stateTimer > ctx.walkDuration) {
          this.stateMachine.setState("IDLE");
        }
        break;

      case "CHASE_BUTTERFLY":
        if (!butterfly || !butterfly.isActive || butterfly.isCaught) {
          this.stateMachine.setState("IDLE");
          this.mood = "happy";
          break;
        }

        const bDist = this.position.dist(butterfly.position);
        const dx = butterfly.position.x - this.position.x;
        const dy = butterfly.position.y - this.position.y;

        this.isFacingRight = dx > 0;
        const runSpeed = 240;
        this.velocity.x = (dx > 0 ? 1 : -1) * runSpeed;

        // Nếu bướm bay cao hơn tầm đứng và Gugugaga đang trên sàn -> nhảy vồ
        if (dy < -60 && this.isGrounded && Math.abs(dx) < 140) {
          this.velocity.y = -580;
          this.isGrounded = false;
        }

        // Bắt được bướm thành công!
        if (bDist < 38) {
          butterfly.catch();
          this.renderer.particles.emitSparkle(this.position.x, this.position.y);
          this.celebrateTimer = 2.2;
          this.velocity.set(0, -250); // Nhảy lên ăn mừng
          this.isGrounded = false;
        }

        // Nếu săn quá 10 giây mà không bắt được thì dừng nghỉ
        if (ctx.stateTimer > 10) {
          this.stateMachine.setState("IDLE");
          this.mood = "happy";
        }
        break;

      case "SLEEP":
        this.velocity.set(0, 0);
        this.mood = "sleepy";
        this.zzzEmitTimer += dt;
        if (this.zzzEmitTimer >= 1.2) {
          this.renderer.particles.emitZzz(this.position.x + (this.isFacingRight ? 18 : -18), this.position.y - 30);
          this.zzzEmitTimer = 0;
        }
        break;

      case "DRAGGED":
        this.isGrounded = false;
        this.mood = "surprised";
        break;

      case "FALLING":
        // Trọng lực rơi tự do
        this.velocity.y += this.gravity * dt;
        this.mood = "surprised";
        break;

      case "NOTIFY":
        // Nhảy nhẹ tại chỗ và giơ tay vẫy chào
        if (this.isGrounded && ctx.stateTimer < 0.2) {
          this.velocity.y = -350;
          this.isGrounded = false;
        }
        this.mood = "excited";
        break;
    }

    // 2. Tích hợp vật lý vị trí (Vận tốc -> Tọa độ)
    if (!this.isDragged) {
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;

      // Trọng lực nếu không chạm đất
      if (!this.isGrounded) {
        this.velocity.y += this.gravity * dt;
      }

      // Xử lý va chạm sàn (Taskbar/Đáy màn hình)
      if (this.position.y >= this.groundY) {
        this.position.y = this.groundY;
        if (!this.isGrounded) {
          // Nảy nhẹ nếu rơi từ trên cao xuống
          if (this.velocity.y > 300) {
            this.velocity.y = -this.velocity.y * 0.35;
            this.renderer.particles.emitDust(this.position.x, this.position.y + 36);
          } else {
            this.velocity.y = 0;
            this.isGrounded = true;
            if (this.stateMachine.currentState === "FALLING") {
              this.stateMachine.setState("IDLE");
              this.mood = "happy";
            }
          }
        }
      } else {
        this.isGrounded = false;
      }

      // Giữ trong màn hình
      const screenPadding = 40;
      if (this.position.x < screenPadding) {
        this.position.x = screenPadding;
        this.velocity.x = 0;
      } else if (this.position.x > window.innerWidth - screenPadding) {
        this.position.x = window.innerWidth - screenPadding;
        this.velocity.x = 0;
      }
    }

    // 3. Cập nhật hoạt cảnh của Renderer
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
    };

    this.renderer.update(dt, renderState);
  }

  public render(ctx: CanvasRenderingContext2D): void {
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
    };

    this.renderer.render(ctx, renderState);
  }

  public wakeUp(): void {
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
    this.position.set(window.innerWidth * 0.5, this.groundY);
    this.velocity.set(0, 0);
    this.isGrounded = true;
    this.stateMachine.setState("IDLE");
    this.mood = "happy";
  }
}
