import { GameLoop } from "./engine/GameLoop.ts";
import { FpsCounter } from "./engine/FpsCounter.ts";
import { GugugagaRenderer, RenderState } from "./entities/GugugagaRenderer.ts";

const canvas = document.getElementById("pet-canvas") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element #pet-canvas not found in DOM.");
}

const fpsCounter = new FpsCounter();
const renderer = new GugugagaRenderer();

// Khởi tạo tọa độ Gugugaga ở sát thanh taskbar (cách đáy 60px)
const initialGroundY = window.innerHeight - 80;
const petState: RenderState = {
  x: window.innerWidth * 0.5,
  y: initialGroundY,
  vx: 0,
  vy: 0,
  isFacingRight: true,
  stateName: "IDLE",
  isGrounded: true,
  isDragged: false,
  mood: "happy",
};

const gameLoop = new GameLoop(
  canvas,
  (dt: number) => {
    fpsCounter.update(dt);
    renderer.update(dt, petState);
  },
  (ctx: CanvasRenderingContext2D) => {
    renderer.render(ctx, petState);
    fpsCounter.render(ctx);
  }
);

gameLoop.start();
console.log("MyPet 60 FPS Render Engine started successfully.");
