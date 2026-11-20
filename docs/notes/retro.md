# Báo cáo Đánh giá & Rút kinh nghiệm (Retro) — Phase 2

## 1. Những gì đã làm tốt
- **Quản lý thay đổi yêu cầu chuẩn mực**: Ticket-02 thay đổi nhiều thông số cốt lõi (chi phí đèn tăng từ 5 lên 10, pulse tăng từ 1 lên 3 đom đóm, bán kính nhặt giảm từ 1.5m xuống 1.0m). Nhóm đã cập nhật kịp thời file `game.contract.json`, sửa đổi bộ test cũ và ghi nhận rõ ràng vào `assumptions.md` mà không làm hỏng tính đúng đắn của logic trước đó.
- **Thực thi thứ tự 12 bước nghiêm ngặt**: Việc sắp xếp tuần tự đúng 12 bước xử lý trong mỗi tick giúp loại bỏ triệt để các xung đột trạng thái giữa người chơi, Gió Lạc và Bóng Mực.
- **Tối ưu hiệu năng vượt trội**: Mô phỏng 21.600 ticks hoàn thành trong chỉ 0.093 giây (yêu cầu ≤ 30 giây), đạt tốc độ hơn 233.000 ticks/giây nhờ cấu trúc dữ liệu mảng phẳng và không tạo object dư thừa trong vòng lặp game loop.
- **Giao diện 3D và Cảm giác chơi (Game Feel)**: Dựng 3 đảo với phong cách visual ấm áp cổ tích, bảng màu chuẩn hóa chính xác, HUD hiển thị trực quan các cooldown và cảnh báo bùa/gió.

## 2. Thách thức & Cách xử lý
- **Lỗi đếm tick kép cho trạng thái choáng (Stun)**: Ban đầu biến đếm stun bị giảm ở cả Step 2 (decrement) và Step 8 (move shades). Sau khi rà soát thứ tự 12 bước trong `AGENTS.md`, nhóm đã quy hoạch toàn bộ việc giảm counter về đúng Step 2, giúp test pass chuẩn xác 120 ticks.
- **Lực rơi tự do khi đứng ngoài rìa đảo**: Nhân vật cần được cập nhật `grounded = false` ngay khi độ cao bề mặt trả về `-999` (vực thẳm) để trọng lực bắt đầu kéo nhân vật rơi xuống $Y < -10$.

## 3. Quản lý Token & Chi phí
- **Tổng token sử dụng Phase 2**: ~14,500 tokens.
- **Kỹ thuật tiết kiệm token**: Đọc và gom cụm yêu cầu theo chủ đề (Harness -> Core Logic -> Unit Test -> 3D UI), sửa trực tiếp các hàm liên quan thay vì viết lại toàn bộ file, giữ các kịch bản test gọn gàng.

## 4. Kế hoạch cho Phase 3
- Sẵn sàng đón nhận Ticket-03 (thay đổi luật chơi trong 30 phút).
- Chuẩn bị sẵn sàng tinh thần xử lý thay đổi thiết kế nhanh và cập nhật kiểm thử hồi quy.
