# Dự án Fullstack (React Frontend & Node.js Backend)

Hướng dẫn cài đặt môi trường phát triển và chạy local trên Windows.

---

## 🛠️ Quy trình cài đặt môi trường (Chỉ làm lần đầu)

### 1. Cài đặt Scoop (Trình quản lý gói)
```bash
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser; iwr -useb get.scoop.sh | iex"
```
*Lưu ý: Sau khi cài xong Scoop, hãy tắt Terminal đi và mở lại một cửa sổ mới để máy nhận diện lệnh.*

### 2. Cài đặt MongoDB bằng Scoop
```bash
scoop install mongodb
```

### 3. Cài đặt Node.js bằng Scoop
```bash
scoop install nodejs
```

### 4. Cài đặt thư viện cho backend
Vào trong thư mục của Repo, sau đó vào `backend/`
```bash
npm install
```

### 5. Cài đặt thư viện cho frontend
Vào trong thư mục của Repo, sau đó vào `frontend/`
```bash
npm install
```

### 6. Cấu hình mongodb chạy được transactions
Ở Terminal thứ nhất, chạy server của mongodb
```bash
mongod --replSet rs0
```

Mở Terminal thứ 2
```bash
mongosh
rs.initiate()
```

*Lưu ý: Sau khi xong, hãy tắt Terminal thứ nhất đi.*

---

## 🚀 Hướng dẫn khởi chạy dự án

### ⚙️ Phần 1: Chạy Database
Mở cửa sổ Terminal thứ nhất
```
mongod --replSet rs0
```

### ⚙️ Phần 2:  Chạy Backend
Mở cửa sổ Terminal thứ hai.
Vào trong thư mục của Repo, sau đó vào `backend/`
```bash
npm run dev
```

### ⚙️ Phần 3:  Chạy frontend
Mở cửa sổ Terminal thứ ba.
Vào trong thư mục của Repo, sau đó vào `frontend/`
```bash
npm run dev
```