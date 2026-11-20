# Nhật ký sử dụng AI & Ước tính Token

## Phase 1 — Đêm 1: Đảo Bến

### Bước 1: Setup khung dự án (Checkpoint 0)
- Tạo `AGENTS.md`, cấu trúc thư mục `docs/`, `LICENSE`, `CREDITS.md`, `.gitignore`.
- Ước tính token sử dụng: ~1,500 tokens.

### Bước 2: Phân tích PRD-0 & Thiết lập Test Contract
- Phân tích chi tiết yêu cầu PRD-0 và Test Contract v1.0.
- Xác định bộ thông số `tuning` cân bằng cho gameplay và test headless.
- Khởi tạo file `game.contract.json` và cập nhật tài liệu giả định `docs/notes/assumptions.md`.
- Ước tính token sử dụng: ~2,500 tokens.
- Kỹ thuật tiết kiệm token: Đọc tài liệu tập trung, trích xuất tham số trực tiếp, không sinh mã boilerplate dư thừa.

### Bước 3: Core Simulation & Trình chạy Headless CLI
- Xây dựng PRNG tất định `src/core/prng.js` (Mulberry32).
- Xây dựng Game Simulation Engine thuần túy `src/core/simulation.js` (tách rời 100% đồ họa).
- Xây dựng CLI Headless `src/headless.js` chuẩn theo Test Contract v1.0, hỗ trợ `--seed`, `--scenario`, `--inputs`, `--ticks`, `--out`, `--snapshot-every`.
- Bộ unit test 6 kịch bản `tests/test_simulation.js` kiểm tra tất định, nhặt đom đóm, nạp đèn, pulse đẩy lùi Bóng Mực, Bóng Mực tấn công, điều kiện thắng/thua. Toàn bộ test pass 100%.
- Chạy thử xuất file `docs/proof/sample_headless.jsonl`.
- Ước tính token sử dụng: ~3,500 tokens.
