export type SpriteKey =
  | "turn_front"
  | "turn_34"
  | "turn_side"
  | "turn_back34"
  | "turn_back"
  | "idle_wave"
  | "idle_back"
  | "walk_1"
  | "walk_2"
  | "walk_3"
  | "walk_4"
  | "chase_crouch"
  | "chase_run"
  | "chase_jump"
  | "chase_celebrate"
  | "sleep"
  | "dragged_dizzy"
  | "dragged_scared"
  | "alert_startled"
  | "alert_happy";

export class SpriteLoader {
  private static instance: SpriteLoader | null = null;
  private images: Map<SpriteKey, HTMLImageElement> = new Map();
  private isLoaded: boolean = false;

  private spriteFiles: Record<SpriteKey, string> = {
    turn_front: "/assets/sprites/turn_front.png",
    turn_34: "/assets/sprites/turn_34.png",
    turn_side: "/assets/sprites/turn_side.png",
    turn_back34: "/assets/sprites/turn_back34.png",
    turn_back: "/assets/sprites/turn_back.png",
    idle_wave: "/assets/sprites/idle_wave.png",
    idle_back: "/assets/sprites/idle_back.png",
    walk_1: "/assets/sprites/walk_1.png",
    walk_2: "/assets/sprites/walk_2.png",
    walk_3: "/assets/sprites/walk_3.png",
    walk_4: "/assets/sprites/walk_4.png",
    chase_crouch: "/assets/sprites/chase_crouch.png",
    chase_run: "/assets/sprites/chase_run.png",
    chase_jump: "/assets/sprites/chase_jump.png",
    chase_celebrate: "/assets/sprites/chase_celebrate.png",
    sleep: "/assets/sprites/sleep.png",
    dragged_dizzy: "/assets/sprites/dragged_dizzy.png",
    dragged_scared: "/assets/sprites/dragged_scared.png",
    alert_startled: "/assets/sprites/alert_startled.png",
    alert_happy: "/assets/sprites/alert_happy.png",
  };

  public static getInstance(): SpriteLoader {
    if (!SpriteLoader.instance) {
      SpriteLoader.instance = new SpriteLoader();
    }
    return SpriteLoader.instance;
  }

  constructor() {
    this.preloadAll();
  }

  private preloadAll(): void {
    let loadedCount = 0;
    const total = Object.keys(this.spriteFiles).length;

    for (const [key, path] of Object.entries(this.spriteFiles)) {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= total) {
          this.isLoaded = true;
          console.log("All Gugugaga official sprites preloaded successfully.");
        }
      };
      this.images.set(key as SpriteKey, img);
    }
  }

  public getSprite(key: SpriteKey): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  public get ready(): boolean {
    return this.isLoaded;
  }
}
