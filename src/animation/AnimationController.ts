/**
 * AnimationController.ts
 * Quản lý tập hợp các AnimationClip và chuyển đổi (transition) mượt mà giữa chúng.
 * Hỗ trợ crossfade theo thời gian để tránh pop/jerk khi chuyển state.
 */
import { AnimationClip, AnimationClipDef, SpriteFrame } from "./AnimationClip.ts";

export class AnimationController {
  private clips: Map<string, AnimationClip> = new Map();
  private current: AnimationClip | null = null;
  private previous: AnimationClip | null = null;

  /** Thời gian crossfade còn lại (giây) */
  private blendTimer: number = 0;
  /** Tổng thời gian crossfade (giây) */
  private blendDuration: number = 0;

  /**
   * Đăng ký một animation clip vào controller.
   */
  public register(def: AnimationClipDef): void {
    this.clips.set(def.name, new AnimationClip(def));
  }

  /**
   * Chuyển sang clip mới.
   * @param name Tên clip đã đăng ký
   * @param crossfade Thời gian blend (giây), 0 = chuyển tức thì
   * @param forceRestart Nếu true, restart dù đang chạy clip đó rồi
   */
  public play(name: string, crossfade: number = 0, forceRestart: boolean = false): void {
    const clip = this.clips.get(name);
    if (!clip) {
      console.warn(`[AnimCtrl] Clip '${name}' not found.`);
      return;
    }

    // Nếu đang chạy clip này rồi và không force → bỏ qua
    if (this.current === clip && !forceRestart && !clip.finished) return;

    // Lưu clip cũ để blend
    if (crossfade > 0 && this.current && this.current !== clip) {
      this.previous = this.current;
      this.blendDuration = crossfade;
      this.blendTimer = crossfade;
    } else {
      this.previous = null;
      this.blendTimer = 0;
    }

    clip.reset();
    this.current = clip;
  }

  /**
   * Cập nhật timer animation. Gọi mỗi frame.
   */
  public update(dt: number): void {
    this.current?.update(dt);
    this.previous?.update(dt);

    if (this.blendTimer > 0) {
      this.blendTimer -= dt;
      if (this.blendTimer <= 0) {
        this.blendTimer = 0;
        this.previous = null;
      }
    }
  }

  /**
   * Lấy frame hiện tại để render.
   * Nếu đang crossfade, trả về frame của clip hiện tại (renderer tự xử lý alpha).
   */
  public get currentFrame(): SpriteFrame | null {
    return this.current?.currentFrame ?? null;
  }

  /**
   * Frame của clip trước trong quá trình blend (có thể null)
   */
  public get previousFrame(): SpriteFrame | null {
    if (!this.previous || this.blendTimer <= 0) return null;
    return this.previous.currentFrame;
  }

  /**
   * Alpha của clip CŨ trong quá trình blend: 1.0 → 0.0
   */
  public get blendAlpha(): number {
    if (this.blendDuration <= 0) return 0;
    return this.blendTimer / this.blendDuration;
  }

  /**
   * Clip hiện tại đã phát xong (với mode=once)?
   */
  public get isFinished(): boolean {
    return this.current?.finished ?? true;
  }

  /**
   * Tên clip đang chạy
   */
  public get currentName(): string {
    return this.current?.name ?? "";
  }

  /**
   * Tiến độ 0→1 của clip hiện tại
   */
  public get progress(): number {
    return this.current?.progress ?? 0;
  }
}
