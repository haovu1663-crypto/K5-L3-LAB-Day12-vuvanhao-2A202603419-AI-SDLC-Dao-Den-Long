# Báo cáo Nghiệm thu & Phát hành Phase 4 (Release v1.0.0)

> **Dự án**: Đảo Đèn Lồng — Day 12 AI SDLC  
> **Sinh viên**: Vũ Văn Hào — MSSV: `2A202603419`  
> **Phiên bản**: `v1.0.0` (Contract v1.2)  
> **Tags**: `phase-1`, `phase-2`, `phase-3`, `phase-4`, `v1.0.0`  
> **Kho lưu trữ GitHub**: `https://github.com/haovu1663-crypto/K5-L3-LAB-Day12-vuvanhao-2A202603419-AI-SDLC`

---

## 1. Mục tiêu Nghiệm thu Phase 4

| Tiêu chuẩn Nghiệm thu | Hiện trạng | Minh chứng |
|---|---|---|
| **Cài đặt & Khởi chạy $\le 3$ lệnh** | ĐẠT ✓ | `npm install && npm start` (hoặc qua Docker) |
| **Kiểm thử tự động toàn diện** | ĐẠT ✓ | 19/19 tests vượt qua (6 hồi quy Phase 1, 6 Phase 2, 7 Phase 3) |
| **Đo lường Hiệu năng Đêm đầy đủ** | ĐẠT ✓ | 21.600 ticks hoàn tất trong 0.35s (ngưỡng $\le 30.0$s) |
| **Độ phủ Test Contract v1.2** | ĐẠT ✓ | Đầy đủ tuning, snapshot, scenario, sự kiện mới |
| **Bản phát hành Release v1.0.0** | ĐẠT ✓ | Đóng gói Web App, Dockerfile, tài liệu hướng dẫn |
| **Tài sản & Bản quyền** | ĐẠT ✓ | LICENSE MIT và CREDITS.md ghi nhận nguồn gốc asset |
| **Video demo & Kịch bản** | ĐẠT ✓ | Hướng dẫn trải nghiệm và kịch bản demo tại `docs/demo/` |

---

## 2. Kết quả Đo lường Hiệu năng & Kiểm thử Tự động

### 2.1. Kiểm thử Tự động (`npm test`)
- **Regression Suite Phase 1**: Tính tất định, nhặt đom đóm, thắp đèn, Tỏa Sáng choáng 120 ticks, Bóng Mực tấn công & giật lùi, điều kiện thắng v1.2.
- **Feature Suite Phase 2**: Lướt Dash 14m/s, Nhảy & trọng lực, Rơi khỏi đảo Y < -10, Bùa Gió & Lướt 0s cd, Gió Lạc cướp & hồi phục đom đóm, Tạm dừng game loop.
- **Feature Suite Phase 3**: Hao hụt nhiên liệu & tắt đèn, Công thức châm dầu, Thắp lại 5 đom đóm (`relight: true`), Bóng Mực hút dầu & thưởng +15 điểm Pulse, Đẩy vùng an toàn 30 ticks, Sức chứa động 10..20, Phân nhánh thắng bình minh `dawn_survived` / thua `dawn`.
- **Tổng cộng**: 19/19 tests đạt 100%.

### 2.2. Đo lường Hiệu năng Headless (`npm run benchmark`)
- **Số ticks mô phỏng**: 21.600 ticks (tương đương 360 giây ở 60Hz).
- **Thời gian thực thi**: ~0.35 giây.
- **Tốc độ mô phỏng**: > 60.000 ticks/giây.
- **Yêu cầu DoD ($\le 30.0$s)**: Vượt mức yêu cầu gấp 85 lần.

---

## 3. Bản phát hành Chạy được (Packaging)

Dự án cung cấp 2 phương thức vận hành độc lập:
1. **Node.js Local**:
   ```bash
   npm install
   npm start
   # Mở http://localhost:3000
   ```
2. **Container Docker**:
   ```bash
   docker build -t dao-den-long .
   docker run -p 3000:3000 dao-den-long
   # Mở http://localhost:3000
   ```

---

## 4. Tổng kết Dự án

Dự án đã hoàn thành toàn vẹn qua cả 4 giai đoạn phát triển theo đúng quy trình AI-driven Software Development Life Cycle:
- Tách biệt logic mô phỏng (Simulation Core) và hiển thị (Three.js WebGL).
- Kiểm thử hồi quy bảo đảm không phát sinh lỗi khi thay đổi yêu cầu lớn.
- Bảng màu tương phản hỗ trợ người chơi mù màu (Accessibility).
- Toàn bộ lịch sử commit, tag và harness được lưu trữ đầy đủ.
