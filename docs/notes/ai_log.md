# Nhật ký sử dụng AI & Ước tính Token

## Phase 1 — Đêm 1: Đảo Bến
- Hoàn thành đầy đủ 5 bước, sinh bằng chứng, kiểm thử tự động, tag `phase-1` và push GitHub.
- Tổng token ước tính Phase 1: ~14,000 tokens.

---

## Phase 2 — "Ba hòn đảo" (Ticket-02, Contract v1.1)

### Bước 2.1: Cập nhật AI Harness & Hợp đồng Test Contract v1.1
- Cập nhật quy định 12 bước xử lý mỗi tick trong `AGENTS.md`.
- Nâng cấp `game.contract.json` lên bản v1.1 với toàn bộ thông số chuẩn hóa bắt buộc.
- Tài liệu hóa toàn bộ thay đổi và giả định vào `docs/notes/assumptions.md`.
- Ước tính token sử dụng: ~2,500 tokens.

### Bước 2.2: Nâng cấp Core Simulation Engine & Headless Runner (Contract v1.1)
- Áp dụng thứ tự xử lý nghiêm ngặt 12 bước trong `src/core/simulation.js`.
- Hỗ trợ 3 bản đồ chuẩn, thực thể mới (Gió Lạc, Bùa Gió, bục nhảy, lướt Dash, rơi vực).
- Chuẩn hóa 5 trạng thái Bóng Mực: spawning, wander, chase, recoil, stunned.
- Nâng cấp `src/headless.js` xuất Snapshot và Events đầy đủ theo schema v1.1.
- Ước tính token sử dụng: ~4,000 tokens.

### Bước 2.3: Kiểm thử tự động, Kiểm tra không hồi quy & Đo hiệu năng
- Cập nhật bộ test chống hồi quy Phase 1 `tests/test_simulation.js` -> 6/6 tests pass.
- Xây dựng bộ test tính năng mới Phase 2 `tests/test_phase2.js` -> 6/6 tests pass.
- Benchmark 21.600 ticks tại `tests/benchmark_perf.js` hoàn thành trong 0.093 giây (đạt chuẩn ≤ 30s).
- Sinh kịch bản và bằng chứng headless tại `docs/proof/proof_dash.jsonl`, `docs/proof/proof_charm.jsonl`, `docs/proof/proof_drifter.jsonl`.
- Ước tính token sử dụng: ~3,500 tokens.

### Bước 2.4: Nâng cấp Giao diện 3D (Three.js), HUD cao cấp & Chuỗi 3 Đêm
- Áp dụng bảng màu chuẩn hóa bắt buộc (bầu trời `#0E1430`, đom đóm `#FFF6C2`, Bóng Mực `#120A1A`, Mây `#E8E2D0` với khăn đỏ `#C8102E`, viền vàng `#F2C14E`).
- Xây dựng 3 bản đồ 3D chuyển đổi mượt mà:
  - Đêm 1: Đảo Bến (r=40m).
  - Đêm 2: Đảo Cau (2 đảo r=28m, cầu tre, bục nhảy năng lượng, Bùa Gió, Gió Lạc).
  - Đêm 3: Đảo Chuông (3 tầng địa hình giật cấp Y=0, Y=3, Y=6, tháp chuông đồng cổ kính, bục nhảy, cảnh báo gió mạnh).
- Nâng cấp HUD: Thanh 10 ô đom đóm trực quan, biểu tượng hồi chiêu Lướt & Tỏa Sáng kèm overlay, gợi ý nạp đèn gần nhất, cảnh báo Bùa Gió.
- Hệ thống Menu chuỗi 3 Đêm: Giới thiệu cốt truyện lời Ông Đăng, chuyển đêm khi thắng, màn hình Bình Minh khi thắng Đêm 3, Menu tạm dừng (Esc/P) kèm cài đặt âm lượng & độ nhạy chuột lưu vào localStorage.
- Ước tính token sử dụng: ~4,500 tokens.
