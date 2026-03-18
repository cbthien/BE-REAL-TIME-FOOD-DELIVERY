# M2 Flow 2 Backend Test - Staff Workflow

Goal: Verify backend readiness for Milestone 2 flow: Customer places order -> Staff sees ticket -> Accept/Reject/Ready -> Customer sees order status change (after refresh).

Scope:
- Customer order creation
- Kitchen ticket creation via event
- Staff ticket actions (accept/reject/ready)
- Order status updates after ticket events

Out of scope:
- Delivery, tracking
- Frontend UI behavior

## Preconditions
- Backend running on http://localhost:3001
- Global prefix is /api
- MongoDB running
- Seed data loaded: `npm run seed`
- Test accounts:
  - Customer: customer@test.com / 123456
  - Staff: staff@test.com / 123456

## Base URL
- API_BASE = http://localhost:3001/api

## Test Data
- Use one menu item from GET /menu
- Delivery address: "123 Test Street, District 1"

## Test Steps (API)

1. Login (Customer)
- Request:
  - POST /auth/login
  - Body: { email, password }
- Expected:
  - 200 OK
  - Response contains `token` and `user`
  - user.role = CUSTOMER

2. Login (Staff)
- Request:
  - POST /auth/login
  - Body: { email, password }
- Expected:
  - 200 OK
  - user.role = STAFF

3. Customer places order (creates ticket via event)
- Request:
  - POST /orders
  - Headers: Authorization: Bearer <customerToken>
  - Body:
    - items: [ { menuItemId, name, quantity, unitPrice } ]
    - deliveryAddress: "123 Test Street, District 1"
- Expected:
  - 201/200 OK
  - Response contains order id
  - status = PENDING

4. Staff sees ticket
- Request:
  - GET /tickets?status=PENDING
  - Headers: Authorization: Bearer <staffToken>
- Expected:
  - 200 OK
  - At least one ticket exists for the new order (orderId matches)

5A. Staff accepts ticket (happy path)
- Request:
  - POST /tickets/{ticketId}/accept
  - Headers: Authorization: Bearer <staffToken>
- Expected:
  - 200 OK
  - Ticket status = IN_PROGRESS
  - Event emitted: ticket.confirmed -> order status becomes CONFIRMED

6A. Customer refreshes order detail
- Request:
  - GET /orders/{orderId}
  - Headers: Authorization: Bearer <customerToken>
- Expected:
  - 200 OK
  - status = CONFIRMED

7A. Staff marks ticket ready
- Request:
  - POST /tickets/{ticketId}/ready
  - Headers: Authorization: Bearer <staffToken>
- Expected:
  - 200 OK
  - Ticket status = READY
  - Event emitted: ticket.ready -> order status becomes READY

8A. Customer refreshes order detail again
- Request:
  - GET /orders/{orderId}
  - Headers: Authorization: Bearer <customerToken>
- Expected:
  - 200 OK
  - status = READY

5B. Staff rejects ticket (alternate path)
- Precondition:
  - Use a new order + its PENDING ticket (do not accept first)
- Request:
  - POST /tickets/{ticketId}/reject
  - Headers: Authorization: Bearer <staffToken>
  - Body: { "reason": "Out of stock" }
- Expected:
  - 200 OK
  - Ticket status = REJECTED
  - Event emitted: ticket.rejected -> order status becomes CANCELLED

6B. Customer refreshes order detail (reject path)
- Request:
  - GET /orders/{orderId}
  - Headers: Authorization: Bearer <customerToken>
- Expected:
  - 200 OK
  - status = CANCELLED

## Example cURL

1) Login customer
```
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"123456"}'
```

2) Login staff
```
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@test.com","password":"123456"}'
```

3) Create order
```
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <customerToken>" \
  -d '{
    "items":[{"menuItemId":"<menuItemId>","name":"<name>","quantity":1,"unitPrice":120000}],
    "deliveryAddress":"123 Test Street, District 1"
  }'
```

4) Staff list tickets
```
curl "http://localhost:3001/api/tickets?status=PENDING" \
  -H "Authorization: Bearer <staffToken>"
```

5) Staff accept ticket
```
curl -X POST http://localhost:3001/api/tickets/<ticketId>/accept \
  -H "Authorization: Bearer <staffToken>"
```

6) Customer refresh order
```
curl http://localhost:3001/api/orders/<orderId> \
  -H "Authorization: Bearer <customerToken>"
```

7) Staff ready ticket
```
curl -X POST http://localhost:3001/api/tickets/<ticketId>/ready \
  -H "Authorization: Bearer <staffToken>"
```

8) Staff reject ticket (alternate path)
```
curl -X POST http://localhost:3001/api/tickets/<ticketId>/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <staffToken>" \
  -d '{"reason":"Out of stock"}'
```

## Notes
- Order status transitions are enforced. For reject path, use a fresh PENDING ticket.
- Customer view is updated on refresh (no polling); re-fetch order detail to see changes.
