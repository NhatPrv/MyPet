import { invoke } from "@tauri-apps/api/core";
import { GameLoop } from "./engine/GameLoop.ts";
import { FpsCounter } from "./engine/FpsCounter.ts";
import { Gugugaga } from "./entities/Gugugaga.ts";
import { Butterfly } from "./entities/Butterfly.ts";
import { HitboxManager } from "./input/HitboxManager.ts";
import { DragController } from "./input/DragController.ts";
import { NotificationBubble } from "./ui/NotificationBubble.ts";

const canvas = document.getElementById("pet-canvas") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element #pet-canvas not found in DOM.");
}

const fpsCounter = new FpsCounter();
const pet = new Gugugaga();
const butterfly = new Butterfly();

// Khởi tạo quản lý tương tác và bong bóng thoại
const hitboxManager = new HitboxManager();
new DragController(pet, hitboxManager);
const notificationBubble = new NotificationBubble(pet, hitboxManager);

// Tự động thả bướm sau 4 giây đầu tiên
setTimeout(() => {
  butterfly.spawn();
}, 4000);

// Hàm gửi thông báo thử nghiệm
export async function sendTestNotification(): Promise<void> {
  try {
    await invoke("trigger_custom_notification", {
      title: "Gugugaga xin chào bạn! ✨",
      body: "Chúc bạn một ngày làm việc tràn đầy năng lượng trên Windows 11!",
      appName: "MyPet",
    });
  } catch {
    // Fallback nếu chạy trên nền web độc lập
    notificationBubble.enqueue({
      id: "mock-" + Date.now(),
      app_name: "Windows System",
      title: "Thông báo thử nghiệm 🔔",
      body: "Gugugaga đã nhận được tín hiệu thông báo mới!",
      timestamp: Date.now(),
    });
  }
}

// Phím tắt tương tác
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "b" || e.key === "B") {
    butterfly.spawn();
  } else if (e.key === "s" || e.key === "S") {
    pet.toggleSleep();
  } else if (e.key === "r" || e.key === "R") {
    pet.resetPosition();
  } else if (e.key === "n" || e.key === "N") {
    sendTestNotification();
  }
});

const gameLoop = new GameLoop(
  canvas,
  (dt: number) => {
    fpsCounter.update(dt);
    butterfly.update(dt);
    pet.update(dt, butterfly);
    notificationBubble.updatePosition();
  },
  (ctx: CanvasRenderingContext2D) => {
    butterfly.render(ctx);
    pet.render(ctx);
    fpsCounter.render(ctx);
  }
);

gameLoop.start();
console.log("MyPet Notification Bubble & Windows 11 Push Interceptor connected.");
