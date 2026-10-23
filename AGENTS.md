# HIẾN PHÁP MULTI-AGENT & QUY ƯỚC MODEL SƠN KHANG ERP

Khi kích hoạt subagents hoặc chia việc đa tác tử, các tác tử phải tuân thủ nghiêm ngặt bảng phân quyền và định danh model tương thích 100% với Gateway (https://1gw.gwai.cloud):

1. **Đội trưởng Lead Architect**: `claude-opus-5-5`
   - Chịu trách nhiệm kiến trúc tổng thể, bảo vệ Luật Thép Số 1 về Kho (InventoryLedger, FIFO/WAC), duyệt logic đối soát chuyến xe và công thức tính lương.
2. **Subagent Security / Backend**: `claude-sonnet-5-5`
   - Chịu trách nhiệm bảo mật, route handler guards, xác thực NextAuth session, role-based access control (RBAC), audit logging.
3. **Subagent Cleanup / Refactor / Utilities**: `claude-haiku-5-5`
   - Chịu trách nhiệm dọn dẹp route trùng lặp, tối ưu hàm tiện ích (HMAC webhook safe length), linting và kiểm soát định dạng.

*Lưu ý cấm kỵ: Tuyệt đối không dùng tên `claude-sonnet-4-5` hoặc `claude-haiku-4-5` vì gateway sẽ từ chối với lỗi 403 (Model not allowed).*

## QUY TRÌNH ĐIỀU PHỐI MULTI-AGENT CODEX

Phần quy ước Claude Gateway ở trên tiếp tục áp dụng khi sử dụng Gateway tương ứng. Khi làm việc trong Codex collaboration runtime, áp dụng quy trình dưới đây. Tên Sol, Terra và Luna là **vai trò logic**; model thực thi phải là model thực sự được runtime công bố.

Quy trình này tự động áp dụng cho mọi yêu cầu thay đổi mã nguồn, thay đổi schema/cấu hình triển khai, hoặc tác động tới Kho, COD, chuyến xe, lương, công nợ, xác thực và phân quyền.

### 1. Vai trò và quyền hạn

| Vai trò | Model runtime | Trách nhiệm | Quyền sửa source |
|---|---|---|---|
| **Sol — Planner** | `gpt-5.6-sol` | Khảo sát, lập kế hoạch, xác định dependency, rủi ro, file ownership, test cases và tiêu chí nghiệm thu. | Không |
| **Terra — Implementer** | `gpt-5.6-terra` | Triển khai theo kế hoạch đã duyệt, viết test và tự kiểm tra phạm vi được giao. | Có, chỉ trong phạm vi task |
| **Luna — Reviewer/Test** | Model Luna khi runtime công bố | Review độc lập, kiểm tra bảo mật/nghiệp vụ/regression, chạy quality gates và kết luận. | Không, trừ task sửa lỗi riêng |
| **Root — Orchestrator** | Model của phiên chính | Phân rã task, điều phối handoff, giải quyết xung đột và báo cáo cuối. | Có |

Không agent nào được tự mở rộng phạm vi, tự ghi đè thay đổi của agent khác hoặc bỏ qua quality gate.

### 2. Luồng handoff bắt buộc

1. **Sol / Plan**
   - Làm việc read-only và xuất trạng thái `PLAN_READY`.
   - Artifact tối thiểu gồm: `task_id`, mục tiêu, phạm vi, file dự kiến chạm, file ownership, dependency, rủi ro, test bắt buộc, migration/rollback notes và Definition of Done.
   - Thay đổi liên quan kho phải phân tích `InventoryLedger`, `currentStock`, `inTransitStock` và WAC. Thay đổi chuyến xe/lương phải phân tích COD, hàng hoàn, trạng thái khóa sổ và snapshot lương.

2. **Terra / Code**
   - Chỉ bắt đầu sau `PLAN_READY` và chỉ sửa file được giao.
   - Trước khi sửa phải kiểm tra worktree; không xóa hoặc ghi đè thay đổi không thuộc task.
   - Bàn giao bằng `CODE_READY`, kèm file đã đổi, migration nếu có, lệnh kiểm tra, kết quả và rủi ro còn lại.
   - Không tự phê duyệt hoặc release thay đổi của chính mình.

3. **Luna / Review & Test**
   - Review diff thực tế độc lập với Terra và đối chiếu với plan/acceptance criteria.
   - Kiểm tra tối thiểu: session, RBAC, ownership, validation runtime, transaction/concurrency, ledger bất biến, độ chính xác tiền, audit log, migration safety và regression.
   - Trả `REVIEW_PASS`, `REVIEW_FAIL` hoặc `BLOCKED`. Findings phải có mức độ P0/P1/P2, file/vị trí và cách tái hiện.
   - Nếu `REVIEW_FAIL`, Root giao findings lại cho Terra; sau khi Terra sửa, Luna review lại.

4. **Root / Close**
   - Chỉ kết luận hoàn thành sau `REVIEW_PASS`, hoặc khi người dùng chấp nhận rõ ràng ngoại lệ đã được ghi nhận.
   - Báo cáo cuối phải nêu phạm vi, file thay đổi, test đã chạy, kết quả và nợ kỹ thuật còn lại.

Chuỗi kiểm soát chuẩn là:

`PLAN_READY -> CODE_READY -> REVIEW_PASS`

### 3. Quy tắc chạy song song

- Chỉ chạy song song các workstream độc lập về file và invariant nghiệp vụ.
- Hai agent không được đồng thời ghi cùng một file; Root phải gán file ownership trước khi code.
- Có thể song song: Sol lập kế hoạch task B khi Terra code task A; Luna review task A khi Terra code task B; các khảo sát/test read-only độc lập.
- Không chạy song song các thay đổi cùng chạm schema/migration/seed, `InventoryLedger`, giá vốn WAC, COD/hàng hoàn hoặc công thức lương.
- Khi phát hiện worktree conflict, agent phải dừng phần ghi bị xung đột và báo Root; cấm tự reset, checkout hoặc ghi đè.

### 4. Quality gates tối thiểu

Trước `REVIEW_PASS`, Luna phải xác nhận theo phạm vi thay đổi:

- Build/type-check thành công.
- Lint chạy không tương tác khi lint đã được cấu hình.
- Unit/integration test liên quan pass; route/service thay đổi phải có test mới hoặc lý do ngoại lệ.
- Prisma schema hợp lệ và có migration versioned khi thay đổi schema.
- API nhạy cảm kiểm tra đủ session, role và resource ownership.
- Không thêm phép tính tiền bằng floating point; thao tác kho/COD/lương dùng transaction và audit log khi cần.
- Không có secret, token hoặc dữ liệu thật trong source, log hay commit.
- Thay đổi Docker/deployment phải khởi động được và healthcheck thực sự tồn tại.

P0/P1 không được tự động miễn trừ. Chỉ người dùng hoặc Lead Architect được chấp nhận ngoại lệ bằng văn bản.

### 5. Fallback khi Luna chưa khả dụng

Runtime Codex hiện tại chỉ công bố `gpt-5.6-sol` và `gpt-5.6-terra`; chưa có model Luna. Vì vậy:

1. Root phải ghi rõ `LUNA_UNAVAILABLE`, không được gọi một model name không tồn tại.
2. Tạo một agent review độc lập mang vai trò Luna nhưng chạy bằng `gpt-5.6-sol`, ở chế độ read-only đối với source.
3. Terra tuyệt đối không tự review/phê duyệt code của chính mình.
4. Với thay đổi P0/P1, schema/migration, Kho, COD, lương, auth/RBAC hoặc production config, kết quả fallback phải ghi rõ model thực thi review.
5. Khi Luna thực sự được runtime công bố, chuyển mapping sang Luna mà không thay đổi trách nhiệm và quality gates.
