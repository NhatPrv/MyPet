/**
 * SpriteAnimator.ts
 * Engine chính chạy animation frame-by-frame từ nhiều file PNG.
 * - Preload toàn bộ ảnh khi khởi tạo
 * - Quản lý state machine animation (clip hiện tại, chuyển đổi)
 * - Cung cấp currentImage + currentMeta để GugugagaRenderer vẽ
 */
import { AnimDef, AnimPlayMode, FrameMeta, GUGA_ANIMS } from "./GugugagaAnimDefs.ts";

// ============================================================
//  Image Cache (Singleton) — tránh load cùng 1 ảnh nhiều lần
// ============================================================
class ImageCache {
  private static _map: Map<string, HTMLImageElement> = new Map();

  static get(src: string): HTMLImageElement {
    if (!this._map.has(src)) {
      const img = new Image();
      img.src = src;
      this._map.set(src, img);
    }
    return this._map.get(src)!;
  }

  static preload(srcs: string[]): void {
    for (const s of srcs) this.get(s);
  }

  static get ready(): boolean {
    for (const img of this._map.values()) {
      if (!img.complete || img.naturalWidth === 0) return false;
    }
    return true;
  }
}

// ============================================================
//  Runtime State của một clip đang chạy
// ============================================================
interface ClipState {
  def: AnimDef;
  frameIndex: number;
  frameTimer: number;
  pingDir: number;   // +1 / -1 cho pingpong
  finished: boolean;
}

export class SpriteAnimator {
  private clips: Map<string, AnimDef> = new Map();
  private current: ClipState | null = null;

  // Crossfade
  private crossfadeFrom: ClipState | null = null;
  private crossfadeTimer: number = 0;
  private crossfadeDuration: number = 0;

  constructor() {
    // Đăng ký tất cả anim defs mặc định của Gugugaga
    for (const def of GUGA_ANIMS) {
      this.register(def);
    }
    // Preload toàn bộ src ảnh
    const allSrcs = new Set<string>();
    for (const def of GUGA_ANIMS) {
      for (const f of def.frames) allSrcs.add(f.src);
    }
    ImageCache.preload(Array.from(allSrcs));
  }

  /** Đăng ký thêm AnimDef tuỳ chỉnh */
  public register(def: AnimDef): void {
    this.clips.set(def.name, def);
  }

  /**
   * Chuyển sang animation mới.
   * @param name   Tên clip (khớp với AnimDef.name)
   * @param crossfade Thời gian blend alpha (0 = tức thì)
   * @param force  Restart nếu đang chạy clip này rồi
   */
  public play(name: string, crossfade: number = 0, force: boolean = false): void {
    const def = this.clips.get(name);
    if (!def) {
      console.warn(`[SpriteAnimator] Clip '${name}' không tồn tại.`);
      return;
    }

    const alreadyPlaying =
      this.current?.def.name === name && !this.current.finished;

    if (alreadyPlaying && !force) return;

    // Lưu clip cũ để crossfade
    if (crossfade > 0 && this.current) {
      this.crossfadeFrom = { ...this.current };
      this.crossfadeTimer = crossfade;
      this.crossfadeDuration = crossfade;
    } else {
      this.crossfadeFrom = null;
      this.crossfadeTimer = 0;
    }

    this.current = {
      def,
      frameIndex: 0,
      frameTimer: 0,
      pingDir: 1,
      finished: false,
    };
  }

  /** Cập nhật timer mỗi tick. Gọi trong game loop trước render */
  public update(dt: number): void {
    if (this.current) this.advanceState(this.current, dt);
    if (this.crossfadeFrom) {
      this.advanceState(this.crossfadeFrom, dt);
      this.crossfadeTimer -= dt;
      if (this.crossfadeTimer <= 0) this.crossfadeFrom = null;
    }
  }

  private advanceState(state: ClipState, dt: number): void {
    if (state.finished) return;
    const frames = state.def.frames;
    if (frames.length === 0) return;

    const frameDur = frames[state.frameIndex].duration ?? (1 / state.def.fps);
    state.frameTimer += dt;

    while (state.frameTimer >= frameDur) {
      state.frameTimer -= frameDur;
      this.nextFrame(state);
      if (state.finished) break;
    }
  }

  private nextFrame(state: ClipState): void {
    const total = state.def.frames.length;
    if (total <= 1) {
      if (state.def.mode === "once") state.finished = true;
      return;
    }

    switch (state.def.mode as AnimPlayMode) {
      case "loop":
        state.frameIndex = (state.frameIndex + 1) % total;
        break;
      case "once":
        state.frameIndex++;
        if (state.frameIndex >= total) {
          state.frameIndex = total - 1;
          state.finished = true;
        }
        break;
      case "pingpong":
        state.frameIndex += state.pingDir;
        if (state.frameIndex >= total) {
          state.frameIndex = total - 2;
          state.pingDir = -1;
        } else if (state.frameIndex < 0) {
          state.frameIndex = 1;
          state.pingDir = 1;
        }
        break;
    }
  }

  // ── Getters cho Renderer ──────────────────────────────────

  /** HTMLImageElement của frame hiện tại (có thể chưa load xong) */
  public get currentImage(): HTMLImageElement | null {
    if (!this.current) return null;
    const frames = this.current.def.frames;
    const frame = frames[this.current.frameIndex] ?? frames[0];
    const img = ImageCache.get(frame.src);
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  /** Metadata biến đổi của frame hiện tại */
  public get currentMeta(): FrameMeta {
    if (!this.current) return {};
    const frames = this.current.def.frames;
    return frames[this.current.frameIndex]?.meta ?? {};
  }

  /** Ảnh của clip cũ khi đang crossfade */
  public get crossfadeImage(): HTMLImageElement | null {
    if (!this.crossfadeFrom || this.crossfadeTimer <= 0) return null;
    const frames = this.crossfadeFrom.def.frames;
    const frame = frames[this.crossfadeFrom.frameIndex] ?? frames[0];
    const img = ImageCache.get(frame.src);
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  /** Alpha của clip cũ (1.0 → 0.0) */
  public get crossfadeAlpha(): number {
    if (this.crossfadeDuration <= 0) return 0;
    return Math.max(0, this.crossfadeTimer / this.crossfadeDuration);
  }

  /** Clip hiện tại đã xong (mode=once) chưa? */
  public get isFinished(): boolean {
    return this.current?.finished ?? true;
  }

  /** Tên clip đang chạy */
  public get currentName(): string {
    return this.current?.def.name ?? "";
  }

  /** Tiến độ 0→1 */
  public get progress(): number {
    if (!this.current) return 0;
    const total = this.current.def.frames.length;
    if (total <= 1) return 1;
    return this.current.frameIndex / (total - 1);
  }

  /** Tất cả ảnh đã load xong chưa */
  public get ready(): boolean {
    return ImageCache.ready;
  }
}
