import { GameLoop } from "./engine/GameLoop.ts";
import { FpsCounter } from "./engine/FpsCounter.ts";
import { Gugugaga } from "./entities/Gugugaga.ts";
import { Butterfly } from "./entities/Butterfly.ts";

const canvas = document.getElementById("pet-canvas") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element #pet-canvas not found in DOM.");
}

const fpsCounter = new FpsCounter();
const pet = new Gugugaga();
const butterfly = new Butterfly();

// Tự động thả bướm sau 4 giây đầu tiên
setTimeout(() => {
  butterfly.spawn();
}, 4000);

// Phím tắt debug: B để thả bướm, S để ngủ/thức
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "b" || e.key === "B") {
    butterfly.spawn();
  } else if (e.key === "s" || e.key === "S") {
    pet.toggleSleep();
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
console.log("MyPet Gugugaga FSM & Butterfly AI Engine active.");
