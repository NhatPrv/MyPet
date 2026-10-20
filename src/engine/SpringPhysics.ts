/**
 * Bộ giải nghiệm dao động lò xo 1 chiều (1D Spring-Damper)
 * Triển khai theo định luật Hooke kết hợp giảm chấn bằng phương pháp tích phân bán ẩn (Semi-implicit Euler)
 */
export class Spring1D {
  public value: number;
  public velocity: number = 0;
  public target: number;

  public stiffness: number; // Độ cứng của lò xo (k)
  public damping: number;   // Hệ số giảm chấn (c)
  public mass: number;      // Khối lượng (m)

  constructor(
    initialValue: number = 0,
    stiffness: number = 240,
    damping: number = 20,
    mass: number = 1
  ) {
    this.value = initialValue;
    this.target = initialValue;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  public setTarget(target: number): void {
    this.target = target;
  }

  public snapTo(val: number): void {
    this.value = val;
    this.target = val;
    this.velocity = 0;
  }

  public update(dt: number): number {
    // F_spring = -k * (x - target)
    // F_damping = -c * v
    // a = (F_spring + F_damping) / m
    const displacement = this.value - this.target;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -this.damping * this.velocity;
    const acceleration = (springForce + dampingForce) / this.mass;

    this.velocity += acceleration * dt;
    this.value += this.velocity * dt;

    return this.value;
  }
}

/**
 * Bộ giải nghiệm dao động lò xo 2 chiều (2D Spring-Damper)
 */
export class Spring2D {
  public x: Spring1D;
  public y: Spring1D;

  constructor(
    initX: number = 0,
    initY: number = 0,
    stiffness: number = 240,
    damping: number = 20
  ) {
    this.x = new Spring1D(initX, stiffness, damping);
    this.y = new Spring1D(initY, stiffness, damping);
  }

  public setTarget(tx: number, ty: number): void {
    this.x.setTarget(tx);
    this.y.setTarget(ty);
  }

  public snapTo(x: number, y: number): void {
    this.x.snapTo(x);
    this.y.snapTo(y);
  }

  public update(dt: number): { x: number; y: number } {
    return {
      x: this.x.update(dt),
      y: this.y.update(dt),
    };
  }
}

/**
 * Bộ giải nghiệm con lắc vật lý (Pendulum Physics Solver)
 * Sử dụng cho trạng thái DRAGGED khi Gugugaga bị nhấc bổng và đung đưa theo quán tính chuột
 */
export class PendulumSolver {
  public angle: number = 0;           // Góc lệch (rad)
  public angularVelocity: number = 0;  // Vận tốc góc (rad/s)
  public length: number;              // Chiều dài dây treo ảo (px)
  public gravity: number;             // Trọng lực
  public damping: number;             // Giảm chấn ma sát không khí

  constructor(
    length: number = 80,
    gravity: number = 1200,
    damping: number = 3.5
  ) {
    this.length = length;
    this.gravity = gravity;
    this.damping = damping;
  }

  /**
   * Cập nhật góc đung đưa theo lực quán tính chuột di chuyển
   * @param dt Thời gian delta-time
   * @param mouseAccelX Gia tốc di chuyển theo trục X của chuột
   */
  public update(dt: number, mouseAccelX: number = 0): number {
    // Phương trình vi phân con lắc: d^2(theta)/dt^2 = -(g/L)*sin(theta) - damping*v + external_force
    const restoringForce = -(this.gravity / this.length) * Math.sin(this.angle);
    const dampingForce = -this.damping * this.angularVelocity;
    const externalForce = -mouseAccelX * 0.008;

    const angularAcceleration = restoringForce + dampingForce + externalForce;

    this.angularVelocity += angularAcceleration * dt;
    this.angle += this.angularVelocity * dt;

    // Giới hạn góc nghiêng tối đa +- 75 độ
    const maxAngle = (75 * Math.PI) / 180;
    if (this.angle > maxAngle) {
      this.angle = maxAngle;
      this.angularVelocity = 0;
    } else if (this.angle < -maxAngle) {
      this.angle = -maxAngle;
      this.angularVelocity = 0;
    }

    return this.angle;
  }

  public reset(): void {
    this.angle = 0;
    this.angularVelocity = 0;
  }
}

// Các hàm Easing chất lượng cao cho hoạt hình hoạt họa
export const Easing = {
  easeOutBack: (x: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },

  easeInOutCubic: (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },

  easeOutElastic: (x: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  },
};
