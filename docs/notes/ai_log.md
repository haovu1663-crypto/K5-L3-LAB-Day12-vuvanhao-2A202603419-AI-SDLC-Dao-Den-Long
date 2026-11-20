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
- Cập nhật bộ test chống hồi quy Phase 1 `tests/test_simulation.js` với số liệu chuẩn hóa mới -> Đạt 100% (6/6 tests).
- Xây dựng bộ test tính năng mới Phase 2 `tests/test_phase2.js` (Dash, Nhảy, Rơi đảo, Bùa Gió, Gió Lạc, Pause) -> Đạt 100% (6/6 tests).
- Benchmark 1 Đêm đầy đủ (21.600 ticks) tại `tests/benchmark_perf.js` hoàn thành trong **0.093 giây** (vượt xa yêu cầu DoD ≤ 30.0 giây, nhanh gấp hơn 300 lần).
- Sinh các file kịch bản headless mới và bằng chứng JSONL tại `docs/proof/proof_dash.jsonl`, `docs/proof/proof_charm.jsonl`, `docs/proof/proof_drifter.jsonl`.
- Ước tính token sử dụng: ~3,500 tokens.
