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
- Bổ sung cơ chế:
  - Nhảy (`jump_velocity: 7.0`, `gravity: -20.0`, kiểm tra grounded).
  - Lướt Dash (`dash_speed: 14.0` trong 12 ticks, hồi chiêu 90 ticks, giữ nguyên cao độ trên không).
  - Bục nhảy Đêm 2 (bắn Y=14, ngang=24 giữa đảo A và B) và Đêm 3 (bắn Y=12, ngang=8 lên tầng 2).
  - Rơi khỏi đảo (`Y < -10`): -1 flame, mất đom đóm, chờ 60 tick rồi hồi sinh, bất tử 90 tick.
- Hỗ trợ 3 bản đồ chuẩn: Đêm 1 (Đảo Bến r=40m), Đêm 2 (Đảo Cau 2 đảo nối cầu tre), Đêm 3 (Đảo Chuông 3 tầng, tháp chuông, gió mạnh mỗi 30s).
- Thêm thực thể mới: Gió Lạc (Drifters cướp đom đóm), Bùa Gió (Charms tăng tốc 7.2 m/s & Dash 0 cd), Đom đóm rơi (TTL 480 ticks).
- Trạng thái Bóng Mực chuẩn hóa: `spawning`, `wander`, `chase`, `recoil`, `stunned`.
- Nâng cấp `src/headless.js` xuất Snapshot và Events đầy đủ theo schema v1.1.
- Ước tính token sử dụng: ~4,000 tokens.
