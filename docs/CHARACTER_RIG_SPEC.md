# Đặc Tả Kỹ Thuật Tạo Hình Nhân Vật Gugugaga (Character Rig Specification)

Tài liệu này định nghĩa cấu trúc phân lớp giải phẫu đồ họa, bảng mã màu, trọng tâm xoay (pivot points) và hệ thống biểu cảm cho nhân vật **Gugugaga** dựa trên hình ảnh thiết kế gốc.

---

## 1. Phân Tích Hình Thể & Nhận Diện Nhân Vật (Visual Identity)

Gugugaga là một bé gái anime phong cách chibi chibi dễ thương mặc bộ đồ thú bông chim cánh cụt (`penguin kigurumi hoodie`):

- **Phần Mũ Cánh Cụt (Penguin Hood):**
  - Mũ trùm đầu trùm kín ôm lấy mái tóc và khuôn mặt, màu đen than nhung mịn (`#1c1917` / `#292524`).
  - Đỉnh mũ gắn hai mắt chim cánh cụt tròn màu trắng (`#ffffff`), viền con ngươi đen tròn xoe (`#0f172a`).
  - Mỏ chim cánh cụt màu vàng cam tươi (`#facc15` viền `#ca8a04`), nằm ngay giữa trán phía trên chân tóc mái.
  - Bên trái mái tóc có kẹp tóc đôi màu bạc kim loại sáng (`#cbd5e1`).

- **Mái Tóc & Gương Mặt (Hair & Face):**
  - Mái tóc ngắn cúp đuôi (`short bob`) màu đen tuyền ánh than, tỉa mái bằng tỉ mỉ che ngang trán.
  - Khuôn mặt bầu bĩnh, cằm tròn đầy đặn trẻ thơ, màu da đào hồng mịn màng (`#ffedd5`).
  - Má hồng gradient phớt nhẹ hai bên gò má (`#fb7185`).
  - Mắt anime to tròn đặc trưng: tròng mắt màu xám khói gradient (`#334155` xuống `#0f172a`), điểm phản quang tròn to màu trắng ở góc trên và ánh sáng phụ ở góc dưới, viền mí sắc nét có mi cong nhỏ.
  - Miệng chúm chím dễ thương, khi cười mở rộng để lộ lưỡi hồng hào (`#f43f5e`).
  - Cổ đeo vòng choker đen có khuyên tròn kim loại bạc lấp lánh (`#94a3b8`).

- **Thân Hình & Trang Phục (Torso & Costume):**
  - Cơ thể chim cánh cụt tròn trịa, mập mạp và đáng yêu.
  - Bụng tròn lớn màu trắng muốt (`#f8fafc`), ở giữa in dòng chữ thương hiệu **"GuGuGaGa"** màu hồng dâu tươi tắn (`#f472b6`).
  - Hai cánh chim cánh cụt màu đen phía ngoài, mặt trong màu xám nhạt (`flipper wings`), hoạt động như hai tay vẫy chào hoặc bám giữ.
  - Hai bàn chân màng chim cánh cụt màu vàng cam tròn xoe (`#f59e0b` / `#fbbf24`), có rãnh ngón tròn múp míp.
  - Đuôi chim cánh cụt nhọn nhỏ vểnh nhẹ ở phía sau.

---

## 2. Bảng Mã Màu Chuẩn (Color Palette)

| Bộ Phận | Mã Hex Chính | Mã Gradient / Đổ Bóng | Ghi Chú |
| :--- | :--- | :--- | :--- |
| **Mũ & Thân Cánh Cụt** | `#1c1917` | `#292524` -> `#0c0a09` | Đen nhung than sang trọng |
| **Bụng Cánh Cụt** | `#f8fafc` | `#ffffff` -> `#e2e8f0` | Trắng lông vũ mềm |
| **Dòng chữ "GuGuGaGa"**| `#f472b6` | `#ec4899` | Hồng dâu ngọt ngào |
| **Mỏ & Bàn Chân** | `#facc15` | `#f59e0b` -> `#d97706` | Vàng cam ấm áp |
| **Mắt Chim Cánh Cụt** | `#ffffff` | `#0f172a` (con ngươi) | Mắt tròn ngộ nghĩnh trên mũ |
| **Tóc Anime** | `#262626` | `#171717` -> `#404040` | Tóc đen than ánh bóng |
| **Da Mặt** | `#ffedd5` | `#fed7aa` -> `#fff7ed` | Da đào hồng hào |
| **Má Hồng** | `#fb7185` | Alpha 0.45 blur | Gradient má búp bê |
| **Mắt Anime Bé Gái** | `#334155` | `#1e293b` -> `#020617` | Mắt xám đen anime sâu thẳm |
| **Vòng Cổ Choker** | `#171717` | `#94a3b8` (khoen bạc) | Choker đen khuyên tròn |
| **Kẹp Tóc** | `#e2e8f0` | `#94a3b8` | Kẹp tóc bạc đôi |

---

## 3. Cây Phân Cấp Khung Xương & Điểm Tựa Xoay (Hierarchical Bone Rig)

```text
Root (Gốc tại sàn chân)
├── Shadow (Bóng đổ sàn)
├── Body (Thân chim cánh cụt) [Pivot: (0, 0)]
│   ├── BackArm / LeftArm (Cánh bơi phía sau) [Pivot: (-30, -10)]
│   ├── TorsoMesh (Thân đen + Bụng trắng + Chữ "GuGuGaGa")
│   ├── LeftLeg (Chân vàng trái) [Pivot: (-18, 28)]
│   ├── RightLeg (Chân vàng phải) [Pivot: (18, 28)]
│   ├── Tail (Đuôi chim cánh cụt phía sau) [Pivot: (0, 20)]
│   ├── Choker (Vòng cổ + Khuyên bạc) [Pivot: (0, -22)]
│   └── Head (Đầu & Mũ chim cánh cụt) [Pivot: (0, -26)]
│       ├── PenguinHood (Mũ đen trùm)
│       ├── PenguinEyes (Mắt chim cánh cụt trên mũ)
│       ├── PenguinBeak (Mỏ vàng nhô ra)
│       ├── HairBack (Tóc gáy phía sau)
│       ├── Face (Mặt, Má hồng, Mũi nhỏ)
│       ├── Eyes (Hai mắt anime to tròn + Highlight)
│       ├── Mouth (Miệng biểu cảm)
│       ├── HairFront & Bangs (Mái tóc bằng + Lọn tóc hai bên)
│       ├── HairPin (Kẹp tóc bạc đôi bên trái)
│       └── FrontArm / RightArm (Cánh bơi phía trước) [Pivot: (30, -10)]
```

---

## 4. Phép Chiếu Thị Sai 2.5D & Sắp Lớp Z-Index (Parallax & Depth Sorting)

- **Góc nhìn chính diện (Front - $0^\circ$):** Hai cánh và hai chân đối xứng hoàn hảo, dòng chữ "GuGuGaGa" ở chính tâm.
- **Góc nhìn nghiêng $\frac{3}{4}$ (Three-Quarter Left/Right):**
  - Mỏ chim cánh cụt và ngũ quan dịch chuyển theo hàm $\sin(\theta) \times R$ tạo độ nổi 3D chân thực.
  - Cánh phía sau thu nhỏ phối cảnh ($scale = 0.88$), nằm sau thân mình.
  - Cánh phía trước vung tự do ở lớp ngoài cùng ($z$-index cao nhất).
- **Chuyển hướng (Directional Turning):**
  - Không đảo hình giật cục bằng `scale(-1, 1)`.
  - Góc nhìn được nội suy qua bộ giảm chấn lò xo `Spring1D` với thời gian xoay $180\,ms$, kèm chuyển động nhún người (anticipation dip).
