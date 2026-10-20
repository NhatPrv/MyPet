import { HitboxManager, HitboxRect } from "../input/HitboxManager.ts";
import { Gugugaga } from "../entities/Gugugaga.ts";
import { Butterfly } from "../entities/Butterfly.ts";
import { FpsCounter } from "../engine/FpsCounter.ts";

export interface ContextMenuCallbacks {
  onSpawnButterfly: () => void;
  onTestNotification: () => void;
  onToggleSleep: () => void;
  onToggleFps: () => void;
  onResetPosition: () => void;
  onQuit: () => void;
}

export class ContextMenu {
  private pet: Gugugaga;
  private hitboxManager: HitboxManager;
  private menuElement: HTMLElement | null = null;
  private overlayContainer: HTMLElement;
  private isVisible: boolean = false;
  private callbacks: ContextMenuCallbacks;

  constructor(
    pet: Gugugaga,
    _butterfly: Butterfly,
    _fpsCounter: FpsCounter,
    hitboxManager: HitboxManager,
    callbacks: ContextMenuCallbacks
  ) {
    this.pet = pet;
    this.hitboxManager = hitboxManager;
    this.callbacks = callbacks;

    const overlay = document.getElementById("ui-overlay");
    if (!overlay) {
      throw new Error("#ui-overlay element not found.");
    }
    this.overlayContainer = overlay;

    this.setupEventListeners();
    this.registerHitbox();
  }

  private registerHitbox(): void {
    this.hitboxManager.registerHitbox((): HitboxRect | null => {
      if (!this.isVisible || !this.menuElement) return null;
      const rect = this.menuElement.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
    });
  }

  private isOverPet(clientX: number, clientY: number): boolean {
    const halfW = this.pet.width / 2 + 10;
    const halfH = this.pet.height / 2 + 10;
    const dx = Math.abs(clientX - this.pet.position.x);
    const dy = Math.abs(clientY - this.pet.position.y);
    return dx <= halfW && dy <= halfH;
  }

  private setupEventListeners(): void {
    // Chuột phải vào nhân vật để mở Menu
    window.addEventListener("contextmenu", (e: MouseEvent) => {
      if (this.isOverPet(e.clientX, e.clientY)) {
        e.preventDefault();
        this.open(e.clientX, e.clientY);
      } else {
        this.close();
      }
    });

    // Nhấp chuột ra ngoài để đóng Menu
    window.addEventListener("pointerdown", (e: PointerEvent) => {
      if (!this.isVisible) return;
      if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
        this.close();
      }
    });
  }

  public open(x: number, y: number): void {
    if (!this.menuElement) {
      this.menuElement = document.createElement("div");
      this.menuElement.className = "context-menu";
      this.overlayContainer.appendChild(this.menuElement);

      this.menuElement.addEventListener("mouseenter", () => {
        this.hitboxManager.setIgnoreCursor(false);
      });
    }

    this.menuElement.innerHTML = `
      <div class="context-menu-item" data-action="butterfly">🦋 Thả Bướm (Spawn Butterfly)</div>
      <div class="context-menu-item" data-action="notify">🔔 Thử Thông Báo (Test Notification)</div>
      <div class="context-menu-item" data-action="sleep">💤 Cho Ngủ / Đánh Thức</div>
      <div class="context-menu-item" data-action="fps">📊 Bật / Tắt FPS (F3)</div>
      <div class="context-menu-item" data-action="reset">📍 Đặt Lại Vị Trí (Reset)</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="quit" style="color: #f87171;">❌ Thoát MyPet</div>
    `;

    // Gắn sự kiện cho các item
    this.menuElement.querySelectorAll(".context-menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = (item as HTMLElement).dataset.action;
        this.handleAction(action);
        this.close();
      });
    });

    // Căn tọa độ menu
    const menuWidth = 200;
    const menuHeight = 220;
    let posX = x + 10;
    let posY = y - 10;

    if (posX + menuWidth > window.innerWidth - 10) {
      posX = x - menuWidth - 10;
    }
    if (posY + menuHeight > window.innerHeight - 10) {
      posY = window.innerHeight - menuHeight - 10;
    }
    if (posY < 10) posY = 10;

    this.menuElement.style.left = `${posX}px`;
    this.menuElement.style.top = `${posY}px`;
    this.menuElement.style.display = "block";
    this.isVisible = true;

    this.hitboxManager.setIgnoreCursor(false);
  }

  public close(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    if (this.menuElement) {
      this.menuElement.style.display = "none";
    }
  }

  private handleAction(action?: string): void {
    switch (action) {
      case "butterfly":
        this.callbacks.onSpawnButterfly();
        break;
      case "notify":
        this.callbacks.onTestNotification();
        break;
      case "sleep":
        this.callbacks.onToggleSleep();
        break;
      case "fps":
        this.callbacks.onToggleFps();
        break;
      case "reset":
        this.callbacks.onResetPosition();
        break;
      case "quit":
        this.callbacks.onQuit();
        break;
    }
  }
}
