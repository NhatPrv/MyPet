import { invoke } from "@tauri-apps/api/core";

export interface HitboxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class HitboxManager {
  private hitboxes: (() => HitboxRect | null)[] = [];
  private padding: number = 18;
  private syncTimer: number | null = null;

  constructor() {
    this.startBackendSync();
  }

  public registerHitbox(getter: () => HitboxRect | null): void {
    this.hitboxes.push(getter);
    this.syncHitboxes();
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
    try {
      invoke("set_ignore_cursor_events", { ignore }).catch(() => {});
    } catch {
      // web dev
    }
  }

  public syncHitboxes(): void {
    const list: HitboxRect[] = [];
    for (const getter of this.hitboxes) {
      const r = getter();
      if (r) {
        list.push(r);
      }
    }

    try {
      invoke("update_hitboxes", { hitboxes: list }).catch(() => {});
    } catch {
      // Chạy môi trường web dev
    }
  }

  private startBackendSync(): void {
    // Đồng bộ tọa độ hitbox sang Rust Native Tracker định kỳ 40ms (~25Hz)
    this.syncTimer = window.setInterval(() => {
      this.syncHitboxes();
    }, 40);
  }

  public destroy(): void {
    if (this.syncTimer !== null) {
      clearInterval(this.syncTimer);
    }
  }
}
