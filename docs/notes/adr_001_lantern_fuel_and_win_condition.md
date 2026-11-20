# ADR-001: Chuyển đổi mô hình Nhiên liệu Đèn và Luật Thắng Đêm

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày quyết định**: 2026-11-20
- **Phạm vi**: Phase 3 (TICKET-03 — Contract v1.2)
- **Người quyết định**: Vũ Văn Hào (Kỹ sư phát triển)

---

## 1. Bối cảnh & Vấn đề (Context)
Trong Phase 1 và 2, luật chơi quy định:
- Đèn Lớn thắp sáng xong sẽ giữ nguyên trạng thái vĩnh viễn đến hết ván.
- Trò chơi lập tức kết thúc thắng cuộc ngay khi toàn bộ các đèn được thắp sáng (`all_lit`).
- Bóng Mực tuyệt đối không bao giờ có thể xâm nhập vùng an toàn bán kính 6.0m quanh đèn đã thắp.

Kết quả playtest thực tế cho thấy: Người chơi thành thạo có thể thắp hết đèn chỉ trong vòng ~2 phút, dẫn tới việc màn chơi kết thúc quá sớm và thiếu đi tính kịch tính, căng thẳng trong giai đoạn cuối đêm.

## 2. Quyết định Thiết kế (Decision)

### 2.1. Đổi mục tiêu từ "Thắp hết đèn" sang "Giữ đảo sáng tới bình minh"
- Loại bỏ hoàn toàn cơ chế kết thúc thắng sớm `all_lit`. Đêm chơi sẽ diễn ra liên tục cho đến khi hết thời gian (bình minh).
- Thời lượng các Đêm được rút ngắn để tăng nhịp độ: Đêm 1: 240s, Đêm 2: 270s, Đêm 3: 300s.
- **Điều kiện Thắng**: Mây còn sống (flames > 0) khi hết giờ và số đèn đang sáng tại tick cuối cùng đạt tối thiểu 60% tổng số đèn ($\ge \lceil 0.6 \times N\rceil$):
  - Đêm 1: $\ge 3/5$ đèn sáng.
  - Đêm 2: $\ge 4/6$ đèn sáng.
  - Đêm 3: $\ge 5/7$ đèn sáng.
  - Sự kiện kết thúc: `game_over` với `reason: "dawn_survived"`.

### 2.2. Mô hình Nhiên liệu Đèn (`fuel`) & Cơ chế Thắp lại (`ever_lit`)
- Mỗi ngọn đèn có thanh nhiên liệu tối đa `fuel_max = 100`.
- Khi vừa thắp (lần đầu hoặc thắp lại): `fuel = 100`.
- Đèn tự động tiêu hao $1.0$ đơn vị/giây ($1/60$ đơn vị mỗi tick). Để đảm bảo tính tất định và không bị sai số dấu phẩy động (floating point), mô phỏng sử dụng đơn vị tick chuẩn ($6000$ tick fuel tối đa).
- Khi đèn đang sáng, người chơi có thể châm dầu bằng phím Tương tác: nạp $10$ fuel cho mỗi đom đóm mang theo.
- Khi `fuel <= 0`, đèn tắt (`lantern_out`), ghi nhớ `ever_lit = true`.
- Thắp lại đèn đã từng sáng (`ever_lit = true`) chỉ tốn **5 đom đóm**, trong khi đèn chưa từng sáng cần **10 đom đóm**.

### 2.3. Bóng Mực Hút Dầu (`drain`)
- Khi đèn có `fuel < 30`, vùng an toàn 6m bị vô hiệu hóa.
- Bóng Mực ở trạng thái `wander` sẽ tìm đến ngọn đèn yếu (`fuel < 30`) gần nhất để đứng hút dầu (trạng thái `drain`), làm đèn mất thêm 5 fuel/giây.
- Dùng kỹ năng Tỏa Sáng (Pulse) trúng Bóng Mực đang drain sẽ giải cứu đèn và được cộng thưởng +15 điểm.

### 2.4. Mở rộng Sức chứa Đom đóm (`capacity`)
- Ban đầu: 10 đom đóm.
- Mỗi lần thắp đèn thành công (kể cả thắp lại): $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$.

## 3. Hệ quả & Tác động (Consequences)
- **Breaking Changes**: Các kịch bản test cũ kỳ vọng thắng sớm bằng `all_lit` sẽ không còn hợp lệ và phải được cập nhật sang kiểm tra luật mới hoặc luật bình minh.
- **Hiệu năng**: Các phép tính trừ nhiên liệu và tìm đèn yếu được tối ưu dạng mảng tĩnh, đảm bảo vẫn hoàn thành 21.600 ticks trong $< 0.1$ giây.
