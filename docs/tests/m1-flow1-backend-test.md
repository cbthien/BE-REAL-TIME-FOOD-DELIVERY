# M1 Flow 1 Backend Test - Customer Ordering

Goal: Verify backend readiness for Milestone 1 flow: login -> view menu -> add to cart -> place order -> view order status.

Scope:
- Auth login
- Menu listing
- Order creation
- Order history and detail

Out of scope:
- Staff processing, delivery, tracking
- Promotions endpoints

## Preconditions
- Backend running on http://localhost:3001
- Global prefix is /api
- MongoDB running
- Seed data loaded: `npm run seed`
- Test account:
  - email: customer@test.com
  - password: 123456

## Base URL
- API_BASE = http://localhost:3001/api

## Test Data
- Use one menu item from GET /menu
- Delivery address: "123 Test Street, District 1"

## Test Steps (API)

1. Login (Customer)
- Request:
  - POST /auth/login
  - Body:
    - email: customer@test.com
    - password: 123456
- Expected:
  - 200 OK
  - Response contains `token` and `user`
  - user.role = CUSTOMER

2. View Menu
- Request:
  - GET /menu
- Expected:
  - 200 OK
  - Non-empty array
  - Each item includes at least: _id (or id), name, price, category, available

3. Place Order
- Prepare:
  - Pick one menu item from step 2
  - Build items array:
    - menuItemId = menu item id
    - name = menu item name
    - quantity = 1
    - unitPrice = menu item price
- Request:
  - POST /orders
  - Headers: Authorization: Bearer <token>
  - Body:
    - items: [ { menuItemId, name, quantity, unitPrice } ]
    - deliveryAddress: "123 Test Street, District 1"
- Expected:
  - 201/200 OK
  - Response contains order id
  - status = PENDING
  - totalAmount = quantity * unitPrice
  - customerId matches logged-in user id

4. View My Orders
- Request:
  - GET /orders/my
  - Headers: Authorization: Bearer <token>
- Expected:
  - 200 OK
  - Array includes newly created order

5. View Order Status (Detail)
- Request:
  - GET /orders/{orderId}
  - Headers: Authorization: Bearer <token>
- Expected:
  - 200 OK
  - Order id matches
  - status is PENDING (or updated by later flows if those are active)

## Example cURL

1) Login
```
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"123456"}'
```

2) Get Menu
```
curl http://localhost:3001/api/menu
```

3) Create Order
```
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "items":[{"menuItemId":"<menuItemId>","name":"<name>","quantity":1,"unitPrice":120000}],
    "deliveryAddress":"123 Test Street, District 1"
  }'
```

4) My Orders
```
curl http://localhost:3001/api/orders/my \
  -H "Authorization: Bearer <token>"
```

5) Order Detail
```
curl http://localhost:3001/api/orders/<orderId> \
  -H "Authorization: Bearer <token>"
```

## Frontend Notes (Mock Data / Integration Gaps)
- Landing page uses mock data for hero slides and promo banners.
  - Sources:
    - frontend/src/components/shared/HeroSection.tsx (MOCK_HERO_SLIDES)
    - frontend/src/app/page.tsx (MOCK_MENU_ITEMS, MOCK_PROMO_BANNERS)
  - TODO: replace with API calls or remove from M1 scope.
- Menu category filters may not match backend seed categories.
  - Frontend categories: Pizza, Burger, Pasta, Salad, Drinks, Dessert
  - Backend seed categories: Main, Appetizer, Beverage, Dessert
  - Result: filters can return empty unless categories are aligned.
- Ensure menu item id mapping on the frontend:
  - Backend returns _id; frontend uses item.id for cart.
  - If `id` is missing, add a mapping layer or enable id virtuals in API response.
