import { Vector2D } from "../engine/Vector2D.ts";

export class Butterfly {
  public position: Vector2D;
  public velocity: Vector2D;
  public isActive: boolean = false;
  public isCaught: boolean = false;

  private wingPhase: number = 0;
  private flightTime: number = 0;
  private baseSpeed: number = 130;
  private changeTargetTimer: number = 0;
  private targetPosition: Vector2D;

  // Màu sắc bướm neon rực rỡ
  public primaryColor: string = "#38bdf8";
  public secondaryColor: string = "#818cf8";
  public size: number = 14;

  constructor() {
    this.position = new Vector2D(0, 0);
    this.velocity = new Vector2D(0, 0);
    this.targetPosition = new Vector2D(0, 0);
  }

  public spawn(x?: number, y?: number): void {
    const startX = x !== undefined ? x : Math.random() * (window.innerWidth - 200) + 100;
    const startY = y !== undefined ? y : Math.random() * (window.innerHeight - 300) + 100;

    this.position.set(startX, startY);
    this.velocity.set(0, 0);
    this.isActive = true;
    this.isCaught = false;
    this.flightTime = 0;
    this.pickNewTarget();
  }

  private pickNewTarget(): void {
    // Chọn mục tiêu bay ngẫu nhiên trong màn hình làm việc
    const padding = 120;
    const tx = Math.random() * (window.innerWidth - padding * 2) + padding;
    const ty = Math.random() * (window.innerHeight - padding * 2 - 80) + padding;
    this.targetPosition.set(tx, ty);
    this.changeTargetTimer = 2.5 + Math.random() * 3;
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.flightTime += dt;
    this.wingPhase += dt * 26; // Tốc độ đập cánh 26 rad/s (~4 Hz)

    this.changeTargetTimer -= dt;
    if (this.changeTargetTimer <= 0) {
      this.pickNewTarget();
    }

    // Lực hướng tâm tới mục tiêu
    const dir = this.targetPosition.clone().sub(this.position);
    const dist = dir.mag();

    if (dist > 15) {
      dir.normalize().mult(this.baseSpeed);
      this.velocity.x += (dir.x - this.velocity.x) * dt * 2.5;
      this.velocity.y += (dir.y - this.velocity.y) * dt * 2.5;
    }

    // Thêm dao động sóng sin tự nhiên cho đường bay chao liệng
    const sineWobbleX = Math.cos(this.flightTime * 4.2) * 45;
    const sineWobbleY = Math.sin(this.flightTime * 5.5) * 55;

    this.position.x += (this.velocity.x + sineWobbleX) * dt;
    this.position.y += (this.velocity.y + sineWobbleY) * dt;

    // Giữ bướm trong giới hạn màn hình
    const maxX = window.innerWidth - 40;
    const maxY = window.innerHeight - 100;
    if (this.position.x < 40) {
      this.position.x = 40;
      this.velocity.x = Math.abs(this.velocity.x);
    } else if (this.position.x > maxX) {
      this.position.x = maxX;
      this.velocity.x = -Math.abs(this.velocity.x);
    }

    if (this.position.y < 50) {
      this.position.y = 50;
      this.velocity.y = Math.abs(this.velocity.y);
    } else if (this.position.y > maxY) {
      this.position.y = maxY;
      this.velocity.y = -Math.abs(this.velocity.y);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive) return;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Tính độ vỗ cánh theo hàm cos (co giãn bề rộng cánh)
    const wingFlap = Math.cos(this.wingPhase);
    const wingWidth = this.size * Math.abs(wingFlap);

    // Hướng bay
    const angle = Math.atan2(this.velocity.y, this.velocity.x) * 0.3;
    ctx.rotate(angle);

    // Cánh trái
    ctx.save();
    ctx.fillStyle = this.primaryColor;
    ctx.beginPath();
    ctx.ellipse(-wingWidth * 0.7, -4, wingWidth, this.size * 0.8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(-wingWidth * 0.6, 6, wingWidth * 0.8, this.size * 0.6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Cánh phải
    ctx.save();
    ctx.fillStyle = this.primaryColor;
    ctx.beginPath();
    ctx.ellipse(wingWidth * 0.7, -4, wingWidth, this.size * 0.8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(wingWidth * 0.6, 6, wingWidth * 0.8, this.size * 0.6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Thân bướm nhỏ thon
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đốm sáng hào quang lấp lánh quanh bướm
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public catch(): void {
    this.isActive = false;
    this.isCaught = true;
  }
}
