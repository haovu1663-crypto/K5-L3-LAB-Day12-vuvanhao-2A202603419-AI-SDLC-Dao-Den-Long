# Quy định Agent (Harness) - Dự án Đảo Đèn Lồng (Cập nhật Phase 2)

## 1. Nguyên tắc cốt lõi
- **Tách biệt logic**: Logic game phải chạy độc lập hoàn toàn với giao diện 3D, hỗ trợ chạy headless qua dòng lệnh.
- **Tuân thủ Test Contract v1.1**:
  - Hỗ trợ đầy đủ tham số `--seed`, `--night 1|2|3`, `--scenario`, `--inputs`, `--ticks`, `--out`, `--snapshot-every`.
  - Tuân thủ nghiêm ngặt thứ tự 12 bước trong 1 tick game.
  - Snapshot và Event phải chứa đầy đủ các trường mới của contract v1.1.
- **Tránh hồi quy (Regression Protection)**: Khi thay đổi số liệu chuẩn hóa, phải cập nhật kịch bản test cũ với lý do rõ ràng, đảm bảo tất cả bài test Phase 1 vẫn pass trên bộ số chuẩn mới.
- **Hiệu năng**: Chạy 1 đêm đầy đủ (21.600 tick) trong chế độ headless phải hoàn thành trong ≤ 30 giây.

## 2. Thứ tự xử lý bắt buộc trong 1 tick (60Hz)
1. Đọc input (xử lý pause trước; nếu vừa tạm dừng thì dừng bước ở đây).
2. Giảm các bộ đếm: thời gian, hồi chiêu, bất tử, choáng, bùa, TTL đom đóm rơi, hồi bùa.
3. Di chuyển Mây (nhảy, lướt, bục nhảy, gió) rồi kiểm tra rơi khỏi đảo (Y < -10).
4. Nhặt đom đóm và bùa.
5. Tương tác với đèn.
6. Cập nhật vùng an toàn.
7. Tỏa Sáng (Pulse).
8. Di chuyển Bóng Mực và Gió Lạc.
9. Chạm & Va chạm: Gió Lạc cướp trước, rồi Bóng Mực gây hit (xét theo id tăng dần).
10. Sinh đom đóm, Bóng Mực, Gió Lạc theo lịch.
11. Xét thắng/thua.
12. Ghi snapshot nếu tới lượt.
