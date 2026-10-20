export type ParticleType = "dust" | "zzz" | "sparkle" | "heart" | "exclamation" | "sweat";

export interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // Thời gian sống tính bằng giây
  maxLife: number;
  size: number;
  color: string;
  type: ParticleType;
  text?: string;
  scale?: number;
}

export class ParticleSystem {
  private particles: ParticleConfig[] = [];

  public emitDust(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI;
      const speed = 20 + Math.random() * 40;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed * 0.5,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        size: 3 + Math.random() * 3,
        color: "rgba(226, 232, 240, 0.7)",
        type: "dust",
      });
    }
  }

  public emitZzz(x: number, y: number): void {
    const letters = ["z", "Z", "Zz"];
    const chosen = letters[Math.floor(Math.random() * letters.length)];
    this.particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      vx: 15 + Math.random() * 15,
      vy: -25 - Math.random() * 20,
      life: 1.8,
      maxLife: 1.8,
      size: 14 + Math.random() * 4,
      color: "rgba(147, 197, 253, 0.9)",
      type: "zzz",
      text: chosen,
    });
  }

  public emitSparkle(x: number, y: number): void {
    const colors = ["#facc15", "#fb923c", "#f43f5e", "#38bdf8", "#a855f7"];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: "sparkle",
      });
    }
  }

  public emitExclamation(x: number, y: number): void {
    // Dấu chấm than "!" giật mình nảy lên cao
    this.particles.push({
      x,
      y: y - 25,
      vx: (Math.random() - 0.5) * 10,
      vy: -90,
      life: 0.8,
      maxLife: 0.8,
      size: 26,
      color: "#ef4444",
      type: "exclamation",
      text: "!",
      scale: 1,
    });
  }

  public emitSweat(x: number, y: number): void {
    // Giọt mồ hôi anime 💧
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (i === 0 ? -22 : 22),
        y: y - 16,
        vx: (i === 0 ? -25 : 25),
        vy: -35,
        life: 0.7,
        maxLife: 0.7,
        size: 9,
        color: "#38bdf8",
        type: "sweat",
      });
    }
  }

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === "dust") {
        p.vx *= 0.92;
        p.vy += 60 * dt;
      } else if (p.type === "zzz") {
        p.x += Math.sin(p.life * 5) * 0.8;
      } else if (p.type === "sparkle") {
        p.vx *= 0.95;
        p.vy *= 0.95;
      } else if (p.type === "exclamation") {
        p.vy *= 0.88; // Giảm dần tốc độ bay lên
      } else if (p.type === "sweat") {
        p.vy += 220 * dt; // Trọng lực rơi giọt nước
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      if (p.type === "dust" || p.type === "sparkle") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "zzz" && p.text) {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${Math.round(p.size)}px 'Segoe UI', cursive, sans-serif`;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === "exclamation" && p.text) {
        // Vẽ dấu chấm than có viền trắng nổi bật
        ctx.save();
        ctx.font = `900 ${Math.round(p.size)}px 'Segoe UI', Impact, sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      } else if (p.type === "sweat") {
        // Vẽ giọt mồ hôi hình giọt nước
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.quadraticCurveTo(p.x + p.size * 0.7, p.y, p.x, p.y + p.size * 0.7);
        ctx.quadraticCurveTo(p.x - p.size * 0.7, p.y, p.x, p.y - p.size);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  public clear(): void {
    this.particles = [];
  }
}
