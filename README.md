# Đảo Đèn Lồng — 3D Game (Day 12 AI SDLC)

> **Video Demo**: [Xem video demo tại GitHub Release v1.0.0](https://github.com/haovu1663-crypto/K5-L3-LAB-Day12-vuvanhao-2A202603419-AI-SDLC/releases) *(hoặc tại `docs/demo/demo.mp4`)*  
> **Sinh viên thực hiện**: Vũ Văn Hào — MSSV: 2A202603419  
> **Phiên bản hiện tại**: Phase 3 — Ticket-03: "Đèn Cạn Dầu" (Contract v1.2)

---

## 1. Giới thiệu dự án
**Đảo Đèn Lồng** là tựa game 3D góc nhìn thứ ba phong cách cổ tích ấm áp. Người chơi hóa thân thành **Mây**, người giữ đèn nhỏ tuổi với chiếc nón lá gắn đèn lồng, phiêu lưu qua **3 Hòn Đảo** giữa biển mây:
- **Đêm 1 — Đảo Bến**: Hòn đảo tròn lớn với 5 ngọn Đèn Lồng Lớn.
- **Đêm 2 — Đảo Cau**: Hai hòn đảo nối với nhau bằng cầu tre, bục nhảy thần tốc, Bùa Gió và loài Gió Lạc ranh mãnh rình cướp đom đóm.
- **Đêm 3 — Đảo Chuông**: Địa hình 3 tầng giật cấp hùng vĩ, tháp chuông đồng cổ kính 8m, bục nhảy lên đỉnh và những cơn gió mạnh cuốn bay.

---

## 2. Cài đặt và Khởi chạy (Tối đa 3 lệnh)

Game được thiết kế không phụ thuộc build tooling phức tạp, chạy mượt mà trên macOS, Linux và Windows:

```bash
# Lệnh 1: Cài đặt (nếu cần)
npm install

# Lệnh 2: Khởi động máy chủ game
npm start

# Lệnh 3: Mở trình duyệt trải nghiệm
# Truy cập: http://localhost:3000
```

---

## 3. Điều khiển trong Game

| Phím bấm | Hành động |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> / Mũi tên | Di chuyển nhân vật Mây |
| <kbd>Chuột trái</kbd> (kéo) | Xoay góc nhìn camera 3D quanh Mây |
| <kbd>Space</kbd> | Nhảy ($V_y = 7.0$ m/s, chỉ nhảy khi chạm đất) |
| <kbd>Shift</kbd> / <kbd>F</kbd> | Lướt Dash ($14.0$ m/s trong 0.2s, hồi chiêu 1.5s; lướt trên không giữ nguyên độ cao) |
| <kbd>E</kbd> | Tương tác nạp đom đóm vào Đèn Lồng Lớn (bán kính 2.0m) |
| <kbd>Q</kbd> | Tỏa Sáng (Pulse) làm choáng 120 ticks và đẩy lùi Bóng Mực (tiêu tốn 3 đom đóm, hồi chiêu 3s) |
| <kbd>Esc</kbd> / <kbd>P</kbd> | Tạm dừng trò chơi (Menu Cài đặt âm lượng & độ nhạy chuột) |

---

## 4. Cơ chế Tính Điểm & Luật Chơi Chuẩn Hóa (Phase 3 — Contract v1.2)

- **Hệ thống Nhiên liệu Đèn**: Nhiên liệu tối đa 100. Khi thắp sáng có 100 fuel. Hao hụt tự nhiên 1.0 fuel/giây (1/60 mỗi tick). Khi $fuel \le 0$, đèn tắt (`lantern_out`), mất vùng an toàn và ghi nhớ `ever_lit = true`.
- **Châm dầu (Refuel)**: Bấm `[E]` ở đèn đang sáng: $used = \min(carried, \lceil(100 - fuel) / 10\rceil)$, tăng $10 \times used$ fuel, tiêu tốn $used$ đom đóm, cộng $+5$ điểm/đom đóm nạp. Đèn đầy dầu không nhận thêm.
- **Thắp lại (Relight)**: Đèn từng sáng (`ever_lit: true`) chỉ cần 5 đom đóm để thắp lại (thay vì 10), thưởng $+40$ điểm thắp lại (+25 điểm nạp).
- **Bóng Mực hút dầu (`drain`)**: Khi ở trạng thái `wander`, Bóng Mực tự tìm đèn yếu ($fuel < 30$) gần nhất; cách $\le 2\text{m}$ chuyển sang `drain`, đứng yên hút 5 fuel/giây. Khi đèn được châm lên $\ge 30$, Bóng Mực bị đẩy lùi 30 ticks và không gây sát thương.
- **Tỏa Sáng (Pulse)**: Làm choáng Bóng Mực trong 5m; thưởng $+5$ điểm/con thường và $+15$ điểm/con đang hút dầu!
- **Sức chứa động**: Sức chứa túi đom đóm bắt đầu từ 10, tăng $+2$ sau mỗi lần thắp/thắp lại thành công (`10 + 2 * successful_lights`), tối đa 20.
- **Luật thắng mới**: Không còn thắng sớm khi thắp hết đèn. Đêm kết thúc khi hết giờ (bình minh):
  - **Thắng (`dawn_survived`)**: Mây còn sống và số đèn sáng $\ge \lceil 0.6 \times \text{tổng đèn}\rceil$ (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7).
  - **Thua (`dawn`)**: Hết giờ mà số đèn sáng dưới ngưỡng.
  - **Thua (`no_flames`)**: Mất hết 3 ngọn lửa hy vọng.
- **Bảng Điểm v1.2**:
  - Mỗi đom đóm nạp vào đèn (thắp mới/thắp lại/châm dầu): $+5$ điểm.
  - Thắp lần đầu: $+100$ điểm · Thắp lại: $+40$ điểm.
  - Pulse trúng Bóng Mực: $+5$ điểm (thường) / $+15$ điểm (đang drain).
  - Bình minh (thắng): $+50$ điểm/ngọn lửa còn lại $+ (50 + \lfloor fuel \rfloor)$ điểm/mỗi đèn đang sáng.
- **Chế độ Mù màu (Accessibility)**: Tùy chọn "Bảng màu dễ phân biệt" đổi viền/mắt Bóng Mực sang `#00B3FF`, cảnh báo UI sang `#FFFFFF` kèm biểu tượng ⚠. Đèn tắt bị xẹp 20% và có hoa văn rách giấy để nhận diện không cần màu.

---

## 5. Chạy Test Tự Động & Headless Mode (Test Contract v1.2)

Simulation engine tách rời hoàn toàn với đồ họa, tuân thủ nghiêm ngặt 12 bước xử lý trong mỗi tick ở 60Hz:

```bash
# Chạy toàn bộ Unit Tests & Regression Tests (Phase 1, 2, 3 - 19 tests):
npm test

# Chạy đo hiệu năng 1 Đêm đầy đủ (21.600 ticks hoàn thành trong ~0.37s):
npm run benchmark

# Chạy mô phỏng Headless xuất JSONL chuẩn v1.2:
npm run test:headless
```

---

## 6. Sáng tạo của tôi (Đánh giá theo Rubric F)

1. **Biển mây huyền ảo**: Đảo Bến, Đảo Cau và Đảo Chuông bồng bềnh giữa biển mây chuyển động chân thực.
2. **Âm thanh Procedural Web Audio API**: Tự động tổng hợp đầy đủ âm thanh nhảy, lướt, chuông thắp đèn, sóng pulse, bục nhảy và tiếng lá bay báo gió mà không phụ thuộc file âm thanh ngoài.
3. **Cốt truyện dẫn chuyện cổ tích**: Lời căn dặn của Ông Đăng trước mỗi đêm chơi tạo không khí ấm áp, đậm đà bản sắc.
4. **Bục nhảy năng lượng & Vòng bảo vệ**: Bục nhảy phát sáng hào quang nâng người chơi bay qua vực thẳm và vòng an toàn rực rỡ quanh các đèn lồng đã thắp.
