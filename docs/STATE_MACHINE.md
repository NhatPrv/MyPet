# Thiết Kế Máy Trạng Thái Hữu Hạn (Finite State Machine - FSM)

Tài liệu này định nghĩa cấu trúc máy trạng thái hữu hạn (FSM) quản lý toàn bộ chu kỳ hành vi và hoạt cảnh của nhân vật **Gugugaga** trong ứng dụng MyPet.

> **Cập nhật v1.3.0 (2026-10-21):** Đã xóa hoàn toàn state `WALK`. Gugugaga không còn tự di chuyển qua lại — luôn đứng yên tại `homeX`.

---

## 1. Sơ Đồ Trạng Thái (State Diagram)

```
                    ┌─────────────────────────────────────────┐
                    │                  IDLE                    │
                    │  • velocity.x = 0 (đứng yên)            │
                    │  • Sub-actions ngẫu nhiên:               │
                    │    LOOK_AROUND / BOUNCE / SCRATCH /      │
                    │    STRETCH / YAWN                        │
                    │  • Sau 90s không tương tác → SLEEP       │
                    └────────┬────────────────────────────────┘
                             │
              ┌──────────────┼──────────────────────┐
              │              │                      │
              ▼              ▼                      ▼
         DRAGGED        NOTIFY               CHASE_BUTTERFLY
      (kéo chuột)   (thông báo mới)         (bướm < 320px)
              │              │                      │
              └──────────────┼──────────────────────┘
                             │ (tất cả → IDLE khi xong)
                             ▼
                          FALLING
                    (sau khi thả chuột)
                             │
                             ▼
                           IDLE
                             │
                    (inactivity > 90s)
                             ▼
                           SLEEP
                             │
                    (tương tác chuột)
                             ▼
                           IDLE
```

---

## 2. Danh Sách Trạng Thái

### `IDLE` — Đứng Chơi / Thư Giãn

**Điều kiện vào:** Trạng thái khởi đầu mặc định; sau khi kết thúc NOTIFY, CHASE_BUTTERFLY, FALLING, DRAGGED.

**Hành vi:**
- `velocity.x = 0` — không di chuyển.
- Phát ngẫu nhiên **Idle Sub-Actions** mỗi 1.8–4s:
  - `LOOK_AROUND` → animation `idle_wave`, mood `curious`
  - `BOUNCE` → nhảy nhẹ lên (velocity.y = -220) + `idle_wave`
  - `SCRATCH` → `idle_wave`, mood `happy`
  - `STRETCH` → `idle_wave`, mood `happy`
  - `YAWN` → `idle_wave`, mood `sleepy`
- Animation sprite: `idle` (thở + lắc 2fps loop)

**Điều kiện ra:**
- Bướm xuất hiện trong vòng 320px → `CHASE_BUTTERFLY`
- Người dùng kéo chuột → `DRAGGED`
- Thông báo mới → `NOTIFY` (qua `startled` trước)
- Không hoạt động 90s → `SLEEP`

---

### `NOTIFY` — Nhận Thông Báo

**Điều kiện vào:** WinRT notification hoặc IPC test event.

**Hành vi:**
1. Giai đoạn `isStartled` (0.65s): giật mình, nhảy lùi, rung lắc.
   - velocity.y = -360, velocity.x = ±40
   - Particles: dấu chấm than `!` + giọt mồ hôi
   - Animation: `startled` (once, squash-stretch shock)
2. Sau startled → chuyển sang `NOTIFY`:
   - Nhảy nhẹ lên khi mới vào (velocity.y = -350)
   - Hiển thị bong bóng thoại với nội dung thông báo
   - Animation: `notify` (loop — nhảy vui + vẫy tay)
   - mood: `excited`

**Điều kiện ra:** Tự động → `IDLE` sau khi bong bóng thoại đóng.

---

### `CHASE_BUTTERFLY` — Rượt Bắt Bướm

**Điều kiện vào:** Bướm đang active, khoảng cách < 320px, từ IDLE.

**4 giai đoạn (ChaseStage):**

| Stage | Thời gian | Hành vi | Animation |
|---|---|---|---|
| `ANTICIPATION` | 0.35s | Đứng yên, quay mặt về hướng bướm | `chase_crouch` squash loop |
| `SPRINT` | ~∞ | velocity ±220px/s về phía bướm | `chase_run` 16fps loop |
| `POUNCE` | ~∞ | Nhảy vọt khi bướm ở cao (dy < -45px) | `chase_jump` once |
| `CELEBRATE` | 2.2s | velocity.x = 0, quay tại chỗ | `chase_celebrate` loop + sparkle |

**Điều kiện ra:**
- Bướm tan biến / bị bắt (dist < 42px) → `CELEBRATE` → `IDLE`
- Timeout > 10s → `IDLE`

---

### `DRAGGED` — Bị Kéo Bởi Chuột

**Điều kiện vào:** Người dùng giữ chuột trái trên hitbox Gugugaga.

**Hành vi:**
- isGrounded = false — không áp dụng trọng lực.
- Vị trí khớp với con trỏ chuột (qua `DragController`).
- `pendulumAngle` dao động theo gia tốc rê chuột.
- Kéo chậm → `dragged` (scared 5fps); Kéo nhanh → `dragged_fast` (dizzy 10fps).

**Điều kiện ra:** Thả chuột → `FALLING`.

---

### `FALLING` — Rơi Tự Do

**Điều kiện vào:** Thả chuột từ DRAGGED.

**Hành vi:**
- velocity.y += gravity (1800 px/s²)
- Khi chạm `groundY`: bounce nhỏ nếu vận tốc > 300, ngược lại dừng → `IDLE`.
- `homeX` cập nhật thành vị trí X nơi đặt chân xuống.

---

### `SLEEP` — Ngủ

**Điều kiện vào:** Không tương tác > 90 giây.

**Hành vi:**
- velocity = (0, 0)
- Phát particle `zzz` mỗi 1.2s
- Animation: `sleep` pingpong thở chậm

**Điều kiện ra:** Tương tác chuột → `IDLE`.

---

## 3. Mapping Animation Clips theo State

| State | ChaseStage | Animation Clip | FPS | Mode |
|---|---|---|---|---|
| IDLE (normal) | — | `idle` | 2 | loop |
| IDLE (wave sub) | — | `idle_wave` | 6 | loop |
| SLEEP | — | `sleep` | 1 | pingpong |
| DRAGGED (chậm) | — | `dragged` | 5 | loop |
| DRAGGED (nhanh) | — | `dragged_fast` | 10 | loop |
| NOTIFY | — | `notify` | 6 | loop |
| startled | — | `startled` | 8 | once |
| CHASE_BUTTERFLY | ANTICIPATION | `chase_crouch` | 7 | loop |
| CHASE_BUTTERFLY | SPRINT | `chase_run` | 16 | loop |
| CHASE_BUTTERFLY | POUNCE | `chase_jump` | 8 | once |
| CHASE_BUTTERFLY | CELEBRATE | `chase_celebrate` | 7 | loop |

---

## 4. Idle Sub-Actions

Khi ở trạng thái `IDLE` và `idleSubAction === "NONE"`, đếm ngược `nextIdleActionTimer` (random 1.8–4.0s). Khi hết giờ, chọn ngẫu nhiên:

```typescript
const actions = ["LOOK_AROUND", "STRETCH", "YAWN", "BOUNCE", "SCRATCH"];
```

Mỗi sub-action kéo dài 1.1–1.8s rồi reset về `NONE`. Animation `idle_wave` được phát trong thời gian này.

---

## 5. Bộ Đếm Thời Gian Tự Động Ngủ

```
inactivityTimer tăng mỗi frame.
Bất kỳ tương tác nào (chuột, drag, wake) → reset về 0.
Nếu inactivityTimer > 90s và state ∉ {SLEEP, DRAGGED, CHASE_BUTTERFLY, NOTIFY}
  → setState("SLEEP")
```
