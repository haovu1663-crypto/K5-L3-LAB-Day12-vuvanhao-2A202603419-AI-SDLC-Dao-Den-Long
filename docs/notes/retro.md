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

## 4. Kế hoạch cho Phase 3 (Đã hoàn thành)
- Sẵn sàng đón nhận Ticket-03 (thay đổi luật chơi trong 30 phút).
- Chuẩn bị sẵn sàng tinh thần xử lý thay đổi thiết kế nhanh và cập nhật kiểm thử hồi quy.

---

# Báo cáo Đánh giá & Rút kinh nghiệm (Retro) — Phase 3 (Ticket-03)

## 1. Những gì đã làm tốt
- **Quản lý Thay đổi & Kiến trúc Phần mềm (ADR & Changelog)**: Khi nhận Change Request quy mô lớn thay đổi luật cốt lõi (hệ thống nhiên liệu, bỏ kết thúc sớm, chuyển mục tiêu sang bình minh), nhóm đã lập tức thiết lập `adr_001_lantern_fuel_and_win_condition.md` và `CHANGELOG.md` ghi nhận rành mạch mọi breaking changes.
- **Tuân thủ nguyên tắc không bỏ qua Test âm thầm**: Toàn bộ các test cũ bị Ticket-03 thay đổi (`testMotePickup`, `testWinCondition`) đều được cập nhật kèm ghi chú giải trình lý do thay đổi theo tài liệu thiết kế. Đồng thời bảo lưu tuyệt đối 100% các test không bị ảnh hưởng.
- **Bao phủ kiểm thử toàn diện (Test Coverage)**: Viết 7 bài test mới bao phủ triệt để: hao hụt dầu tự nhiên, châm dầu, thắp lại 5 đom đóm, Bóng Mực drain và thưởng +15 điểm Pulse, đẩy vùng an toàn 30 ticks, sức chứa động 10..20, và phân nhánh thắng `dawn_survived` / thua `dawn`.
- **Thiết kế tiếp cận người dùng (Accessibility)**: Chế độ Mù màu được thiết kế thực chất: không chỉ đổi màu bảng mã hex (`#00B3FF`, `#FFFFFF` + ⚠) mà còn thay đổi cả hình thái hình học 3D (đèn tắt xẹp 20%, có vết rách) để người chơi phân biệt hoàn toàn độc lập với màu sắc.
- **Hiệu năng Headless tiếp tục duy trì xuất sắc**: Mô phỏng 21.600 ticks chỉ mất 0.368 giây (vượt xa yêu cầu $\le 30.0$ giây).

## 2. Thách thức & Cách xử lý
- **Thứ tự thực thi trong Tick giữa Tỏa Sáng (Pulse) và AI Bóng Mực (Drain)**: Nếu Bóng Mực chuyển trạng thái sang `chase` khi người chơi vào bán kính 6m trước khi người chơi bấm Tỏa Sáng (bán kính 5m), người chơi sẽ không bao giờ nhận được điểm thưởng $+15$ khi đánh trúng con đang drain. Bằng cách thực thi đúng thứ tự 12 bước (Step 7: Tỏa Sáng chạy TRƯỚC Step 8: Di chuyển Bóng Mực), người chơi hoàn toàn có thể lao vào bấm Pulse stun con đang hút dầu và nhận trọn $+15$ điểm!
- **Đơn vị thời gian khi test tua nhanh bình minh**: Đảm bảo sử dụng đúng biến thời gian chuẩn `sim.time_left_s = 1 / 60` thay vì các biến tick cục bộ, giúp điều kiện kiểm tra bình minh kích hoạt chính xác tại tick kế tiếp.

## 3. Quản lý Token & Chi phí
- **Tổng token sử dụng Phase 3**: ~13,500 tokens.
- **Kỹ thuật tiết kiệm token**: Triển khai theo từng bước rõ ràng (Step 3.1: ADR & Contract -> Step 3.2: Simulation Engine -> Step 3.3: Unit Test & Proofs -> Step 3.4: 3D Visuals & Colorblind -> Step 3.5: Docs & Tag), tránh lặp lại ngữ cảnh không cần thiết.

## 4. Kế hoạch cho Phase 4 (Đã hoàn thành)
- Hoàn thiện sản phẩm cuối cùng (Release v1.0.0).
- Chuẩn bị video demo `.mp4` dưới 5 phút thể hiện toàn bộ tính năng 3D, gameplay cả 3 đêm, chế độ mù màu và chạy headless CLI.
- Hoàn thiện tài liệu `SUBMISSION.md`, `CREDITS.md`, `LICENSE`.

---

# Báo cáo Đánh giá Tổng kết Dự án (Final Retro) — Release v1.0.0

## 1. Những bài học lớn qua 4 Phase phát triển
- **Kiến trúc Tách biệt Logic & Hiển thị (Decoupled Engine)**: Là quyết định kiến trúc đúng đắn nhất trong toàn bộ dự án. Giúp simulation chạy độc lập hoàn toàn ở 60Hz, hỗ trợ headless CLI cực nhanh (21.600 ticks trong ~0.35s) và cho phép viết bộ test tự động độc lập với môi trường trình duyệt.
- **Quản lý Thay đổi & Hạn chế Hồi quy (Regression Defense)**: Khi nhận Change Request Ticket-03 thay đổi cốt lõi (chuyển sang đèn có nhiên liệu, bỏ kết thúc sớm, tính điểm mới), việc lập ADR và cập nhật bộ test cũ có giải trình lý do rõ ràng giúp dự án chuyển hướng mượt mà mà không để sót bất kỳ lỗi hồi quy nào.
- **Khai thác AI hiệu quả với Agentic Harness**:
  - Tận dụng `AGENTS.md` để quy định thứ tự 12 bước trong 1 tick, chuẩn hóa Test Contract.
  - Phân tích các lần AI mắc lỗi (như đếm trùng tick stun, hoặc nhầm lẫn logic camera Y/Z) để bổ sung ngay vào quy tắc harness, ngăn lỗi tái diễn.
- **Tiếp cận Đa dạng Người dùng (Accessibility)**: Chế độ mù màu được thiết kế thực chất cả về màu sắc (`#00B3FF`, `#FFFFFF`) và hình học 3D (đèn xẹp 20%, có vết rách khi tắt).

## 2. Thống kê & Quản lý Token Toàn Dự án
- **Phase 1**: ~14,000 tokens.
- **Phase 2**: ~14,500 tokens.
- **Phase 3**: ~16,000 tokens.
- **Phase 4 & Release**: ~6,500 tokens.
- **Tổng toàn bộ dự án**: ~51,000 tokens (nằm trong hạn mức an toàn, tối ưu cao).

## 3. Nếu làm lại từ đầu thì sẽ thay đổi điều gì?
- Viết sẵn hệ thống Test Harness v1.2 ngay từ đầu để sẵn sàng cho các biến thể luật chơi phức tạp hơn.
- Tự động hóa việc ghi snapshot JSONL bằng benchmark script thay vì chạy lệnh thủ công.
