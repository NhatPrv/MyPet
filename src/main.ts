import { GameLoop } from "./engine/GameLoop.ts";
import { FpsCounter } from "./engine/FpsCounter.ts";
import { Gugugaga } from "./entities/Gugugaga.ts";
import { Butterfly } from "./entities/Butterfly.ts";
import { HitboxManager } from "./input/HitboxManager.ts";
import { DragController } from "./input/DragController.ts";

const canvas = document.getElementById("pet-canvas") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element #pet-canvas not found in DOM.");
}

const fpsCounter = new FpsCounter();
const pet = new Gugugaga();
const butterfly = new Butterfly();

// Khởi tạo hệ thống quản lý Hitbox và kéo thả chuột
const hitboxManager = new HitboxManager();
new DragController(pet, hitboxManager);

// Tự động thả bướm sau 4 giây đầu tiên
setTimeout(() => {
  butterfly.spawn();
}, 4000);

// Phím tắt tương tác nhanh
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "b" || e.key === "B") {
    butterfly.spawn();
  } else if (e.key === "s" || e.key === "S") {
    pet.toggleSleep();
  } else if (e.key === "r" || e.key === "R") {
    pet.resetPosition();
  }
});

const gameLoop = new GameLoop(
  canvas,
  (dt: number) => {
    fpsCounter.update(dt);
    butterfly.update(dt);
    pet.update(dt, butterfly);
  },
  (ctx: CanvasRenderingContext2D) => {
    butterfly.render(ctx);
    pet.render(ctx);
    fpsCounter.render(ctx);
  }
);

gameLoop.start();
console.log("MyPet Drag-and-Drop & Dynamic Click-Through Hitbox active.");
