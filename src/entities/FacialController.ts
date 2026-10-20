export type ExpressionType =
  | "NORMAL"
  | "HAPPY"
  | "EXCITED_STAR_EYES"
  | "SLEEPY"
  | "SURPRISED_DIZZY"
  | "STARTLED";

export class FacialController {
  public expression: ExpressionType = "NORMAL";

  // Theo dõi mục tiêu của con ngươi (Target Tracking)
  public pupilTargetX: number = 0;
  public pupilTargetY: number = 0;
  public pupilCurrentX: number = 0;
  public pupilCurrentY: number = 0;

  // Chớp mắt tự nhiên (Blinking)
  private blinkTimer: number = 3.0;
  private isBlinking: boolean = false;
  private blinkProgress: number = 0;
  private isDoubleBlink: boolean = false;

  public setExpression(exp: ExpressionType): void {
    this.expression = exp;
  }

  public setLookTarget(dx: number, dy: number): void {
    // Chuẩn hóa độ lệch sang phạm vi [-1, 1]
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      this.pupilTargetX = Math.max(-1, Math.min(1, dx / 250));
      this.pupilTargetY = Math.max(-1, Math.min(1, dy / 250));
    } else {
      this.pupilTargetX = 0;
      this.pupilTargetY = 0;
    }
  }

  public update(dt: number): void {
    // 1. Cập nhật vị trí con ngươi theo bộ lọc thông thấp (Lerp mượt mà)
    this.pupilCurrentX += (this.pupilTargetX - this.pupilCurrentX) * Math.min(1, dt * 10);
    this.pupilCurrentY += (this.pupilTargetY - this.pupilCurrentY) * Math.min(1, dt * 10);

    // 2. Tự động chớp mắt ngẫu nhiên với xác suất chớp mắt kép (double blink)
    if (this.expression !== "STARTLED" && this.expression !== "SLEEPY") {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        this.blinkProgress = 0;
        this.isDoubleBlink = Math.random() < 0.25; // 25% chớp mắt kép
        this.blinkTimer = 2.5 + Math.random() * 3.5;
      }

      if (this.isBlinking) {
        this.blinkProgress += dt * 14;
        if (this.blinkProgress >= 1) {
          if (this.isDoubleBlink) {
            this.isDoubleBlink = false;
            this.blinkProgress = 0;
          } else {
            this.isBlinking = false;
          }
        }
      }
    } else {
      this.isBlinking = false;
    }
  }

  public get isEyesClosed(): boolean {
    return this.isBlinking || this.expression === "SLEEPY";
  }

  public get blinkAmount(): number {
    if (this.expression === "SLEEPY") return 1;
    if (!this.isBlinking) return 0;
    // Hàm sin chu kỳ chớp mắt nhắm rồi mở
    return Math.sin(this.blinkProgress * Math.PI);
  }
}
