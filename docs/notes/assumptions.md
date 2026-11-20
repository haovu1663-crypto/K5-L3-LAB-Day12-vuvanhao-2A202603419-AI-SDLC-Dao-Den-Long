# Giả định kỹ thuật & Yêu cầu qua các Phase

## Phase 1 (PRD-0) — Đêm 1: Đảo Bến (Đã nghiệm thu)
## Phase 2 (TICKET-02) — "Ba hòn đảo" (Đã nghiệm thu)

---

## Phase 3 (TICKET-03) — Change Request "Đèn cạn dầu" (Contract v1.2)

### 1. Chi tiết Thay đổi Luật Cốt lõi & Giả định Thiết kế
- **Nhiên liệu đèn (`fuel`)**:
  - Thang đo: 0 đến 100. Đèn tắt có `fuel = 0`.
  - Tiêu hao: $1.0$ đơn vị/s. Trong mã nguồn, để loại bỏ sai số số thực, lưu trữ `fuel_ticks` với 1 đơn vị = 60 ticks.
  - Châm dầu (`refuel`): Khi người chơi bấm tương tác với đèn đang sáng:
    $$\text{used} = \min\left(\text{carried}, \left\lceil \frac{100 - \text{fuel}}{10} \right\rceil\right)$$
    $$\text{fuel} = \min(100, \text{fuel} + 10 \times \text{used})$$
    Trừ `used` đom đóm mang theo. Đèn đầy dầu (`used == 0`) không được tương tác.
  - Cạn dầu: Khi $\text{fuel} \le 0$, đèn tắt, `deposited = 0`, `lit = false`, phát sự kiện `lantern_out`, ghi nhớ `ever_lit = true`.
  - Thắp lại: Đèn đã từng sáng (`ever_lit == true`) chỉ cần 5 đom đóm để thắp lại; đèn chưa từng sáng cần 10 đom đóm.
- **Bóng Mực hút dầu (`drain`)**:
  - Khi $\text{fuel} < 30$, đèn mất vùng an toàn 6m. Đúng 30 thì vùng an toàn vẫn còn.
  - Bóng Mực `wander` ưu tiên tìm đèn sáng có $\text{fuel} < 30$ gần nhất (bằng nhau thì id nhỏ hơn).
  - Khi khoảng cách XZ $\le 2.0$m: Bóng Mực chuyển sang `drain`, đứng yên và hút 5 fuel/giây (5/60 mỗi tick). Phát sự kiện `fuel_drain` mỗi 60 tick.
  - Nếu đèn được châm dầu lên $\ge 30$, Bóng Mực đang trong vùng 6m bị đẩy lùi ra mép trong tối đa 30 tick và không gây sát thương trong lúc đó.
- **Luật Thắng Mới (Bình minh)**:
  - Thời lượng: Đêm 1: 240s, Đêm 2: 270s, Đêm 3: 300s.
  - Không còn thắng sớm. Thắng khi hết giờ (bình minh) và số đèn sáng $\ge \lceil 0.6 \times \text{tổng đèn}\rceil$:
    - Đêm 1: $\ge 3/5$ đèn.
    - Đêm 2: $\ge 4/6$ đèn.
    - Đêm 3: $\ge 5/7$ đèn.
  - Lý do kết thúc: `dawn_survived` khi thắng; `no_flames` (hết máu) hoặc `dawn` (hết giờ mà thiếu đèn) khi thua.
- **Sức chứa Đom đóm Tăng dần**:
  - $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$.
  - `successful_lights` tăng 1 mỗi lần thắp sáng thành công (kể cả thắp lại; đèn dựng bằng scenario không tính). Đặt lại 0 đầu mỗi đêm.
- **Hệ thống Điểm chuẩn v1.2**:
  - Mỗi đom đóm nạp (thắp mới, thắp lại, châm dầu): +5 điểm.
  - Thắp lần đầu: +100 điểm.
  - Thắp lại: +40 điểm.
  - Tỏa Sáng trúng Bóng Mực: +5 điểm thường, +15 điểm nếu con đó đang ở trạng thái `drain`.
  - Bình minh khi thắng: +50 điểm/mỗi flame còn lại + (+50 + $\lfloor\text{fuel}\rfloor$)/mỗi đèn đang sáng.
