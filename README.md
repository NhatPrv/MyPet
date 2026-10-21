# MyPet - Gugugaga Desktop Pet (Windows 11)

Ứng dụng thú cưng màn hình (Desktop Pet) tương tác thời gian thực dành cho Windows 11 với nhân vật **Gugugaga** – bé gái anime chibi mặc trang phục chim cánh cụt bông siêu đáng yêu. Dự án được xây dựng trên nền tảng **Tauri v2** (Rust Backend + TypeScript + HTML5 Canvas Frontend + Vite), tối ưu hóa hiệu năng và bộ nhớ cực thấp trên hệ thống máy tính cá nhân.

![Gugugaga Reference](public/assets/gugugaga_ref.png)

---

## 🌟 Tính Năng Nổi Bật

1. **Hoạt Hình Frame-by-Frame Thực Sự (SpriteAnimator @ 60 FPS):**
   - Engine `SpriteAnimator` tự xây dựng: mỗi animation là một clip gồm nhiều frame PNG với timing riêng biệt (`duration` per frame).
   - Hỗ trợ đầy đủ: `loop`, `once`, `pingpong` playmode.
   - **Crossfade alpha-blend** mượt mà khi chuyển đổi giữa các animation (không giật/pop).
   - Squash-and-stretch metadata per-frame cho cảm giác cartoon sinh động.
   - Image Cache singleton — preload toàn bộ ảnh một lần, zero re-load khi runtime.

2. **Bộ Animation Clips Phong Phú:**
   - `idle` — nhịp thở + lắc nhẹ tự nhiên
   - `idle_wave` — vẫy tay khi có sub-action (LOOK_AROUND, BOUNCE, SCRATCH)
   - `sleep` — pingpong thở chậm rãi
   - `dragged` / `dragged_fast` — biểu cảm sợ hãi/hoa mắt khi bị nhấc bổng
   - `startled` — giật mình thót tim với squash-stretch shock
   - `notify` — nhảy vui mừng khi nhận thông báo
   - `chase_crouch` → `chase_run` → `chase_jump` → `chase_celebrate` — chuỗi 4 pha rượt bướm điện ảnh

3. **Hành Vi Tự Động Khi Đứng Yên (Idle Sub-Actions):**
   - Gugugaga tự phát ngẫu nhiên các hành động nhỏ khi đứng chờ: vẫy tay, nhảy nhẹ, gãi đầu, ngáp.
   - Sau 90 giây không tương tác → tự động chuyển sang ngủ.

4. **Chuỗi Rượt Bắt Bướm Điện Ảnh:**
   - **Pha 1 (ANTICIPATION):** Khom người chuẩn bị — `chase_crouch` animation với squash.
   - **Pha 2 (SPRINT):** Phi nhanh theo bướm — `chase_run` 16fps.
   - **Pha 3 (POUNCE):** Nhảy vồ parabol — `chase_jump` once.
   - **Pha 4 (CELEBRATE):** Vũ điệu ăn mừng — `chase_celebrate` loop kèm sparkle particles.

5. **Kéo Thả Vật Lý Con Lắc (Pendulum Drag):**
   - Cửa sổ trong suốt toàn màn hình — click xuyên qua vùng trống.
   - Tự động bắt tương tác khi rê chuột vào Gugugaga.
   - Thân hình nghiêng theo góc con lắc (pendulumAngle) khi kéo.
   - Kéo nhanh → kích hoạt `dragged_fast` hoa mắt chóng mặt.

6. **Bộ Lắng Nghe Thông Báo Windows 11:**
   - WinRT API `UserNotificationListener` — nhận thông báo hệ thống thời gian thực.
   - Khi có thông báo: `startled` animation + particles dấu chấm than + bong bóng thoại.
   - Sau giật mình: chuyển sang `notify` animation vẫy chào.

7. **Khay Hệ Thống & Menu Ngữ Cảnh Chuột Phải:**
   - Bấm chuột phải vào Gugugaga hoặc icon khay để mở menu tùy chọn.

---

## 🏗 Kiến Trúc Animation

```
src/animation/
├── AnimationClip.ts        # Engine 1 clip: frame timing, loop/once/pingpong
├── AnimationController.ts  # Quản lý nhiều clips, crossfade
├── GugugagaAnimDefs.ts     # Định nghĩa 14 animation clips (frame paths + meta)
├── SpriteAnimator.ts       # Runtime engine: ImageCache, state machine, crossfade render
└── PoseAnimator.ts         # (Legacy) RigPose calculator — không còn dùng để render
```

**Luồng render:**
```
Gugugaga.update() → RenderState → GugugagaRenderer.update()
  → selectAnimation(state) → SpriteAnimator.play(clipName)
  → SpriteAnimator.update(dt) → currentImage + currentMeta
  → GugugagaRenderer.render() → drawSprite() → ctx.drawImage()
```

---

## 🛠 Yêu Cầu Môi Trường & Cài Đặt

### Cài đặt dependencies:
```bash
npm install
```

### Chạy chế độ phát triển:
```bash
npm run tauri dev
```

### Đóng gói thành phẩm:
```bash
npm run tauri build
```

---

## 🎮 Hướng Dẫn Điều Khiển & Phím Tắt

| Thao tác | Mô tả |
| :--- | :--- |
| **Rê chuột vào Gugugaga** | Tự động bắt tương tác chuột (hitbox detection). |
| **Kéo thả chuột trái** | Nhấc bổng Gugugaga đung đưa theo quán tính con lắc. |
| **Chuột phải vào Gugugaga** | Mở Menu ngữ cảnh Dark Glassmorphism. |
| **Phím `B`** | Thả bướm để Gugugaga rượt bắt. |
| **Phím `N`** | Bắn thông báo thử nghiệm → xem hoạt ảnh giật mình. |
| **Phím `S`** | Cho ngủ hoặc đánh thức Gugugaga. |
| **Phím `R`** | Đặt lại vị trí về góc phải màn hình. |

---

## 📋 Changelog

### v1.3.0 — 2026-10-21
- **Xóa state WALK:** Gugugaga đứng yên tại chỗ — không còn tự di chuyển qua lại (đã bị lỗi nặng).
- **Fix khuôn mặt biến dạng:** Loại bỏ hoàn toàn `GugugagaRig` vector fallback render; sprite PNG là nguồn render duy nhất.
- **Fix NaN scale:** `meta.scaleX` undefined không còn gây `ctx.scale(NaN, 1)` làm vỡ canvas transform.
- **Crossfade alpha-blend:** Clip cũ fade out đồng thời clip mới fade in — transition mượt mà thực sự.

### v1.2.0 — 2026-10-21
- **SpriteAnimator engine:** Frame-by-frame animation thực sự từ mảng PNG; thay thế cơ chế "chọn 1 ảnh theo state" cũ.
- **14 animation clips:** Mỗi clip có frame timing chính xác + squash-stretch metadata per-frame.
- **ImageCache singleton:** Preload toàn bộ assets khi khởi động, zero overhead lúc runtime.
- **AnimationClip / AnimationController:** Các lớp tiện ích hỗ trợ loop, once, pingpong.

### v1.1.0 — 2026-10-21
- Tích hợp bộ sprite asset chính thức Gugugaga (20 PNG frames).
- Kéo thả vật lý con lắc với `pendulumAngle`.
- Phản ứng giật mình khi có thông báo mới.
- Butterfly chase 4 giai đoạn điện ảnh.
- Hành động idle tự động ngẫu nhiên.

### v1.0.0 — 2026-10-20
- Khởi tạo dự án Tauri v2 + Vite + TypeScript.
- Cửa sổ trong suốt, luôn trên cùng, skipTaskbar.
- WinRT notification listener.
- System tray + context menu.
- Lần đầu tiên Gugugaga xuất hiện trên màn hình.

---

## 📜 Giấy Phép

Dự án phát triển bởi **NhatPrv** - Giấy phép [MIT License](LICENSE).
