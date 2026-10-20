import { invoke } from "@tauri-apps/api/core";

export interface HitboxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class HitboxManager {
  private isIgnoring: boolean = false;
  private hitboxes: (() => HitboxRect | null)[] = [];
  private padding: number = 14; // Vùng đệm 14px để di chuột mượt mà

  constructor() {
    this.setupMouseTracking();
    // Khởi tạo mặc định: Nếu chưa di chuột vào pet, kích hoạt click-through
    this.setIgnoreCursor(true);
  }

  public registerHitbox(getter: () => HitboxRect | null): void {
    this.hitboxes.push(getter);
  }

  public isPointInsideHitbox(px: number, py: number): boolean {
    for (const getter of this.hitboxes) {
      const rect = getter();
      if (!rect) continue;

      const minX = rect.x - this.padding;
      const maxX = rect.x + rect.width + this.padding;
      const minY = rect.y - this.padding;
      const maxY = rect.y + rect.height + this.padding;

      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        return true;
      }
    }
    return false;
  }

  public setIgnoreCursor(ignore: boolean): void {
    if (this.isIgnoring === ignore) return;
    this.isIgnoring = ignore;

    try {
      invoke("set_ignore_cursor_events", { ignore }).catch((err) => {
        // Chạy trong trình duyệt thông thường khi dev thì invoke có thể không có backend
        console.debug("Tauri set_ignore_cursor_events:", err);
      });
    } catch {
      // Fallback môi trường web dev
    }
  }

  private setupMouseTracking(): void {
    // Theo dõi chuột khi đang nhận sự kiện
    window.addEventListener("pointermove", (e: PointerEvent) => {
      const inside = this.isPointInsideHitbox(e.clientX, e.clientY);
      if (!inside) {
        this.setIgnoreCursor(true);
      }
    });

    // Khi con trỏ chuột rời khỏi cửa sổ
    window.addEventListener("pointerleave", () => {
      this.setIgnoreCursor(true);
    });

    // Sự kiện di chuột trên vùng nhận tương tác
    window.addEventListener("mousemove", (e: MouseEvent) => {
      const inside = this.isPointInsideHitbox(e.clientX, e.clientY);
      if (inside) {
        this.setIgnoreCursor(false);
      } else {
        this.setIgnoreCursor(true);
      }
    });
  }
}
