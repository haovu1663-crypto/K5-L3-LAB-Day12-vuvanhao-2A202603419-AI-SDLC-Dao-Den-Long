# Đảo Đèn Lồng — 3D Game (Day 12 AI SDLC)

> **Video Demo**: [Xem video demo tại GitHub Release v1.0.0](https://github.com/haovu1663-crypto/K5-L3-LAB-Day12-vuvanhao-2A202603419-AI-SDLC/releases) *(hoặc tại `docs/demo/demo.mp4`)*  
> **Sinh viên thực hiện**: Vũ Văn Hào — MSSV: 2A202603419  
> **Phiên bản hiện tại**: Phase 2 — Ticket-02: "Ba Hòn Đảo" (Contract v1.1)

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

## 4. Cơ chế Tính Điểm & Luật Chơi Chuẩn Hóa (Phase 2)

- **Nhặt đom đóm**: +10 điểm/con (sức chứa tối đa 10 con).
- **Nạp & Thắp Đèn**: +10 điểm mỗi con nạp vào đèn, +100 điểm khi đèn thắp sáng hoàn toàn (mỗi đèn cần 10 đom đóm).
- **Tỏa Sáng trúng Bóng Mực**: +5 điểm mỗi con (kể cả con đang bị choáng).
- **Thưởng Thắng Đêm**: $+ \lfloor\text{giây còn lại}\rfloor \times 2 + 50 \times \text{Ngọn Lửa còn lại}$. Tổng điểm game là tổng điểm các Đêm đã thắng.
- **Thắng**: Thắp sáng toàn bộ Đèn Lồng trong Đêm (Đêm 1: 5 đèn; Đêm 2: 6 đèn; Đêm 3: 7 đèn).
- **Thua**: Mất hết 3 ngọn lửa (bị Bóng Mực chạm trúng 3 lần) hoặc hết thời gian Đêm (Đêm 1: 300s, Đêm 2: 330s, Đêm 3: 360s).
- **Rơi khỏi đảo ($Y < -10$)**: Mất 1 ngọn lửa, mất toàn bộ đom đóm đang giữ, chờ 60 tick và hồi sinh tại điểm xuất phát kèm 90 tick bất tử.
- **Bùa Gió**: Tăng tốc độ chạy lên 7.2 m/s và Lướt Dash không có thời gian hồi chiêu trong 600 ticks.
- **Gió Lạc**: Khi mang $\ge 5$ đom đóm, Gió Lạc sẽ đuổi theo cướp 3 đom đóm rồi bỏ chạy. Dùng Tỏa Sáng trúng Gió Lạc đang chạy trốn để thu hồi lại đom đóm!

---

## 5. Chạy Test Tự Động & Headless Mode (Test Contract v1.1)

Simulation engine tách rời hoàn toàn với đồ họa, tuân thủ nghiêm ngặt 12 bước xử lý trong mỗi tick ở 60Hz:

```bash
# Chạy toàn bộ Unit Tests & Regression Tests:
npm test

# Chạy đo hiệu năng 1 Đêm đầy đủ (21.600 ticks hoàn thành trong ~0.09s):
npm run benchmark

# Chạy mô phỏng Headless xuất JSONL chuẩn v1.1:
npm run test:headless
```

---

## 6. Sáng tạo của tôi (Đánh giá theo Rubric F)

1. **Biển mây huyền ảo**: Đảo Bến, Đảo Cau và Đảo Chuông bồng bềnh giữa biển mây chuyển động chân thực.
2. **Âm thanh Procedural Web Audio API**: Tự động tổng hợp đầy đủ âm thanh nhảy, lướt, chuông thắp đèn, sóng pulse, bục nhảy và tiếng lá bay báo gió mà không phụ thuộc file âm thanh ngoài.
3. **Cốt truyện dẫn chuyện cổ tích**: Lời căn dặn của Ông Đăng trước mỗi đêm chơi tạo không khí ấm áp, đậm đà bản sắc.
4. **Bục nhảy năng lượng & Vòng bảo vệ**: Bục nhảy phát sáng hào quang nâng người chơi bay qua vực thẳm và vòng an toàn rực rỡ quanh các đèn lồng đã thắp.
