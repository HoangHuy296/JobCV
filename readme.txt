========================================
HƯỚNG DẪN KHỞI ĐỘNG PROJECT
========================================

YÊU CẦU HỆ THỐNG:
- Node.js (v16 trở lên)
- MySQL (v8.0 trở lên)
- npm hoặc yarn

========================================
BƯỚC 1: CÀI ĐẶT DATABASE
========================================

1. Tạo database MySQL:
mysql -u root -p
CREATE DATABASE your_database_name;
exit;

========================================
BƯỚC 2: CẤU HÌNH BACKEND
========================================

1. Di chuyển vào thư mục backend:
cd back-end

2. Cài đặt dependencies:
npm install

3. Tạo file .env từ .env.example:
copy .env.example .env

4. Cấu hình file .env với thông tin của bạn:
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
DB_PORT=3306
JWT_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@cv.com
ADMIN_PASSWORD=admin@@123

5. Chạy migration để tạo bảng và dữ liệu mẫu:
npm run migrate

6. Khởi động backend:
npm run dev

Backend sẽ chạy tại: http://localhost:3000

========================================
BƯỚC 3: CẤU HÌNH FRONTEND
========================================

1. Mở terminal mới, di chuyển vào thư mục frontend:
cd front-end

2. Cài đặt dependencies:
npm install

3. Khởi động frontend:
npm run dev

Frontend sẽ chạy tại: http://localhost:5173

========================================
BƯỚC 4: TRUY CẬP ỨNG DỤNG
========================================

1. Mở trình duyệt và truy cập: http://localhost:5173

2. Đăng nhập với tài khoản admin:
Email: admin@cv.com
Password: admin@@123

========================================
CÁC LỆNH HỮU ÍCH
========================================

BACKEND:
- Chạy development mode: npm run dev
- Chạy production mode: npm start
- Chạy migration: npm run migrate

FRONTEND:
- Chạy development mode: npm run dev
- Build production: npm run build
- Preview production build: npm run preview
