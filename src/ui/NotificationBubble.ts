import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Gugugaga } from "../entities/Gugugaga.ts";
import { HitboxManager, HitboxRect } from "../input/HitboxManager.ts";

export interface NotificationData {
  id: string;
  app_name: string;
  title: string;
  body: string;
  timestamp: number;
}

export class NotificationBubble {
  private pet: Gugugaga;
  private hitboxManager: HitboxManager;
  private overlayContainer: HTMLElement;
  private bubbleElement: HTMLElement | null = null;

  private queue: NotificationData[] = [];
  private currentNotif: NotificationData | null = null;
  private displayTimer: number | null = null;
  private unlistenFn: UnlistenFn | null = null;

  constructor(pet: Gugugaga, hitboxManager: HitboxManager) {
    this.pet = pet;
    this.hitboxManager = hitboxManager;

    const overlay = document.getElementById("ui-overlay");
    if (!overlay) {
      throw new Error("#ui-overlay not found.");
    }
    this.overlayContainer = overlay;

    this.initTauriListener();
    this.registerHitbox();
  }

  private registerHitbox(): void {
    this.hitboxManager.registerHitbox((): HitboxRect | null => {
      if (!this.bubbleElement || !this.currentNotif) return null;
      const rect = this.bubbleElement.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
    });
  }

  private async initTauriListener(): Promise<void> {
    try {
      this.unlistenFn = await listen<NotificationData>(
        "system-notification",
        (event) => {
          this.enqueue(event.payload);
        }
      );
      console.log("Notification listener connected to Tauri event bridge.");
    } catch {
      console.debug("Running in standalone web mode or Tauri event unavailable.");
    }
  }

  public enqueue(notif: NotificationData): void {
    this.queue.push(notif);
    if (!this.currentNotif) {
      this.showNext();
    }
  }

  private showNext(): void {
    if (this.queue.length === 0) {
      this.hide();
      return;
    }

    this.currentNotif = this.queue.shift() || null;
    if (!this.currentNotif) return;

    // Đánh thức và kích hoạt trạng thái thông báo của Gugugaga
    this.pet.wakeUp();
    this.pet.stateMachine.setState("NOTIFY");

    this.renderBubble(this.currentNotif);

    // Thời gian hiển thị dựa trên độ dài nội dung (tối thiểu 6s, tối đa 10s)
    const textLen = (this.currentNotif.title + this.currentNotif.body).length;
    const duration = Math.min(10000, Math.max(6000, textLen * 90));

    if (this.displayTimer) {
      clearTimeout(this.displayTimer);
    }
    this.displayTimer = window.setTimeout(() => {
      this.showNext();
    }, duration);
  }

  private renderBubble(notif: NotificationData): void {
    if (!this.bubbleElement) {
      this.bubbleElement = document.createElement("div");
      this.bubbleElement.className = "speech-bubble";
      this.overlayContainer.appendChild(this.bubbleElement);

      this.bubbleElement.addEventListener("mouseenter", () => {
        this.hitboxManager.setIgnoreCursor(false);
      });
    }

    this.bubbleElement.innerHTML = `
      <div class="bubble-header">
        <span class="bubble-app">${this.escapeHtml(notif.app_name)}</span>
        <button class="bubble-close" title="Đóng">&times;</button>
      </div>
      <div class="bubble-title">${this.escapeHtml(notif.title)}</div>
      <div class="bubble-body">${this.escapeHtml(notif.body)}</div>
      <div class="bubble-arrow"></div>
    `;

    const closeBtn = this.bubbleElement.querySelector(".bubble-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showNext();
      });
    }

    this.updatePosition();
    this.bubbleElement.classList.remove("bubble-hide");
    this.bubbleElement.classList.add("bubble-show");
  }

  public updatePosition(): void {
    if (!this.bubbleElement || !this.currentNotif) return;

    const bubbleWidth = 280;
    const petX = this.pet.position.x;
    const petY = this.pet.position.y;

    // Căn giữa theo đầu Gugugaga
    let posX = petX - bubbleWidth / 2;
    let posY = petY - this.pet.height - 75;

    // Kẹp biên màn hình
    const padding = 20;
    if (posX < padding) posX = padding;
    if (posX + bubbleWidth > window.innerWidth - padding) {
      posX = window.innerWidth - bubbleWidth - padding;
    }
    if (posY < padding) posY = padding;

    this.bubbleElement.style.left = `${posX}px`;
    this.bubbleElement.style.top = `${posY}px`;

    // Cập nhật vị trí mũi tên trỏ vào đỉnh đầu Gugugaga
    const arrow = this.bubbleElement.querySelector(".bubble-arrow") as HTMLElement;
    if (arrow) {
      const arrowRelativeX = petX - posX;
      const clampedArrowX = Math.max(20, Math.min(bubbleWidth - 20, arrowRelativeX));
      arrow.style.left = `${clampedArrowX}px`;
    }
  }

  public hide(): void {
    this.currentNotif = null;
    if (this.displayTimer) {
      clearTimeout(this.displayTimer);
      this.displayTimer = null;
    }
    if (this.bubbleElement) {
      this.bubbleElement.classList.remove("bubble-show");
      this.bubbleElement.classList.add("bubble-hide");
    }
    if (this.pet.currentState === "NOTIFY") {
      this.pet.stateMachine.setState("IDLE");
    }
  }

  private escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  public destroy(): void {
    if (this.unlistenFn) {
      this.unlistenFn();
    }
  }
}
