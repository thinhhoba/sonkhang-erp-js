# HIẾN PHÁP MULTI-AGENT & QUY ƯỚC MODEL SƠN KHANG ERP

Khi kích hoạt subagents hoặc chia việc đa tác tử, các tác tử phải tuân thủ nghiêm ngặt bảng phân quyền và định danh model tương thích 100% với Gateway (https://1gw.gwai.cloud):

1. **Đội trưởng Lead Architect**: `claude-opus-5-5`
   - Chịu trách nhiệm kiến trúc tổng thể, bảo vệ Luật Thép Số 1 về Kho (InventoryLedger, FIFO/WAC), duyệt logic đối soát chuyến xe và công thức tính lương.
2. **Subagent Security / Backend**: `claude-sonnet-5-5`
   - Chịu trách nhiệm bảo mật, route handler guards, xác thực NextAuth session, role-based access control (RBAC), audit logging.
3. **Subagent Cleanup / Refactor / Utilities**: `claude-haiku-5-5`
   - Chịu trách nhiệm dọn dẹp route trùng lặp, tối ưu hàm tiện ích (HMAC webhook safe length), linting và kiểm soát định dạng.

*Lưu ý cấm kỵ: Tuyệt đối không dùng tên `claude-sonnet-4-5` hoặc `claude-haiku-4-5` vì gateway sẽ từ chối với lỗi 403 (Model not allowed).*
