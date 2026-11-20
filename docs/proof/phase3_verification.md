# Báo cáo Nghiệm thu & Kiểm chứng Phase 3 (Ticket-03: "Đèn Cạn Dầu")

> **Dự án**: Đảo Đèn Lồng — Day 12 AI SDLC  
> **Sinh viên**: Vũ Văn Hào — MSSV: `2A202603419`  
> **Phiên bản Contract**: `v1.2`  
> **Git Tag**: `phase-3`  
> **Tài liệu quyết định thiết kế**: [ADR-001 (docs/notes/adr_001_lantern_fuel_and_win_condition.md)](../notes/adr_001_lantern_fuel_and_win_condition.md)  
> **Danh sách Breaking Changes**: [CHANGELOG.md](../../CHANGELOG.md)

---

## 1. Mục tiêu & Yêu cầu của Ticket-03 (DoD)

| Tiêu chí DoD | Trạng thái | Bằng chứng kiểm chứng |
|---|---|---|
| **ADR quyết định thiết kế** | ĐẠT ✓ | `docs/notes/adr_001_lantern_fuel_and_win_condition.md` mô tả kiến trúc fuel & luật thắng bình minh |
| **Changelog Breaking Changes** | ĐẠT ✓ | `CHANGELOG.md` liệt kê chi tiết mọi luật cũ bị thay thế trong Phase 3 |
| **Cập nhật Test cũ bị ảnh hưởng** | ĐẠT ✓ | Cập nhật `tests/test_simulation.js` có giải trình rõ ràng, không skip âm thầm |
| **Bảo lưu 100% Test không bị thay thế** | ĐẠT ✓ | 6/6 test hồi quy Phase 1 và 6/6 test Phase 2 đều đạt 100% |
| **Bộ Test Suite mới Phase 3** | ĐẠT ✓ | `tests/test_phase3.js` gồm 7 kịch bản kiểm thử toàn diện các luật v1.2 |
| **Bằng chứng Headless CLI Contract v1.2** | ĐẠT ✓ | Các tệp `docs/proof/proof_refuel.jsonl`, `proof_drain.jsonl`, `proof_relight.jsonl` |
| **Hiệu năng Headless 21.600 ticks** | ĐẠT ✓ | Hoàn thành trong **0.368 giây** (yêu cầu $\le 30.0$ giây) |
| **Chế độ Mù màu (Accessibility)** | ĐẠT ✓ | Tùy chọn "Bảng màu dễ phân biệt" lưu `localStorage`, viền `#00B3FF`, UI `#FFFFFF` + ⚠, đèn xẹp 20% khi tắt |

---

## 2. Kết quả Chạy Bộ Kiểm Thử Tự Động (`npm test`)

```text
> dao-den-long@1.0.0 test
> node tests/test_simulation.js && node tests/test_phase2.js && node tests/test_phase3.js

--- RUNNING REGRESSION SUITE (PHASE 1 ON STANDARDIZED NUMBERS) ---
Testing determinism...
✓ Determinism test passed!
Testing mote pickup (pickup_radius = 1.0m)...
✓ Mote pickup test passed!
Testing lantern deposit & lighting (cost = 10, interact_radius = 2.0m)...
✓ Lantern deposit & lighting test passed!
Testing pulse (pulse_cost = 3, stun 120 ticks, push 4m in 15 ticks)...
✓ Pulse stun test passed!
Testing shade attack & recoil...
✓ Shade attack test passed!
Testing win condition (Contract v1.2: dawn_survived when time expires and >= 60% lanterns lit)...
✓ Win condition (dawn_survived) test passed!

ALL 6 REGRESSION TESTS PASSED CLEANLY ON STANDARDIZED NUMBERS!
--- RUNNING PHASE 2 NEW FEATURES TEST SUITE ---
Testing Dash mechanism (14 m/s, 12 ticks, cooldown 1.5s)...
✓ Dash mechanics test passed!
Testing Jump and Gravity...
✓ Jump and Gravity test passed!
Testing Fall off island (Y < -10, wait 60 ticks, respawn with 90 invuln)...
✓ Fall off island test passed!
Testing Wind Charm pickup and zero-cooldown dash...
✓ Wind Charm test passed!
Testing Drifter steal and pulse drop recovery...
✓ Drifter steal and pulse recovery test passed!
Testing Pause functionality...
✓ Pause handling test passed!

ALL PHASE 2 FEATURE TESTS PASSED SUCCESSFULLY!
--- RUNNING PHASE 3 NEW FEATURES TEST SUITE (CONTRACT v1.2) ---
Testing fuel decay (1.0/s) and lantern_out when fuel reaches 0...
✓ Fuel decay & lantern_out test passed!
Testing refuel formula and full-fuel rejection...
✓ Refuel mechanics test passed!
Testing relighting cost (5 motes for ever_lit vs 10 first time)...
✓ Relight mechanics test passed!
Testing shade drain state and pulse +15 bonus on draining shade...
✓ Shade drain & pulse bonus test passed!
Testing safe zone pushback when lantern refueled to >= 30...
✓ Safe push on refuel test passed!
Testing dynamic capacity expansion (10 + 2 * successful_lights, max 20)...
✓ Dynamic capacity test passed!
Testing dawn_survived win (>=60% lit) and dawn loss (<60% lit)...
✓ Dawn win & loss test passed!

ALL 7 PHASE 3 FEATURE TESTS PASSED CLEANLY (CONTRACT v1.2)!
```

---

## 3. Kiểm chứng Hiệu năng Headless (`npm run benchmark`)

```text
> dao-den-long@1.0.0 benchmark
> node tests/benchmark_perf.js

--- BENCHMARK: FULL NIGHT (21,600 TICKS) HEADLESS SIMULATION ---
Ticks simulated: 21600
Execution time:  0.368 seconds (367.8 ms)
Simulation rate: 58.733 ticks/second
Performance DoD requirement (<= 30.0s): PASS ✓
✓ Benchmark passed with flying colors!
```

---

## 4. Kiểm chứng Bằng chứng Dữ liệu Headless Contract v1.2

### 4.1. Bằng chứng Châm dầu (`docs/proof/proof_refuel.jsonl`)
- **Kịch bản**: Đèn `L1` đang sáng có $fuel = 75$, Mây mang 2 đom đóm tương tác `interact: true`.
- **Sự kiện ghi nhận**:
  ```json
  {"type":"event","tick":1,"name":"refuel","data":{"lantern_id":"L1","amount":2,"fuel":95}}
  ```
- **Snapshot kiểm chứng**: Mây hết đom đóm (`carried: 0`), điểm cộng $+10$ (+5/đom đóm), nhiên liệu đèn tăng lên 95 và hao hụt 1.0/s tự nhiên ở các tick tiếp theo.

### 4.2. Bằng chứng Bóng Mực hút dầu (`docs/proof/proof_drain.jsonl`)
- **Kịch bản**: Đèn `L1` có $fuel = 20 < 30$, Bóng Mực `S1` ở cách 1m chuyển từ `wander` sang `drain`.
- **Sự kiện ghi nhận**:
  ```json
  {"type":"event","tick":2,"name":"fuel_drain","data":{"lantern_id":"L1","shade_id":"S1","fuel":19.9}}
  ...
  {"type":"event","tick":62,"name":"fuel_drain","data":{"lantern_id":"L1","shade_id":"S1","fuel":13.9}}
  ```
- **Tốc độ hao hụt**: Hao hụt $6.0$ đơn vị fuel trong 60 ticks (1.0 tự nhiên + 5.0 do Bóng Mực hút). Sự kiện `fuel_drain` phát đều đặn mỗi 60 ticks.

### 4.3. Bằng chứng Thắp lại & Sức chứa động (`docs/proof/proof_relight.jsonl`)
- **Kịch bản**: Đèn `L1` đã từng sáng (`ever_lit: true`), nạp 5 đom đóm để thắp lại.
- **Sự kiện ghi nhận**:
  ```json
  {"type":"event","tick":1,"name":"deposit","data":{"lantern_id":"L1","amount":5,"deposited":5}}
  {"type":"event","tick":1,"name":"lantern_lit","data":{"lantern_id":"L1","relight":true}}
  ```
- **Snapshot kiểm chứng**:
  - `relight: true`, `relit_count: 1`, `fuel: 100.0`.
  - Sức chứa túi đom đóm tăng từ $10 \to 12$ (`capacity: 12`).
  - Điểm số tăng $+65$ (+25 nạp + 40 thắp lại).

---

## 5. Kiểm chứng Chế độ Mù Màu & Khả năng Truy cập

1. **Giao diện không phụ thuộc màu sắc**:
   - Đèn tắt/cạn dầu bị xẹp 20% chiều cao (`scale.y = 0.8`) và hiển thị các mảng giấy rách.
   - Đèn sắp cạn dầu ($fuel < 30$) nhấp nháy 1 Hz và mất vòng sáng an toàn.
   - Đèn đang sáng có thanh đo nhiên liệu 3D hiển thị rõ độ đầy dầu.
2. **Cài đặt Bảng màu dễ phân biệt**:
   - Mắt và viền Bóng Mực đổi từ `#7A3CFF` sang `#00B3FF`.
   - Màu cảnh báo UI chuyển từ `#FF5A5F` sang `#FFFFFF` kèm biểu tượng ⚠.
   - Cài đặt được lưu trong `localStorage` và đồng bộ qua mọi màn hình.

---

## 6. Kết luận
Phase 3 đáp ứng đầy đủ và vượt mức tất cả các yêu cầu của **Ticket-03 — Change Request "Đèn cạn dầu"** và **Test Contract v1.2**. Toàn bộ mã nguồn, kiểm thử, tài liệu quyết định thiết kế và bằng chứng đã sẵn sàng cho `phase-3`.
