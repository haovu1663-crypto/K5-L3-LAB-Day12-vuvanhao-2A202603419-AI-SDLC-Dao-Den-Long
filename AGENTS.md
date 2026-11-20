# Quy định Agent (Harness) - Dự án Đảo Đèn Lồng (Cập nhật Phase 3)

## 1. Nguyên tắc cốt lõi
- **Tách biệt logic**: Logic game phải chạy độc lập hoàn toàn với giao diện 3D, hỗ trợ chạy headless qua dòng lệnh.
- **Tuân thủ Test Contract v1.2**:
  - Hỗ trợ đầy đủ tham số `--seed`, `--night 1|2|3`, `--scenario`, `--inputs`, `--ticks`, `--out`, `--snapshot-every`.
  - Thứ tự xử lý 12 bước trong 1 tick (bổ sung trừ dầu ở bước 2, tắt đèn cạn dầu ngay sau bước 2).
  - Snapshot và Event phải chứa đầy đủ các trường mới của contract v1.2 (`fuel`, `ever_lit`, `relit_count`, `capacity`, `drain`).
- **Quản lý Thay đổi & Tránh hồi quy**:
  - Cập nhật các test cũ bị Ticket-03 thay đổi có lý do rõ ràng trong code.
  - Mọi test ẩn Phase 1–2 không bị luật mới thay thế vẫn phải đạt 100%.
- **Hiệu năng**: Chạy 1 đêm đầy đủ (21.600 tick) trong chế độ headless phải hoàn thành trong ≤ 30 giây.

## 2. Thứ tự xử lý trong 1 tick (Contract v1.2)
1. Đọc input (xử lý pause trước; nếu vừa tạm dừng thì dừng bước ở đây).
2. Giảm các bộ đếm: thời gian, hồi chiêu, bất tử, choáng, bùa, TTL đom đóm rơi, hồi bùa, **nhiên liệu đèn** (hao hụt 1/s + Bóng Mực hút 5/s). Ngay sau bước 2, đèn có $\text{fuel} \le 0$ chuyển sang tắt (`lantern_out`).
3. Di chuyển Mây (nhảy, lướt, bục nhảy, gió) rồi kiểm tra rơi khỏi đảo.
4. Nhặt đom đóm và bùa.
5. Tương tác với đèn (thắp mới, thắp lại 5 đom đóm, hoặc châm dầu).
6. Cập nhật vùng an toàn (chỉ đèn có $\text{fuel} \ge 30$ mới có vùng an toàn).
7. Tỏa Sáng (Pulse: làm choáng Bóng Mực, thưởng +15 nếu đang hút dầu).
8. Di chuyển Bóng Mực và Gió Lạc (Bóng Mực wander tìm đèn có $\text{fuel} < 30$).
9. Chạm & Va chạm: Gió Lạc cướp trước, rồi Bóng Mực gây hit.
10. Sinh đom đóm, Bóng Mực, Gió Lạc theo lịch.
11. Xét thắng/thua (sau mọi cập nhật; hết flames luôn thua `no_flames` trước; hết giờ xét `dawn_survived` nếu $\ge 60\%$ đèn sáng, ngược lại thua `dawn`).
12. Ghi snapshot nếu tới lượt.
