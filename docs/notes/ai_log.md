# Nhật ký sử dụng AI & Ước tính Token

## Phase 1 — Đêm 1: Đảo Bến (Hoàn thành)
- Tổng token ước tính Phase 1: ~14,000 tokens.

## Phase 2 — "Ba hòn đảo" (Hoàn thành)
- Tổng token ước tính Phase 2: ~14,500 tokens.

---

## Phase 3 — Change Request "Đèn cạn dầu" (Ticket-03, Contract v1.2)

### Bước 3.1: Thiết lập ADR, Changelog Breaking Changes & Nâng cấp Contract v1.2
- Viết tài liệu quyết định thiết kế `docs/notes/adr_001_lantern_fuel_and_win_condition.md` (ADR-001) giải trình chi tiết lý do và kiến trúc chuyển đổi mô hình đèn có nhiên liệu và luật thắng bình minh.
- Viết `CHANGELOG.md` liệt kê toàn bộ các breaking changes theo đúng yêu cầu DoD của Phase 3.
- Nâng cấp `game.contract.json` lên bản v1.2 với các thông số chuẩn hóa mới:
  - `fuel_max: 100`, `fuel_decay_per_s: 1.0`, `relight_cost: 5`, `low_fuel_threshold: 30`, `drain_per_s: 5`, `win_ratio: 0.6`, `capacity_max: 20`.
  - Cập nhật thời lượng đêm: 240s / 270s / 300s.
  - Cập nhật bảng điểm mới v1.2.
- Cập nhật hướng dẫn `AGENTS.md` và tài liệu giả định `docs/notes/assumptions.md`.
- Ước tính token sử dụng: ~3,000 tokens.
