/**
 * AnimationClip.ts
 * Định nghĩa một clip hoạt ảnh gồm nhiều frame từ spritesheet.
 * Mỗi frame có toạ độ (x, y, w, h) trên spritesheet + duration riêng.
 */

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Thời gian giữ frame này (giây). Mặc định tính từ fps của clip */
  duration?: number;
}

export type PlayMode = "loop" | "once" | "pingpong" | "hold_last";

export interface AnimationClipDef {
  /** Tên định danh clip */
  name: string;
  /** Danh sách các frame theo thứ tự */
  frames: SpriteFrame[];
  /** Số frame/giây (áp dụng cho frame không có duration riêng) */
  fps: number;
  /** Chế độ phát */
  mode: PlayMode;
}

export class AnimationClip {
  public readonly name: string;
  public readonly frames: SpriteFrame[];
  public readonly fps: number;
  public readonly mode: PlayMode;

  /** Thời gian đã trôi qua trong frame hiện tại (giây) */
  private frameTimer: number = 0;
  /** Index frame hiện tại */
  private frameIndex: number = 0;
  /** Hướng ping-pong: +1 tiến, -1 lùi */
  private pingDir: number = 1;
  /** Clip đã hoàn thành lần phát once chưa */
  public finished: boolean = false;

  constructor(def: AnimationClipDef) {
    this.name = def.name;
    this.frames = def.frames;
    this.fps = def.fps;
    this.mode = def.mode;
  }

  /** Reset về frame đầu tiên */
  public reset(): void {
    this.frameTimer = 0;
    this.frameIndex = 0;
    this.pingDir = 1;
    this.finished = false;
  }

  /** Cập nhật timer và chuyển frame. Gọi mỗi tick game loop */
  public update(dt: number): void {
    if (this.finished) return;
    if (this.frames.length === 0) return;

    const currentFrame = this.frames[this.frameIndex];
    const frameDuration = currentFrame.duration ?? (1 / this.fps);

    this.frameTimer += dt;

    while (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.advance();
      if (this.finished) break;
    }
  }

  private advance(): void {
    const total = this.frames.length;
    if (total <= 1) {
      if (this.mode === "once") this.finished = true;
      return;
    }

    switch (this.mode) {
      case "loop":
        this.frameIndex = (this.frameIndex + 1) % total;
        break;

      case "once":
        this.frameIndex++;
        if (this.frameIndex >= total) {
          this.frameIndex = total - 1;
          this.finished = true;
        }
        break;

      case "pingpong":
        this.frameIndex += this.pingDir;
        if (this.frameIndex >= total) {
          this.frameIndex = total - 2;
          this.pingDir = -1;
        } else if (this.frameIndex < 0) {
          this.frameIndex = 1;
          this.pingDir = 1;
        }
        break;

      case "hold_last":
        this.frameIndex++;
        if (this.frameIndex >= total) {
          this.frameIndex = total - 1;
          this.finished = true;
        }
        break;
    }
  }

  /** Lấy frame hiện tại để render */
  public get currentFrame(): SpriteFrame {
    return this.frames[this.frameIndex] ?? this.frames[0];
  }

  /** Tiến độ 0→1 của animation (chỉ hữu ích với mode=once) */
  public get progress(): number {
    if (this.frames.length <= 1) return 1;
    return this.frameIndex / (this.frames.length - 1);
  }
}
