# KẾ HOẠCH TỔNG THỂ TÁI THIẾT KẾ SƠN KHANG ERP

**Mã kế hoạch:** `SKERP-UIUX-PWA-V7-2026-01`  
**Trạng thái:** `APPROVED_IN_PROGRESS`  
**Chủ trì kế hoạch:** Sol / Planner  
**Triển khai:** Đã được chủ dự án phê duyệt ngày 21/10/2026; đang thực hiện theo phase  
**Phạm vi:** UI/UX, Dedicated Routes, bảo mật, RBAC, liên kết dữ liệu, quy trình nghiệp vụ, PWA theo vai trò, kiểm thử và phát hành.

---

## 1. Mục tiêu

1. Thiết kế lại Sơn Khang ERP theo layout chuẩn ERP, nhất quán, mật độ dữ liệu cao và dễ thao tác.
2. Chuẩn hóa hệ thống thành 9 phân hệ nghiệp vụ chính thức.
3. Xây dựng trang đăng nhập Google hiện đại với mô hình 3D xe máy/xe tải giao hàng nhưng không ảnh hưởng hiệu năng hoặc khả năng đăng nhập.
4. Thiết kế đầy đủ frontend bằng URL định danh cụ thể cho danh sách, chi tiết, tạo mới, phê duyệt và đối soát.
5. Thay cơ chế ẩn/hiện giao diện theo vai trò giả lập bằng RBAC, permission, data scope và ownership thật.
6. Chuẩn hóa liên kết dữ liệu từ mua hàng, kho, bán hàng, giao hàng, công nợ đến tài chính/MISA.
7. Thiết kế PWA riêng theo trải nghiệm của Giám đốc, Kế toán, Kinh doanh, Kho và Giao hàng trên cùng một codebase.
8. Triển khai theo vertical slice, có feature flag, kiểm thử và đường rollback; không thay đổi toàn bộ theo kiểu big bang.

---

## 2. Phạm vi 9 phân hệ chính thức

1. **Tổng quan**
2. **Mua hàng**
3. **Kho hàng**
4. **Bán hàng**
5. **Giao hàng**
6. **Công nợ**
7. **Tài chính, kế toán**
8. **Không gian làm việc nội bộ**
9. **Thiết lập hệ thống**

Các tên kỹ thuật hiện tại như `procurement`, `inventory`, `logistics`, `finance`, `feed` và `documents` phải được ánh xạ về 9 phân hệ trên trong menu, tài liệu, route registry và permission registry.

---

## 3. Đánh giá hiện trạng

- Nền tảng Next.js 14, React 18, Ant Design 5, NextAuth và Prisma/PostgreSQL được giữ lại.
- Admin layout hiện là một client component lớn, menu và nhiều style bị hard-code.
- Menu đang gộp sai ranh giới: Mua hàng với Kho; Bán hàng với Công nợ; Giao hàng với Phương tiện.
- Role switcher, tên/avatar và thông báo trên header chưa lấy từ session/dữ liệu thật.
- NextAuth đã trỏ tới `/auth/signin` và `/auth/error`, nhưng chưa có các trang này.
- Chưa có page guard tập trung; RBAC API chưa bao phủ permission, ownership, data scope và field-level access.
- Dashboard hiện có nguy cơ trả dữ liệu tài chính và giá vốn cho mọi tài khoản đã đăng nhập.
- Driver route chưa kiểm tra nhất quán quyền sở hữu chuyến.
- Tiền và giá vốn đang dùng `Float`.
- `InventoryLedger` đã tồn tại nhưng cơ chế concurrency và chống tồn âm chưa hoàn chỉnh.
- Chưa có `GoodsReceipt`, AR/AP ledger, payment allocation và một số state machine cần thiết.
- PWA hiện chỉ có manifest và service worker tối thiểu; chưa có offline outbox, push, update lifecycle hoặc tách cache theo tài khoản.
- Lint chưa chạy không tương tác; chưa có E2E, accessibility và visual regression test.

---

## 4. Kiến trúc frontend mục tiêu

```text
src/app
├── (auth)                      # Public/Auth shell
│   └── auth
├── (erp)                       # Desktop ERP shell
│   ├── overview
│   ├── purchasing
│   ├── inventory
│   ├── sales
│   ├── delivery
│   ├── debts
│   ├── finance
│   ├── workspace
│   └── settings
├── (pwa)                       # Adaptive PWA shell theo persona
│   └── pwa
├── (driver)                    # Chỉ giữ trong giai đoạn tương thích
└── api
```

### Nguyên tắc

- URL dùng slug tiếng Anh ổn định; nhãn giao diện dùng tiếng Việt.
- Server Component là mặc định; Client Component chỉ dùng cho bảng tương tác, form, chart, scanner và 3D.
- Route registry có type là nguồn dùng chung cho menu, breadcrumb, title, permission và legacy redirects.
- Page guard và API guard dùng cùng permission registry.
- Không giả lập role bằng state hoặc query string.
- Không đổi toàn bộ API sang `/api/v1` trong một lần; chuyển theo từng vertical slice và duy trì compatibility window.
- Driver/PWA không tải desktop sidebar và bundle 3D không được tải ngoài auth route.

---

## 5. Layout và design system chuẩn ERP

### 5.1 Desktop ERP shell

- Sidebar 264 px, collapsed 72 px, sticky, gồm đúng 9 phân hệ.
- Header 64 px gồm: collapse, command search, chọn kho/scope, quick create, notifications và user menu.
- Menu được render từ session/permission thật.
- Nội dung trang theo chuẩn: breadcrumb → page title/action → tabs → KPI/summary → filter bar → data table/detail.
- Table hỗ trợ saved views, density, column visibility, filter trên URL, phân trang và export theo quyền.
- Detail dùng dedicated route; drawer chỉ dùng cho quick preview hoặc chỉnh sửa nhẹ.
- Mobile sidebar chuyển thành drawer; table có card/list fallback.

### 5.2 Design tokens

- Màu thương hiệu blue/indigo; màu semantic success/warning/error/info.
- Contrast đạt WCAG 2.1 AA.
- Spacing theo thang 4/8 px; border radius 6–12 px.
- Dùng tabular numbers cho tiền và số lượng.
- Tiền định dạng `vi-VN`, VND, không hiển thị phần thập phân.
- Số lượng/kg có precision theo đơn vị.
- Ngày giờ theo `Asia/Ho_Chi_Minh`.
- Mọi trang có loading, skeleton, empty, error và forbidden state.

### 5.3 Component nền dùng chung

```text
AppShell, AppSidebar, AppHeader, CommandSearch
PageHeader, Breadcrumbs, ModuleTabs
KpiCard, FilterBar, DataTable, SavedView
StatusBadge, MoneyText, QuantityText, DateTimeText
EntityLink, AuditTimeline, ApprovalActions
EmptyState, ErrorState, ForbiddenState
ConfirmAction, FormDrawer, DocumentViewer
```

---

## 6. Trang đăng nhập hiện đại và 3D

### Routes

```text
/auth/signin
/auth/error
/auth/access-denied
/auth/signout
```

### Trải nghiệm

- Desktop split layout: scene 3D bên trái; nhận diện Sơn Khang và nút Google bên phải.
- Scene mô phỏng xe máy và xe tải di chuyển từ kho tới các điểm giao.
- Mobile ưu tiên nút đăng nhập; 3D thu gọn hoặc thay bằng ảnh WebP.
- Login vẫn hoạt động nếu WebGL hoặc scene lỗi.

### Công nghệ dự kiến

```text
three
@react-three/fiber
@react-three/drei
@types/three
```

### Performance contract

- Dynamic import với `ssr: false`.
- GLB lưu local, có bản quyền, ưu tiên tổng dung lượng dưới 1,5 MB.
- Giới hạn DPR, giảm/tắt shadow trên thiết bị yếu.
- Pause animation khi tab ẩn; hỗ trợ `prefers-reduced-motion`.
- Có fallback khi WebGL lỗi hoặc data-saver bật.
- 3D không được precache mặc định trong PWA.

### Google OAuth và bảo mật

- Dùng `signIn("google", { callbackUrl })`, callback chỉ là đường dẫn nội bộ đã sanitize.
- Whitelist bằng `Employee`; tài khoản inactive bị chặn kể cả với token cũ.
- Bootstrap admin phải được tắt sau khởi tạo.
- Audit `LOGIN_SUCCESS`, `LOGIN_DENIED`, `LOGOUT`; không ghi token.
- Cấu hình secure/httpOnly/sameSite cookie, `NEXTAUTH_SECRET` và `NEXTAUTH_URL` đúng môi trường.

---

## 7. Dedicated route map

### 7.1 Tổng quan

```text
/overview
/overview/operations
/overview/finance
/overview/alerts
```

Legacy `/` và `/dashboard` chuyển về `/overview`.

### 7.2 Mua hàng

```text
/purchasing
/purchasing/suppliers
/purchasing/suppliers/[supplierId]
/purchasing/purchase-orders
/purchasing/purchase-orders/new
/purchasing/purchase-orders/[purchaseOrderId]
/purchasing/receipts
/purchasing/receipts/[receiptId]
/purchasing/invoices
/purchasing/invoices/[invoiceId]
/purchasing/three-way-match/[purchaseOrderId]
```

### 7.3 Kho hàng

```text
/inventory
/inventory/products
/inventory/products/[productId]
/inventory/locations
/inventory/movements
/inventory/stocktakes
/inventory/stocktakes/new
/inventory/stocktakes/[stocktakeId]
/inventory/issues
/inventory/issues/[issueId]
/inventory/in-transit
/inventory/alerts
```

### 7.4 Bán hàng

```text
/sales
/sales/orders
/sales/orders/[orderId]
/sales/customers
/sales/customers/[customerId]
/sales/credit-approvals
/sales/returns
/sales/returns/[returnId]
/sales/sync-status
```

### 7.5 Giao hàng

```text
/delivery
/delivery/dispatch
/delivery/trips
/delivery/trips/new
/delivery/trips/[tripId]
/delivery/trips/[tripId]/settlement
/delivery/vehicles
/delivery/vehicles/[vehicleId]
```

### 7.6 Công nợ

```text
/debts
/debts/receivables
/debts/receivables/[customerId]
/debts/payables
/debts/payables/[supplierId]
/debts/aging
/debts/collections
/debts/credit-limits
/debts/reconciliation
```

### 7.7 Tài chính, kế toán

```text
/finance
/finance/transactions
/finance/transactions/[transactionId]
/finance/cashbook
/finance/reconciliation
/finance/documents
/finance/documents/[documentId]
/finance/payroll
/finance/payroll/[monthYear]
/finance/exports/misa
/finance/reports
```

### 7.8 Không gian làm việc nội bộ

```text
/workspace
/workspace/feed
/workspace/notes
/workspace/tasks
/workspace/documents
/workspace/notifications
/workspace/profile
```

### 7.9 Thiết lập hệ thống

```text
/settings
/settings/users
/settings/users/[employeeId]
/settings/roles
/settings/warehouses
/settings/catalogs
/settings/integrations
/settings/integrations/sapo
/settings/integrations/meinvoice
/settings/integrations/misa
/settings/document-numbering
/settings/audit-logs
/settings/security
/settings/security/devices
/settings/system
```

---

## 8. PWA cho 5 persona

PWA dùng một codebase và một điểm vào `/pwa`. Route này xác thực session rồi chuyển hướng theo persona/permission.

### 8.1 Dedicated PWA routes

```text
/pwa
├── executive
│   ├── alerts
│   ├── approvals
│   ├── operations
│   └── finance
├── accounting
│   ├── settlements
│   ├── transactions
│   ├── receivables
│   ├── payables
│   ├── approvals
│   └── documents/scan
├── sales
│   ├── orders
│   ├── orders/[orderId]
│   ├── customers
│   ├── customers/[customerId]
│   ├── credit-requests
│   └── collections
├── warehouse
│   ├── receiving
│   ├── picking
│   ├── stocktakes
│   ├── stocktakes/[stocktakeId]
│   ├── returns
│   ├── issues
│   └── scan
└── delivery
    ├── trips
    ├── trips/[tripId]
    ├── trips/[tripId]/stops/[stopId]
    ├── trips/[tripId]/proof-of-delivery
    └── sync
```

Legacy `/driver-app` và `/delivery/driver` chuyển về `/pwa/delivery`.

### 8.2 Home và hành động theo persona

| Persona | Home | Hành động chính |
|---|---|---|
| Giám đốc | KPI, tồn, công nợ, dòng tiền, chuyến, cảnh báo | Duyệt theo thẩm quyền, drill-down, xử lý cảnh báo |
| Kế toán | COD chờ đối soát, thu chi, AR/AP quá hạn | Đối soát, lập phiếu, phân bổ thanh toán, scan chứng từ |
| Kinh doanh | Đơn hôm nay, khách phụ trách, credit hold | Cập nhật khách, xin duyệt hạn mức, theo dõi/thu hồi nợ |
| Kho | Nhận hàng, picking, hàng hoàn, kiểm kê | Scan, nhận/kiểm đếm, tạo draft kiểm kê và hàng hoàn |
| Giao hàng | Chuyến hiện tại, stop kế tiếp, COD dự kiến | Xuất phát, đến điểm, POD, ký nhận, hoàn tất, về kho |

Giám đốc, Kế toán và Kinh doanh ưu tiên online. Kho và Giao hàng có limited-offline workflow.

### 8.3 Adaptive shell

- Mobile: top bar gọn, bottom navigation tối đa 5 mục, touch target 44–48 px.
- Tablet kho: split view scan–item–quantity, hỗ trợ landscape.
- Desktop standalone: navigation rail/sidebar nhỏ.
- Hiển thị rõ `Online`, `Offline`, `Đang đồng bộ`, `Đồng bộ lỗi`.
- Bản ghi offline luôn có badge `Chưa đồng bộ`, không hiển thị như đã post.

### 8.4 Installability

Manifest mục tiêu:

```json
{
  "id": "/sonkhang-erp",
  "start_url": "/pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "any"
}
```

- Icon `any`, `maskable`, `monochrome`; có screenshots mobile/desktop.
- Install prompt chỉ hiện sau đăng nhập và khi thiết bị đủ điều kiện.
- Có hướng dẫn cài thủ công trên nền tảng không hỗ trợ prompt.
- Service-worker update hiển thị banner; không reload giữa lúc nhập liệu.

### 8.5 Cache và offline

| Dữ liệu | Strategy |
|---|---|
| JS/CSS/font/icon fingerprinted | Cache-first, versioned precache |
| Navigation shell | Network-first, fallback offline shell |
| Danh mục ít nhạy cảm | Stale-while-revalidate theo user/scope/version |
| Tài chính, công nợ, giá vốn, payroll | Network-only, `private/no-store` |
| OAuth/session/auth | Network-only, không cache |
| Ảnh/chứng từ/POD | Không cache mặc định; upload queue có giới hạn |
| Draft được phép offline | IndexedDB outbox với UUID/idempotency key |

Được queue offline:

- Draft kết quả điểm giao/POD.
- Ảnh, chữ ký và metadata giao hàng.
- Draft số kiểm kê.
- Draft scan nhận hàng/hàng hoàn.
- Ghi chú tác nghiệp không nhạy cảm.

Bắt buộc online:

- Duyệt PO/hạn mức/thu chi.
- Post phiếu nhập, kiểm kê, xuất hủy hoặc ledger.
- Đối soát COD và khóa chuyến.
- Phân bổ thanh toán/công nợ.
- Chốt/payroll/payment.
- Thay đổi role, integration hoặc system settings.

Server là nguồn sự thật. Mọi sync phải kiểm tra lại session, permission, scope, ownership, entity version và idempotency. Conflict không được tự ghi đè.

### 8.6 Push notification

- Giám đốc: approval, rủi ro dòng tiền, bất thường kho/COD.
- Kế toán: chuyến chờ COD, thu chi chờ duyệt, nợ quá hạn.
- Kinh doanh: credit hold, lỗi đồng bộ đơn, khách quá hạn.
- Kho: phiếu nhận/picking mới, hàng hoàn, kiểm kê, tồn thấp.
- Giao hàng: chuyến được gán/thay đổi, stop cập nhật, yêu cầu về kho.

Push trên lockscreen không chứa COD, lương, công nợ, giá vốn hoặc thông tin khách đầy đủ. Deep link phải kiểm tra lại session/RBAC.

### 8.7 Camera, scanner, GPS và chữ ký

- Xin quyền just-in-time; luôn có fallback nhập/upload thủ công.
- Scan barcode/QR cho SKU, PO, phiếu nhận, order và trip.
- Ảnh nén phía client, upload bằng signed URL, loại bỏ EXIF không cần thiết.
- GPS foreground; ghi accuracy, timestamp và consent; không theo dõi nền mặc định.
- POD signature gắn người ký, order/stop, actor, timestamp và hash.
- POD là bằng chứng vận hành, không tự tuyên bố là chữ ký số pháp lý.

### 8.8 Device và session security

- Installation ID không thay thế authentication và không dùng fingerprint làm danh tính.
- Có màn hình xem/revoke thiết bị.
- Session idle timeout theo persona; thao tác nhạy cảm yêu cầu recent authentication.
- Thiết bị dùng chung phải hỗ trợ khóa/re-auth và đổi tài khoản rõ ràng.
- Cache/outbox được purge khi logout, account switch, inactive hoặc session epoch đổi.
- Không lưu token trong `localStorage`.
- Audit actor, device, thời gian và nguồn online/offline cho mutation quan trọng.

---

## 9. RBAC, permission và data scope

### Role mục tiêu

```text
ADMIN
EXECUTIVE
PROCUREMENT
WAREHOUSE
SALES
DISPATCHER
DRIVER
ACCOUNTANT
```

### Data scope

```text
ALL
DEPARTMENT
WAREHOUSE
ASSIGNED
OWN
```

### Permission mẫu

```text
overview:view_finance
purchase_order:create|submit|approve|cancel
goods_receipt:create|post
inventory:view_qty|view_cost|adjust|stocktake_approve
sales_order:view|edit|credit_approve
trip:create|dispatch|operate|settle_cash|settle_return|close
receivable:view|allocate_payment|write_off
finance_transaction:create|approve|post|void
payroll:view|calculate|confirm|pay
settings:manage_users|manage_roles|manage_integrations
audit:view
```

### Quy tắc

- Menu ẩn theo permission, nhưng server/API luôn kiểm tra lại.
- Driver chỉ đọc/sửa chuyến có `driverId === session.user.id`.
- Dispatcher không được nhận trường giá vốn.
- Sales chỉ xem khách/công nợ trong scope được giao.
- Procurement không tự duyệt PO do chính mình tạo nếu maker-checker được bật.
- Người lập thu/chi không tự duyệt khi vượt ngưỡng.
- Dashboard trả payload theo permission, không gửi dữ liệu nhạy cảm rồi ẩn ở UI.

---

## 10. Liên kết dữ liệu và nguồn sự thật

```text
Supplier
  → PurchaseOrder
  → GoodsReceipt
  → PurchaseInvoice / Three-way Match
  → InventoryLedger
  → AccountsPayable
```

```text
Sapo SalesOrder
  → Customer / Credit Approval
  → DeliveryTrip / DeliveryTripStop
  → InventoryLedger / Return
  → AccountsReceivable
  → Payment Allocation / COD Settlement
  → Finance Transaction
  → MISA Export
```

### Invariant bắt buộc

- `InventoryLedger` là nguồn sự thật của mọi biến động kho.
- `currentStock` và `inTransitStock` chỉ là cached balance, cập nhật atomic cùng ledger.
- Không cho tồn kho hoặc tồn trên xe âm.
- WAC chỉ thay đổi ở nghiệp vụ nhập hợp lệ.
- Trip close yêu cầu mọi stop terminal, xe về kho, COD và hàng hoàn đã đối soát.
- Trip `CLOSED` bất biến; điều chỉnh qua reversal/reopen có quyền và audit.
- Lương chuyến snapshot đúng một lần khi khóa chuyến.
- Công nợ có ledger entry và payment allocation; `currentDebt` chỉ là cached balance.
- Liên kết chứng từ bằng foreign key hoặc reference có kiểm soát, không chỉ chuỗi tự do.
- Tiền dùng `Decimal` hoặc integer VND; không bổ sung phép tính tiền bằng `Float`.
- Webhook có signature fail-closed, idempotency, replay protection và audit.

---

## 11. State machine nghiệp vụ

### Mua hàng

```text
DRAFT → SUBMITTED → APPROVED
                   → PARTIALLY_RECEIVED → RECEIVED → CLOSED
DRAFT/SUBMITTED → CANCELLED
```

### Kho

```text
Stocktake:      DRAFT → IN_PROGRESS → SUBMITTED → APPROVED → POSTED
WarehouseIssue: DRAFT → SUBMITTED → APPROVED → POSTED
```

Chỉ `POSTED` mới ghi ledger; ledger không update/delete.

### Bán hàng

```text
IMPORTED → NEEDS_REVIEW / CREDIT_HOLD
→ READY_TO_DISPATCH → ALLOCATED → IN_TRANSIT
→ DELIVERED / PARTIAL / CANCELLED → CLOSED
```

### Giao hàng

```text
DRAFT → READY → ON_ROAD → RETURNED
→ WAITING_SETTLEMENT → CLOSED
```

Cash settlement và return settlement là hai checkpoint độc lập.

### Công nợ/tài chính

```text
Debt: OPEN → PARTIALLY_PAID → PAID
      OPEN/PARTIAL → OVERDUE / DISPUTED

Transaction: DRAFT → SUBMITTED → APPROVED → POSTED
                           ↘ REJECTED
POSTED → VOIDED bằng reversal
```

---

## 12. Phân kỳ triển khai

### Phase 0 — Contract và baseline

- Chốt route registry, wireframe, design tokens, permission matrix và role migration.
- Chốt ranh giới kế toán ERP với MISA.
- Chốt source/license model 3D.
- Chốt persona PWA, offline allowlist, thiết bị/browser và chính sách GPS.
- Lưu baseline screenshot, test và build.

**Exit gate:** Chủ dự án phê duyệt IA, RBAC, workflow và phạm vi dữ liệu.

### Phase 1 — Security foundation

- Permission engine, data scope, server page guards và middleware.
- Driver ownership, field-level access, auth logging.
- Zod runtime validation, secure headers, CSP và rate limit.
- Webhook fail-closed, chuẩn hóa error envelope và audit helper.

**Exit gate:** Không còn P0/P1 đã biết về auth/RBAC.

### Phase 2 — Design system, shell, login và PWA core

Có thể chạy song song sau khi auth contract được khóa:

- A: design tokens, primitives, desktop ERP shell và adaptive PWA shell.
- B: auth pages, Google OAuth UX, 3D scene và fallback.
- C: route registry, breadcrumb, legacy redirects.
- D: manifest, install UX, offline page, service-worker lifecycle và sync status.

**Exit gate:** Login hoạt động; sidebar dựa trên permission; không còn fake role/user; PWA cài được và update an toàn.

### Phase 3 — Master data và vertical slices

1. Settings/users/roles/warehouses/catalogs.
2. Purchasing + Inventory; các đoạn chạm ledger/WAC/schema chạy tuần tự.
3. Sales + Debts.
4. Delivery, phụ thuộc Sales và Inventory.
5. Finance/Accounting, phụ thuộc Purchasing/Debts/Delivery.
6. Workspace.
7. Overview làm cuối.

Mỗi slice phải hoàn thiện list/detail/create/edit/approval/audit/test trước khi chuyển phân hệ.

### Phase 4 — PWA nghiệp vụ

1. Push subscription, preferences, deep link và revoke.
2. PWA Kho: scan, receiving draft, stocktake draft, return draft.
3. PWA Giao hàng: assigned trip snapshot, stop outbox, POD, signature, GPS.
4. PWA Giám đốc/Kế toán/Kinh doanh: dashboard và action online-only.

PWA Kho/Giao hàng chỉ triển khai sau khi state machine và idempotency server hoàn thiện.

### Phase 5 — Data hardening

- Versioned migrations.
- GoodsReceipt, AR/AP ledger, PaymentAllocation.
- Role/Permission/DataScope và Notification/Task nếu được duyệt.
- Shadow-column migration từ Float sang Decimal/integer VND.
- Enum/check constraint/index.
- Serializable/atomic update cho kho và settlement.
- Backfill, reconciliation report và cutover.

### Phase 6 — UAT, field pilot và release

- E2E happy/forbidden paths, accessibility, performance và visual regression.
- Pilot thiết bị Android/iOS, tablet kho, desktop standalone và mạng chập chờn.
- Canary theo role và feature flag theo module.
- Theo dõi legacy redirect telemetry.
- Chỉ xóa legacy page/API sau thời gian ổn định.

---

## 13. File ownership dự kiến

| Task | Ownership độc quyền |
|---|---|
| `T-FND-AUTH` | Auth, route guards, middleware, auth pages/tests |
| `T-FND-UI` | Root/ERP layout, globals, ERP/UI components, navigation/route registry |
| `T-LOGIN-3D` | Auth components, 3D components, model/image assets |
| `T-PWA-CORE` | Manifest, service worker/tooling, PWA layout/core |
| `T-PWA-SYNC` | IndexedDB/outbox, sync protocol và endpoints |
| `T-PWA-PUSH` | Push subscription/preferences/services |
| `T-PURCHASE` | Purchasing routes/features/services/tests |
| `T-INVENTORY` | Inventory routes/features/services/tests |
| `T-SALES` | Sales routes/features/services/tests |
| `T-DELIVERY` | Delivery desktop/PWA/features/services/tests |
| `T-DEBTS` | Debts routes/features/AR-AP services/tests |
| `T-FINANCE` | Finance/payroll/MISA routes/services/tests |
| `T-WORKSPACE` | Workspace routes/features |
| `T-SETTINGS` | Settings routes/features |
| `T-DATA` | Prisma schema/migrations/data scripts; luôn chạy tuần tự |
| `T-QA-CONFIG` | Playwright/Vitest/ESLint config |

Shared files như `package.json`, `next.config.js`, schema, migration, service worker và route registry chỉ có một owner tại mỗi thời điểm.

---

## 14. Dependencies dự kiến

### Runtime

```text
zod
three
@react-three/fiber
@react-three/drei
@types/three
```

Cân nhắc, chưa mặc định phê duyệt:

```text
react-hook-form
@tanstack/react-query
```

### Test/dev

```text
@playwright/test
@testing-library/react
@testing-library/user-event
jest-axe hoặc tương đương
ESLint config không tương tác
```

Chưa cài dependency nào trước khi kế hoạch được phê duyệt.

---

## 15. Test plan và quality gates

### Unit

- Permission/data-scope resolver, safe callback URL, route registry và breadcrumb.
- Formatter tiền/số lượng/ngày giờ.
- State transition validator, WAC, ledger balance, trip salary.
- Webhook và sync idempotency.

### Component

- Login success/error/loading/WebGL fallback.
- Sidebar và PWA home theo từng persona/role.
- DataTable/filter URL state và approval actions.
- Responsive/adaptive shell, keyboard navigation và trạng thái offline.

### API/integration

- `401/403`, driver ownership và field-level protection.
- Validation chống âm, NaN và enum giả.
- Maker-checker, audit old/new/actor và transaction rollback.
- Trip closed không mutate; concurrent inventory không mất biến động.
- Webhook signature/duplicate/replay và Decimal reconciliation.
- Sync retry không tạo ledger/COD/event trùng; conflict không ghi đè server.

### E2E

- Google OAuth mock và redirect đúng.
- PO → Receipt → Invoice → Match → Ledger/AP.
- Sapo Order → Credit Approval → Trip → Delivery → Return/COD → Close → Payroll.
- Stocktake → Approval → Posted Ledger.
- AR payment allocation → Finance Transaction → Reconciliation.
- Role navigation cho desktop và 5 PWA persona.
- Legacy URL redirect giữ query/deep link.

### PWA/non-functional

- Manifest/installability/service-worker update.
- Cache không rò giữa hai tài khoản.
- Logout/inactive/device revoke xử lý cache/outbox/subscription đúng.
- Network flap, offline allowlist và online-only blocking.
- Camera/GPS/push denied có fallback.
- Android/iOS/tablet/desktop standalone.
- WCAG 2.1 AA, Lighthouse và bundle/performance budget.

### Quality gate chung

- Build/type-check, lint, Prisma validate, unit, integration, E2E và accessibility đạt.
- Không thêm secret/token/dữ liệu thật.
- Không phát sinh phép tính tiền mới bằng floating point.
- Migration có version, rollback/cutover notes và reconciliation.

---

## 16. Migration và rollback

- Tạo canonical routes trước, xác nhận parity rồi mới redirect routes cũ.
- Feature flag theo module/role để quay lại legacy UI.
- Data migration theo expand → backfill → validate → contract.
- Chuyển tiền bằng shadow columns; đối soát tổng trước cutover.
- Role mới được map từ role hiện tại; tài khoản không map được mặc định deny.
- Không xóa cột/table trong cùng release thêm schema thay thế.
- Có thể tắt 3D và dùng ảnh fallback mà không ảnh hưởng auth.
- Rollback UI không rollback ledger/chứng từ đã post; dùng reversal cho nghiệp vụ kho/tài chính.
- Service-worker update không được làm mất outbox; có cơ chế thu hồi cache version lỗi.

---

## 17. Rủi ro chính

- Ranh giới “Tài chính, kế toán” với MISA chưa được chốt.
- GoodsReceipt và AR/AP ledger chưa tồn tại nên một số route cần bổ sung backend/schema, không chỉ redesign UI.
- Chuyển `Float` là migration tài chính rủi ro cao và phải tách riêng.
- Model 3D có thể tăng bundle nếu không giữ performance budget.
- OAuth cần callback URL/secret riêng cho dev/staging/prod.
- Legacy và canonical routes cùng tồn tại cần telemetry và compatibility policy.
- Service worker cũ có thể giữ bundle không tương thích.
- Cache có nguy cơ rò dữ liệu trên thiết bị dùng chung.
- Background Sync/push khác nhau giữa browser và hệ điều hành.
- Offline event có thể xung đột trạng thái trip/stock trên server.
- Retry có thể nhân đôi ledger/COD nếu server thiếu idempotency.
- GPS trong nhà không chính xác; chữ ký POD có thể bị hiểu nhầm là chữ ký số pháp lý.

---

## 18. Definition of Done tổng thể

- 9 phân hệ xuất hiện đúng IA và ranh giới nghiệp vụ.
- Entity quan trọng có dedicated list/detail/action routes và deep link.
- Không còn fake role switcher hoặc user/notification hard-code.
- Login Google hoạt động; có error/access-denied route và 3D fallback.
- Desktop/PWA dùng permission và data scope thật ở cả page/API.
- Driver ownership và dashboard field-level access có test.
- Kho/COD/lương giữ invariant, transaction, idempotency và audit.
- PWA cài được; 5 persona có home/action đúng quyền.
- Kho/Giao hàng limited-offline; không post/settle/close offline.
- Cache/outbox/push/device lifecycle an toàn trên thiết bị dùng chung.
- Legacy URL có redirect/compatibility mapping đã test.
- Build/type-check/lint/test/E2E/a11y/performance đạt.
- Tài liệu route map, permission matrix, workflow, migration và rollback được cập nhật.

---

## 19. Các quyết định cần chủ dự án phê duyệt

1. ERP chỉ quản trị vận hành và xuất MISA, hay sẽ triển khai sổ cái kế toán kép riêng?
2. Phê duyệt mở rộng từ 4 role hiện tại lên 8 role mục tiêu?
3. Có xây GoodsReceipt và sổ AR/AP ngay trong chương trình redesign?
4. Model 3D dùng asset mua bản quyền, tự dựng hay phong cách low-poly?
5. Có phê duyệt feature flag và rollout tuần tự theo phân hệ/role?
6. Phê duyệt limited-offline chỉ cho Kho và Giao hàng theo allowlist?
7. Có cho phép GPS foreground cho giao hàng và cấm tracking nền mặc định?
8. Thiết bị kho/giao hàng là thiết bị cá nhân hay thiết bị công ty/dùng chung?

---

## 20. Cổng phê duyệt

Kế hoạch đã được chủ dự án phê duyệt để triển khai:

```text
APPROVED_IN_PROGRESS
```

Quy tắc thực thi sau phê duyệt:

- Triển khai tuần tự theo phase và file ownership đã quy định.
- Mỗi checkpoint phải qua review độc lập trước khi chuyển phase phụ thuộc.
- Localhost được duy trì để chủ dự án theo dõi thay đổi bằng hot reload.
- Chưa push/deploy production khi chưa hoàn thành toàn bộ quality gate.
- Chỉ kích hoạt pipeline GitHub/VPS sau khi build, test, migration/reconciliation và release review đạt.

Root tạo backlog theo phase và task ownership, giao Terra triển khai từng vertical slice, sau đó chuyển Luna review/test theo chuỗi:

```text
PLAN_READY → APPROVED → CODE_READY → REVIEW_PASS
```

Do runtime hiện chưa có model Luna, reviewer độc lập sẽ mang vai trò Luna và chạy bằng `gpt-5.6-sol` ở chế độ read-only; báo cáo review phải ghi rõ `LUNA_UNAVAILABLE` và model fallback.
