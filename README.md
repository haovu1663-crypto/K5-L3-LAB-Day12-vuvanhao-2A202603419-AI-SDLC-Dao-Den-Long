# Đảo Đèn Lồng — 3D Game (Day 12 AI SDLC)

> **Video Demo**: [Xem video demo tại GitHub Release v1.0.0](https://github.com/haovu1663-crypto/K5-L3-LAB-Day12-vuvanhao-2A202603419-AI-SDLC/releases) *(hoặc đính kèm tại `docs/demo/demo.mp4`)*  
> **Sinh viên thực hiện**: Vũ Văn Hào — MSSV: 2A202603419

---

## 1. Giới thiệu dự án
**Đảo Đèn Lồng** là game 3D góc nhìn thứ ba mang phong cách cổ tích ấm áp. Người chơi vào vai **Mây**, người giữ đèn nhỏ tuổi với chiếc nón lá gắn đèn lồng, gom những đốm sáng (đom đóm) trong đêm tối trên Đảo Bến để thắp lại 5 ngọn Đèn Lồng Lớn và né tránh quái vật Bóng Mực.

---

## 2. Cài đặt và Chạy game (Tối đa 3 lệnh)

Game được thiết kế không phụ thuộc build tooling phức tạp, chạy mượt mà trên mọi hệ điều hành (macOS, Linux, Windows):

```bash
# Lệnh 1: Cài đặt (nếu cần)
npm install

# Lệnh 2: Khởi động máy chủ game
npm start

# Lệnh 3: Mở trình duyệt truy cập
# Mở: http://localhost:3000
```

---

## 3. Điều khiển trong Game

| Phím bấm | Hành động |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> / Mũi tên | Di chuyển nhân vật Mây |
| <kbd>Chuột trái</kbd> (kéo) | Xoay góc nhìn camera 3D quanh Mây |
| <kbd>E</kbd> | Tương tác nạp đom đóm vào Đèn Lồng Lớn |
| <kbd>Q</kbd> | Tỏa Sáng (Pulse) xua đuổi, choáng Bóng Mực (tiêu tốn 1 đom đóm) |
| <kbd>R</kbd> | Chơi lại ván mới |

---

## 4. Cơ chế Tính Điểm & Luật Chơi

- **Nhặt đom đóm**: +10 điểm mỗi con (tối đa mang 10 con).
- **Thắp sáng Đèn Lồng**: +100 điểm mỗi ngọn đèn (cần nạp 5 đom đóm để thắp 1 đèn).
- **Làm choáng Bóng Mực (Pulse)**: +20 điểm.
- **Thưởng khi Thắng**: +1 điểm mỗi giây còn lại + 50 điểm mỗi ngọn lửa (máu) còn giữ được.
- **Thắng**: Thắp sáng đủ cả 5 Đèn Lồng Lớn (L1 đến L5).
- **Thua**: Mất hết 3 ngọn lửa (bị Bóng Mực tấn công 3 lần) hoặc hết 300 giây thời gian đêm.

---

## 5. Chạy Test Tự Động & Headless Mode (Test Contract v1.0)

Game hỗ trợ chế độ headless chạy ở 60 tick/s, không cần UI/GPU, xuất dữ liệu JSONL chuẩn xác theo `game.contract.json`:

```bash
# Chạy toàn bộ Unit Tests:
npm test

# Chạy mô phỏng Headless theo Test Contract:
npm run test:headless

# Hoặc chạy lệnh tùy chỉnh:
node src/headless.js --seed 42 --night 1 --ticks 120 --out docs/proof/sample_headless.jsonl
```

---

## 6. Sáng tạo của tôi (Đánh giá theo Rubric F)

Bên cạnh các yêu cầu lõi bắt buộc, game được bổ sung các chi tiết sáng tạo tinh tế mà không làm ảnh hưởng đến Test Contract:
1. **Biển mây bồng bềnh**: Đảo Bến lơ lửng trên tầng mây đêm với hiệu ứng mây chuyển động huyền ảo.
2. **Âm thanh Procedural (Web Audio API)**: Tự động tổng hợp âm thanh nhặt đom đóm, chuông thắp đèn, sóng xung kích pulse mà không cần nạp asset bên ngoài, đảm bảo dung lượng siêu nhẹ và chơi offline 100%.
3. **Nón lá truyền thống & Đèn lồng con**: Nhân vật Mây mang nón lá Việt Nam có treo chiếc đèn lồng nhỏ phát sáng dẫn lối.
4. **Vòng hào quang an toàn**: Đèn Lồng khi thắp sáng sẽ phóng chiếu vòng bảo vệ rực rỡ trên mặt đất cản bước Bóng Mực.
