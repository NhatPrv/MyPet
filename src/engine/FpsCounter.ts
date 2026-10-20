export class FpsCounter {
  public isVisible: boolean = false;
  private frameCount: number = 0;
  private fps: number = 60;
  private lastCalculationTime: number = performance.now();
  private smoothedDt: number = 0.016;

  constructor() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
  }

  public update(dt: number): void {
    this.frameCount++;
    this.smoothedDt = this.smoothedDt * 0.9 + dt * 0.1;

    const now = performance.now();
    const elapsed = now - this.lastCalculationTime;
    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastCalculationTime = now;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    ctx.save();
    const x = 20;
    const y = 20;
    const width = 160;
    const height = 64;

    // Nền tối mờ kiểu Glassmorphism
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Văn bản chẩn đoán
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px 'Segoe UI', monospace";
    ctx.fillText(`FPS: ${this.fps}`, x + 12, y + 24);

    const ms = (this.smoothedDt * 1000).toFixed(1);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px 'Segoe UI', monospace";
    ctx.fillText(`Frame Time: ${ms} ms`, x + 12, y + 42);
    ctx.fillText(`Mode: 60 FPS Locked`, x + 12, y + 56);

    ctx.restore();
  }
}
