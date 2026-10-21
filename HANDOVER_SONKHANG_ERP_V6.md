# HỒ SƠ BÀN GIAO KỸ THUẬT TOÀN DIỆN: SƠN KHANG ERP (BẢN 6 - OPERATIONS HUB)
**Đơn vị:** Công ty TNHH Thực phẩm Sơn Khang  
**Mục tiêu:** Hệ thống Điều phối Giao vận, Quản lý Kho Giá vốn bình quân, Tự động hóa Hóa đơn đầu vào & Tính lương KPI kết nối Sapo - MISA.

---

## PHẦN 1: NỘI DUNG FILE `CLAUDE.md` (Đặt tại thư mục gốc dự án)
*(Lưu ý: Copy nội dung Phần 1 này lưu thành 3 file giống hệt nhau ở thư mục gốc: `CLAUDE.md`, `.cursorrules`, và `.clinerules` để khóa chặt hành vi của AI trên VS Code / Antigravity)*

### 1. ĐỊNH VỊ HỆ THỐNG & PHẠM VI (CHỐNG ÔM ĐỒM)
Dự án này là **Trạm Điều Phối & Đối Soát Trung Tâm (Operations Hub)** của Công ty TNHH Thực phẩm Sơn Khang, đứng giữa Sapo, MISA meInvoiceBot và phần mềm Kế toán MISA:
- **KHÔNG** viết chức năng quản lý bán lẻ/tạo đơn hàng phức tạp (Đã có **Sapo** sử dụng đến năm 2029, hệ thống chỉ nhận đơn từ Sapo về qua Webhook/API hoặc Import Excel).
- **KHÔNG** viết hệ thống báo cáo thuế phức tạp (Hệ thống chỉ xuất file Excel/XML chuẩn định dạng để đẩy vào **MISA**).
- **KHÔNG** quản lý tồn kho theo Số lô / Hạn sử dụng (FEFO). Hàng lưu chuyển nhanh nên chỉ quản lý **Tổng số lượng tồn** và **Giá vốn bình quân gia quyền (Weighted Average Cost)**.

### 2. TECH STACK CỐ ĐỊNH (TRỊ BỆNH TRÌ TRỆ & GIAO DIỆN XẤU)
- **Framework:** Next.js 14+ (App Router) + TypeScript.
- **Database & ORM:** PostgreSQL (hoặc SQLite khi dev) + **Prisma ORM**.
- **Giao diện Quản trị (Desktop):** BẮT BUỘC sử dụng **Ant Design (`antd`)** kết hợp `@ant-design/icons` và `dayjs`.
  - Mọi bảng dữ liệu phải cấu hình mật độ cao chuẩn ERP: `<Table size="small" bordered sticky pagination={{ pageSize: 50 }} />`.
  - Tuyệt đối không tự viết bảng HTML/Tailwind thô sơ thiếu tính năng lọc/ghim cột.
- **Giao diện Tài xế (`/driver-app` trên Mobile):** Giao diện Mobile-first tối giản, nút bấm lớn (chiều cao tối thiểu `48px`), chữ to rõ để tài xế thao tác ngoài đường bằng 1 tay.

### 3. KIẾN TRÚC PHÂN TẦNG (CHỐNG CODE VÒNG QUANH & RỐI LOGIC)
Cấu trúc thư mục bắt buộc trong `src/`:
```text
src/
├── app/
│   ├── (admin)/             # Giao diện máy tính (Ant Design Layout)
│   │   ├── inventory/       # Module 1: Hóa đơn meInvoiceBot, Ánh xạ mã, Thẻ kho
│   │   ├── logistics/       # Module 2: Đơn Sapo, Điều phối chuyến xe, Đối soát COD/Hàng hoàn
│   │   └── hr-misa/         # Module 3: Chấm công, Bảng lương tự động, Xuất file MISA
│   ├── (driver)/
│   │   └── driver-app/      # Giao diện điện thoại riêng cho Tài xế (Tera V6 / Shipper)
│   └── api/                 # API Routes & Webhooks
├── services/                # TẦNG NGHIỆP VỤ LÕI (BẮT BUỘC TÁCH BIỆT KHỎI UI)
│   ├── inventory.service.ts # Tính Giá vốn bình quân gia quyền & ghi sổ InventoryLedger
│   ├── meinvoice.service.ts # Kéo hóa đơn đầu vào từ MISA meInvoiceBot & Auto-mapping
│   ├── sapo.service.ts      # Đồng bộ đơn hàng & cân nặng (grams -> kg) từ Sapo
│   ├── logistics.service.ts # Quản lý Chuyến giao hàng, khóa sổ COD & Hàng hoàn
│   ├── payroll.service.ts   # Động cơ tính lương tự động (Chuyến + Điểm + Kg)
│   └── misa.service.ts      # Xuất dữ liệu ra định dạng Excel/XML chuẩn MISA
└── lib/
    ├── prisma.ts            # Prisma Client Singleton
    └── auth.ts              # Cấu hình NextAuth Google OAuth Whitelist
```
**LUẬT THÉP:**
1. Tuyệt đối **KHÔNG** viết công thức tính tiền, tính tồn kho, giá vốn hay tính lương ở trong các file Giao diện (`src/app/...` hoặc React Components). Giao diện chỉ được gọi hàm từ `src/services/`.
2. Khi làm việc ở Module nào, chỉ sửa file trong Module đó. Không tự ý thay đổi cấu trúc `prisma/schema.prisma` khi chưa được phép.

### 4. CƠ CHẾ BẢO MẬT & PHÂN QUYỀN TRÊN VPS CÔNG KHAI
- **Đăng nhập:** Duy nhất qua **Google OAuth 2.0** (`next-auth` chế độ `session: { strategy: "jwt" }`).
- **CẤM** dùng `@auth/prisma-adapter` đẻ thêm các bảng `User`, `Account`, `Session` rác. Đối chiếu trực tiếp `profile.email` với bảng `Employee`.
- **Cơ chế Whitelist (Danh sách trắng):**
  1. Nếu `email` đăng nhập trùng với `process.env.ADMIN_EMAIL` và bảng `Employee` chưa có bản ghi đó -> Tự động tạo tài khoản `ADMIN` đầu tiên.
  2. Với mọi email khác: Kiểm tra trong bảng `Employee` (`where: { email, isActive: true }`). Nếu không tồn tại hoặc `isActive === false` -> Chặn đăng nhập ngay lập tức (`return false`).
- **Phân quyền 4 Vai trò (`Role`):**
  - `ADMIN`: Toàn quyền hệ thống, mở khóa chuyến xe đã chốt (`CLOSED`), xem lịch sử `AuditLog`.
  - `ACCOUNTANT`: Quản lý Module 1 (meInvoiceBot), xác nhận thu tiền COD (`cashSettledAt`), chốt bảng lương & xuất MISA. Được xem Giá vốn.
  - `DISPATCHER`: Quản lý Module 2 (Đồng bộ đơn Sapo, gán chuyến xe, xác nhận nhận lại hàng hoàn `returnStockSettledAt`). **Ẩn tuyệt đối** cột Giá vốn (`avgCostPrice`) và Lương của người khác.
  - `DRIVER`: Middleware tự động ép chuyển hướng vào `/driver-app`. Chỉ thấy chuyến xe và thu nhập tích lũy của chính mình.

### 5. QUY TẮC NGHIỆP VỤ BẤT DI BẤT DỊCH (CORE BUSINESS LOGIC)
1. **Cấm sửa trực tiếp cột Tồn kho:** Mọi thay đổi số lượng tồn (`currentStock`) và giá vốn (`avgCostPrice`) trên bảng `Product` bắt buộc phải chạy qua hàm `recordInventoryTransaction()` trong `inventory.service.ts` (sử dụng `prisma.$transaction`) để ghi dòng nhật ký vào bảng `InventoryLedger`.
2. **Công thức Giá vốn bình quân gia quyền (Khi nhập kho từ `PurchaseInvoice`):**
   - `Giá trị nhập thực tế = Tổng tiền hàng trước thuế - Chiết khấu + Chi phí mua hàng phân bổ`
   - `Giá vốn bình quân mới = ((Tồn hiện tại * Giá vốn cũ) + Giá trị nhập thực tế) / (Tồn hiện tại + Số lượng nhập quy đổi)`
3. **Quy tắc Giao lại & Hàng hoàn trên xe:**
   - Một `SalesOrder` nếu giao thất bại (`FAILED`) ở chuyến xe trước sẽ tự động chuyển trạng thái về `WAITING_DISPATCH` để gán vào chuyến xe hôm sau.
   - Nếu chuyến xe có đơn `FAILED` hoặc `PARTIAL` (khách trả lại một phần), thủ kho phải bấm xác nhận `returnStockSettledAt` để kiểm đếm hàng rớt trên xe về lại kho.
4. **Công thức Lương Tài xế theo Chuyến (`DeliveryTrip`):**
   - Chỉ tính cho các điểm dừng có trạng thái `SUCCESS` hoặc `PARTIAL`.
   - `Lương Chuyến = employee.ratePerTrip (30.000đ) + (Số_điểm_thành_công * employee.ratePerStop (5.000đ)) + (Tổng_Kg_thực_giao * employee.ratePerKg (250đ))`
   - Một khi Kế toán đã bấm xác nhận thu đủ tiền COD (`cashSettledAt != null`) và Thủ kho đã nhận hàng hoàn (`status = "CLOSED"`), khóa cứng chuyến xe, cấm sửa đổi số liệu (trừ `ADMIN`).

---

## PHẦN 2: NỘI DUNG FILE `prisma/schema.prisma` (11 Bảng dữ liệu chuẩn)

```prisma
// File: prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// 1. NHÂN SỰ, BẢO MẬT GOOGLE OAUTH & NHẬT KÝ
// ==========================================
model Employee {
  id                String   @id @default(cuid())
  code              String   @unique // Mã NV (VD: SK-001) -> Dùng khớp với MISA
  fullName          String
  email             String   @unique // Gmail dùng cho Google OAuth Whitelist
  phone             String   @unique
  avatarUrl         String?
  
  role              String   @default("DRIVER") // ADMIN | ACCOUNTANT | DISPATCHER | DRIVER
  isActive          Boolean  @default(true)     // Tắt = Chặn đăng nhập ngay lập tức
  
  // Cấu hình lương & đơn giá KPI mặc định cho Tài xế
  baseSalary        Float    @default(0)
  ratePerTrip       Float    @default(30000)    // 30.000đ / chuyến
  ratePerStop       Float    @default(5000)     // 5.000đ / điểm giao thành công
  ratePerKg         Float    @default(250)      // 250đ / kg hàng thực giao
  
  trips             DeliveryTrip[]
  attendances       Attendance[]
  payrolls          MonthlyPayroll[]
  auditLogs         AuditLog[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model AuditLog {
  id                String   @id @default(cuid())
  employeeId        String
  employee          Employee @relation(fields: [employeeId], references: [id])
  action            String   // VD: "SETTLE_CASH", "SETTLE_RETURN_STOCK", "UNLOCK_TRIP", "IMPORT_XML"
  targetId          String   // ID bản ghi bị tác động
  oldValue          String?  // JSON trước khi sửa
  newValue          String?  // JSON sau khi sửa
  note              String?
  createdAt         DateTime @default(now())
}

// ==========================================
// 2. DANH MỤC HÀNG HÓA & TỒN KHO BÌNH QUÂN
// ==========================================
model Product {
  id                String   @id @default(cuid())
  sapoVariantId     String?  @unique // ID phiên bản sản phẩm trên Sapo
  sku               String   @unique // Mã SKU chuẩn Sơn Khang (VD: IDM-DB-T40)
  misaItemCode      String?          // Mã vật tư hàng hóa bên MISA (nếu khác SKU)
  name              String   
  baseUnit          String   // Đơn vị chuẩn để quản lý tồn kho (VD: Thùng / Gói / Túi)
  weightKg          Float    @default(0) // Trọng lượng 1 đơn vị chuẩn (Kg) -> Tính lương 250đ/kg
  
  // Tồn kho & Giá vốn bình quân gia quyền
  currentStock      Float    @default(0) // Tồn thực tế trong kho
  inTransitStock    Float    @default(0) // Hàng đang nằm trên xe giao vận
  avgCostPrice      Float    @default(0) // Giá vốn bình quân gia quyền hiện tại

  supplierMappings  SupplierProductMapping[]
  inventoryLogs     InventoryLedger[]
  orderItems        SalesOrderItem[]
  purchaseItems     PurchaseInvoiceItem[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ==========================================
// 3. MODULE 1: MUA HÀNG (MEINVOICEBOT) & KHO
// ==========================================
model SupplierProductMapping {
  id                  String   @id @default(cuid())
  supplierTaxCode     String   // Mã số thuế NCC
  invoiceProductName  String   // Tên hàng nguyên bản trên XML của NCC
  invoiceUnit         String   // Đơn vị tính trên hóa đơn NCC
  conversionRate      Float    @default(1) // Hệ số quy đổi sang baseUnit của Sơn Khang
  
  productId           String
  product             Product  @relation(fields: [productId], references: [id])

  @@unique([supplierTaxCode, invoiceProductName, invoiceUnit])
}

model PurchaseInvoice {
  id                  String   @id @default(cuid())
  meInvoiceId         String   @unique // ID hóa đơn từ API MISA meInvoiceBot
  invoiceNumber       String   // Số hóa đơn
  invoiceSymbol       String   // Ký hiệu
  invoiceDate         DateTime
  supplierTaxCode     String
  supplierName        String
  misaVendorCode      String?  // Mã Nhà cung cấp trong MISA (VD: NCC_INDOMIE)
  
  subTotalAmount      Float    // Tổng tiền hàng trước thuế
  discountAmount      Float    @default(0) // Chiết khấu thương mại trên hóa đơn
  extraFeeAmount      Float    @default(0) // Chi phí mua hàng/vận chuyển phân bổ thêm (nếu có)
  vatAmount           Float    // Tiền thuế GTGT
  grandTotal          Float    // Tổng tiền thanh toán
  xmlRawContent       String?  // Nội dung hoặc URL file XML gốc
  
  status              String   @default("PENDING_MAP") // PENDING_MAP (Chờ gán mã) | IMPORTED_STOCK (Đã nhập kho & tính giá vốn) | EXPORTED_MISA
  items               PurchaseInvoiceItem[]
  createdAt           DateTime @default(now())
}

model PurchaseInvoiceItem {
  id                  String          @id @default(cuid())
  purchaseInvoiceId   String
  purchaseInvoice     PurchaseInvoice @relation(fields: [purchaseInvoiceId], references: [id], onDelete: Cascade)
  
  rawProductName      String   // Tên hàng gốc trên hóa đơn
  rawUnit             String   // Đơn vị tính gốc
  quantity            Float    // Số lượng trên hóa đơn
  unitPrice           Float    // Đơn giá trên hóa đơn
  amount              Float    // Thành tiền trước thuế của dòng hàng
  
  // Dữ liệu sau khi đối chiếu qua bảng SupplierProductMapping:
  mappedProductId     String?
  mappedProduct       Product? @relation(fields: [mappedProductId], references: [id])
  convertedQty        Float?   // = quantity * conversionRate
  effectiveUnitCost   Float?   // Đơn giá vốn thực tế sau khi trừ chiết khấu/cộng phí phân bổ
}

model InventoryLedger {
  id                  String   @id @default(cuid())
  productId           String
  product             Product  @relation(fields: [productId], references: [id])
  type                String   // IN_PURCHASE | OUT_DISPATCH | IN_RETURN_TRIP | ADJUSTMENT
  referenceCode       String   // Số Hóa đơn mua hoặc Mã Chuyến xe / Đơn Sapo
  qtyChange           Float    // Số lượng thay đổi (+ hoặc -)
  unitCostAtTime      Float    // Đơn giá vốn tại thời điểm ghi sổ
  stockAfter          Float    // Tồn kho sau giao dịch
  avgCostAfter        Float    // Giá vốn bình quân mới sau giao dịch
  note                String?
  createdAt           DateTime @default(now())
}

// ==========================================
// 4. MODULE 2: ĐỒNG BỘ SAPO & ĐIỀU PHỐI GIAO VẬN
// ==========================================
model SalesOrder {
  id                  String   @id @default(cuid())
  sapoOrderId         String   @unique // ID đơn hàng trên Sapo
  orderCode           String   @unique // Mã đơn Sapo (VD: SON10567)
  
  sapoCustomerId      String?
  misaCustomerCode    String?  // Mã Khách hàng khớp với MISA (VD: KH0012)
  customerName        String
  customerPhone       String?
  shippingAddress     String
  
  totalWeightKg       Float    @default(0) // Tổng số Kg của cả đơn
  totalAmount         Float    // Tổng giá trị đơn hàng
  codAmountRequired   Float    // Số tiền cần thu hộ (COD)
  
  deliveryStatus      String   @default("WAITING_DISPATCH") 
  // WAITING_DISPATCH (Chờ xếp xe - bao gồm cả đơn giao trượt chờ giao lại)
  // IN_TRANSIT (Đang trên xe) | DELIVERED (Giao đủ) | PARTIAL (Giao 1 phần) | CANCELLED (Hủy hẳn)
  
  misaSyncStatus      String   @default("UNSYNCED") // UNSYNCED | EXPORTED
  
  items               SalesOrderItem[]
  tripStops           DeliveryTripStop[] // Cho phép 1 đơn đi qua nhiều chuyến nếu lần 1 giao FAILED
  orderDate           DateTime
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model SalesOrderItem {
  id                  String     @id @default(cuid())
  salesOrderId        String
  salesOrder          SalesOrder @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
  productId           String
  product             Product    @relation(fields: [productId], references: [id])
  
  orderedQty          Float      // Số lượng khách đặt trên Sapo
  deliveredQty        Float      @default(0) // Số lượng thực giao thành công lũy kế
  returnedQty         Float      @default(0) // Số lượng khách trả lại tại điểm giao
  unitPrice           Float
  discountAmount      Float      @default(0)
  lineAmount          Float      // Thành tiền thực thu
  lineWeightKg        Float      // = orderedQty * product.weightKg
}

model DeliveryTrip {
  id                    String   @id @default(cuid())
  tripCode              String   @unique // VD: TRIP-20261020-01
  driverId              String
  driver                Employee @relation(fields: [driverId], references: [id])
  vehiclePlate          String?  // Biển số xe (VD: Tera V6 - 29D-xxx.xx)
  
  // Giám sát thời gian thực tế (Chống câu giờ)
  plannedDurationMin    Int?      // Định mức thời gian dự kiến (phút)
  departedAt            DateTime? // Giờ tài xế bấm "Xuất phát" rời kho
  returnedAt            DateTime? // Giờ tài xế bấm "Về tới kho"
  
  // 2 Chốt chặn Đối soát cuối chuyến (Bắt buộc trước khi CLOSED)
  hasReturnGoods        Boolean   @default(false) // Có hàng giao trượt/trả lại trên xe không?
  returnStockSettledAt  DateTime? // Giờ Thủ kho xác nhận đã nhận lại đủ hàng hoàn từ xe
  returnSettledById     String?
  
  cashSettledAt         DateTime? // Giờ Kế toán xác nhận đã thu đủ tiền mặt COD từ tài xế
  cashSettledById       String?
  
  // Kết quả tổng hợp của Chuyến (Chỉ tính các điểm SUCCESS hoặc PARTIAL)
  totalSuccessStops     Int       @default(0) // Số điểm giao thành công
  totalDeliveredKg      Float     @default(0) // Tổng số Kg thực giao thành công
  totalCashCollected    Float     @default(0) // Tổng tiền mặt tài xế thu về
  totalTransferCollected Float    @default(0) // Tổng tiền khách chuyển khoản
  totalDebtSigned       Float     @default(0) // Tổng tiền khách ký nợ
  
  // Snapshot Lương của riêng chuyến này
  tripSalaryEarned      Float     @default(0) // = 30k + (totalSuccessStops * 5k) + (totalDeliveredKg * 250đ)
  
  status                String    @default("DRAFT") 
  // DRAFT (Mới xếp chuyến) | ON_ROAD (Đang đi giao) | WAITING_SETTLE (Đã về kho, chờ nộp tiền/hàng hoàn) | CLOSED (Đã khóa sổ)
  
  stops                 DeliveryTripStop[]
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model DeliveryTripStop {
  id                  String       @id @default(cuid())
  tripId              String
  trip                DeliveryTrip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  salesOrderId        String
  salesOrder          SalesOrder   @relation(fields: [salesOrderId], references: [id])
  stopSequence        Int          // Thứ tự điểm giao (1, 2, 3...)
  
  arrivedAt           DateTime?    // Giờ tài xế bấm "Đã đến điểm giao"
  completedAt         DateTime?    // Giờ hoàn tất giao hàng tại điểm này
  
  status              String       @default("PENDING") // PENDING | SUCCESS | PARTIAL | FAILED
  failOrPartialReason String?      // Lý do giao thất bại hoặc khách trả lại 1 phần hàng
  
  actualDeliveredKg   Float        @default(0) // Số Kg khách thực nhận tại điểm này
  cashCollected       Float        @default(0) // Tiền mặt tài xế cầm
  transferCollected   Float        @default(0) // Tiền khách CK về TK công ty
  debtSigned          Float        @default(0) // Tiền khách ký nhận nợ
  proofImageUrl       String?      // Ảnh chụp biên bản giao nhận / bill chuyển khoản
}

// ==========================================
// 5. MODULE 3: CHẤM CÔNG & CHỐT BẢNG LƯƠNG THÁNG
// ==========================================
model Attendance {
  id                  String   @id @default(cuid())
  employeeId          String
  employee            Employee @relation(fields: [employeeId], references: [id])
  date                DateTime // Ngày chấm công (YYYY-MM-DD)
  checkIn             DateTime?
  checkOut            DateTime?
  workDayValue        Float    @default(1.0) // 1.0 công hoặc 0.5 công
  penaltyAmount       Float    @default(0)   // Phạt đi muộn / vi phạm quy trình trong ngày
  note                String?

  @@unique([employeeId, date])
}

model MonthlyPayroll {
  id                  String   @id @default(cuid())
  employeeId          String
  employee            Employee @relation(fields: [employeeId], references: [id])
  monthYear           String   // Định dạng "YYYY-MM" (VD: "2026-10")
  
  totalWorkDays       Float    @default(0)
  baseSalaryEarned    Float    @default(0) // Lương cơ bản theo ngày công
  
  // Tự động tổng hợp từ bảng DeliveryTrip (các chuyến đã CLOSED trong tháng)
  totalTripsCount     Int      @default(0)
  totalStopsCount     Int      @default(0)
  totalDeliveredKg    Float    @default(0)
  totalTripSalary     Float    @default(0) // Tổng lương năng suất giao vận
  
  // Các khoản điều chỉnh cuối tháng do Kế toán/Admin nhập
  allowanceAmount     Float    @default(0) // Phụ cấp ăn trưa, xăng xe, điện thoại
  bonusAmount         Float    @default(0) // Thưởng chuyên cần / thưởng nóng
  advanceDeducted     Float    @default(0) // Trừ tiền đã tạm ứng giữa tháng
  penaltyDeducted     Float    @default(0) // Trừ phạt / đền bù hỏng hàng
  
  netSalary           Float    @default(0) // Thực lĩnh = Cơ bản + Lương chuyến + Phụ cấp + Thưởng - Tạm ứng - Phạt
  status              String   @default("DRAFT") // DRAFT | CONFIRMED | PAID
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([employeeId, monthYear])
}
```

---

## PHẦN 3: NỘI DUNG FILE `.env.example` (Biến môi trường mẫu)

```env
# 1. DATABASE (PostgreSQL trên VPS hoặc Supabase)
DATABASE_URL="postgresql://postgres:mat_khau_cua_ban@localhost:5432/sonkhang_erp?schema=public"

# 2. NEXTAUTH & GOOGLE OAUTH WHITELIST
NEXTAUTH_URL="[https://erp.sonkhang.vn](https://erp.sonkhang.vn)"
NEXTAUTH_SECRET="chuoi_ky_tu_ngau_nhien_dai_32_ky_tu_tro_len"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
# Email của Giám đốc (Tự động cấp quyền ADMIN ngay lần đăng nhập đầu tiên)
ADMIN_EMAIL="email_cua_ban@gmail.com"

# 3. KẾT NỐI SAPO (MODULE 2)
SAPO_SHOP_DOMAIN="ten-cua-hang.mysapo.net"
SAPO_API_KEY="xxx"
SAPO_API_SECRET="xxx"
SAPO_WEBHOOK_SECRET="xxx"

# 4. KẾT NỐI MISA MEINVOICEBOT (MODULE 1)
MEINVOICE_APP_ID="xxx"
MEINVOICE_TAX_CODE="ma_so_thue_son_khang"
MEINVOICE_USERNAME="xxx"
MEINVOICE_PASSWORD="xxx"
```

---

## PHẦN 4: KỊCH BẢN 3 PROMPT GIAO VIỆC TUẦN TỰ CHO CLAUDE
*(Tuyệt đối không yêu cầu làm tất cả cùng lúc. Chỉ gửi Prompt Bước 2 khi Bước 1 đã chạy mượt)*

### BƯỚC 1: Khởi tạo Khung Dự án, Bảo mật Google OAuth & Lõi Giao vận + Lương (Module 2 & 3)
```text
Hãy đọc kỹ file `CLAUDE.md` và `prisma/schema.prisma` trong thư mục dự án. Đây là quy chuẩn kiến trúc bất di bất dịch của dự án Sơn Khang ERP (Bản 6).

Nhiệm vụ của bạn trong BƯỚC 1:
1. Khởi tạo cấu trúc dự án Next.js (App Router, TypeScript), cài đặt `antd`, `@ant-design/icons`, `prisma`, `@prisma/client`, `next-auth`, `dayjs`.
2. Cấu hình `src/lib/prisma.ts` và `src/lib/auth.ts` sử dụng Google OAuth Whitelist đối chiếu trực tiếp với bảng `Employee` (tự động tạo ADMIN cho `process.env.ADMIN_EMAIL`, không dùng Prisma Adapter).
3. Tạo Layout Quản trị bằng Ant Design (`src/app/(admin)/layout.tsx`) với thanh menu bên trái chia rõ 3 Module:
   - Module 1: Mua hàng & Kho (meInvoiceBot)
   - Module 2: Điều phối Giao vận (Sapo)
   - Module 3: Nhân sự, Lương & MISA
4. Viết tầng dịch vụ lõi (`src/services/logistics.service.ts` và `src/services/payroll.service.ts`) tuân thủ đúng công thức trong `CLAUDE.md`:
   - Tạo chuyến xe (`DeliveryTrip`), cập nhật trạng thái điểm giao (`DeliveryTripStop`).
   - Tự động tính lương chuyến = 30.000đ + (Số điểm giao thành công * 5.000đ) + (Tổng số Kg thực giao * 250đ).
   - Hàm khóa sổ chuyến xe (`CLOSED`) khi đã xác nhận `cashSettledAt` và `returnStockSettledAt` (nếu có hàng hoàn), đồng thời ghi vào bảng `AuditLog`.
5. Dựng màn hình Quản lý Chuyến xe trên Desktop (Ant Design Table) và màn hình `/driver-app` tối giản trên điện thoại cho tài xế.

Lưu ý: Tuyệt đối không tự ý sửa đổi `prisma/schema.prisma`. Hãy thực hiện tuần tự và báo cáo khi hoàn thành Bước 1.
```

### BƯỚC 2: Đồng bộ Đơn hàng & Cân nặng từ Sapo (Hoàn thiện Module 2)
```text
Tiếp tục tuân thủ `CLAUDE.md`. Hãy triển khai `src/services/sapo.service.ts` và giao diện Quản lý Đơn hàng tại `src/app/(admin)/logistics/orders/page.tsx`:
1. Viết API Webhook nhận đơn hàng mới từ Sapo (và chức năng Import file Excel đơn hàng Sapo dự phòng).
2. Tự động quy đổi trọng lượng `grams` trên Sapo sang `weightKg` cho từng dòng hàng (`SalesOrderItem`) và tính tổng `totalWeightKg` cho cả đơn hàng (`SalesOrder`).
3. Trên màn hình Danh sách đơn hàng (dùng `<Table bordered size="small" sticky/>` của Ant Design), cho phép Điều phối viên lọc các đơn đang ở trạng thái `WAITING_DISPATCH`, tích chọn nhiều đơn cùng tuyến và bấm nút "Tạo chuyến giao hàng" gán cho Tài xế (xe Tera V6 hoặc Shipper).
```

### BƯỚC 3: Tích hợp `meInvoiceBot`, Kho Giá vốn bình quân & Xuất file MISA (Module 1 & 3)
```text
Tiếp tục tuân thủ `CLAUDE.md`. Hãy hoàn thiện phần còn lại:
1. Viết `src/services/meinvoice.service.ts` và `src/services/inventory.service.ts`:
   - Kéo hóa đơn đầu vào từ API MISA meInvoiceBot (hoặc upload file XML hóa đơn đầu vào).
   - Tự động kiểm tra bảng `SupplierProductMapping` theo `supplierTaxCode` và `invoiceProductName`. Nếu mặt hàng chưa được gán mã, hiển thị giao diện cho Kế toán chọn gán vào mã `Product` nội bộ và điền hệ số quy đổi `conversionRate` (Hệ thống tự ghi nhớ cho lần sau).
   - Khi bấm "Nhập kho", chạy hàm cập nhật Giá vốn bình quân gia quyền (`avgCostPrice`) và ghi vào sổ cái `InventoryLedger` trong cùng 1 `prisma.$transaction`.
2. Viết `src/services/misa.service.ts`:
   - Xuất danh sách Hóa đơn mua hàng (`IMPORTED_STOCK`) và Đơn bán hàng (`DELIVERED` / `PARTIAL` đã đối soát) ra file Excel chuẩn định dạng cột của MISA (khớp `misaCustomerCode`, `misaVendorCode`, `misaItemCode`).
```