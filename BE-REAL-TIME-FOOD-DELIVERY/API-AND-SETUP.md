# Backend Real-Time Food Delivery – Tóm tắt chức năng, API và cách chạy

## Công nghệ

- **NestJS** (TypeScript), **TypeORM**, **PostgreSQL**
- **JWT** (Passport), **Swagger** (API docs)
- **Prefix API:** `/api` — Swagger UI: **`/api/docs`**

---

## Cách chạy

### 1. Cài đặt PostgreSQL

- Chạy PostgreSQL (mặc định: `localhost:5432`).
- Tạo database: `real_time_food_delivery`.

```sql
CREATE DATABASE real_time_food_delivery;
```

### 2. Cấu hình DB (nếu cần)

File: `src/config/database.config.ts`

- **host:** `localhost`
- **port:** `5432`
- **username:** `postgres`
- **password:** `123456`
- **database:** `real_time_food_delivery`
- **synchronize:** `true` (tự tạo/cập nhật bảng)

### 3. Cài dependency và chạy

```bash
cd BE-REAL-TIME-FOOD-DELIVERY
npm install
npm run dev
```

- **Port:** `process.env.PORT` hoặc **3000**.
- **URL API:** `http://localhost:3000/api`
- **Swagger:** `http://localhost:3000/api/docs`

### 4. Seed dữ liệu

- **Admin:** Khi start app lần đầu, `AdminSeedService` tạo tài khoản:
  - **Email:** `admin@gmail.com`
  - **Password:** `123123`
- **Menu:** `MenuSeedService` tự chạy khi start (seed categories + menu items nếu chưa có).

---

## Chức năng chính

| Module        | Chức năng |
|---------------|-----------|
| **Auth**      | Đăng ký khách, đăng nhập (JWT), lấy thông tin user đăng nhập (`/auth/me`) |
| **Menu**      | Xem menu công khai (filter category), xem chi tiết món; Admin/Staff: tạo category, tạo món |
| **Cart**      | Khách: thêm/sửa/xóa giỏ, lấy giỏ hiện tại |
| **Orders**    | Khách: tạo đơn từ giỏ, xem đơn của mình, chi tiết đơn, hủy đơn, xác nhận đã nhận |
| **Staff Orders** | Staff: xem tất cả đơn, chi tiết đơn, cập nhật trạng thái đến READY, assign tài xế, hủy đơn |
| **Driver Orders** | Tài xế: xem đơn được assign, chi tiết đơn, xác nhận đã lấy hàng, xác nhận đã giao |
| **Driver Profile** | Tài xế: bật/tắt trạng thái online/offline |
| **Staff Menu** | Staff: bật/tắt món (availability) |
| **Admin**     | Tạo/sửa/xem Staff và Driver |

---

## Danh sách Endpoints (prefix `/api`)

### Auth – `POST/GET /api/auth/*`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/auth/register/customer` | Đăng ký khách hàng | Không |
| POST | `/auth/login` | Đăng nhập (trả JWT) | Không |
| GET  | `/auth/me` | Thông tin user hiện tại | Bearer JWT |

---

### Menu – `GET/POST /api/menu/*`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET  | `/menu` | Danh sách món (query: `category`) | Không |
| GET  | `/menu/:id` | Chi tiết món | Không |
| POST | `/menu/categories` | Tạo category | Admin/Staff |
| POST | `/menu/items` | Tạo món | Admin/Staff |

---

### Cart – `GET/POST/PATCH/DELETE /api/cart/*` (Customer, JWT)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET  | `/cart` | Lấy giỏ hiện tại |
| POST | `/cart/items` | Thêm món vào giỏ |
| PATCH | `/cart/items/:cartItemId` | Sửa số lượng |
| DELETE | `/cart/items/:cartItemId` | Xóa món khỏi giỏ |

---

### Orders (Customer) – `GET/POST/PATCH /api/orders/*` (Customer, JWT)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/orders` | Tạo đơn từ giỏ (checkout; body có thể gửi `deliveryLat`, `deliveryLng` từ Location khách) |
| GET  | `/orders` | Danh sách đơn của tôi |
| GET  | `/orders/:id` | Chi tiết đơn |
| PATCH | `/orders/:id/cancel` | Hủy đơn |
| PATCH | `/orders/:id/confirm-delivered` | Xác nhận đã nhận hàng |

---

### Staff Orders – `GET/PATCH /api/staff/orders/*` (Staff, JWT)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET  | `/staff/orders/available-drivers` | Danh sách tài xế online/available để staff assign |
| GET  | `/staff/orders` | Tất cả đơn (query filter) |
| GET  | `/staff/orders/:orderId` | Chi tiết đơn |
| PATCH | `/staff/orders/:orderId/status` | Cập nhật trạng thái (đến READY) |
| PATCH | `/staff/orders/:orderId/assign-driver` | Gán tài xế (body: `driverId`) |
| PATCH | `/staff/orders/:orderId/cancel` | Hủy đơn |

---

### Driver Orders – `GET/PATCH /api/driver/orders/*` (Driver, JWT)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET  | `/driver/orders` | Đơn được assign cho tài xế |
| GET  | `/driver/orders/:id` | Chi tiết đơn |
| PATCH | `/driver/orders/:id/pick-up` | Xác nhận đã lấy hàng |
| PATCH | `/driver/orders/:id/confirm-delivered` | Xác nhận đã giao (BE set `status = DELIVERED`, `deliveredAt`) |
| PATCH | `/driver/orders/:id/location` | Driver cập nhật vị trí hiện tại (body: `lat`, `lng`); chỉ khi order READY hoặc PICKED_UP |

---

### Driver Profile – `PATCH /api/driver/profile/*` (Driver, JWT)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| PATCH | `/driver/profile/online` | Bật trạng thái online |
| PATCH | `/driver/profile/offline` | Tắt trạng thái offline |

---

### Staff Menu – `PATCH /api/staff/menu-items/*` (Staff, JWT)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| PATCH | `/staff/menu-items/:id/availability` | Bật/tắt món (body: `isAvailable`) |

---

### Admin – `GET/POST/PATCH /api/admin/*` (Admin, JWT)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/admin/staffs` | Tạo staff |
| GET  | `/admin/staffs` | Danh sách staff |
| GET  | `/admin/staffs/:userId` | Chi tiết staff |
| PATCH | `/admin/staffs/:userId` | Cập nhật staff |
| POST | `/admin/drivers` | Tạo driver |
| GET  | `/admin/drivers` | Danh sách drivers |
| GET  | `/admin/drivers/:userId` | Chi tiết driver |
| PATCH | `/admin/drivers/:userId` | Cập nhật driver |

---

## Scripts trong `package.json`

| Script | Mô tả |
|--------|--------|
| `npm run build` | Build NestJS |
| `npm run start` | Chạy (không watch) |
| `npm run start:dev` / `npm run dev` | Chạy development (watch) |
| `npm run start:prod` | Chạy production (`node dist/main`) |
| `npm run lint` | ESLint |
| `npm run test` | Unit test |
| `npm run test:e2e` | E2E test |

---

## Lưu ý

- **CORS:** Đang bật `origin: '*'` (trong `main.ts`).
- **Tracking vị trí tài xế:** REST + polling (FE polling 15s). BE lưu tọa độ driver vào order (`driver_lat`, `driver_lng`, `driver_location_updated_at`). Response order (customer/staff/driver) có `deliveryLocation` và `driverLocation` (lat, lng, timestamp) để FE vẽ map và ETA.
