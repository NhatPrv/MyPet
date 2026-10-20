import { FacingController, ParallaxOffset } from "../engine/Transform25D.ts";
import { FacialController } from "./FacialController.ts";
import { Spring2D } from "../engine/SpringPhysics.ts";

export interface RigPose {
  bodyOffsetY: number;
  bodyRotation: number;
  headOffsetY: number;
  headRotation: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftLegAngle: number;
  rightLegAngle: number;
  leftLegOffsetY: number;
  rightLegOffsetY: number;
  scaleX: number;
  scaleY: number;
}

export class GugugagaRig {
  public facing: FacingController;
  public facial: FacialController;
  public scaleSpring: Spring2D;

  constructor() {
    this.facing = new FacingController();
    this.facial = new FacialController();
    // Lò xo bảo toàn thể tích và tạo hiệu ứng nhún đàn hồi (Squash & Stretch)
    this.scaleSpring = new Spring2D(1, 1, 300, 18);
  }

  public update(dt: number): void {
    this.facing.update(dt);
    this.facial.update(dt);
    this.scaleSpring.update(dt);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    pose: RigPose,
    isStartled: boolean = false
  ): void {
    const parallax = this.facing.getParallax();
    const curScale = { x: this.scaleSpring.x.value * pose.scaleX, y: this.scaleSpring.y.value * pose.scaleY };

    ctx.save();

    // Áp dụng độ giãn nén đàn hồi tổng thể
    ctx.scale(curScale.x * parallax.depthScale, curScale.y);

    // 1. Vẽ bóng đổ (Shadow) dưới chân
    this.drawShadow(ctx);

    // 2. Sắp lớp theo chiều sâu 2.5D: Cánh phía sau (Back Arm)
    if (parallax.isBackArmBehind) {
      if (parallax.facingDir.includes("RIGHT")) {
        this.drawArm(ctx, pose.leftArmAngle, -1, parallax.backLimbScale, true);
      } else {
        this.drawArm(ctx, pose.rightArmAngle, 1, parallax.backLimbScale, true);
      }
    }

    // 3. Đuôi chim cánh cụt phía sau (Tail)
    this.drawTail(ctx, parallax);

    // 4. Hai chân chim cánh cụt màu vàng (Legs / Feet)
    this.drawLegs(ctx, pose, parallax);

    // 5. Thân chim cánh cụt (Torso Mesh & Bụng trắng in chữ "GuGuGaGa")
    ctx.save();
    ctx.translate(0, pose.bodyOffsetY);
    ctx.rotate(pose.bodyRotation);

    this.drawTorso(ctx, parallax);

    // 6. Đầu chim cánh cụt & Mũ trùm đầu (Head, Penguin Hood, Face)
    ctx.save();
    ctx.translate(0, -32 + pose.headOffsetY);
    ctx.rotate(pose.headRotation);

    this.drawHead(ctx, parallax, isStartled);

    ctx.restore(); // Hết phần Đầu

    ctx.restore(); // Hết phần Thân

    // 7. Cánh phía trước (Front Arm)
    if (parallax.isBackArmBehind) {
      if (parallax.facingDir.includes("RIGHT")) {
        this.drawArm(ctx, pose.rightArmAngle, 1, parallax.frontLimbScale, false);
      } else {
        this.drawArm(ctx, pose.leftArmAngle, -1, parallax.frontLimbScale, false);
      }
    } else {
      // Nhìn chính diện: Vẽ cả 2 cánh hai bên
      this.drawArm(ctx, pose.leftArmAngle, -1, 1, false);
      this.drawArm(ctx, pose.rightArmAngle, 1, 1, false);
    }

    ctx.restore();
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 46, 38, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawTail(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    const tailShiftX = -parallax.featureX * 0.45;
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.moveTo(tailShiftX - 12, 28);
    ctx.quadraticCurveTo(tailShiftX, 42, tailShiftX + 12, 28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawTorso(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();

    // Vỏ thân chim cánh cụt nhung đen than
    const torsoGrad = ctx.createLinearGradient(0, -20, 0, 45);
    torsoGrad.addColorStop(0, "#292524");
    torsoGrad.addColorStop(0.5, "#1c1917");
    torsoGrad.addColorStop(1, "#0c0a09");

    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.ellipse(0, 10, 40, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bụng trắng chim cánh cụt hình bầu dục lớn
    const bellyShiftX = parallax.featureX * 0.6;
    const bellyGrad = ctx.createRadialGradient(bellyShiftX, 8, 4, bellyShiftX, 12, 34);
    bellyGrad.addColorStop(0, "#ffffff");
    bellyGrad.addColorStop(0.85, "#f8fafc");
    bellyGrad.addColorStop(1, "#e2e8f0");

    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(bellyShiftX, 12, 26, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dòng chữ thương hiệu "GuGuGaGa" màu hồng dâu trên bụng
    ctx.save();
    ctx.font = "900 11px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f472b6";
    ctx.fillText("GuGuGaGa", bellyShiftX, 16);
    ctx.restore();

    ctx.restore();
  }

  private drawHead(
    ctx: CanvasRenderingContext2D,
    parallax: ParallaxOffset,
    isStartled: boolean
  ): void {
    ctx.save();

    // 1. Mũ trùm đầu chim cánh cụt nhung đen than (Penguin Hood)
    const hoodGrad = ctx.createRadialGradient(-6, -6, 10, 0, 0, 48);
    hoodGrad.addColorStop(0, "#292524");
    hoodGrad.addColorStop(0.7, "#1c1917");
    hoodGrad.addColorStop(1, "#0c0a09");

    ctx.fillStyle = hoodGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hai mắt chim cánh cụt tròn xoe trên đỉnh mũ
    this.drawPenguinHoodEyes(ctx, parallax);

    // 3. Mỏ chim cánh cụt màu vàng cam nổi khối trên trán
    this.drawPenguinBeak(ctx, parallax);

    // 4. Mái tóc anime đen ngắn ngang vai (Bob Hair Cut)
    this.drawAnimeHairBack(ctx, parallax);

    // 5. Khuôn mặt tròn bầu bĩnh bé gái màu da đào
    this.drawAnimeFaceSkin(ctx, parallax);

    // 6. Mái tóc bằng (Bangs) và lọn tóc ôm má
    this.drawAnimeHairFront(ctx, parallax);

    // 7. Kẹp tóc bạc đôi bên trái
    this.drawHairPin(ctx, parallax);

    // 8. Ngũ quan: Mắt anime long lanh, Má hồng, Miệng
    this.drawFacialFeatures(ctx, parallax, isStartled);

    // 9. Vòng cổ choker đen với khoen tròn bạc
    this.drawChoker(ctx, parallax);

    ctx.restore();
  }

  private drawPenguinHoodEyes(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    const eyeY = -28 + parallax.featureY * 0.4;
    const eyeSpacing = 16;
    const eyeShiftX = parallax.featureX * 0.5;

    // Mắt trái mũ
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-eyeSpacing + eyeShiftX, eyeY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(-eyeSpacing + eyeShiftX, eyeY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Mắt phải mũ
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(eyeSpacing + eyeShiftX, eyeY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(eyeSpacing + eyeShiftX, eyeY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPenguinBeak(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    const beakX = parallax.featureX * 0.7;
    const beakY = -22 + parallax.featureY * 0.5;

    // Mỏ hình tam giác vát tròn màu vàng cam nổi khối
    const beakGrad = ctx.createLinearGradient(beakX, beakY - 6, beakX, beakY + 10);
    beakGrad.addColorStop(0, "#fde047");
    beakGrad.addColorStop(0.5, "#facc15");
    beakGrad.addColorStop(1, "#d97706");

    ctx.fillStyle = beakGrad;
    ctx.beginPath();
    ctx.moveTo(beakX - 13, beakY - 4);
    ctx.quadraticCurveTo(beakX, beakY - 7, beakX + 13, beakY - 4);
    ctx.quadraticCurveTo(beakX + 10, beakY + 9, beakX, beakY + 11);
    ctx.quadraticCurveTo(beakX - 10, beakY + 9, beakX - 13, beakY - 4);
    ctx.closePath();
    ctx.fill();

    // Đường rãnh giữa mỏ
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(beakX - 8, beakY + 2);
    ctx.quadraticCurveTo(beakX, beakY + 4, beakX + 8, beakY + 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawAnimeHairBack(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    ctx.fillStyle = "#262626";
    const hairShiftX = parallax.featureX * 0.4;

    // Tóc sau ôm lấy mặt
    ctx.beginPath();
    ctx.arc(hairShiftX, 4, 38, 0.2, Math.PI - 0.2, false);
    ctx.fill();
    ctx.restore();
  }

  private drawAnimeFaceSkin(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    const faceX = parallax.featureX * 0.6;
    const faceY = 4 + parallax.featureY * 0.5;

    // Khuôn mặt bầu bĩnh màu da đào hồng hào
    const faceGrad = ctx.createRadialGradient(faceX, faceY - 4, 6, faceX, faceY + 6, 32);
    faceGrad.addColorStop(0, "#fff7ed");
    faceGrad.addColorStop(0.7, "#ffedd5");
    faceGrad.addColorStop(1, "#fed7aa");

    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(faceX, faceY, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawAnimeHairFront(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    const hairX = parallax.featureX * 0.65;
    const hairY = -8 + parallax.featureY * 0.4;
    ctx.fillStyle = "#262626";

    // Mái bằng tỉa đẹp ôm trán
    ctx.beginPath();
    ctx.moveTo(hairX - 28, hairY);
    ctx.quadraticCurveTo(hairX - 15, hairY + 14, hairX - 8, hairY + 6);
    ctx.quadraticCurveTo(hairX, hairY + 15, hairX + 8, hairY + 6);
    ctx.quadraticCurveTo(hairX + 16, hairY + 14, hairX + 28, hairY);
    ctx.quadraticCurveTo(hairX + 18, hairY - 14, hairX, hairY - 14);
    ctx.quadraticCurveTo(hairX - 18, hairY - 14, hairX - 28, hairY);
    ctx.closePath();
    ctx.fill();

    // Hai lọn tóc mai dài hai bên má
    ctx.beginPath();
    ctx.ellipse(hairX - 29, hairY + 12, 5, 14, 0.2, 0, Math.PI * 2);
    ctx.ellipse(hairX + 29, hairY + 12, 5, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawHairPin(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    const pinX = -24 + parallax.featureX * 0.6;
    const pinY = -8 + parallax.featureY * 0.4;

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    // Hai thanh kẹp tóc song song màu bạc
    ctx.beginPath();
    ctx.moveTo(pinX - 4, pinY - 4);
    ctx.lineTo(pinX + 4, pinY + 3);
    ctx.moveTo(pinX - 4, pinY);
    ctx.lineTo(pinX + 4, pinY + 7);
    ctx.stroke();

    ctx.restore();
  }

  private drawFacialFeatures(
    ctx: CanvasRenderingContext2D,
    parallax: ParallaxOffset,
    isStartled: boolean
  ): void {
    ctx.save();
    const cx = parallax.featureX * 0.65;
    const cy = 4 + parallax.featureY * 0.5;

    // 1. Má hồng búp bê
    ctx.fillStyle = "rgba(251, 113, 133, 0.45)";
    ctx.beginPath();
    ctx.ellipse(cx - 19, cy + 6, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 19, cy + 6, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hai mắt anime to tròn long lanh
    const eyeSpacing = 13.5;
    if (isStartled || this.facial.expression === "STARTLED") {
      this.drawShockedAnimeEye(ctx, cx - eyeSpacing, cy);
      this.drawShockedAnimeEye(ctx, cx + eyeSpacing, cy);
    } else if (this.facial.isEyesClosed) {
      this.drawClosedAnimeEye(ctx, cx - eyeSpacing, cy);
      this.drawClosedAnimeEye(ctx, cx + eyeSpacing, cy);
    } else if (this.facial.expression === "EXCITED_STAR_EYES") {
      this.drawStarAnimeEye(ctx, cx - eyeSpacing, cy);
      this.drawStarAnimeEye(ctx, cx + eyeSpacing, cy);
    } else {
      this.drawNormalAnimeEye(ctx, cx - eyeSpacing, cy);
      this.drawNormalAnimeEye(ctx, cx + eyeSpacing, cy);
    }

    // 3. Miệng chibi dễ thương
    this.drawMouth(ctx, cx, cy, isStartled);

    ctx.restore();
  }

  private drawNormalAnimeEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();

    // Tròng mắt anime màu xám than gradient
    const eyeGrad = ctx.createLinearGradient(x, y - 9, x, y + 9);
    eyeGrad.addColorStop(0, "#475569");
    eyeGrad.addColorStop(0.5, "#1e293b");
    eyeGrad.addColorStop(1, "#020617");

    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, 7.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Con ngươi chuyển động theo mục tiêu (Eye Tracking)
    const px = x + this.facial.pupilCurrentX * 2.5;
    const py = y + this.facial.pupilCurrentY * 2.5;

    // Đốm sáng phản quang chính lớn màu trắng
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(px - 2.5, py - 3.5, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Đốm sáng phụ nhỏ góc dưới
    ctx.beginPath();
    ctx.arc(px + 2.8, py + 3, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Đường viền mi mắt trên cong mềm mại
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y - 3, 8.5, Math.PI + 0.3, -0.2, false);
    ctx.stroke();

    ctx.restore();
  }

  private drawClosedAnimeEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(x, y + 2, 7.5, 0.25, Math.PI - 0.25, false);
    ctx.stroke();
    ctx.restore();
  }

  private drawShockedAnimeEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    // Mắt mở to tròn trắng dã
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Con ngươi chấm nhỏ xíu
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawStarAnimeEye(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save();
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = cx + Math.cos(outerAngle) * 9.5;
      const oy = cy + Math.sin(outerAngle) * 9.5;
      const ix = cx + Math.cos(innerAngle) * 4.2;
      const iy = cy + Math.sin(innerAngle) * 4.2;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawMouth(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    isStartled: boolean
  ): void {
    ctx.save();
    ctx.fillStyle = "#f43f5e";
    ctx.strokeStyle = "#881337";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";

    if (isStartled) {
      // Miệng giật mình há hốc chữ O rung
      ctx.beginPath();
      ctx.ellipse(cx, cy + 14, 5.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.facial.expression === "HAPPY" || this.facial.expression === "EXCITED_STAR_EYES") {
      // Miệng cười lớn để lộ lưỡi hồng
      ctx.beginPath();
      ctx.arc(cx, cy + 11, 7.5, 0, Math.PI, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fda4af";
      ctx.beginPath();
      ctx.arc(cx, cy + 15, 4.5, Math.PI, 0, false);
      ctx.fill();
    } else {
      // Miệng cười chúm chím búp bê như ảnh gốc
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 6, 0.2, Math.PI - 0.2, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fda4af";
      ctx.beginPath();
      ctx.arc(cx, cy + 13, 3.5, Math.PI, 0, false);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawChoker(ctx: CanvasRenderingContext2D, parallax: ParallaxOffset): void {
    ctx.save();
    const chX = parallax.featureX * 0.55;
    const chY = 24 + parallax.featureY * 0.4;

    // Dải choker đen
    ctx.strokeStyle = "#171717";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(chX - 16, chY);
    ctx.quadraticCurveTo(chX, chY + 4, chX + 16, chY);
    ctx.stroke();

    // Khuyên tròn kim loại bạc ở chính giữa
    ctx.strokeStyle = "#94a3b8";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(chX, chY + 2.5, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawArm(
    ctx: CanvasRenderingContext2D,
    angle: number,
    side: number, // -1: bên trái, 1: bên phải
    scale: number,
    _isBackArm: boolean
  ): void {
    ctx.save();
    const pivotX = side * 30;
    const pivotY = -6;

    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Cánh chim cánh cụt màu đen than mềm mại
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.moveTo(-6 * side, 0);
    ctx.quadraticCurveTo(side * 18, 12, side * 14, 28);
    ctx.quadraticCurveTo(side * 8, 34, 0, 32);
    ctx.quadraticCurveTo(-side * 8, 20, -6 * side, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawLegs(
    ctx: CanvasRenderingContext2D,
    pose: RigPose,
    parallax: ParallaxOffset
  ): void {
    // Chân trái vàng
    this.drawSingleFoot(
      ctx,
      -18 + parallax.featureX * 0.3,
      34 + pose.leftLegOffsetY,
      pose.leftLegAngle
    );

    // Chân phải vàng
    this.drawSingleFoot(
      ctx,
      18 + parallax.featureX * 0.3,
      34 + pose.rightLegOffsetY,
      pose.rightLegAngle
    );
  }

  private drawSingleFoot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Bàn chân màng chim cánh cụt màu vàng cam
    const footGrad = ctx.createLinearGradient(0, -6, 0, 14);
    footGrad.addColorStop(0, "#fde047");
    footGrad.addColorStop(0.5, "#f59e0b");
    footGrad.addColorStop(1, "#d97706");

    ctx.fillStyle = footGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rãnh ngón chân múp míp
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-5, 10);
    ctx.moveTo(5, 0);
    ctx.lineTo(5, 10);
    ctx.stroke();

    ctx.restore();
  }
}
