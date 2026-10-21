# HIẾN PHÁP KIẾN TRÚC & QUY TẮC BẢO MẬT: SƠN KHANG ERP (BẢN 6 - OPERATIONS HUB)
**Công ty TNHH Thực phẩm Sơn Khang**

### 1. Cấu trúc thư mục bắt buộc
```text
src/
├── app/
│   ├── (admin)/             # Giao diện máy tính (Ant Design Layout)
│   │   ├── inventory/       # Module 1: Hóa đơn meInvoiceBot, Ánh xạ mã, Thẻ kho
│   │   ├── logistics/       # Module 2: Đơn Sapo, Điều phối chuyến xe, Đối soát COD/Hàng hoàn
│   │   └── hr-misa/         # Module 3: Chấm công, Bảng lương tự động, Xuất file MISA
│   ├── (driver)/
│   │   └── driver-app/      # Giao diện điện thoại riêng cho Tài xế xe Tera V6
│   └── api/                 # API Routes & Webhooks (/api/webhooks/sapo...)
├── services/                # TẦNG DỊCH VỤ LÕI (BẮT BUỘC TÁCH BIỆT KHỎI GIAO DIỆN)
│   ├── inventory.service.ts # Giá vốn bình quân gia quyền & Thẻ kho InventoryLedger
│   ├── meinvoice.service.ts # Kéo hóa đơn MISA Inbot & Tự học ánh xạ mã hàng NCC
│   ├── sapo.service.ts      # Xác thực HMAC & Bóc tách cân nặng đơn Sapo
│   ├── logistics.service.ts # Tạo chuyến, giám sát thời gian, đối soát tiền & hàng hoàn
│   ├── payroll.service.ts   # Tính lương chuyến (30k/5k/250đ) & Chốt bảng lương tháng
│   └── misa.service.ts      # Xuất file Excel/XML chuẩn chứng từ kế toán MISA
└── lib/
    ├── prisma.ts            # Prisma Client Singleton
    └── auth.ts              # NextAuth Google OAuth Whitelist
```

### 2. Ma trận Phân quyền & Bảo mật VPS Công khai
* **Cơ chế Whitelist Google OAuth:** Khi bấm "Đăng nhập với Google", hệ thống lấy `profile.email` kiểm tra trong bảng `Employee` (`where: { email, isActive: true }`). Nếu không tồn tại hoặc `isActive === false` -> Chặn đăng nhập ngay lập tức.
* **Tự khởi tạo Admin:** Nếu cơ sở dữ liệu trống và email trùng với `process.env.ADMIN_EMAIL` -> Tự động cấp quyền `ADMIN`.
* **4 Vai trò cố định:**
  * `ADMIN`: Toàn quyền hệ thống, mở khóa chuyến xe đã chốt, xem nhật ký `AuditLog`.
  * `ACCOUNTANT`: Duyệt hóa đơn `meInvoiceBot`, xác nhận thu tiền mặt COD (`cashSettledAt`), chốt bảng lương và xuất file MISA. Được xem Giá vốn.
  * `DISPATCHER`: Quản lý đơn Sapo, tạo chuyến xe, xác nhận nhận lại hàng hoàn từ xe (`returnStockSettledAt`). Ẩn tuyệt đối Giá vốn (`avgCostPrice`) và Lương người khác.
  * `DRIVER`: Tự động chuyển hướng vào `/driver-app`. Chỉ xem chuyến xe và thu nhập tích lũy của chính mình.

### 3. Quy tắc Nghiệp vụ Bất di bất dịch
1. **Giá vốn bình quân gia quyền:**
   $$\text{Giá vốn mới} = \frac{(\text{Tồn cũ} \times \text{Giá vốn cũ}) + \text{Giá trị nhập thực tế}}{\text{Tồn cũ} + \text{Số lượng nhập quy đổi}}$$
   *(Giá trị nhập thực tế = Tiền hàng trước thuế - Chiết khấu + Chi phí mua hàng/vận chuyển phân bổ).*
2. **Lương chuyến xe Tera V6:**
   $$\text{Lương chuyến} = 30.000đ + (\text{Số điểm giao thành công} \times 5.000đ) + (\text{Tổng số Kg thực giao} \times 250đ)$$
3. **Quy tắc Khóa sổ (`CLOSED`):** Chỉ khóa sổ chuyến xe khi Kế toán đã bấm xác nhận thu đủ tiền COD (`cashSettledAt != null`) VÀ Thủ kho đã bấm xác nhận nhận lại hàng rớt trên xe (nếu chuyến có đơn `FAILED` hoặc `PARTIAL`).

### 4. Cấu hình Chuẩn Tên Model Subagent (Gateway 1gw.gwai.cloud)
Khi kích hoạt hoặc điều phối Multi-Agent / Subagents, BẮT BUỘC sử dụng chính xác định danh model sau để tránh lỗi 403 (Model not allowed):
- **Đội trưởng Lead / Architect**: `claude-opus-5-5`
- **Subagent Security / Backend / Fullstack**: `claude-sonnet-5-5`
- **Subagent Cleanup / Refactor / Utilities**: `claude-haiku-5-5`
*(Tuyệt đối không sử dụng alias cũ `claude-sonnet-4-5` hay `claude-haiku-4-5` do gateway không ánh xạ).*

