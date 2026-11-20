# Giả định kỹ thuật & Yêu cầu qua các Phase

## Phase 1 (PRD-0) — Đêm 1: Đảo Bến
*(Đã lưu trữ và hoàn thành ở tag `phase-1`)*

---

## Phase 2 (TICKET-02) — "Ba hòn đảo" (Contract v1.1)

### 1. Thay đổi chuẩn hóa từ Ticket-02 (thay thế giả định Phase 1)
- **Chi phí thắp đèn**: Tăng từ 5 lên **10 đom đóm**. Cho phép nạp nhiều lần, đèn ghi nhớ tiến độ tích lũy.
- **Bán kính tương tác đèn**: Chuẩn hóa thành **2.0 m** (Phase 1 dùng 2.5 m).
- **Bán kính nhặt đom đóm**: Chuẩn hóa thành **XZ ≤ 1.0 m** và chênh cao giữa chân Mây và mặt đất nơi đặt đom đóm **≤ 1.5 m** (Phase 1 dùng 1.5 m).
- **Kỹ năng Tỏa Sáng (Pulse)**:
  - Chi phí: Tăng từ 1 lên **3 đom đóm** (không đủ 3 con thì không kích hoạt).
  - Hồi chiêu: **3.0 s** (Phase 1 dùng 1.0 s).
  - Điểm thưởng trúng pulse: Chuẩn hóa thành **+5 điểm/con** (Phase 1 dùng 20 điểm).
  - Thời gian choáng: 120 ticks, đẩy lùi 4 m trong 15 tick đầu theo phương ngang.
- **Bóng Mực (Shades)**:
  - Tốc độ: 4.0 m/s (Đêm 3 là 4.5 m/s).
  - Phạm vi phát hiện: 12 m; bỏ đuổi khi Mây vượt quá 18 m.
  - Trạng thái chuẩn hóa bắt buộc: `spawning`, `wander`, `chase`, `recoil`, `stunned`.
  - Va chạm: XZ ≤ 1.0 m và chênh cao ≤ 1.5 m. Gây hit lùi 2 m trong 60 tick. Mây bất tử 90 tick và rơi `floor(carried / 2)` đom đóm ra vành 1.5–2.5 m (tồn tại 480 tick).
- **Rơi khỏi đảo**: `fall_enabled = true`. Khi Y < -10 m: mất 1 flame, mất toàn bộ đom đóm, chờ 60 tick rồi hồi sinh tại vị trí xuất phát với vận tốc 0, bất tử 90 tick.
- **Điểm thắng cuộc**: `+ floor(giây còn lại) × 2 + 50 × Ngọn Lửa còn lại`.

### 2. Tính năng mới & Cơ chế mở rộng
- **Kỹ năng Lướt (Dash)**:
  - Tốc độ: 14 m/s trong 0.2 s (12 ticks).
  - Hồi chiêu: 1.5 s tính từ lúc bắt đầu lướt.
  - Hướng lướt: Theo hướng di chuyển; nếu đứng yên thì theo hướng quay mặt. Trên không giữ nguyên độ cao (Y vel = 0).
- **Nhảy**: Vận tốc 7.0 m/s, trọng lực -20 m/s², chỉ nhảy khi chạm đất (`grounded`).
- **Gió Lạc (Drifters)** (Đêm 2 & 3):
  - Tốc độ bay 7.0 m/s, tối đa 2 con. Sinh tại tick 1200, 2400...
  - Khi Mây mang ≥ 5 đom đóm và cách ≤ 15 m: Gió Lạc chuyển `chase` cướp `min(3, carried)` đom đóm rồi chuyển sang `flee` bay ra xa trong 240 tick rồi biến mất.
  - Nếu bị Pulse trúng lúc đang flee mang đồ: Rơi toàn bộ đom đóm đã cướp lại tại chỗ.
- **Bùa Gió (Wind Charm)**:
  - Nhặt được như đom đóm, hiệu lực 600 tick: Tăng tốc độ chạy lên 7.2 m/s và Lướt Dash không có thời gian hồi chiêu! Tái xuất hiện sau 2700 tick.
- **Bục nhảy (Jump pads)**:
  - Đêm 2: Bắn người chơi lên Y=14 m/s và vận tốc ngang 24 m/s hướng về tâm đảo kia.
  - Đêm 3: Bắn lên tầng 2 (Y=12 m/s, ngang 8 m/s hướng -Z).
- **Gió mạnh (Đêm 3)**:
  - Mỗi 30 s có một cơn gió 5 s đẩy người chơi 2 m/s theo hướng ngẫu nhiên (báo trước 2 s).
- **Hệ thống 3 Đêm**:
  - Đêm 1 (Đảo Bến, 300s, 5 đèn L1..L5).
  - Đêm 2 (Đảo Cau, 330s, 6 đèn L1..L6, 2 đảo nối cầu tre, bục nhảy, Gió Lạc, Bùa Gió).
  - Đêm 3 (Đảo Chuông, 360s, 7 đèn L1..L7, 3 tầng, tháp chuông, bục nhảy, gió mạnh).
