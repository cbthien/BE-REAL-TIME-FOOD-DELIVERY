# Frontend Data Flow Diagram

## Tổng quan kiến trúc Frontend

Dự án sử dụng **Next.js 16** với **App Router** và **Feature-Based Architecture**.

```mermaid
flowchart TB
    subgraph BROWSER["BROWSER"]
        subgraph NEXT["Next.js App Router"]
            subgraph LAYOUT["Root Layout"]
                PROVIDERS["<Providers />"]
            end
            
            subgraph ROUTES["Route Groups"]
                LOGIN["/login"]
                CUSTOMER["(customer)/<br/>Menu | Cart | Orders"]
                STAFF["(staff)/orders"]
                DRIVER["(driver)/jobs"]
                ADMIN["(admin)/<br/>Dashboard | Drivers"]
            end
        end
        
        subgraph FEATURES["Feature-Based Architecture"]
            AUTH["features/auth"]
            CART["features/cart"]
            MENU["features/menu"]
            ORDERS["features/orders"]
            STAFF_F["features/staff"]
            DRIVER_F["features/driver"]
            TRACKING["features/tracking"]
            ADMIN_F["features/admin"]
        end
        
        subgraph SHARED["Shared"]
            COMPONENTS["components/"]
            UI["components/ui/"]
            LIB["lib/"]
            TYPES["types/"]
        end
    end
    
    subgraph BACKEND["BACKEND API"]
        REST["REST API<br/>NestJS"]
        WS["WebSocket<br/>Real-time Tracking"]
    end
    
    %% Layout flow
    PROVIDERS --> ROUTES
    
    %% Routes to Features
    LOGIN --> AUTH
    CUSTOMER --> MENU & CART & ORDERS
    CUSTOMER --> TRACKING
    STAFF --> STAFF_F
    DRIVER --> DRIVER_F
    DRIVER --> TRACKING
    ADMIN --> ADMIN_F
    
    %% Features connections
    AUTH -.-> CART & ORDERS & STAFF_F & DRIVER_F & ADMIN_F
    CART -.-> ORDERS
    
    %% Shared
    UI -.-> FEATURES
    LAYOUT -.-> ROUTES
    LIB -.-> FEATURES
    TYPES -.-> FEATURES
    
    %% Backend
    FEATURES --> REST
    TRACKING --> WS
```

## Feature-Based Architecture Pattern

Mỗi feature là một module độc lập chứa đầy đủ các thành phần:

```mermaid
flowchart TD
    subgraph FEATURE["features/{feature}/"]
        INDEX["index.ts<br/>Public API"]
        
        subgraph COMP["Components"]
            COMP1["*.tsx UI Components"]
        end
        
        subgraph STATE["State"]
            CTX["*Context.tsx<br/>React Context"]
            HOOK["use*.ts<br/>Custom Hooks"]
        end
        
        subgraph API["API Layer"]
            SVC["*.service.ts<br/>API Calls"]
        end
    end
    
    subgraph LIB["lib/"]
        API_CLIENT["api.ts<br/>HTTP Client"]
    end
    
    subgraph PAGE["app/{route}/page.tsx"]
        ROUTE["Page Component"]
    end
    
    INDEX --> COMP & STATE & API
    COMP --> HOOK
    HOOK --> CTX
    HOOK --> SVC
    SVC --> API_CLIENT
    ROUTE --> INDEX
```

## Chi tiết Data Flow theo Feature

### 1. Auth Feature

```mermaid
flowchart LR
    subgraph UI["UI"]
        LOGIN_FORM["LoginForm.tsx"]
    end
    
    subgraph STATE["State"]
        AUTH_CTX["AuthContext.tsx<br/>{user, login, logout}"]
        USE_AUTH["useAuth.ts"]
    end
    
    subgraph API["API"]
        AUTH_SVC["auth.service.ts"]
        AUTH_STORAGE["auth.storage.ts"]
    end
    
    subgraph INFRA["Infrastructure"]
        API_CLIENT["lib/api.ts"]
        LOCAL["localStorage<br/>token"]
    end
    
    LOGIN_FORM --> USE_AUTH
    USE_AUTH --> AUTH_CTX
    AUTH_CTX --> AUTH_SVC
    AUTH_SVC --> API_CLIENT
    AUTH_SVC --> AUTH_STORAGE
    AUTH_STORAGE --> LOCAL
```

**Data Flow:**
1. User nhập credentials → `LoginForm`
2. Gọi `useAuth().login(data)`
3. `AuthContext` gọi `authService.login()`
4. Service gọi API → nhận `{token, user}`
5. `authStorage.setToken(token)` → lưu localStorage
6. `AuthContext` cập nhật `user` state
7. Toàn app re-render với auth mới

### 2. Cart Feature

```mermaid
flowchart LR
    subgraph UI["UI"]
        CART_LIST["CartList.tsx"]
        CART_SUMMARY["CartSummary.tsx"]
    end
    
    subgraph STATE["State"]
        CART_CTX["CartContext.tsx<br/>{items, addItem, removeItem...}"]
        USE_CART["useCart.ts"]
    end
    
    subgraph STORAGE["Persistence"]
        LOCAL["localStorage<br/>cart_items"]
    end
    
    subgraph PAGE["Pages"]
        MENU_PAGE["/menu"]
        CART_PAGE["/cart"]
    end
    
    MENU_PAGE --> CART_SUMMARY
    CART_PAGE --> CART_LIST & CART_SUMMARY
    CART_LIST --> USE_CART
    CART_SUMMARY --> USE_CART
    USE_CART --> CART_CTX
    CART_CTX -.persist.-> LOCAL
    CART_CTX -.load.-> LOCAL
```

**Data Flow:**
1. Customer thêm item → `addItem(menuItem, qty)`
2. `CartContext` cập nhật `items` state
3. `useEffect` lưu `localStorage.setItem('cart_items')`
4. Cart icon tự động cập nhật số lượng
5. Reload page → `cartItemsFromStorage()` khôi phục cart

### 3. Orders Feature

```mermaid
flowchart LR
    subgraph UI["UI"]
        ORDER_LIST["OrderList.tsx"]
        ORDER_DETAIL["OrderDetail.tsx"]
        STATUS_BADGE["OrderStatusBadge.tsx"]
    end
    
    subgraph STATE["State"]
        USE_ORDERS["useOrders.ts<br/>{orders, loading, refetch}"]
        USE_ORDER["useOrder.ts<br/>{order, loading}"]
    end
    
    subgraph API["API"]
        ORDER_SVC["order.service.ts"]
    end
    
    subgraph PAGE["Pages"]
        ORDERS_PAGE["/orders"]
        ORDER_PAGE["/orders/[id]"]
    end
    
    ORDERS_PAGE --> ORDER_LIST
    ORDER_PAGE --> ORDER_DETAIL
    ORDER_LIST --> USE_ORDERS
    ORDER_DETAIL --> USE_ORDER
    ORDER_DETAIL --> STATUS_BADGE
    USE_ORDERS --> ORDER_SVC
    USE_ORDER --> ORDER_SVC
```

**Data Flow:**
1. Page mount → `useEffect` gọi `orderService.getMyOrders()`
2. Service gọi `GET /orders/my`
3. Data trả về → cập nhật `orders` state
4. Component render list
5. Click order → navigate `/orders/[id]`
6. `useOrder(id)` gọi `orderService.getById(id)`
7. Component render chi tiết

### 4. Staff Feature

```mermaid
flowchart LR
    subgraph UI["UI"]
        TICKET_QUEUE["TicketQueue.tsx"]
        TICKET_CARD["TicketCard.tsx"]
    end
    
    subgraph STATE["State"]
        USE_QUEUE["useStaffQueue.ts<br/>{tickets, loading, refetch}"]
    end
    
    subgraph API["API"]
        STAFF_SVC["staff.service.ts"]
    end
    
    subgraph PAGE["Page"]
        STAFF_PAGE["/staff/orders"]
    end
    
    STAFF_PAGE --> TICKET_QUEUE
    TICKET_QUEUE --> TICKET_CARD
    TICKET_QUEUE --> USE_QUEUE
    TICKET_CARD --> STAFF_SVC
    USE_QUEUE --> STAFF_SVC
```

**Data Flow:**
1. Staff mở `/staff/orders`
2. `useStaffQueue()` gọi `staffService.getQueue()`
3. API trả về danh sách `KitchenTicket[]`
4. Render `TicketCard` cho mỗi ticket
5. Staff click Accept → `staffService.acceptTicket(id)`
6. API cập nhật → `refetch()` reload queue

### 5. Driver Feature

```mermaid
flowchart LR
    subgraph UI["UI"]
        JOB_LIST["JobList.tsx"]
        JOB_CARD["JobCard.tsx"]
    end
    
    subgraph STATE["State"]
        USE_JOBS["useDriverJobs.ts<br/>{jobs, loading, refetch}"]
        USE_DRIVER_JOBS["useDriverJobs.ts"]
    end
    
    subgraph API["API"]
        DRIVER_SVC["driver.service.ts"]
        JOB_SVC["job.service.ts"]
    end
    
    subgraph PAGE["Page"]
        JOBS_PAGE["/driver/jobs"]
    end
    
    JOBS_PAGE --> JOB_LIST
    JOB_LIST --> JOB_CARD
    JOB_LIST --> USE_JOBS
    JOB_CARD --> DRIVER_SVC
    USE_JOBS --> DRIVER_SVC
```

**Data Flow:**
1. Driver mở `/driver/jobs`
2. `useDriverJobs()` gọi `driverService.getMyJobs()`
3. API trả về `DeliveryJob[]`
4. Driver click Accept → `driverService.acceptJob(jobId)`
5. Sau đó có thể: `pickupJob()` → `deliverJob()`

### 6. Tracking Feature (Real-time)

```mermaid
flowchart LR
    subgraph UI["UI"]
        MAP["TrackingMap.tsx"]
        DRIVER_MARKER["DriverMarker.tsx"]
    end
    
    subgraph STATE["State"]
        USE_TRACKING["useTracking.ts<br/>{tracking, connected}"]
    end
    
    subgraph API["API"]
        TRACKING_SVC["tracking.service.ts"]
    end
    
    subgraph REALTIME["Real-time"]
        SOCKET["WebSocket<br/>Socket.io"]
    end
    
    subgraph PAGE["Page"]
        ORDER_TRACKING["/orders/[id]"]
    end
    
    ORDER_TRACKING --> MAP
    MAP --> DRIVER_MARKER
    MAP --> USE_TRACKING
    USE_TRACKING --> TRACKING_SVC
    USE_TRACKING <--WebSocket--> SOCKET
```

**Data Flow:**
1. Customer mở order tracking
2. `useTracking(orderId)` khởi tạo WebSocket
3. Socket emit `track_order` event
4. Server broadcast `tracking_update` khi có thay đổi
5. `driver_location` events cập nhật vị trí real-time
6. Map re-render với marker mới

## Context Providers Flow

```mermaid
flowchart TD
    subgraph ROOT["app/layout.tsx"]
        HTML["<html>"]
        BODY["<body>"]
    end
    
    subgraph PROV["app/providers.tsx"]
        AUTH_P["<AuthProvider>"]
        CART_P["<CartProvider>"]
    end
    
    subgraph AUTH["features/auth/AuthContext"]
        AUTH_STATE["user: User | null<br/>loading: boolean<br/>isAuthenticated"]
        AUTH_METHODS["login()<br/>register()<br/>logout()"]
    end
    
    subgraph CART["features/cart/CartContext"]
        CART_STATE["items: OrderItem[]<br/>totalAmount<br/>itemCount"]
        CART_METHODS["addItem()<br/>removeItem()<br/>updateQuantity()<br/>clearCart()"]
    end
    
    subgraph CHILDREN["App Routes"]
        PAGES["All Pages"]
    end
    
    HTML --> BODY --> PROV
    AUTH_P --> AUTH
    AUTH --> CART_P --> CART
    CART --> CHILDREN
    
    AUTH -.useAuth.-> PAGES
    CART -.useCart.-> PAGES
```

## API Layer Architecture

```mermaid
flowchart TB
    subgraph FEATURES["Feature Services"]
        AUTH_SVC["auth.service.ts"]
        ORDER_SVC["order.service.ts"]
        STAFF_SVC["staff.service.ts"]
        DRIVER_SVC["driver.service.ts"]
        TRACKING_SVC["tracking.service.ts"]
        MENU_SVC["menu.service.ts"]
    end
    
    subgraph HTTP["HTTP Layer"]
        API_CLIENT["lib/api.ts<br/>Generic HTTP Client"]
    end
    
    subgraph CONFIG["Config"]
        ENV["process.env<br/>NEXT_PUBLIC_API_URL"]
        TOKEN["localStorage<br/>auth_token"]
    end
    
    subgraph BACKEND["Backend"]
        API["NestJS API<br/>http://localhost:3000/api"]
    end
    
    FEATURES --> API_CLIENT
    API_CLIENT --> ENV
    API_CLIENT --> TOKEN
    API_CLIENT --> API
```

## Data Flow Patterns

### Pattern 1: Server State (useEffect + Service)

```mermaid
sequenceDiagram
    participant Page as Page Component
    participant Hook as useFeature.ts
    participant SVC as feature.service.ts
    participant API as lib/api.ts
    participant Back as Backend
    
    Page->>Hook: useOrders()
    Hook->>SVC: orderService.getMyOrders()
    SVC->>API: api.get('/orders/my')
    API->>Back: GET /api/orders/my
    Back-->>API: Order[]
    API-->>SVC: Order[]
    SVC-->>Hook: Order[]
    Hook->>Hook: setOrders(data)
    Hook-->>Page: {orders, loading, error}
```

### Pattern 2: Client State (Context + localStorage)

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Hook as useCart()
    participant CTX as CartContext
    participant LS as localStorage
    
    UI->>Hook: addItem(menuItem)
    Hook->>CTX: addItem()
    CTX->>CTX: setItems([...items, newItem])
    CTX->>LS: localStorage.setItem('cart_items')
    CTX-->>Hook: updated context
    Hook-->>UI: re-render
```

### Pattern 3: Authentication Flow

```mermaid
sequenceDiagram
    participant Form as LoginForm
    participant UseAuth as useAuth()
    participant AuthCtx as AuthContext
    participant AuthSvc as auth.service
    participant Storage as auth.storage
    participant API as lib/api
    participant Back as Backend
    
    Form->>UseAuth: login({email, password})
    UseAuth->>AuthCtx: login(data)
    AuthCtx->>AuthSvc: authService.login(data)
    AuthSvc->>API: api.post('/auth/login')
    API->>Back: POST /api/auth/login
    Back-->>API: {token, user}
    API-->>AuthSvc: {token, user}
    AuthSvc->>Storage: setToken(token)
    AuthSvc-->>AuthCtx: {token, user}
    AuthCtx->>AuthCtx: setUser(user)
    AuthCtx-->>UseAuth: context updated
    UseAuth-->>Form: isAuthenticated = true
```

### Pattern 4: Real-time Tracking Flow

```mermaid
sequenceDiagram
    participant Map as TrackingMap
    participant Hook as useTracking
    participant Socket as Socket.io
    participant Server as WS Server
    participant Driver as Driver App
    
    Map->>Hook: useTracking(orderId)
    Hook->>Socket: io.connect()
    Socket->>Server: track_order {orderId}
    Server-->>Socket: subscription confirmed
    
    loop Every 5s
        Driver->>Server: publish_location
        Server->>Socket: driver_location
        Socket->>Hook: setTracking(update)
        Hook->>Map: re-render with new position
    end
```

## Directory Structure

```
frontend/src/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Route group: Admin
│   │   ├── dashboard/page.tsx
│   │   └── drivers/page.tsx
│   ├── (customer)/               # Route group: Customer
│   │   ├── page.tsx              # Home
│   │   ├── menu/page.tsx
│   │   ├── cart/page.tsx
│   │   └── orders/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── (driver)/                 # Route group: Driver
│   │   └── jobs/
│   │       ├── page.tsx
│   │       └── [orderId]/page.tsx
│   ├── (staff)/                  # Route group: Staff
│   │   └── tickets/page.tsx
│   ├── login/page.tsx
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # Context providers
│   └── globals.scss
├── components/                   # Shared (non-domain) components
│   ├── layout/                   # Layout wrappers
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PageContainer.tsx
│   │   └── index.ts
│   ├── shared/                   # Shared generic components
│   │   └── PageHeader.tsx
│   └── ui/                       # shadcn/ui primitives
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Dialog.tsx
│       ├── Input.tsx
│       ├── Label.tsx
│       ├── Modal.tsx
│       ├── Spinner.tsx
│       └── index.ts
├── features/                     # Feature-Based Architecture
│   ├── auth/                     # Auth feature
│   │   ├── AuthContext.tsx       # React Context
│   │   ├── auth.service.ts       # API calls
│   │   ├── auth.storage.ts       # localStorage
│   │   ├── useAuth.ts            # Hook
│   │   ├── LoginForm.tsx         # UI Component
│   │   └── index.ts              # Public API
│   ├── cart/                     # Cart feature
│   │   ├── CartContext.tsx
│   │   ├── CartList.tsx
│   │   ├── CartSummary.tsx
│   │   └── index.ts
│   ├── menu/                     # Menu feature
│   │   ├── menu.service.ts
│   │   ├── useMenu.ts
│   │   ├── MenuList.tsx
│   │   ├── MenuItemCard.tsx
│   │   └── index.ts
│   ├── orders/                   # Orders feature
│   │   ├── order.service.ts
│   │   ├── useOrders.ts
│   │   ├── OrderList.tsx
│   │   ├── OrderDetail.tsx
│   │   └── index.ts
│   ├── staff/                    # Staff feature
│   │   ├── staff.service.ts
│   │   ├── useStaffQueue.ts
│   │   ├── TicketQueue.tsx
│   │   ├── TicketCard.tsx
│   │   └── index.ts
│   ├── driver/                   # Driver feature
│   │   ├── driver.service.ts
│   │   ├── job.service.ts
│   │   ├── useDriverJobs.ts
│   │   ├── JobList.tsx
│   │   ├── JobCard.tsx
│   │   └── index.ts
│   ├── tracking/                 # Tracking feature
│   │   ├── tracking.service.ts
│   │   ├── useTracking.ts
│   │   ├── TrackingMap.tsx
│   │   ├── DriverMarker.tsx
│   │   └── index.ts
│   └── admin/                    # Admin feature
│       ├── admin.service.ts
│       ├── useAdminStats.ts
│       ├── StatsCards.tsx
│       ├── DriverTable.tsx
│       └── index.ts
├── lib/                          # Utilities
│   ├── api.ts                    # HTTP Client
│   ├── constants.ts
│   └── utils.ts
├── types/                        # TypeScript types
│   ├── index.ts
│   ├── user.ts
│   ├── menu.ts
│   ├── order.ts
│   ├── ticket.ts
│   └── delivery.ts
└── styles/
    └── globals.scss
```

## Quy ước Data Flow

### 1. Feature Module Convention

```typescript
// features/{feature}/index.ts - Public API
export { FeatureProvider } from './FeatureContext';
export { useFeature } from './useFeature';
export { featureService } from './feature.service';
export { FeatureComponent } from './FeatureComponent';
```

### 2. Service Pattern

```typescript
// features/{feature}/{feature}.service.ts
import { api } from '@/lib/api';

export const featureService = {
  async getAll(): Promise<Data[]> {
    return api.get<Data[]>('/endpoint');
  },
  async create(data: CreateRequest): Promise<Data> {
    return api.post<Data>('/endpoint', data);
  },
  async update(id: string, data: UpdateRequest): Promise<Data> {
    return api.patch<Data>(`/endpoint/${id}`, data);
  },
  async delete(id: string): Promise<void> {
    return api.delete<void>(`/endpoint/${id}`);
  },
};
```

### 3. Hook Pattern

```typescript
// features/{feature}/use{Feature}.ts
'use client';
import { useState, useEffect } from 'react';
import { featureService } from './feature.service';

export function useFeature() {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await featureService.getAll();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { data, loading, error, refetch: loadData };
}
```

### 4. Context Pattern (nếu cần global state)

```typescript
// features/{feature}/{Feature}Context.tsx
'use client';
import { createContext, useState, useContext } from 'react';

interface ContextValue {
  state: State;
  actions: Actions;
}

const Context = createContext<ContextValue | undefined>(undefined);

export function FeatureProvider({ children }) {
  const [state, setState] = useState(initialState);
  
  const actions = {
    action1: () => { /* ... */ },
    action2: () => { /* ... */ },
  };
  
  return (
    <Context.Provider value={{ state, actions }}>
      {children}
    </Context.Provider>
  );
}

export function useFeatureContext() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('Must be used within Provider');
  return ctx;
}
```

### 5. Data Flow Summary

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Page** | Routing & Layout | `app/(customer)/orders/page.tsx` |
| **Component** | UI Rendering | `OrderList.tsx`, `OrderCard.tsx` |
| **Hook** | Business Logic & State | `useOrders.ts`, `useOrder(id)` |
| **Context** | Global State (if needed) | `AuthContext.tsx`, `CartContext.tsx` |
| **Service** | API Communication | `order.service.ts` |
| **API Client** | HTTP Request | `lib/api.ts` |
