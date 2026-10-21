# HƯỚNG DẪN KÍCH HOẠT TỰ ĐỘNG DEPLOY VPS QUA GITHUB (CI/CD)

Hệ thống đã thiết lập sẵn luồng CI/CD tự động trong file `.github/workflows/deploy.yml`. 
Mỗi khi bạn `git push` lên nhánh `main` (hoặc `master`), GitHub Actions sẽ:
1. Tự động chạy kiểm tra Typescript (`tsc --noEmit`).
2. Tự động chạy 19 bài kiểm thử nghiệp vụ (`npm run test`).
3. Nếu tất cả đều PASS, GitHub sẽ tự động SSH vào VPS, pull code và chạy `docker compose up -d --build`.

---

## 🛠️ CÁC BƯỚC THIẾT LẬP 1 LẦN DUY NHẤT:

### 1. Khởi tạo Git và đẩy code lên GitHub
Mở Terminal tại thư mục dự án và chạy:
```bash
git init
git add .
git commit -m "feat: release sonkhang-erp v6 production ready with automated CI/CD"
git branch -M main
git remote add origin <URL_REPO_GITHUB_CUA_BAN>
git push -u origin main
```

### 2. Cấu hình Secrets trên GitHub Repository
Truy cập vào GitHub Repo của bạn:
👉 **Settings** -> **Secrets and variables** -> **Actions** -> Chọn **New repository secret**:

Thêm 4 thông số sau:
- `VPS_HOST`: Địa chỉ IP công khai của VPS (Ví dụ: `103.x.x.x` hoặc domain).
- `VPS_USERNAME`: Tên tài khoản SSH trên VPS (Mặc định là `root` hoặc `ubuntu`).
- `VPS_SSH_KEY`: Nội dung Private Key SSH (`id_rsa` hoặc `id_ed25519`) của bạn để GitHub đăng nhập vào VPS.
- `VPS_PORT`: Cổng SSH (Mặc định là `22`).

---

## 🖥️ CHUẨN BỊ MÔI TRƯỜNG TRÊN VPS LẦN ĐẦU:
Đăng nhập vào VPS của bạn và chạy lệnh cài Docker (nếu chưa có):
```bash
# Cài Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# Tạo thư mục dự án và cấp quyền
mkdir -p /opt/sonkhang-erp
cd /opt/sonkhang-erp

# Tạo trước file cấu hình môi trường bảo mật trên VPS
nano .env.production
```
*(Copy nội dung từ file `.env.production.example` sang và điền các secret thật).*

---

## 🚀 KẾT QUẢ VẬN HÀNH:
Từ nay về sau, bất kỳ khi nào bạn hoặc đội ngũ đẩy code lên GitHub (`git push origin main`), toàn bộ quy trình:
**Test -> Build Container -> Deploy VPS** sẽ diễn ra **HOÀN TOÀN TỰ ĐỘNG 100%**!
