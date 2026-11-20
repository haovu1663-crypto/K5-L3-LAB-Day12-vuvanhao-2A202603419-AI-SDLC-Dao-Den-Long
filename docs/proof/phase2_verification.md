# Báo cáo Kiểm chứng Phase 2 (Verification Report)

## Dự án: Đảo Đèn Lồng — Ticket-02: "Ba Hòn Đảo" (Contract v1.1)

### 1. Ma trận Truy vết Yêu cầu & Bằng chứng (Traceability Matrix)

| Yêu cầu (Ticket-02) | Phương pháp kiểm chứng | Bằng chứng kiểm chứng | Kết quả |
|---|---|---|---|
| **1. Chống hồi quy (Regression)** | Chạy lại 6 test Phase 1 trên bộ số chuẩn hóa mới | [tests/test_simulation.js](../../tests/test_simulation.js) | **ĐẠT (6/6 tests pass)** |
| **2. Kỹ năng Lướt (Dash)** | Scenario `scenario_dash.json`: lướt 14 m/s trong 12 ticks, cd 90 ticks | [docs/proof/proof_dash.jsonl](proof_dash.jsonl) L2: sự kiện `dash` | **ĐẠT** |
| **3. Nhảy & Trọng lực** | Unit test `testJumpAndGravity`: $V_y=7$, $g=-20$, tiếp đất an toàn | [tests/test_phase2.js](../../tests/test_phase2.js) | **ĐẠT** |
| **4. Rơi khỏi đảo (Y < -10)** | Unit test `testFallOffIsland`: -1 flame, mất đom đóm, hồi sinh sau 60 ticks kèm 90 ticks bất tử | [tests/test_phase2.js](../../tests/test_phase2.js) -> sự kiện `player_hit` by `fall`, `lost: true` | **ĐẠT** |
| **5. Bùa Gió (Wind Charm)** | Scenario `scenario_charm.json`: nhặt C1, tăng tốc 7.2 m/s, Dash 0 cooldown | [docs/proof/proof_charm.jsonl](proof_charm.jsonl) L2: `charm_picked`, `charm_ticks: 600` | **ĐẠT** |
| **6. Gió Lạc (Drifter)** | Scenario `scenario_drifter.json`: cướp đom đóm khi $\ge 5$ con, nhả lại khi bị Pulse | [docs/proof/proof_drifter.jsonl](proof_drifter.jsonl) L2: `drifter_steal`, L3: `drifter_drop` | **ĐẠT** |
| **7. Tạm dừng (Pause)** | Unit test `testPauseHandling`: Esc/P tạm dừng `sim_tick` và thời gian | [tests/test_phase2.js](../../tests/test_phase2.js) -> sự kiện `paused`, `resumed` | **ĐẠT** |
| **8. Hiệu năng DoD (≤ 30s)** | Mô phỏng trọn vẹn 1 Đêm 21.600 ticks | [tests/benchmark_perf.js](../../tests/benchmark_perf.js) -> **0.093 giây** (~233k ticks/s) | **ĐẠT (Nhanh gấp >300 lần)** |
| **9. Giao diện 3D & Chuỗi 3 Đêm** | Chạy local server `npm start`, mở trình duyệt chơi thử 3 đảo | [public/game.js](../../public/game.js), Three.js 3D, HUD 10 ô đom đóm, chuỗi 3 đêm | **ĐẠT** |

### 2. Các lệnh chạy kiểm chứng
```bash
# 1. Chạy toàn bộ test suite (gồm regression và Phase 2):
npm test

# 2. Chạy đo hiệu năng 21.600 ticks:
npm run benchmark

# 3. Chạy các scenario headless xuất bằng chứng:
node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_dash.json --inputs tests/scenarios/inputs_dash.json --ticks 20 --out docs/proof/proof_dash.jsonl
node src/headless.js --seed 42 --night 2 --scenario tests/scenarios/scenario_charm.json --inputs tests/scenarios/inputs_charm.json --ticks 10 --out docs/proof/proof_charm.jsonl
node src/headless.js --seed 42 --night 2 --scenario tests/scenarios/scenario_drifter.json --inputs tests/scenarios/inputs_drifter.json --ticks 10 --out docs/proof/proof_drifter.jsonl
```
