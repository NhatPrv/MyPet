export type StateType =
  | "IDLE"
  | "CHASE_BUTTERFLY"
  | "SLEEP"
  | "DRAGGED"
  | "FALLING"
  | "NOTIFY";

export interface StateContext {
  stateTimer: number;
  idleDuration: number;
  inactivityTimer: number;
}

export class StateMachine {
  public currentState: StateType = "IDLE";
  private context: StateContext;

  constructor() {
    this.context = {
      stateTimer: 0,
      idleDuration: 3 + Math.random() * 3,
      inactivityTimer: 0,
    };
  }

  public setState(newState: StateType): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    this.context.stateTimer = 0;

    if (newState === "IDLE") {
      this.context.idleDuration = 3 + Math.random() * 4;
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
