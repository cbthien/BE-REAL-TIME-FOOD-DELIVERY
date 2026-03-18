# Frontend Architecture — Pure Feature-Based Pattern

## Tổng quan

Frontend sử dụng **Pure Feature-Based Architecture** với Next.js 16 App Router.

### Nguyên tắc chính

1. **Mỗi feature là một module tự chứa** — chứa service + hooks + state + UI components
2. **`components/`** chỉ giữ **shared non-domain** components (UI primitives, layout wrappers)
3. **Không có domain component nào nằm trong `components/`** — tất cả nằm trong `features/`

---

## Cấu trúc thư mục

```
frontend/src/
│
├── app/                          # Next.js App Router (routing only)
│   ├── layout.tsx                # Root layout + Header
│   ├── providers.tsx             # AuthProvider + CartProvider
│   ├── (customer)/               # Customer route group
│   │   ├── page.tsx              # Landing page
│   │   ├── menu/page.tsx
│   │   ├── cart/page.tsx
│   │   └── orders/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── (staff)/                  # Staff route group
│   │   └── tickets/page.tsx
│   ├── (driver)/                 # Driver route group
│   │   └── jobs/page.tsx
│   ├── (admin)/                  # Admin route group
│   │   ├── dashboard/page.tsx
│   │   └── drivers/page.tsx
│   └── login/page.tsx
│
├── features/                     # ★ Domain modules (core)
│   ├── auth/                     # Authentication
│   │   ├── auth.service.ts       #   API calls
│   │   ├── auth.storage.ts       #   Token persistence
│   │   ├── AuthContext.tsx        #   Global auth state
│   │   ├── useAuth.ts            #   Hook
│   │   ├── LoginForm.tsx         #   UI component
│   │   └── index.ts              #   Public exports
│   ├── cart/                     # Shopping cart
│   │   ├── CartContext.tsx        #   Cart state + localStorage
│   │   ├── CartList.tsx           #   Cart items UI
│   │   ├── CartSummary.tsx        #   Order summary UI
│   │   └── index.ts
│   ├── menu/                     # Menu browsing
│   │   ├── menu.service.ts
│   │   ├── useMenu.ts
│   │   ├── MenuList.tsx
│   │   ├── MenuItemCard.tsx
│   │   └── index.ts
│   ├── orders/                   # Customer orders
│   │   ├── order.service.ts
│   │   ├── useOrders.ts
│   │   ├── OrderList.tsx
│   │   ├── OrderDetail.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   └── index.ts
│   ├── staff/                    # Kitchen ticket queue
│   │   ├── staff.service.ts
│   │   ├── ticket.service.ts
│   │   ├── useStaffQueue.ts
│   │   ├── useTickets.ts
│   │   ├── TicketQueue.tsx
│   │   ├── TicketCard.tsx
│   │   └── index.ts
│   ├── driver/                   # Delivery jobs
│   │   ├── driver.service.ts
│   │   ├── job.service.ts
│   │   ├── useDriverJobs.ts
│   │   ├── useJobs.ts
│   │   ├── JobList.tsx
│   │   ├── JobCard.tsx
│   │   └── index.ts
│   ├── tracking/                 # Real-time GPS tracking
│   │   ├── tracking.service.ts
│   │   ├── useTracking.ts
│   │   ├── TrackingMap.tsx
│   │   ├── DriverMarker.tsx
│   │   └── index.ts
│   └── admin/                    # Admin dashboard
│       ├── admin.service.ts
│       ├── useAdminStats.ts
│       ├── StatsCards.tsx
│       ├── DriverTable.tsx
│       └── index.ts
│
├── components/                   # ★ Shared non-domain components
│   ├── ui/                       #   shadcn/ui primitives
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Label.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── index.ts
│   ├── layout/                   #   Layout wrappers
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PageContainer.tsx
│   │   └── index.ts
│   └── shared/                   #   Shared generic components
│       └── PageHeader.tsx
│
├── lib/                          # Infrastructure utilities
│   ├── api.ts                    #   HTTP client (axios wrapper)
│   ├── constants.ts
│   └── utils.ts
│
├── types/                        # TypeScript type definitions
│   ├── index.ts
│   ├── user.ts
│   ├── menu.ts
│   ├── order.ts
│   ├── ticket.ts
│   └── delivery.ts
│
└── styles/
    └── globals.scss
```

---

## Quy tắc phân chia

### `features/` — Domain business modules

| Nằm trong `features/` | Ví dụ |
|---|---|
| Service (API calls) | `order.service.ts` |
| Custom hooks | `useOrders.ts`, `useMenu.ts` |
| React Context (global state) | `AuthContext.tsx`, `CartContext.tsx` |
| UI Components **gắn liền domain** | `OrderList.tsx`, `TicketCard.tsx`, `MenuItemCard.tsx` |
| Barrel export | `index.ts` |

### `components/` — Shared non-domain components

| Nằm trong `components/` | Ví dụ |
|---|---|
| UI primitives (shadcn/ui) | `Button.tsx`, `Card.tsx`, `Input.tsx` |
| Layout wrappers | `Header.tsx`, `Sidebar.tsx`, `PageContainer.tsx` |
| Cross-cutting shared components | `PageHeader.tsx` |

### ❌ KHÔNG nằm trong `components/`

| Sai | Đúng |
|---|---|
| `components/cart/CartList.tsx` | `features/cart/CartList.tsx` |
| `components/menu/MenuItemCard.tsx` | `features/menu/MenuItemCard.tsx` |
| `components/order/OrderDetail.tsx` | `features/orders/OrderDetail.tsx` |

---

## Quy tắc import

```typescript
// ✅ Page imports từ features (qua barrel export index.ts)
import { MenuList, useMenu } from '@/features/menu';
import { CartList, CartSummary, useCart } from '@/features/cart';
import { OrderList, OrderDetail } from '@/features/orders';

// ✅ Page imports shared layout/ui
import { PageContainer } from '@/components/layout';
import { Button, Card, Spinner } from '@/components/ui';

// ✅ Feature imports shared ui
import { Badge, Card } from '@/components/ui';

// ✅ Feature imports types
import type { Order, MenuItem } from '@/types';

// ✅ Feature imports lib
import { api } from '@/lib/api';

// ❌ KHÔNG import trực tiếp file nội bộ của feature khác
import { CartContext } from '@/features/cart/CartContext'; // ❌
import { useCart } from '@/features/cart';                 // ✅

// ❌ KHÔNG để domain component trong components/
import { CartList } from '@/components/cart/CartList';     // ❌ Folder này không tồn tại
```

---

## Feature Module Template

Khi tạo feature mới, follow template sau:

```
features/{feature-name}/
├── {feature}.service.ts    # API calls
├── use{Feature}.ts         # Custom hook (data fetching)
├── {Feature}Context.tsx    # (Optional) Global state nếu cần Context
├── {Component}.tsx         # UI components
└── index.ts                # Public barrel export
```

**index.ts template:**
```typescript
// features/{feature}/index.ts
export { ComponentA } from './ComponentA';
export { ComponentB } from './ComponentB';
export { useFeature } from './useFeature';
export { featureService } from './feature.service';
export type { SomeType } from './feature.service';
```

---

## Data Flow Pattern

```
app/page.tsx (routing)
  └── imports from features/
        ├── UI Components  ← render
        ├── Hooks          ← business logic + state
        │   └── Service    ← API calls
        │       └── lib/api.ts ← HTTP client
        └── Context        ← global state (auth, cart)
```

| Layer | File | Responsibility |
|-------|------|----------------|
| **Page** | `app/(customer)/menu/page.tsx` | Routing, layout, compose features |
| **Feature Component** | `features/menu/MenuList.tsx` | Domain-specific UI |
| **Hook** | `features/menu/useMenu.ts` | Data fetching, state, business logic |
| **Service** | `features/menu/menu.service.ts` | API communication |
| **API Client** | `lib/api.ts` | HTTP wrapper, auth headers, error handling |
| **Shared UI** | `components/ui/Button.tsx` | Generic reusable primitives |
| **Layout** | `components/layout/Header.tsx` | App shell, navigation |
