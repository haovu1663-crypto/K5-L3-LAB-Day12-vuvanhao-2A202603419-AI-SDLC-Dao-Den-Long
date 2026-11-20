# Giả định kỹ thuật & Yêu cầu qua các Phase

## Phase 1 (PRD-0) — Đêm 1: Đảo Bến

### 1. Phạm vi cốt lõi & Tiêu chí nghiệm thu
- **Nhân vật (Mây)**:
  - Tốc độ di chuyển: 6.0 m/s (0.1 m/tick ở 60Hz).
  - Máu (flames): Ban đầu có 3 ngọn lửa (`flames = 3`).
  - Sức chứa đom đóm mang theo tối đa: 10 (`carry_capacity = 10`).
  - Khi bị Bóng Mực đánh trúng: Mất 1 flame, rơi 50% số đom đóm đang mang (`hit_drop_ratio = 0.5`, làm tròn xuống), nhận thời gian miễn nhiễm 1.5s (`invuln_s = 1.5`).
- **Kỹ năng Tỏa sáng (Pulse)**:
  - Tiêu tốn: 1 đom đóm đang giữ (`pulse_cost = 1`). Nếu `carried < 1`, không kích hoạt được pulse.
  - Bán kính: 5.0 m (`pulse_radius = 5.0`).
  - Hiệu ứng lên Bóng Mực: Choáng trong 3.0s (`pulse_stun_s = 3.0`), đẩy lùi 3.0m ra xa người chơi (`pulse_push_m = 3.0`).
  - Hồi chiêu: 1.0s (`pulse_cooldown_s = 1.0`).
- **Đèn Lồng Lớn (5 đèn L1 đến L5)**:
  - Mỗi đèn cần 5 đom đóm để thắp sáng (`lantern_cost = 5`).
  - Khoảng cách tương tác để nạp: 2.5 m (`interact_radius = 2.5`).
  - Nạp khi người chơi nhấn `interact` trong bán kính. Người chơi nạp toàn bộ số đom đóm đang có cho đến khi đèn đủ 5 đom đóm hoặc người chơi hết đom đóm mang theo.
  - Vùng an toàn của đèn đã thắp: Bán kính 6.0 m (`safe_radius = 6.0`). Bóng Mực không thể xâm nhập vùng này (bị cản ở rìa hoặc quay đầu).
- **Đom đóm (Motes)**:
  - Bán kính nhặt: 1.5 m (`pickup_radius = 1.5`). Khi khoảng cách người chơi đến đom đóm <= 1.5m, tự động nhặt nếu chưa đầy sức chứa.
- **Bóng Mực (Shades)**:
  - Tốc độ đuổi: 3.5 m/s.
  - Bán kính chạm gây sát thương: 1.2 m (`shade_hit_radius = 1.2`).
  - Trạng thái: `chase` (đuổi theo người chơi), `stunned` (bị choáng bởi pulse).
- **Màn chơi & Thời gian**:
  - Thời lượng Đêm 1: 300 giây (18.000 ticks ở 60Hz).
  - Điều kiện Thắng: Thắp sáng đủ 5 đèn (`lantern_lit` đủ L1-L5) -> `game_over` kết quả `won`, lý do `all_lit`.
  - Điều kiện Thua:
    - Hết máu (`flames <= 0`) -> `game_over` kết quả `lost`, lý do `no_flames`.
    - Hết thời gian (`time_left_s <= 0`) -> `game_over` kết quả `lost`, lý do `dawn`.
- **Hệ thống điểm**:
  - Nhặt 1 đom đóm: +10 điểm.
  - Thắp sáng 1 đèn: +100 điểm.
  - Choáng 1 Bóng Mực: +20 điểm.
  - Khi thắng, cộng điểm thưởng: +1 điểm mỗi giây còn lại (`per_second_left`), +50 điểm mỗi flame còn lại (`per_flame_left`).
- **Rơi khỏi đảo**: `fall_enabled = false` (Phase 1 tập trung mặt đất phẳng Y=0, không có cơ chế rớt vực).

### 2. Định dạng Tọa độ & Tính tất định
- Đơn vị đo là mét; trục Y hướng lên; mặt đất ở Y = 0.
- Tính toán khoảng cách theo mặt phẳng ngang 2D (XZ): `dist = sqrt((x1-x2)^2 + (z1-z2)^2)`.
- Mọi tọa độ xuất trong file JSONL được làm tròn 3 chữ số thập phân (`toFixed(3)`).
- Sử dụng thuật toán sinh số ngẫu nhiên giả lập (PRNG - LCG/XorShift) theo `--seed` để đảm bảo cùng seed, scenario và input sẽ sinh đúng 100% output JSONL.
