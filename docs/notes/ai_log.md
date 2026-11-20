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

### Bước 4: Tích hợp Giao diện 3D (Three.js) & Web Server
- Tải Three.js r128 phục vụ offline 100% không phụ thuộc internet tại `public/three.min.js`.
- Xây dựng Web Server HTTP Node.js gọn nhẹ không dependency ngoài tại `src/server.js`.
- Xây dựng giao diện web game 3D hoàn chỉnh `public/index.html` và `public/game.js`:
  - Khung cảnh đảo tròn Đảo Bến giữa biển mây, ánh sáng cổ tích ấm áp ban đêm.
  - Nhân vật Mây đội nón lá gắn đèn lồng nhỏ.
  - 5 cột Đèn Lồng Lớn phát sáng cam ấm và vùng an toàn khi nạp đủ đom đóm.
  - Đom đóm bay lơ lửng, Bóng Mực tím đen rượt đuổi, hiệu ứng sóng xung kích Tỏa Sáng (Pulse).
  - Tích hợp hiệu ứng âm thanh procedural bằng Web Audio API.
  - HUD đầy đủ: Flames (máu), đom đóm mang theo, 5 đèn lồng, thời gian, điểm số.
- Đã khởi động máy chủ thành công tại `http://localhost:3000`.
- Ước tính token sử dụng: ~4,500 tokens.
