# MyPet - Gugugaga Desktop Pet (Windows 11)

Ứng dụng thú cưng màn hình (Desktop Pet) tương tác thời gian thực dành cho Windows 11 với nhân vật **Gugugaga** – bé gái anime chibi mặc trang phục chim cánh cụt bông siêu đáng yêu. Dự án được xây dựng trên nền tảng **Tauri v2** (Rust Backend + TypeScript + HTML5 Canvas Frontend + Vite), tối ưu hóa hiệu năng và bộ nhớ cực thấp trên hệ thống máy tính cá nhân.

![Gugugaga Reference](public/assets/gugugaga_ref.png)

---

## 🌟 Tính Năng Nổi Bật

1. **Tạo Hình Chuẩn 100% Nhân Vật GuGuGaGa:**
   - Bé gái chibi với mái tóc ngắn búp bê (`bob haircut`), kẹp tóc bạc kép, khuôn mặt bầu bĩnh màu da đào ửng hồng.
   - Mũ trùm đầu chim cánh cụt nhung đen than, hai mắt chim cánh cụt tròn xoe và mỏ chim cánh cụt vàng cam nổi khối.
   - Bụng chim cánh cụt trắng muốt in thương hiệu **"GuGuGaGa"** màu hồng dâu tươi tắn, hai cánh bơi mềm mại (`flipper wings`) và đôi chân vàng múp míp.
   - Vòng cổ choker đen với khuyên tròn kim loại bạc lấp lánh.

2. **Động Cơ Hoạt Hình 2.5D & Vật Lý Lò Xo Đàn Hồi (Spring Damper @ 60 FPS):**
   - Vòng lặp render chuẩn 60 FPS bằng `requestAnimationFrame` kết hợp bảo toàn thể tích (Volume Preservation `scaleX * scaleY ≈ 1.0`).
   - Phép chiếu thị sai 2.5D (Parallax): Ngũ quan, mỏ, tóc và bụng trượt theo chiều sâu hình cầu khi quay trái, quay phải, chính diện mà không giật lật hình `scale(-1, 1)`.
   - Cử động bước đi hoạt họa kinh điển 4 pha (`Contact -> Down -> Pass -> Up`) với nhịp lắc lư cánh cụt đáng yêu.
   - Con ngươi mắt bám theo mục tiêu thời gian thực (`Eye Tracking` theo bướm hoặc con trỏ chuột) và chớp mắt tự nhiên với xác suất chớp mắt kép.

3. **Chuỗi Hoạt Cảnh Rượt Bắt Bướm Điện Ảnh (Cinematic Butterfly Chase):**
   - **Pha 1 (Lấy đà & Lắc mông):** Gugugaga phát hiện bướm, mắt sáng hình ngôi sao lấp lánh, hạ thấp người nhún nảy lắc hông tinh nghịch chuẩn bị phóng.
   - **Pha 2 (Phi nước đại):** Thân dốc về trước, cánh quạt như guồng quay, mắt bám theo độ cao của bướm.
   - **Pha 3 (Nhảy vồ & Ăn mừng):** Nhảy vọt parabol trên không với hai cánh vươn dài chộp bướm, bướm tan thành chùm pháo hoa lấp lánh và Gugugaga thực hiện vũ điệu xoay tròn 360 độ ăn mừng!

4. **Kéo Thả Vật Lý Con Lắc & Xuyên Chuột Động (Dynamic Click-Through):**
   - Cửa sổ trong suốt toàn màn hình: Click chuột xuyên qua vùng trống để làm việc bình thường, tự động bắt tương tác khi rê vào Gugugaga hoặc bong bóng thông báo.
   - Tích hợp bộ giải nghiệm con lắc vật lý (`PendulumSolver`): Thân hình và chân tay đung đưa theo gia tốc rê chuột của người dùng; khi lắc chuột nhanh sẽ kích hoạt biểu cảm hoa mắt chóng mặt dễ thương.

5. **Bộ Lắng Nghe Thông Báo Windows 11 & Phản Ứng Giật Mình:**
   - Lắng nghe sự kiện thông báo hệ thống qua WinRT API (`UserNotificationListener`) hoặc IPC test notification.
   - Khi có thông báo: Gugugaga giật mình thót tim nhảy lùi ra sau, thân hình rung chấn, hai tai dựng đứng rung bần bật, bắn hạt dấu chấm than `!` đỏ và giọt mồ hôi anime 💧.
   - Sau đó quay mặt trực diện $0^\circ$ về phía người dùng, giơ hai cánh vẫy chào và hiển thị bong bóng thoại anime.

6. **Khay Hệ Thống & Menu Ngữ Cảnh Chuột Phải:**
   - Bấm chuột phải trực tiếp vào Gugugaga hoặc icon khay hệ thống để mở menu tùy chọn nhanh (Thả bướm, thử thông báo, cho ngủ, bật/tắt đo FPS,...).

---

## 🛠 Yêu Cầu Môi Trường & Cài Đặt

### Cài đặt dependencies:
```bash
npm install
```

### Chạy ứng dụng chế độ phát triển (Development):
```bash
npm run tauri dev
```

### Đóng gói ứng dụng thành phẩm (Production Build):
```bash
npm run tauri build
```

---

## 🎮 Hướng Dẫn Điều Khiển & Phím Tắt

| Thao tác | Mô tả |
| :--- | :--- |
| **Rê chuột vào Gugugaga** | Tự động bắt tương tác chuột. |
| **Kéo thả chuột trái (Drag)** | Nhấc bổng Gugugaga đung đưa theo quán tính con lắc; buông tay để rơi tự do. |
| **Nhấp đúp chuột trái** | Cưng nựng Gugugaga nhảy lên vui sướng kèm chùm sao lấp lánh. |
| **Chuột phải vào Gugugaga** | Mở Menu ngữ cảnh tùy chọn phong cách Dark Glassmorphism. |
| **Phím `F3`** | Bật / tắt bộ đo FPS và Frame-Time. |
| **Phím `B`** | Thả bướm bay lượn để Gugugaga rượt bắt. |
| **Phím `N`** | Bắn thông báo thử nghiệm để xem hoạt ảnh giật mình và bong bóng thoại. |
| **Phím `S`** | Cho Gugugaga ngủ hoặc đánh thức. |
| **Phím `R`** | Đặt lại vị trí Gugugaga về giữa màn hình. |

---

## 📜 Giấy Phép

Dự án phát triển bởi **NhatPrv** - Giấy phép [MIT License](LICENSE).
