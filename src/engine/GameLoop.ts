export type UpdateCallback = (dt: number) => void;
export type RenderCallback = (ctx: CanvasRenderingContext2D) => void;

export class GameLoop {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;

  constructor(
    canvas: HTMLCanvasElement,
    onUpdate: UpdateCallback,
    onRender: RenderCallback
  ) {
    this.canvas = canvas;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Unable to obtain 2D rendering context from canvas.");
    }
    this.ctx = context;
    this.onUpdate = onUpdate;
    this.onRender = onRender;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  public resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Scale context theo tỉ lệ DPR để hình vẽ sắc nét trên màn hình Retina / QHD
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    // Tính delta-time tính bằng giây
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamping delta-time: Giới hạn tối đa 0.05s (~20 FPS) để chống vỡ tính toán vật lý
    if (dt > 0.05) {
      dt = 0.05;
    }

    // 1. Cập nhật logic & vật lý
    this.onUpdate(dt);

    // 2. Xóa khung hình trước
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // 3. Kết xuất đồ họa
    this.onRender(this.ctx);

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
