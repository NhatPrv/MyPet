/**
 * SpriteAnimator.ts
 * Hệ thống animation frame-by-frame sử dụng mảng file PNG riêng lẻ.
 * Mỗi AnimDef định nghĩa danh sách frame (path ảnh) + timing + playmode.
 * Renderer đọc currentImage và currentMeta để vẽ.
 */

export type AnimPlayMode = "loop" | "once" | "pingpong";

export interface FrameMeta {
  /** Scale X nhân thêm (1.0 = bình thường, dùng cho squash-stretch) */
  scaleX?: number;
  /** Scale Y nhân thêm */
  scaleY?: number;
  /** Offset Y thêm vào vị trí render (pixel, + = xuống thấp) */
  offsetY?: number;
  /** Offset X thêm vào vị trí render */
  offsetX?: number;
  /** Góc xoay thêm (radian) */
  rotation?: number;
}

export interface FrameDef {
  /** Đường dẫn file ảnh (relative /assets/sprites/...) */
  src: string;
  /** Thời gian giữ frame (giây). Ghi đè fps mặc định của AnimDef */
  duration?: number;
  /** Metadata biến đổi cho frame này */
  meta?: FrameMeta;
}

export interface AnimDef {
  name: string;
  frames: FrameDef[];
  /** FPS mặc định nếu frame không có duration riêng */
  fps: number;
  mode: AnimPlayMode;
}

// ============================================================
//  TOÀN BỘ ĐỊNH NGHĨA ANIMATION CLIPS CHO GUGUGAGA
// ============================================================
export const GUGA_ANIMS: AnimDef[] = [
  // ── IDLE (thở + lắc nhẹ) ──
  {
    name: "idle",
    frames: [
      { src: "/assets/sprites/turn_front.png", duration: 0.55, meta: { scaleY: 1.0 } },
      { src: "/assets/sprites/idle_wave.png", duration: 0.55, meta: { scaleY: 1.0 } },
      { src: "/assets/sprites/turn_front.png", duration: 0.55, meta: { scaleY: 1.0 } },
      { src: "/assets/sprites/idle_wave.png", duration: 0.55, meta: { scaleY: 1.0 } },
      { src: "/assets/sprites/turn_front.png", duration: 0.7 },
    ],
    fps: 2,
    mode: "loop",
  },

  // ── IDLE WAVE (vẫy tay) ──
  {
    name: "idle_wave",
    frames: [
      { src: "/assets/sprites/turn_front.png", duration: 0.1 },
      { src: "/assets/sprites/idle_wave.png", duration: 0.18 },
      { src: "/assets/sprites/turn_front.png", duration: 0.18 },
      { src: "/assets/sprites/idle_wave.png", duration: 0.15 },
      { src: "/assets/sprites/turn_front.png", duration: 0.18 },
      { src: "/assets/sprites/idle_wave.png", duration: 0.18 },
      { src: "/assets/sprites/turn_front.png", duration: 0.12 },
    ],
    fps: 6,
    mode: "loop",
  },

  // ── WALK (chu kỳ bộ 4 frame liên tục) ──
  {
    name: "walk",
    frames: [
      { src: "/assets/sprites/walk_1.png", duration: 0.12, meta: { offsetY: 0 } },
      { src: "/assets/sprites/walk_2.png", duration: 0.12, meta: { offsetY: -4, scaleX: 1.0, scaleY: 1.02 } },
      { src: "/assets/sprites/walk_3.png", duration: 0.12, meta: { offsetY: 0 } },
      { src: "/assets/sprites/walk_4.png", duration: 0.12, meta: { offsetY: -4, scaleX: 1.0, scaleY: 1.02 } },
    ],
    fps: 8,
    mode: "loop",
  },

  // ── WALK FAST (rượt bướm - sprint) ──
  {
    name: "walk_fast",
    frames: [
      { src: "/assets/sprites/walk_1.png", duration: 0.07, meta: { scaleX: 1.05, scaleY: 0.97 } },
      { src: "/assets/sprites/walk_2.png", duration: 0.07, meta: { offsetY: -6, scaleY: 1.04 } },
      { src: "/assets/sprites/walk_3.png", duration: 0.07, meta: { scaleX: 1.05, scaleY: 0.97 } },
      { src: "/assets/sprites/walk_4.png", duration: 0.07, meta: { offsetY: -6, scaleY: 1.04 } },
    ],
    fps: 14,
    mode: "loop",
  },

  // ── SLEEP (thở chậm) ──
  {
    name: "sleep",
    frames: [
      { src: "/assets/sprites/sleep.png", duration: 1.2, meta: { scaleY: 1.0 } },
      { src: "/assets/sprites/sleep.png", duration: 1.2, meta: { scaleY: 1.03, offsetY: 1 } },
    ],
    fps: 1,
    mode: "pingpong",
  },

  // ── DRAGGED (bị nhấc bổng) ──
  {
    name: "dragged",
    frames: [
      { src: "/assets/sprites/dragged_scared.png", duration: 0.18 },
      { src: "/assets/sprites/dragged_dizzy.png", duration: 0.18 },
    ],
    fps: 5,
    mode: "loop",
  },

  // ── DRAGGED FAST (quay vòng) ──
  {
    name: "dragged_fast",
    frames: [
      { src: "/assets/sprites/dragged_scared.png", duration: 0.09 },
      { src: "/assets/sprites/dragged_dizzy.png", duration: 0.09 },
      { src: "/assets/sprites/dragged_scared.png", duration: 0.09, meta: { scaleX: -1 } },
      { src: "/assets/sprites/dragged_dizzy.png", duration: 0.09, meta: { scaleX: -1 } },
    ],
    fps: 10,
    mode: "loop",
  },

  // ── ALERT / STARTLED (giật mình) ──
  {
    name: "startled",
    frames: [
      { src: "/assets/sprites/alert_startled.png", duration: 0.08, meta: { offsetY: -6, scaleY: 1.08 } },
      { src: "/assets/sprites/alert_startled.png", duration: 0.08, meta: { offsetY: 2, scaleY: 0.94 } },
      { src: "/assets/sprites/alert_startled.png", duration: 0.1, meta: { offsetY: -3, scaleY: 1.04 } },
      { src: "/assets/sprites/alert_startled.png", duration: 0.1, meta: { offsetY: 0, scaleY: 1.0 } },
      { src: "/assets/sprites/alert_startled.png", duration: 0.18 },
    ],
    fps: 8,
    mode: "once",
  },

  // ── NOTIFY / ALERT HAPPY (nhận thông báo) ──
  {
    name: "notify",
    frames: [
      { src: "/assets/sprites/alert_happy.png", duration: 0.1, meta: { offsetY: -5, scaleY: 1.06 } },
      { src: "/assets/sprites/alert_happy.png", duration: 0.1, meta: { offsetY: 2, scaleY: 0.95 } },
      { src: "/assets/sprites/alert_happy.png", duration: 0.12, meta: { offsetY: -2, scaleY: 1.02 } },
      { src: "/assets/sprites/alert_happy.png", duration: 0.14 },
      { src: "/assets/sprites/idle_wave.png", duration: 0.18 },
      { src: "/assets/sprites/alert_happy.png", duration: 0.18 },
      { src: "/assets/sprites/idle_wave.png", duration: 0.18 },
      { src: "/assets/sprites/turn_front.png", duration: 0.2 },
    ],
    fps: 6,
    mode: "loop",
  },

  // ── CHASE CROUCH (chuẩn bị nhảy) ──
  {
    name: "chase_crouch",
    frames: [
      { src: "/assets/sprites/chase_crouch.png", duration: 0.14, meta: { scaleY: 0.92, offsetY: 4 } },
      { src: "/assets/sprites/chase_crouch.png", duration: 0.12, meta: { scaleY: 0.96, offsetY: 2 } },
      { src: "/assets/sprites/chase_crouch.png", duration: 0.14, meta: { scaleY: 0.92, offsetY: 4 } },
    ],
    fps: 7,
    mode: "loop",
  },

  // ── CHASE RUN (chạy nhanh) ──
  {
    name: "chase_run",
    frames: [
      { src: "/assets/sprites/walk_1.png", duration: 0.06, meta: { scaleX: 1.06, scaleY: 0.96 } },
      { src: "/assets/sprites/chase_run.png", duration: 0.06, meta: { offsetY: -7, scaleY: 1.06 } },
      { src: "/assets/sprites/walk_3.png", duration: 0.06, meta: { scaleX: 1.06, scaleY: 0.96 } },
      { src: "/assets/sprites/chase_run.png", duration: 0.06, meta: { offsetY: -7, scaleY: 1.06 } },
    ],
    fps: 16,
    mode: "loop",
  },

  // ── CHASE POUNCE / JUMP ──
  {
    name: "chase_jump",
    frames: [
      { src: "/assets/sprites/chase_crouch.png", duration: 0.06, meta: { scaleY: 0.88, offsetY: 5 } },
      { src: "/assets/sprites/chase_jump.png", duration: 0.1, meta: { offsetY: -12, scaleY: 1.1 } },
      { src: "/assets/sprites/chase_jump.png", duration: 0.12, meta: { offsetY: -8, scaleY: 1.06 } },
      { src: "/assets/sprites/chase_jump.png", duration: 0.14, meta: { offsetY: -2, scaleY: 1.0 } },
    ],
    fps: 8,
    mode: "once",
  },

  // ── CHASE CELEBRATE (mừng bắt được) ──
  {
    name: "chase_celebrate",
    frames: [
      { src: "/assets/sprites/chase_celebrate.png", duration: 0.14, meta: { offsetY: -6, scaleY: 1.06 } },
      { src: "/assets/sprites/idle_wave.png", duration: 0.14 },
      { src: "/assets/sprites/chase_celebrate.png", duration: 0.14, meta: { offsetY: -4, scaleY: 1.03 } },
      { src: "/assets/sprites/idle_wave.png", duration: 0.14 },
      { src: "/assets/sprites/chase_celebrate.png", duration: 0.16 },
    ],
    fps: 7,
    mode: "loop",
  },

  // ── TURN FRONT (nhìn thẳng - trạng thái mặc định) ──
  {
    name: "turn_front",
    frames: [
      { src: "/assets/sprites/turn_front.png", duration: 0.5 },
    ],
    fps: 2,
    mode: "loop",
  },

  // ── TURN SIDE (quay sang bên) ──
  {
    name: "turn_side",
    frames: [
      { src: "/assets/sprites/turn_front.png", duration: 0.08 },
      { src: "/assets/sprites/turn_34.png", duration: 0.08 },
      { src: "/assets/sprites/turn_side.png", duration: 0.4 },
    ],
    fps: 12,
    mode: "once",
  },
];
