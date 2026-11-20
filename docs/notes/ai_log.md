# Nhật ký sử dụng AI & Ước tính Token

## Phase 1 — Đêm 1: Đảo Bến
- Hoàn thành đầy đủ 5 bước, sinh bằng chứng, kiểm thử tự động, tag `phase-1` và push GitHub.
- Tổng token ước tính Phase 1: ~14,000 tokens.

---

## Phase 2 — "Ba hòn đảo" (Ticket-02, Contract v1.1)

### Bước 2.1: Cập nhật AI Harness & Hợp đồng Test Contract v1.1
- Cập nhật quy định 12 bước xử lý mỗi tick trong `AGENTS.md`.
- Nâng cấp `game.contract.json` lên bản v1.1 với toàn bộ thông số chuẩn hóa bắt buộc:
  - Chi phí đèn = 10, bán kính tương tác = 2.0m, bán kính nhặt = 1.0m.
  - Kỹ năng Tỏa Sáng (Pulse) = 3 đom đóm, hồi chiêu 3s, stun 120 tick, push 4m.
  - Kỹ năng Lướt (Dash) 14m/s, duration 0.2s, cd 1.5s.
  - Trạng thái Bóng Mực: spawning, wander, chase, recoil, stunned.
  - Rơi đảo (Y < -10), bùa gió, gió lạc, bục nhảy, chuỗi 3 đêm.
- Tài liệu hóa toàn bộ thay đổi và giả định vào `docs/notes/assumptions.md`.
- Ước tính token sử dụng: ~2,500 tokens.
