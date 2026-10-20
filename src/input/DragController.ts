import { Gugugaga } from "../entities/Gugugaga.ts";
import { HitboxManager } from "./HitboxManager.ts";

export class DragController {
  private pet: Gugugaga;
  private hitboxManager: HitboxManager;

  private isDragging: boolean = false;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  // Tính toán vận tốc ném
  private lastDragX: number = 0;
  private lastDragY: number = 0;
  private lastDragTime: number = 0;
  private releaseVx: number = 0;
  private releaseVy: number = 0;

  constructor(pet: Gugugaga, hitboxManager: HitboxManager) {
    this.pet = pet;
    this.hitboxManager = hitboxManager;

    this.registerHitbox();
    this.setupEventListeners();
  }

  private registerHitbox(): void {
    this.hitboxManager.registerHitbox(() => {
      // Hitbox của Gugugaga (tính từ tâm (x, y) sang bounding box)
      return {
        x: this.pet.position.x - this.pet.width / 2,
        y: this.pet.position.y - this.pet.height / 2,
        width: this.pet.width,
        height: this.pet.height,
      };
    });
  }

  private isOverPet(clientX: number, clientY: number): boolean {
    const halfW = this.pet.width / 2 + 10;
    const halfH = this.pet.height / 2 + 10;
    const dx = Math.abs(clientX - this.pet.position.x);
    const dy = Math.abs(clientY - this.pet.position.y);
    return dx <= halfW && dy <= halfH;
  }

  private setupEventListeners(): void {
    window.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return; // Chỉ xử lý chuột trái

      if (this.isOverPet(e.clientX, e.clientY)) {
        this.startDrag(e.clientX, e.clientY);
      }
    });

    window.addEventListener("pointermove", (e: PointerEvent) => {
      if (this.isDragging) {
        this.updateDrag(e.clientX, e.clientY);
      } else {
        // Cập nhật trạng thái tương tác chuột
        if (this.isOverPet(e.clientX, e.clientY)) {
          this.hitboxManager.setIgnoreCursor(false);
        }
      }
    });

    window.addEventListener("pointerup", (e: PointerEvent) => {
      if (this.isDragging && e.button === 0) {
        this.endDrag();
      }
    });

    // Nhấp đúp chuột để vuốt ve cưng nựng Gugugaga
    window.addEventListener("dblclick", (e: MouseEvent) => {
      if (this.isOverPet(e.clientX, e.clientY)) {
        this.pet.wakeUp();
        this.pet.mood = "excited";
        this.pet.velocity.y = -350;
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

    this.dragOffsetX = this.pet.position.x - clientX;
    this.dragOffsetY = this.pet.position.y - clientY;

    this.lastDragX = clientX;
    this.lastDragY = clientY;
    this.lastDragTime = performance.now();
    this.releaseVx = 0;
    this.releaseVy = 0;

    this.hitboxManager.setIgnoreCursor(false);
  }

  private updateDrag(clientX: number, clientY: number): void {
    const now = performance.now();
    const dt = (now - this.lastDragTime) / 1000;

    if (dt > 0.005) {
      // Tính vận tốc kéo tức thời
      const vx = (clientX - this.lastDragX) / dt;
      const vy = (clientY - this.lastDragY) / dt;
      this.releaseVx = this.releaseVx * 0.4 + vx * 0.6;
      this.releaseVy = this.releaseVy * 0.4 + vy * 0.6;

      this.lastDragX = clientX;
      this.lastDragY = clientY;
      this.lastDragTime = now;
    }

    // Cập nhật vị trí Gugugaga theo con trỏ chuột
    this.pet.position.x = clientX + this.dragOffsetX;
    this.pet.position.y = clientY + this.dragOffsetY;
  }

  private endDrag(): void {
    this.isDragging = false;
    this.pet.isDragged = false;

    // Giới hạn vận tốc ném tối đa 1200 px/s
    const maxSpeed = 1200;
    this.pet.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, this.releaseVx));
    this.pet.velocity.y = Math.max(-maxSpeed, Math.min(maxSpeed, this.releaseVy));

    // Nếu thả trên không trung, chuyển sang trạng thái FALLING
    if (this.pet.position.y < this.pet.groundY - 5) {
      this.pet.isGrounded = false;
      this.pet.stateMachine.setState("FALLING");
    } else {
      this.pet.isGrounded = true;
      this.pet.position.y = this.pet.groundY;
      this.pet.velocity.set(0, 0);
      this.pet.stateMachine.setState("IDLE");
    }
  }
}
