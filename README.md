# MyPet - Gugugaga Desktop Pet (Windows 11)

Ứng dụng thú cưng màn hình (Desktop Pet) tương tác thời gian thực dành cho Windows 11 với nhân vật **Gugugaga** tinh nghịch, giàu năng lượng. Dự án được xây dựng trên nền tảng **Tauri v2** (Rust Backend + TypeScript + HTML5 Canvas Frontend + Vite), tối ưu hóa hiệu năng và bộ nhớ cực thấp trên hệ thống máy tính cá nhân.

---

## 🌟 Tính Năng Nổi Bật

1. **Cửa Sổ Trong Suốt & Xuyên Chuột Động (Dynamic Click-Through Overlay):**
   - Cửa sổ không viền (`frameless`), luôn nổi trên cùng (`always-on-top`), nền trong suốt hoàn toàn.
   - Cơ chế phát hiện tương tác theo pixel/hitbox: Chuột click xuyên qua các vùng trống để làm việc bình thường với các ứng dụng Windows khác; tự động bắt tương tác chuột khi rê vào nhân vật Gugugaga hoặc bong bóng thông báo.

2. **Game Loop 60 FPS & Vẽ Procedural Canvas:**
   - Vòng lặp render chuẩn 60 FPS bằng `requestAnimationFrame` kết hợp tính toán vật lý theo delta-time (`dt`).
   - Kết xuất nhân vật Gugugaga bằng đồ họa Canvas vector/procedural mượt mà, hỗ trợ hiệu ứng squash-and-stretch sinh động, tai/tay chân lắc lư và mắt biểu cảm mà không phụ thuộc ảnh ngoài (đồng thời hỗ trợ nạp sprite sheet tùy biến).
   - Tích hợp bộ đếm FPS chẩn đoán (bật/tắt bằng phím `F3`).

3. **Máy Trạng Thái Hữu Hạn (FSM) & AI Bướm Độc Lập:**
   - Bộ quản lý hành vi đa trạng thái: `IDLE`, `WALK`, `SLEEP`, `CHASE_BUTTERFLY`, `DRAGGED`, `NOTIFY`.
   - Thực thể bướm tự hành (`Butterfly`) bay lượn ngẫu nhiên theo hàm sóng sin/Perlin và đập cánh ở 60 FPS.
   - Gugugaga tự động phát hiện bướm trong tầm nhìn, chuyển sang trạng thái rượt đuổi, phóng người vồ bướm và ăn mừng chiến thắng.
   - Tự động đi ngủ (`SLEEP`) với hoạt ảnh hạt "Zzz" bay lơ lửng khi người dùng không hoạt động trong một khoảng thời gian.

4. **Kéo Thả Vật Lý & Trọng Lực:**
   - Kéo thả mượt mà bằng chuột trái với vận tốc quán tính và hoạt cảnh tay chân vùng vẫy khi bị nhấc lên (`DRAGGED`).
   - Rơi tự do có gia tốc trọng lực và đáp xuống thanh Taskbar của Windows hoặc đáy màn hình khi buông tay.

5. **Bộ Lắng Nghe Thông Báo Windows 11 (Push Notification Interceptor):**
   - Subsystem Rust khai thác WinRT API (`Windows.UI.Notifications.Management.UserNotificationListener`) để lắng nghe thông báo hệ thống và ứng dụng Windows 11.
   - Hàng đợi bong bóng hội thoại phong cách anime gắn trên đầu Gugugaga, kèm phản ứng nhảy vẫy chào vui nhộn khi có thông báo mới.
   - Cung cấp lệnh IPC/mock test thông báo để kiểm thử nhanh chóng ngay cả khi chưa cấp quyền hệ thống.

6. **Khay Hệ Thống & Menu Ngữ Cảnh (System Tray & Radial Menu):**
   - Icon khay hệ thống Windows (`MyPet - Gugugaga`) cùng Context Menu chuột phải:
     - Thả bướm bay lượn (Spawn Butterfly 🦋)
     - Gửi thông báo kiểm thử (Send Test Notification 🔔)
     - Bắt buộc ngủ / Đánh thức (Sleep / Wake Up 💤)
     - Bật/tắt bộ đo FPS (Toggle FPS Counter 📊)
     - Đặt lại vị trí ban đầu (Reset Position 📍)
     - Thoát ứng dụng (Quit MyPet ❌)

---

## 🛠 Yêu Cầu Môi Trường & Cài Đặt

### Điều kiện tiên quyết:
- **Hệ điều hành:** Windows 10/11 64-bit (khuyên dùng Windows 11 để hỗ trợ đầy đủ `UserNotificationListener`).
- **Node.js:** Phiên bản `>= 18.0.0` (khuyên dùng v20+ hoặc v24 LTS).
- **Rust & Cargo:** Phiên bản ổn định mới nhất (`rustup default stable-x86_64-pc-windows-msvc`).
- **WebView2:** Microsoft Edge WebView2 Runtime (đã tích hợp sẵn trên Windows 11).
- **C++ Build Tools:** Visual Studio C++ Build Tools với Windows 10/11 SDK.

### Cài đặt dependencies:
```bash
# Cài đặt frontend dependencies
npm install

# Kiểm tra công cụ Rust backend
cargo --version
```

### Chạy ứng dụng chế độ phát triển (Development):
```bash
npm run tauri dev
```

### Đóng gói ứng dụng thành phẩm (Production Build):
```bash
npm run tauri build
```

File thực thi `.exe` và bộ cài installer sẽ được xuất tại thư mục:
`src-tauri/target/release/` hoặc `src-tauri/target/release/bundle/msi/`.

---

## 📂 Cấu Trúc Dự Án

```
MyPet/
├── docs/                           # Tài liệu kỹ thuật chuyên sâu
│   ├── ARCHITECTURE.md             # Kiến trúc hệ thống Tauri v2, Rust & Canvas
│   ├── STATE_MACHINE.md            # Thiết kế FSM & sơ đồ trạng thái Gugugaga
│   └── NOTIFICATION_PROTOCOL.md    # Giao thức lắng nghe & hiển thị thông báo
├── src-tauri/                      # Mã nguồn Rust Backend (Tauri v2)
│   ├── src/
│   │   ├── main.rs                 # Điểm khởi chạy ứng dụng
│   │   ├── lib.rs                  # Đăng ký plugin, lệnh IPC và cấu hình runtime
│   │   ├── notifications.rs        # Lắng nghe WinRT UserNotificationListener & Mock IPC
│   │   ├── window_ext.rs           # Quản lý click-through (WS_EX_TRANSPARENT, hit-test)
│   │   └── tray.rs                 # Quản lý System Tray & tương tác khay hệ thống
│   ├── Cargo.toml                  # Khai báo crate phụ thuộc (windows, tauri, serde, tokio)
│   └── tauri.conf.json             # Cấu hình cửa sổ trong suốt, quyền bảo mật
├── src/                            # Mã nguồn Frontend (TypeScript + Vite + Canvas)
│   ├── ai/
│   │   └── StateMachine.ts         # Quản lý chuyển đổi trạng thái FSM của Gugugaga
│   ├── engine/
│   │   ├── GameLoop.ts             # Vòng lặp render 60 FPS cố định với delta-time
│   │   ├── Vector2D.ts             # Thư viện toán học vector 2D, nội suy
│   │   └── FpsCounter.ts           # Đo đạc và hiển thị FPS/MS chẩn đoán
│   ├── entities/
│   │   ├── GugugagaRenderer.ts     # Vẽ vector procedural cho Gugugaga, squash & stretch
│   │   └── Butterfly.ts            # Thực thể bướm tự hành, thuật toán bay sóng sin
│   ├── input/
│   │   ├── DragController.ts       # Xử lý kéo thả, vận tốc quán tính và trọng lực
│   │   └── HitboxManager.ts        # Tính toán va chạm pixel & gửi tín hiệu click-through
│   ├── ui/
│   │   ├── NotificationBubble.ts   # Hàng đợi bong bóng hội thoại anime mượt mà
│   │   └── ContextMenu.ts          # Menu ngữ cảnh chuột phải trực tiếp trên nhân vật
│   ├── index.html                  # Khung DOM trong suốt chứa Canvas & UI overlay
│   ├── main.ts                     # Khởi tạo frontend engine & kết nối Rust IPC
│   └── style.css                   # Định kiểu trong suốt, font chữ và hiệu ứng hoạt họa
├── package.json                    # Cấu hình package npm và script
├── tsconfig.json                   # Cấu hình TypeScript nghiêm ngặt
└── README.md                       # Tài liệu tổng quan dự án
```

---

## 🎮 Hướng Dẫn Điều Khiển & Phím Tắt

| Thao tác | Mô tả |
| :--- | :--- |
| **Rê chuột vào Gugugaga** | Tự động bắt tương tác (tắt click-through để có thể tương tác). |
| **Kéo thả chuột trái (Drag)** | Nhấc Gugugaga lên vị trí bất kỳ; khi thả sẽ rơi tự do xuống taskbar. |
| **Nhấp đúp chuột trái** | Tương tác nựng Gugugaga, chuyển nhanh sang hành vi phấn khích. |
| **Chuột phải vào Gugugaga** | Mở Menu ngữ cảnh tùy chọn (Thả bướm, thử thông báo, cho ngủ,...). |
| **Phím `F3`** | Bật / tắt bộ đo tốc độ khung hình (FPS & Delta-time). |
| **Icon Khay Hệ Thống** | Bấm chuột phải vào icon ở thanh taskbar để mở menu điều khiển nhanh. |

---

## 📜 Giấy Phép & Tác Quyền

Dự án phát triển bởi **NhatPrv** dành cho cộng đồng mã nguồn mở.
Được cấp phép theo [MIT License](LICENSE).
