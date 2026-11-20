# Báo cáo Kiểm chứng Phase 1 (Verification Report)

## Dự án: Đảo Đèn Lồng — Đêm 1: Đảo Bến

### 1. Ma trận Truy vết Yêu cầu & Bằng chứng (Traceability Matrix)

| Yêu cầu cốt lõi (PRD-0) | Phương pháp kiểm chứng | Bằng chứng kiểm chứng | Kết quả |
|---|---|---|---|
| **1. Tính tất định (Determinism)** | Chạy 2 lần cùng seed 42 và inputs, so sánh diff | [docs/proof/proof_pickup.jsonl](proof_pickup.jsonl) vs chạy lặp lại (`Compare-Object`) | **ĐẠT (Diff = 0 dòng)** |
| **2. Thu thập đom đóm (Motes)** | Scenario `scenario_pickup.json`: Mây di chuyển tới đom đóm | [docs/proof/proof_pickup.jsonl](proof_pickup.jsonl) L3: `mote_picked`, `carried: 1` | **ĐẠT** |
| **3. Nạp & Thắp Đèn Lồng Lớn** | Scenario `scenario_lantern.json`: mang 5 đom đóm, nhấn E | [docs/proof/proof_lantern.jsonl](proof_lantern.jsonl) L2: `deposit`, L3: `lantern_lit` (L1) | **ĐẠT** |
| **4. Kỹ năng Tỏa Sáng (Pulse)** | Scenario `scenario_pulse.json`: nhấn Q khi có đom đóm | [docs/proof/proof_pulse.jsonl](proof_pulse.jsonl) L2: `pulse`, `stunned_ids: ["S1"]` | **ĐẠT** |
| **5. Bóng Mực tấn công & rơi đom đóm** | Unit test `testShadeHitPlayer` | [tests/test_simulation.js](../../tests/test_simulation.js) -> `player_hit`, mất 1 flame, rơi 50% | **ĐẠT** |
| **6. Điều kiện Thắng (All Lit)** | Scenario `scenario_win.json`: nạp đủ đèn thứ 5 | [docs/proof/proof_win.jsonl](proof_win.jsonl) L4: `game_over`, `result: "won"`, `all_lit` | **ĐẠT** |
| **7. Giao diện 3D & HUD chơi được** | Chạy local server `npm start`, mở trình duyệt | [public/index.html](../../public/index.html), Three.js 3D Canvas, HUD trực quan | **ĐẠT** |

### 2. Chi tiết các lệnh tái hiện bằng chứng
```bash
# 1. Chạy toàn bộ Unit Tests:
node tests/test_simulation.js

# 2. Chạy kịch bản nhặt đom đóm:
node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_pickup.json --inputs tests/scenarios/inputs_pickup.json --ticks 60 --out docs/proof/proof_pickup.jsonl

# 3. Chạy kịch bản thắp đèn:
node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_lantern.json --inputs tests/scenarios/inputs_lantern.json --ticks 60 --out docs/proof/proof_lantern.jsonl

# 4. Chạy kịch bản Pulse làm choáng:
node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_pulse.json --inputs tests/scenarios/inputs_pulse.json --ticks 60 --out docs/proof/proof_pulse.jsonl

# 5. Chạy kịch bản Chiến thắng:
node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_win.json --inputs tests/scenarios/inputs_win.json --ticks 60 --out docs/proof/proof_win.jsonl
```
