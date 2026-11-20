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

### Bước 3.2 & 3.3: Cập nhật Engine Simulation v1.2, Suite Test Hồi quy & Test Suite Phase 3
- Hoàn thiện toàn bộ logic mô phỏng theo Contract v1.2 (`src/core/simulation.js`):
  - Hao hụt dầu 1.0/s ở bước 2 tick loop, Bóng Mực hút 5.0/s ở trạng thái `drain`.
  - Đèn hết dầu chuyển tắt ngay sau bước 2, phát sự kiện `lantern_out`, ghi nhớ `ever_lit = true`.
  - Cơ chế châm dầu (Refuel) nạp tối đa tới 100, chỉ nhận đom đóm khi chưa đầy dầu, thưởng +5 điểm/đom đóm.
  - Cơ chế thắp lại (Relight) đèn `ever_lit` chỉ tốn 5 đom đóm, thưởng +40 điểm thắp lại (+25 điểm nạp).
  - Trạng thái `drain` của Bóng Mực khi ở gần đèn yếu (`fuel < 30`, XZ <= 2m), phát `fuel_drain` định kỳ mỗi 60 ticks.
  - Tỏa Sáng (Pulse) làm choáng Bóng Mực đang drain thưởng +15 điểm (bổ sung +10 điểm thưởng).
  - Vùng an toàn chỉ kích hoạt khi đèn có `fuel >= 30`. Đẩy Bóng Mực ra mép trong 30 tick khi châm dầu vượt ngưỡng.
  - Sức chứa túi đom đóm tăng dần: `10 + 2 * successful_lights`, tối đa 20.
  - Luật thắng mới `dawn_survived` khi hết giờ và >= 60% đèn sáng; luật thua `dawn` và `no_flames`.
- Cập nhật test hồi quy cũ `tests/test_simulation.js` phù hợp với Ticket-03 (giải trình lý do thay đổi luật điểm và luật thắng).
- Xây dựng test suite Phase 3 đầy đủ `tests/test_phase3.js` với 7 kịch bản kiểm thử bao phủ toàn bộ cơ chế mới.
- Sinh các tệp bằng chứng headless: `docs/proof/proof_refuel.jsonl`, `docs/proof/proof_drain.jsonl`, `docs/proof/proof_relight.jsonl`.
- Kết quả: 6/6 test hồi quy Phase 1, 6/6 test Phase 2, 7/7 test Phase 3 đều đạt 100%; benchmark 21.600 tick đạt 0.379s (<= 30s).
- Ước tính token sử dụng: ~6,500 tokens.
