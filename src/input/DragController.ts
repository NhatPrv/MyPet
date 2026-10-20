import { invoke } from "@tauri-apps/api/core";
import { Gugugaga } from "../entities/Gugugaga.ts";
import { HitboxManager } from "./HitboxManager.ts";
import { PendulumSolver } from "../engine/SpringPhysics.ts";

export class DragController {
  private pet: Gugugaga;
  private hitboxManager: HitboxManager;
  private canvas: HTMLCanvasElement;

  public isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private activePointerId: number | null = null;

  // Bộ giải nghiệm con lắc vật lý
  public pendulum: PendulumSolver;
  public isDraggedFast: boolean = false;

  // Tính toán gia tốc và vận tốc kéo
  private lastDragX: number = 0;
  private lastDragY: number = 0;
  private lastDragVx: number = 0;
  private lastDragTime: number = 0;
  private releaseVx: number = 0;
  private releaseVy: number = 0;

  constructor(pet: Gugugaga, hitboxManager: HitboxManager) {
    this.pet = pet;
    this.hitboxManager = hitboxManager;
    this.canvas = document.getElementById("pet-canvas") as HTMLCanvasElement;
    this.pendulum = new PendulumSolver(75, 1400, 3.8);

    this.registerHitbox();
    this.setupEventListeners();
  }

  private registerHitbox(): void {
    this.hitboxManager.registerHitbox(() => {
      return {
        x: this.pet.position.x - this.pet.width / 2,
        y: this.pet.position.y - this.pet.height / 2,
        width: this.pet.width,
        height: this.pet.height,
      };
    });
  }

  public isOverPet(clientX: number, clientY: number): boolean {
    const halfW = this.pet.width / 2 + 16;
    const halfH = this.pet.height / 2 + 16;
    const dx = Math.abs(clientX - this.pet.position.x);
    const dy = Math.abs(clientY - this.pet.position.y);
    return dx <= halfW && dy <= halfH;
  }

  private setupEventListeners(): void {
    window.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return; // Chỉ nhận chuột trái

      if (this.isOverPet(e.clientX, e.clientY)) {
        this.activePointerId = e.pointerId;
        if (this.canvas && this.canvas.setPointerCapture) {
          try {
            this.canvas.setPointerCapture(e.pointerId);
          } catch {
            // bỏ qua nếu không hỗ trợ
          }
        }
        this.startDrag(e.clientX, e.clientY);
      }
    });

    window.addEventListener("pointermove", (e: PointerEvent) => {
      if (this.isDragging) {
        this.updateDrag(e.clientX, e.clientY);
      } else {
        // Cập nhật con trỏ chuột thành hình bàn tay nắm khi rê vào pet
        if (this.isOverPet(e.clientX, e.clientY)) {
          document.body.style.cursor = "grab";
        } else {
          document.body.style.cursor = "default";
        }
      }
    });

    const handlePointerUp = (e: PointerEvent) => {
      if (this.isDragging && (this.activePointerId === null || e.pointerId === this.activePointerId)) {
        if (this.canvas && this.canvas.releasePointerCapture && this.activePointerId !== null) {
          try {
            this.canvas.releasePointerCapture(this.activePointerId);
          } catch {
            // bỏ qua
          }
        }
        this.activePointerId = null;
        this.endDrag();
      }
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    // Nhấp đúp chuột để nựng Gugugaga
    window.addEventListener("dblclick", (e: MouseEvent) => {
      if (this.isOverPet(e.clientX, e.clientY)) {
        this.pet.wakeUp();
        this.pet.mood = "excited";
        this.pet.velocity.y = -380;
        this.pet.isGrounded = false;
        this.pet.renderer.particles.emitSparkle(this.pet.position.x, this.pet.position.y);
      }
    });
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.pet.wakeUp();
    this.pet.isDragged = true;
    this.pet.stateMachine.setState("DRAGGED");
    document.body.style.cursor = "grabbing";

    this.dragOffsetX = this.pet.position.x - clientX;
    this.dragOffsetY = this.pet.position.y - clientY;

    this.lastDragX = clientX;
    this.lastDragY = clientY;
    this.lastDragVx = 0;
    this.lastDragTime = performance.now();
    this.releaseVx = 0;
    this.releaseVy = 0;
    this.pendulum.reset();
    this.pet.pendulumAngle = 0;
    this.pet.isDraggedFast = false;

    // Báo cho Rust Native Tracker khóa giữ tương tác không cho xuyên chuột trong khi kéo
    try {
      invoke("set_drag_state", { isDragging: true }).catch(() => {});
    } catch {
      // bỏ qua
    }
  }

  private updateDrag(clientX: number, clientY: number): void {
    const now = performance.now();
    const dt = (now - this.lastDragTime) / 1000;

    if (dt > 0.005) {
      const vx = (clientX - this.lastDragX) / dt;
      const vy = (clientY - this.lastDragY) / dt;
      const accelX = (vx - this.lastDragVx) / dt;

      this.releaseVx = this.releaseVx * 0.4 + vx * 0.6;
      this.releaseVy = this.releaseVy * 0.4 + vy * 0.6;

      this.pendulum.update(dt, accelX);

      this.isDraggedFast = Math.abs(vx) > 480 || Math.abs(this.pendulum.angularVelocity) > 6;
      this.pet.pendulumAngle = this.pendulum.angle;
      this.pet.isDraggedFast = this.isDraggedFast;

      if (this.isDraggedFast) {
        this.pet.mood = "surprised";
      }

      this.lastDragVx = vx;
      this.lastDragX = clientX;
      this.lastDragY = clientY;
      this.lastDragTime = now;
    }

    this.pet.position.x = clientX + this.dragOffsetX;
    this.pet.position.y = clientY + this.dragOffsetY;

    // Cập nhật hitbox ngay lập tức khi kéo để backend theo kịp
    this.hitboxManager.syncHitboxes();
  }

  private endDrag(): void {
    this.isDragging = false;
    this.pet.isDragged = false;
    this.isDraggedFast = false;
    this.pet.pendulumAngle = 0;
    this.pet.isDraggedFast = false;
    document.body.style.cursor = "default";

    // Báo cho Rust kết thúc kéo thả
    try {
      invoke("set_drag_state", { isDragging: false }).catch(() => {});
    } catch {
      // bỏ qua
    }

    const maxSpeed = 1200;
    this.pet.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, this.releaseVx));
    this.pet.velocity.y = Math.max(-maxSpeed, Math.min(maxSpeed, this.releaseVy));

    if (this.pet.position.y < this.pet.groundY - 5) {
      this.pet.isGrounded = false;
      this.pet.stateMachine.setState("FALLING");
    } else {
      this.pet.isGrounded = true;
      this.pet.position.y = this.pet.groundY;
      this.pet.homeX = this.pet.position.x;
      this.pet.velocity.set(0, 0);
      this.pet.stateMachine.setState("IDLE");
    }

    this.hitboxManager.syncHitboxes();
  }
}
