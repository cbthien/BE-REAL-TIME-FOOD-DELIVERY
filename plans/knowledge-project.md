# Food Delivery — Project Knowledge Base

> **Mục đích**: Context file duy nhất để AI agent (hoặc dev mới) có thể hiểu toàn bộ project và thực hiện các task còn lại mà không cần hỏi thêm.  
> **Cập nhật**: 2026-03-11

---

## 1. Tổng quan dự án

- **Loại**: Food delivery — demo cho giảng viên (4-7 users, happy path).
- **Architecture**: Layered Architecture + Client-Server, Modular Monolith backend, Event-Driven module communication, Feature-based Frontend.
- **Repo root**: `food-delivery/` gồm `backend/`, `frontend/`, `plans/`, `docs/`.

---

## 2. Tech Stack

| Layer | Tech | Version | Ghi chú |
|-------|------|---------|---------|
| Backend runtime | NestJS | latest | Modular monolith, REST + WS |
| Database | MongoDB | 6.0 (Docker) | Mongoose ODM |
| Auth | JWT | passport-jwt | Global guards, @Public() bypass |
| Cross-module events | EventEmitter2 | @nestjs/event-emitter | @OnEvent() handlers |
| WebSocket | Socket.IO | @nestjs/platform-socket.io | Tracking gateway |
| Frontend framework | Next.js | 16.1.4 | App Router |
| UI library | React | 19.2.3 | — |
| Styling | Tailwind CSS | 3.4 | + shadcn-style components |
| HTTP client | Axios | 1.13 | JWT interceptor, 401 redirect |
| Animation | framer-motion | 12.x | — |
| Icons | lucide-react | 0.563 | — |
| Maps | Leaflet.js + OpenStreetMap | — | Planned (M3-FE-05) |

---

## 3. Cách chạy project

```bash
# 1. Start MongoDB (Docker)
cd backend
docker-compose up -d mongo

# 2. Backend
cd backend
cp .env.example .env      # PORT=3001, MONGO_URI=mongodb://localhost:27017/food_delivery, JWT_SECRET=...
npm install
npm run seed               # Tạo 4 users + 10 menu items
npm run start:dev          # localhost:3001

# 3. Frontend
cd frontend
npm install
npm run dev                # localhost:3000
```

**Env vars backend** (file `.env`):
```
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/food_delivery
JWT_SECRET=<any-string>
```

**Env vars frontend** (file `.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Test accounts** (seed):
| Email | Password | Role |
|-------|----------|------|
| customer@test.com | 123456 | CUSTOMER |
| staff@test.com | 123456 | STAFF |
| driver@test.com | 123456 | DRIVER |
| admin@test.com | 123456 | ADMIN |

---

## 4. Backend — Cấu trúc thư mục

```
backend/src/
├── main.ts                          # Bootstrap: PORT 3001, CORS, prefix /api, ValidationPipe
├── app.module.ts                    # Root module — import all modules, register global guards
├── seed.ts                          # Seed 4 users + 10 menu items
│
├── common/
│   ├── configs/                     # ConfigModule, env validation (NODE_ENV, PORT, MONGO_URI, JWT_SECRET)
│   ├── database/                    # MongoModule, AbstractSchema base class
│   ├── decorators/                  # @Public(), @Roles(), @CurrentUser()
│   └── guards/                      # JwtAuthGuard (global), RolesGuard (global)
│
├── integrations/
│   ├── payment/
│   │   ├── interfaces/              # PaymentGateway { charge(req): PaymentResult }
│   │   ├── adapters/                # MockPaymentAdapter — always success
│   │   └── payment.module.ts
│   └── map/
│       ├── interfaces/              # MapGateway { estimateEtaMinutes(req): number }
│       ├── adapters/                # MockMapAdapter — returns 20 min
│       └── map.module.ts
│
├── modules/
│   ├── auth/                        # ✅ Hoàn chỉnh
│   ├── ordering/                    # ✅ Hoàn chỉnh
│   ├── order-processing/            # ✅ Hoàn chỉnh
│   ├── delivery/                    # ✅ Hoàn chỉnh
│   └── events/                      # ✅ WebSocket Gateway
│
└── shared/
    ├── enums/                       # UserRole, OrderStatus
    └── constants/                   # app.constant.ts (empty)
```

---

## 5. Backend — Schemas (MongoDB Collections)

### User (`users`)
```typescript
{ email: string, passwordHash: string, name: string, role: UserRole, timestamps }
```
UserRole = `CUSTOMER | STAFF | DRIVER | ADMIN`

### Customer (`customers`) / Staff (`staffs`)
```typescript
Customer { user_id: ref User, default_address_id: ref Address }
Staff    { user_id: ref User, restaurant_id: ObjectId, is_active: boolean }
```

### Order (`orders`)
```typescript
{
  customerId: string,
  items: [{ menuItemId, name, quantity, unitPrice }],
  totalAmount: number,
  status: OrderStatus,          // PENDING → CONFIRMED → PREPARING → READY → DELIVERING → DELIVERED | CANCELLED
  deliveryAddress: string,
  timestamps
}
```

### MenuItem (`menuitems`)
```typescript
{ name, description, price, category, imageUrl, available: boolean, timestamps }
```

### KitchenTicket (`kitchentickets`)
```typescript
{
  orderId: string,
  items: [{ menuItemId, name, quantity }],
  status: TicketStatus,         // PENDING → IN_PROGRESS → READY | REJECTED
  staffId: string,
  acceptedAt, readyAt, rejectionReason,
  timestamps
}
```

### DeliveryAssignment (`deliveryassignments`)
```typescript
{
  orderId: string, driverId: string,
  status: DeliveryStatus,       // PENDING → ASSIGNED → PICKED_UP → DELIVERED
  pickupAddress, deliveryAddress,
  acceptedAt, pickedUpAt, deliveredAt,
  timestamps
}
```

### Driver (`drivers`)
```typescript
{
  userId: string,
  status: DriverStatus,         // PENDING → APPROVED | REJECTED
  vehicleType, licensePlate, phone,
  rejectionReason, timestamps
}
```

---

## 6. Backend — API Endpoints

### Auth (`/api/auth`) — BE2
| Method | Path | Auth | Response |
|--------|------|------|----------|
| POST | `/auth/register` | @Public | `{ token, user }` |
| POST | `/auth/login` | @Public | `{ token, user }` |
| GET | `/auth/me` | JWT | `{ id, email, role, name }` |

### Menu (`/api/menu`) — BE1
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/menu` | @Public | `MenuItem[]`, filter: `?category=X` |

### Orders (`/api/orders`) — BE1
| Method | Path | Auth | Response | Event |
|--------|------|------|----------|-------|
| POST | `/orders` | CUSTOMER | `Order` | emit `order.placed` |
| GET | `/orders/my` | CUSTOMER | `Order[]` | — |
| GET | `/orders/:id` | JWT | `Order` | — |

### Tickets (`/api/tickets`) — BE2
| Method | Path | Auth | Response | Event |
|--------|------|------|----------|-------|
| GET | `/tickets` | STAFF | `KitchenTicket[]`, filter: `?status=X` | — |
| GET | `/tickets/:id` | STAFF | `KitchenTicket` | — |
| POST | `/tickets/:id/accept` | STAFF | `KitchenTicket` | emit `ticket.confirmed` |
| POST | `/tickets/:id/reject` | STAFF | `KitchenTicket` | emit `ticket.rejected` |
| POST | `/tickets/:id/ready` | STAFF | `KitchenTicket` | emit `ticket.ready` |

### Delivery (`/api/delivery`) — BE2
| Method | Path | Auth | Response | Event |
|--------|------|------|----------|-------|
| GET | `/delivery/jobs` | DRIVER | `DeliveryAssignment[]` (PENDING) | — |
| POST | `/delivery/jobs/:id/accept` | DRIVER | `DeliveryAssignment` | emit `delivery.accepted` |
| POST | `/delivery/jobs/:id/pickup` | DRIVER | `DeliveryAssignment` | — |
| POST | `/delivery/jobs/:id/complete` | DRIVER | `DeliveryAssignment` | emit `delivery.delivered` |

### Driver Recruitment (`/api/drivers`, `/api/admin/drivers`) — BE1
| Method | Path | Auth | Response |
|--------|------|------|----------|
| POST | `/drivers/apply` | CUSTOMER | `Driver` |
| GET | `/admin/drivers` | ADMIN | `Driver[]`, filter: `?status=X` |
| POST | `/admin/drivers/:id/approve` | ADMIN | `Driver` (→ user role = DRIVER) |
| POST | `/admin/drivers/:id/reject` | ADMIN | `Driver`, body: `{reason}` |

### Admin Stats (`/api/admin`) — BE2 — ⬜ CHƯA IMPLEMENT
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/admin/stats` | ADMIN | `{ totalOrders, todayOrders, totalRevenue, activeDrivers }` |
| POST | `/admin/menu` | ADMIN | Create MenuItem |
| PUT | `/admin/menu/:id` | ADMIN | Update MenuItem |
| DELETE | `/admin/menu/:id` | ADMIN | Soft delete (available=false) |

### WebSocket — Tracking Gateway
| Event | Direction | Payload | Ghi chú |
|-------|-----------|---------|---------|
| `tracking:subscribe` | Client → Server | `{ orderId }` | Join room `order:{orderId}` |
| `driver:location` | Client → Server | `{ orderId, lat, lng }` | Driver emit vị trí |
| `location:update` | Server → Client | `{ orderId, lat, lng }` | Broadcast to room |

---

## 7. Event-Driven Flow (Cross-module)

```
Customer POST /orders
  └─ OrderingService.createOrder() → emit 'order.placed'
       └─ OrderProcessingService.handleOrderPlaced() → Tạo KitchenTicket (PENDING)

Staff POST /tickets/:id/accept
  └─ OrderProcessingService.acceptTicket() → emit 'ticket.confirmed'
       └─ OrderingService → Order: PENDING → CONFIRMED

Staff POST /tickets/:id/ready
  └─ OrderProcessingService.markReady() → emit 'ticket.ready'
       ├─ OrderingService → Order: PREPARING → READY
       └─ DeliveryService.handleTicketReady() → Tạo DeliveryAssignment (PENDING)

Driver POST /delivery/jobs/:id/accept
  └─ DeliveryService.acceptJob() → emit 'delivery.accepted'
       └─ OrderingService → Order: READY → DELIVERING

Driver POST /delivery/jobs/:id/complete
  └─ DeliveryService.completeJob() → emit 'delivery.delivered'
       └─ OrderingService → Order: DELIVERING → DELIVERED
```

**6 Events:**
| # | Event | Emitter | Listener(s) |
|---|-------|---------|-------------|
| 1 | `order.placed` | OrderingService | OrderProcessingService |
| 2 | `ticket.confirmed` | OrderProcessingService | OrderingService |
| 3 | `ticket.rejected` | OrderProcessingService | OrderingService |
| 4 | `ticket.ready` | OrderProcessingService | OrderingService + DeliveryService |
| 5 | `delivery.accepted` | DeliveryService | OrderingService |
| 6 | `delivery.delivered` | DeliveryService | OrderingService |

---

## 8. State Machines

### Order Status
```
PENDING ──→ CONFIRMED ──→ PREPARING ──→ READY ──→ DELIVERING ──→ DELIVERED
  │             │
  └─→ CANCELLED ←┘
```

### Ticket Status
```
PENDING ──→ IN_PROGRESS ──→ READY
  │             │
  └─→ REJECTED ←┘
```

### Delivery Status
```
PENDING ──→ ASSIGNED ──→ PICKED_UP ──→ DELIVERED
```

### Driver Status
```
PENDING ──→ APPROVED
  └──→ REJECTED
```

---

## 9. Frontend — Cấu trúc thư mục

```
frontend/src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page (/)
│   ├── providers.tsx                 # AuthProvider, CartProvider
│   ├── login/page.tsx                # /login
│   ├── register/page.tsx             # /register
│   ├── (customer)/
│   │   ├── menu/page.tsx             # /menu
│   │   ├── cart/page.tsx             # /cart
│   │   └── orders/
│   │       ├── page.tsx              # /orders (history)
│   │       └── [id]/page.tsx         # /orders/:id (detail)
│   ├── (staff)/
│   │   └── staff/tickets/page.tsx    # /staff/tickets
│   ├── (driver)/
│   │   └── driver/jobs/page.tsx      # /driver/jobs
│   └── (admin)/
│       ├── admin/dashboard/page.tsx  # /admin/dashboard
│       └── admin/drivers/page.tsx    # /admin/drivers
│
├── features/                         # Feature modules (service + hook + UI)
│   ├── auth/                         # auth.service, AuthContext, LoginForm, RegisterForm, useAuth
│   ├── menu/                         # menu.service, MenuItemCard, MenuList, useMenu
│   ├── cart/                         # CartContext, CartList, CartSummary
│   ├── orders/                       # order.service, OrderDetail, OrderList, OrderStatusBadge, useOrders
│   ├── staff/                        # staff.service, ticket.service, TicketCard, TicketQueue, useStaffQueue
│   ├── driver/                       # driver.service, job.service, JobCard, JobList, useDriverJobs
│   ├── admin/                        # admin.service, DriverTable, StatsCards, useAdminStats
│   └── tracking/                     # tracking.service, TrackingMap, DriverMarker, useTracking
│
├── components/
│   ├── layout/                       # Header, LandingHeader, LandingFooter, Sidebar, BottomNav, PageContainer
│   ├── shared/                       # HeroSection, PageHeader, ProductCard
│   └── ui/                          # Button, Card, Badge, Input, Label, Modal, Dialog, Spinner
│
├── lib/
│   ├── api.ts                        # Axios client — baseURL: localhost:3001, JWT interceptor, 401 redirect
│   ├── constants.ts                  # ROUTES, NAV_LINKS, HERO_SLIDE_COLORS, CONTACT_INFO
│   └── utils.ts                      # cn() class merge helper
│
├── mocks/                            # Mock data = API contracts cho backend
│   ├── index.ts
│   ├── menu.ts                       # MOCK_MENU_ITEMS (categories: Combos, Burgers, etc.)
│   └── promotions.ts                 # MOCK_HERO_SLIDES, MOCK_PROMO_BANNERS
│
├── types/                            # TypeScript interfaces
│   ├── index.ts
│   ├── user.ts                       # User, AuthToken
│   ├── order.ts                      # Order, OrderItem, OrderStatus
│   ├── ticket.ts                     # KitchenTicket, TicketStatus
│   ├── delivery.ts                   # DeliveryJob, DeliveryStatus, DriverLocation
│   └── menu.ts                       # MenuItem, MenuCategory
│
└── styles/globals.scss
```

---

## 10. Frontend — API Client (`lib/api.ts`)

```typescript
// Axios instance
baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
prefix: '/api'

// Request interceptor: auto-attach JWT from localStorage
// Response interceptor: 401 → clear token → redirect /login

// Type-safe methods:
api.get<T>(url)
api.post<T>(url, data)
api.put<T>(url, data)
api.patch<T>(url, data)
api.delete<T>(url)
```

---

## 11. Frontend — Feature Services (API calls)

### auth.service.ts
```typescript
login(email, password)          → POST /api/auth/login      → { token, user }
register(email, password, name) → POST /api/auth/register   → { token, user }
getMe()                         → GET  /api/auth/me         → User
```

### menu.service.ts
```typescript
getMenuItems(category?)         → GET /api/menu?category=X  → MenuItem[]
```

### order.service.ts
```typescript
createOrder(items, address)     → POST /api/orders           → Order
getMyOrders()                   → GET  /api/orders/my        → Order[]
getOrderById(id)                → GET  /api/orders/:id       → Order
```

### ticket.service.ts
```typescript
getTickets(status?)             → GET  /api/tickets?status=X → KitchenTicket[]
acceptTicket(id)                → POST /api/tickets/:id/accept
rejectTicket(id, reason)        → POST /api/tickets/:id/reject
markReady(id)                   → POST /api/tickets/:id/ready
```

### job.service.ts
```typescript
getAvailableJobs()              → GET  /api/delivery/jobs     → DeliveryJob[]
acceptJob(id)                   → POST /api/delivery/jobs/:id/accept
pickupJob(id)                   → POST /api/delivery/jobs/:id/pickup
completeJob(id)                 → POST /api/delivery/jobs/:id/complete
```

### admin.service.ts
```typescript
getDrivers(status?)             → GET  /api/admin/drivers?status=X
approveDriver(id)               → POST /api/admin/drivers/:id/approve
rejectDriver(id, reason)        → POST /api/admin/drivers/:id/reject
getStats()                      → GET  /api/admin/stats       // ⬜ BE chưa implement
```

### driver.service.ts
```typescript
applyAsDriver(data)             → POST /api/drivers/apply
```

### tracking.service.ts
```typescript
// Socket.IO client
connect(token)                  → WS connect
subscribeToOrder(orderId)       → emit 'tracking:subscribe'
sendLocation(orderId, lat, lng) → emit 'driver:location'
onLocationUpdate(callback)      → listen 'location:update'
```

---

## 12. Seed Data (backend/src/seed.ts)

### Users (4)
| Email | Role | Password |
|-------|------|----------|
| customer@test.com | CUSTOMER | 123456 |
| staff@test.com | STAFF | 123456 |
| driver@test.com | DRIVER | 123456 |
| admin@test.com | ADMIN | 123456 |

### Menu Items (10)
| Name | Price (VND) | Category |
|------|-------------|----------|
| Margherita Pizza | 120,000 | Pizza |
| Pepperoni Pizza | 150,000 | Pizza |
| Spaghetti Carbonara | 100,000 | Main |
| Caesar Salad | 70,000 | Salad |
| Garlic Bread | 40,000 | Side |
| Coca Cola | 15,000 | Drink |
| Orange Juice | 25,000 | Drink |
| Tiramisu | 60,000 | Dessert |
| Cheesecake | 65,000 | Dessert |
| BBQ Chicken Wings | 90,000 | Main |

---

## 13. Task còn lại (chưa hoàn thành)

### Backend — ⬜ Not Started
| Task ID | Mô tả | Assignment |
|---------|--------|------------|
| M4-BE-02 | `GET /api/admin/stats` — return `{totalOrders, todayOrders, totalRevenue, activeDrivers}`. Dùng `countDocuments` + `aggregate`. Admin role. | BE2 |
| M4-BE-03 | Menu CRUD: `POST /api/admin/menu`, `PUT /api/admin/menu/:id`, `DELETE /api/admin/menu/:id` (soft delete). Admin role. Qua repository layer. | BE2 |

### Frontend — ⬜ Not Started
| Task ID | Mô tả | Assignment |
|---------|--------|------------|
| M1-FE-03 | Route group layouts: Customer + Driver → BottomNav; Staff + Admin → Sidebar. | FE1 + FE2 |
| M2-FE-03 | Staff ticket detail page: `/(staff)/tickets/[id]` — full info, action buttons theo status. | FE1 |
| M3-FE-03 | WebSocket client: `lib/socket.ts` — Socket.IO connect với token, basic reconnect. | FE2 |
| M3-FE-04 | Driver fake location: dropdown chọn vị trí giả + nút "Gửi vị trí" → emit `driver:location`. | FE2 |
| M3-FE-05 | Customer tracking page `/(customer)/orders/[id]/tracking` — Leaflet + OpenStreetMap, subscribe WS room. | FE2 |
| M3-FE-06 | Map marker update: nhận WS event → cập nhật marker position. | FE2 |
| M4-FE-01 | Driver apply page `/(driver)/apply` — form: vehicleType, licensePlate, phone. | FE1 |
| M4-FE-04 | Admin menu CRUD page `/(admin)/menu` — table + add/edit/delete modal. | FE2 |

### Frontend — 🔄 In Progress
| Task ID | Mô tả | Assignment |
|---------|--------|------------|
| M4-FE-02 | Admin dashboard `/(admin)/dashboard` — 4 stats summary cards (fetch từ BE stats API). | FE2 |

### Milestone 5 — ⬜ Not Started
| Task ID | Mô tả |
|---------|--------|
| M5-01 | Demo seed data: enrich seed (5 sample orders, 2 approved drivers, 1 pending driver). |
| M5-02 | Integration testing: full 6 flows end-to-end. |
| M5-03 | Bug fixes from integration. |
| M5-04 | Demo script + rehearsal (15-20 min demo). |
| M5-05 | Documentation: README, architecture diagram, API summary → `/docs`. |

---

## 14. Design Patterns đã áp dụng

| Pattern | Vị trí | Mô tả |
|---------|--------|--------|
| **Adapter** | `integrations/payment/`, `integrations/map/` | Interface → MockAdapter. Dễ swap. |
| **Repository** | `modules/*/repositories/` | Encapsulate Mongoose access, service không gọi Model trực tiếp. |
| **State Guard** | `modules/*/state/` | Transition map + validation trước khi đổi status. |
| **Event-Driven** | EventEmitter2 + @OnEvent | Cross-module async communication. |
| **Strategy** | Payment gateway interface | Mở rộng cho nhiều payment method. |
| **Decorator** | `@Public()`, `@Roles()`, `@CurrentUser()` | AOP-style auth/authorization. |

---

## 15. Quy tắc khi implement

1. **Layer direction**: Controller → Service → Repository → Schema. Service KHÔNG import Model trực tiếp khi đã có Repository.
2. **Event emit**: Chỉ emit event từ **Service layer**, không emit từ Controller.
3. **State transition**: Phải validate qua `StateGuard` / `TransitionMap` trước khi update status.
4. **Auth**: Mọi route mặc định protected. Dùng `@Public()` cho route public, `@Roles()` cho role-specific.
5. **DTO validation**: Dùng `class-validator` + `ValidationPipe` (global). Mỗi endpoint nhận DTO rõ ràng.
6. **Frontend feature pattern**: Mỗi feature = `service.ts` (API calls) + `useXxx.ts` (hook) + `Component.tsx` (UI). Import lẫn nhau trong feature OK, nhưng không circular giữa features.
7. **No circular deps**: Module A không import Module B nếu B đã import A. Giao tiếp qua events.
8. **Demo scope**: Happy path only — không cần pagination, complex error handling, hay performance optimization.

---

## 16. Team & Phân công

| Thành viên | Vai trò | Modules |
|------------|---------|---------|
| Thanh Phúc (FE1) | Frontend Lead | Customer UI, Staff UI, Driver Apply |
| Tuấn Kiệt (FE2) | Frontend Developer | Driver UI, Tracking Map, Admin UI |
| Bá Thiên (BE1) | Backend Developer | Ordering, Tracking WS, Driver Recruitment |
| Tuấn Kha (BE2) | Backend Developer | Order-Processing, Delivery, Admin Stats |

---

## 17. Known Issues (đã fix)

| Issue | Fix |
|-------|-----|
| BE login trả `access_token`, FE expect `token` | Đổi response key → `token` |
| BE register trả `{userId}`, FE expect `{token, user}` | Register trả token + user |
| CORS chưa enable | `app.enableCors()` trong main.ts |
| Guards chưa global | Register APP_GUARD trong AppModule |
| Order items là `string[]` | Sửa schema items[] thành structured objects |
| Port mismatch (BE 3000, FE target 3001) | Set PORT=3001 |
| Seed script chưa có | Thêm `"seed": "ts-node src/seed.ts"` |
