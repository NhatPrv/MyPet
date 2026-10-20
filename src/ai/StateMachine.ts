export type StateType =
  | "IDLE"
  | "WALK"
  | "CHASE_BUTTERFLY"
  | "SLEEP"
  | "DRAGGED"
  | "FALLING"
  | "NOTIFY";

export interface StateContext {
  stateTimer: number;
  idleDuration: number;
  walkDuration: number;
  inactivityTimer: number;
  targetDirection: number; // 1: phải, -1: trái
}

export class StateMachine {
  public currentState: StateType = "IDLE";
  private context: StateContext;

  constructor() {
    this.context = {
      stateTimer: 0,
      idleDuration: 3 + Math.random() * 3,
      walkDuration: 4 + Math.random() * 3,
      inactivityTimer: 0,
      targetDirection: 1,
    };
  }

  public setState(newState: StateType): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    this.context.stateTimer = 0;

    if (newState === "IDLE") {
      this.context.idleDuration = 2.5 + Math.random() * 3.5;
    } else if (newState === "WALK") {
      this.context.walkDuration = 3.5 + Math.random() * 3.5;
      this.context.targetDirection = Math.random() > 0.5 ? 1 : -1;
    }
  }

  public registerUserActivity(): void {
    this.context.inactivityTimer = 0;
    if (this.currentState === "SLEEP") {
      this.setState("IDLE");
    }
  }

  public update(dt: number): void {
    this.context.stateTimer += dt;
    this.context.inactivityTimer += dt;

    // Tự động chuyển sang ngủ sau 90 giây không tương tác
    if (
      this.context.inactivityTimer > 90 &&
      this.currentState !== "SLEEP" &&
      this.currentState !== "DRAGGED" &&
      this.currentState !== "CHASE_BUTTERFLY" &&
      this.currentState !== "NOTIFY"
    ) {
      this.setState("SLEEP");
    }
  }

  public getContext(): StateContext {
    return this.context;
  }
}
