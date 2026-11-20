# Kịch bản Video Demo — Đảo Đèn Lồng (Release v1.0.0)

> **Thời lượng video**: < 5 phút  
> **Định dạng**: MP4  
> **Người thực hiện**: Vũ Văn Hào — MSSV: `2A202603419`

---

## 1. Cấu trúc Video Demo

### Phân cảnh 1: Giới thiệu & Khởi chạy (0:00 - 0:30)
- Mở Terminal: Chạy `npm test` chứng minh 19/19 tests đạt 100%.
- Chạy `npm run benchmark` chứng minh 21.600 ticks hoàn thành trong ~0.35s (đạt chuẩn $\le 30$s).
- Khởi động server với `npm start` và mở trình duyệt tại `http://localhost:3000`.

### Phân cảnh 2: Gameplay Đêm 1 — Đảo Bến (0:30 - 1:45)
- Di chuyển nhân vật Mây, nhặt đom đóm phát sáng.
- Thắp sáng ngọn đèn đầu tiên (+100 điểm, +5 điểm/đom đóm nạp).
- Thể hiện thanh đo nhiên liệu 3D trên đỉnh đèn.
- Quan sát Bóng Mực tiếp cận hút dầu (`drain`) và sử dụng Tỏa Sáng (Pulse phím Q) để làm choáng và nhận thưởng $+15$ điểm.
- Bật/tắt chế độ Mù màu "Bảng màu dễ phân biệt" để quan sát mắt/viền Bóng Mực chuyển màu `#00B3FF`.

### Phân cảnh 3: Gameplay Đêm 2 — Đảo Cau (1:45 - 2:45)
- Nhảy qua Bục Nhảy thần tốc vượt qua vực thẳm sang đảo thứ 2.
- Nhặt Bùa Gió tăng tốc độ và lướt Dash liên tục không hồi chiêu.
- Đối đầu Gió Lạc: Gió Lạc cướp đom đóm, Mây dùng Tỏa Sáng đánh trúng để thu hồi lại đom đóm rơi.

### Phân cảnh 4: Gameplay Đêm 3 — Đảo Chuông (2:45 - 3:45)
- Vượt qua địa hình 3 tầng giật cấp lên đỉnh tháp chuông cổ kính 8m.
- Đón đầu và né tránh các cơn gió giật mạnh theo chu kỳ.
- Thắp sáng các ngọn đèn, duy trì tỷ lệ sáng $\ge 60\%$ cho tới khi đồng hồ về 0 để nhận kết quả chiến thắng bình minh `dawn_survived`.

### Phân cảnh 5: Chế độ Headless CLI & Tổng kết (3:45 - 4:30)
- Chạy mô phỏng Headless CLI qua dòng lệnh xuất file `.jsonl` chuẩn Test Contract v1.2.
- Tổng kết mã nguồn, git history và các thẻ tag `phase-1`, `phase-2`, `phase-3`, `phase-4`, `v1.0.0`.
