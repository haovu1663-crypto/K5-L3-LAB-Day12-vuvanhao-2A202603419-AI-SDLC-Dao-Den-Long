# CHANGELOG — Dự án Đảo Đèn Lồng

Toàn bộ các thay đổi qua các phiên bản và các thay đổi phá vỡ tương thích (Breaking Changes).

---

## [Phase 3] — Ticket-03: Change Request "Đèn cạn dầu" (Contract v1.2)

### ⚠ Breaking Changes (Thay đổi phá vỡ tương thích)
1. **Loại bỏ Thắng Sớm (`all_lit`)**:
   - Thắp sáng toàn bộ đèn không còn làm kết thúc ván chơi.
   - Lý do kết thúc thắng mới là `dawn_survived` (sống sót tới bình minh và có $\ge 60\%$ đèn sáng).
2. **Đèn có Nhiên liệu & Có thể Bị Tắt**:
   - Luật cũ "đèn đã sáng không nhận thêm đom đóm và không bao giờ tắt" bị bãi bỏ.
   - Đèn có `fuel` tối đa 100, tự hao $1.0$/giây. Khi `fuel <= 0`, đèn chuyển sang tắt và phát sự kiện `lantern_out`.
   - Đèn đã từng sáng (`ever_lit = true`) khi thắp lại chỉ tốn **5 đom đóm** (thay vì 10).
3. **Vùng an toàn bị suy yếu & Trạng thái Bóng Mực `drain`**:
   - Đèn có `fuel < 30` bị mất vùng an toàn.
   - Bóng Mực có trạng thái mới `drain`, tiếp cận đèn yếu trong phạm vi 2.0m và hút 5 fuel/giây.
4. **Hệ thống Điểm số Mới**:
   - Nạp đom đóm (thắp hoặc châm dầu): +5 điểm/con (thay vì +10).
   - Thắp lần đầu: +100 điểm.
   - Thắp lại: +40 điểm.
   - Tỏa Sáng trúng Bóng Mực: +5 điểm (nếu đang drain: +15 điểm).
   - Bỏ thưởng thời gian khi thắng. Thưởng bình minh: +50 điểm/mỗi flame + (+50 + floor(fuel))/mỗi đèn đang sáng.
5. **Rút ngắn Thời lượng Đêm**:
   - Đêm 1: 240s (cũ: 300s).
   - Đêm 2: 270s (cũ: 330s).
   - Đêm 3: 300s (cũ: 360s).
6. **Nâng cấp Test Contract lên v1.2**:
   - Snapshot bổ sung: `fuel`, `ever_lit`, `relit_count` ở từng đèn; `capacity` ở người chơi; trạng thái `drain` ở Bóng Mực.
   - Sự kiện mới: `refuel`, `lantern_out`, `fuel_drain`, trường `relight` trong `lantern_lit`.

### New Features (Tính năng mới)
- **Sức chứa tăng dần**: Sức chứa đom đóm mở rộng từ 10 lên tối đa 20 dựa trên số lần thắp đèn thành công ($10 + 2 \times \text{successful\_lights}$).
- **Châm dầu đèn**: Tương tác với đèn đang sáng để châm dầu (nạp 10 fuel/đom đóm).
- **Chế độ Hỗ trợ Mù màu (Colorblind Accessibility)**: Tùy chọn bảng màu tương phản cao (mắt Bóng Mực chuyển `#00B3FF`, UI cảnh báo `#FFFFFF` kèm icon ⚠, đèn tắt xẹp 20%).

---

## [Phase 2] — Ticket-02: "Ba hòn đảo" (Contract v1.1)
- Chuẩn hóa số liệu điều khiển (Mây 6.0m/s, nhảy 7.0m/s, lướt 14.0m/s).
- Mở rộng 3 Đêm: Đảo Bến, Đảo Cau (cầu tre, bục nhảy), Đảo Chuông (3 tầng địa hình, tháp chuông, gió mạnh).
- Bổ sung thực thể mới: Gió Lạc (Drifters), Bùa Gió (Wind Charm), Đom đóm rơi (TTL 480 ticks).
- Hỗ trợ tạm dừng (Pause), xuất snapshot và events chuẩn v1.1.

---

## [Phase 1] — PRD-0: Đêm 1 Đảo Bến (Contract v1.0)
- Thiết lập core simulation engine tách biệt 100% đồ họa.
- Kịch bản Đêm 1: Mây thu thập đom đóm thắp 5 đèn L1..L5, né Bóng Mực, dùng Tỏa Sáng.
- Giao diện 3D Three.js và chế độ headless CLI.
