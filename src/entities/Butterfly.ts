import { Vector2D } from "../engine/Vector2D.ts";

export class Butterfly {
  public position: Vector2D;
  public velocity: Vector2D;
  public isActive: boolean = false;
  public isCaught: boolean = false;

  private wingPhase: number = 0;
  private flightTime: number = 0;
  private baseSpeed: number = 120;
  private changeTargetTimer: number = 0;
  private targetPosition: Vector2D;
  private petCenterX: number = window.innerWidth * 0.5;

  // Màu sắc bướm xanh ngọc bích dạ quang (như hình mẫu đuổi bắt bướm)
  public primaryColor: string = "#2dd4bf";
  public secondaryColor: string = "#38bdf8";
  public size: number = 13;

  constructor() {
    this.position = new Vector2D(0, 0);
    this.velocity = new Vector2D(0, 0);
    this.targetPosition = new Vector2D(0, 0);
  }

  public spawn(nearX?: number, y?: number): void {
    if (nearX !== undefined) {
      this.petCenterX = nearX;
    }

    // Xuất hiện trong phạm vi nhỏ gần Gugugaga (bán kính 180px)
    const offsetX = (Math.random() - 0.5) * 260;
    const startX = Math.max(80, Math.min(window.innerWidth - 80, this.petCenterX + offsetX));
    const startY = y !== undefined ? y : window.innerHeight - 220 - Math.random() * 120;

    this.position.set(startX, startY);
    this.velocity.set(0, 0);
    this.isActive = true;
    this.isCaught = false;
    this.flightTime = 0;
    this.pickNewTarget();
  }

  public updateHome(x: number): void {
    this.petCenterX = x;
  }

  private pickNewTarget(): void {
    // Bay lượn trong không gian nhỏ quanh Gugugaga
    const rangeX = 180;
    const tx = Math.max(60, Math.min(window.innerWidth - 60, this.petCenterX + (Math.random() - 0.5) * rangeX * 2));
    const ty = Math.max(window.innerHeight - 380, Math.min(window.innerHeight - 110, window.innerHeight - 200 + (Math.random() - 0.5) * 160));
    this.targetPosition.set(tx, ty);
    this.changeTargetTimer = 2.0 + Math.random() * 2.5;
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.flightTime += dt;
    this.wingPhase += dt * 26;

    this.changeTargetTimer -= dt;
    if (this.changeTargetTimer <= 0) {
      this.pickNewTarget();
    }

    const dir = this.targetPosition.clone().sub(this.position);
    const dist = dir.mag();

    if (dist > 15) {
      dir.normalize().mult(this.baseSpeed);
      this.velocity.x += (dir.x - this.velocity.x) * dt * 2.5;
      this.velocity.y += (dir.y - this.velocity.y) * dt * 2.5;
    }

    const sineWobbleX = Math.cos(this.flightTime * 4.2) * 40;
    const sineWobbleY = Math.sin(this.flightTime * 5.5) * 45;

    this.position.x += (this.velocity.x + sineWobbleX) * dt;
    this.position.y += (this.velocity.y + sineWobbleY) * dt;

    const minX = Math.max(40, this.petCenterX - 220);
    const maxX = Math.min(window.innerWidth - 40, this.petCenterX + 220);

    if (this.position.x < minX) {
      this.position.x = minX;
      this.velocity.x = Math.abs(this.velocity.x);
    } else if (this.position.x > maxX) {
      this.position.x = maxX;
      this.velocity.x = -Math.abs(this.velocity.x);
    }

    const minY = window.innerHeight - 400;
    const maxY = window.innerHeight - 100;

    if (this.position.y < minY) {
      this.position.y = minY;
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

    const wingFlap = Math.cos(this.wingPhase);
    const wingWidth = this.size * Math.abs(wingFlap);

    const angle = Math.atan2(this.velocity.y, this.velocity.x) * 0.3;
    ctx.rotate(angle);

    // Cánh trái xanh ngọc
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

    // Thân bướm
    ctx.fillStyle = "#134e4a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public catch(): void {
    this.isActive = false;
    this.isCaught = true;
  }
}
