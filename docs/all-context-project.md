# All Context Project - Real-Time Food Delivery Tracking System

## 1. Document Purpose
This file is the single source of context for AI-assisted work in the implementation phase.
It consolidates project requirements, analysis artifacts, design decisions, and implementation mapping.

## 2. Project Snapshot
- Project: Real-Time Food Delivery Tracking System
- Domain: Food ordering, kitchen processing, delivery assignment, real-time tracking
- Main actors: Guest, Customer, Staff, Driver, Admin
- External systems: Payment System, Map Service
- Tech stack (current codebase):
  - Backend: NestJS + MongoDB (Mongoose)
  - Frontend: Next.js + TypeScript
  - Realtime: WebSocket

## 3. Problem Statement (Approved)
Typical food delivery workflows lack transparent, real-time visibility for customers, weak coordination between staff and drivers, and inconsistent status flow for delivery operations.

Target solution: build a real-time ordering and delivery tracking platform that improves coordination between Customer, Staff, Driver, and Admin with continuous status updates and driver location tracking.

## 4. Functional Scope (Major Features)
- FE-01: Browse menu, view item details, manage cart quantity
- FE-02: Checkout with address, notes, COD, receive unique order ID
- FE-03: Staff real-time queue processing (accept/reject, preparing/ready, assign driver)
- FE-04: Driver delivery job flow (picked up -> delivering -> delivered)
- FE-05: Customer real-time tracking (status, map location, ETA)
- FE-06: Admin operations (driver approval, basic dashboard/statistics)

## 5. Use Case Baseline (Locked)
System currently tracks 24 use cases:
- UC-01 Register Account
- UC-02 Login
- UC-03 Logout
- UC-04 Manage Profile
- UC-05 View Menu
- UC-06 Manage Cart
- UC-07 Place Order
- UC-08 Track Order Status
- UC-09 Track Driver Location
- UC-10 Rate Delivery
- UC-11 View Pending Orders
- UC-12 Accept Order
- UC-13 Reject Order
- UC-14 Prepare Food
- UC-15 Mark Order Ready
- UC-16 Toggle Online Status
- UC-17 View Available Deliveries
- UC-18 Pick Up Order
- UC-19 Deliver Order
- UC-20 Share GPS Location
- UC-21 Manage Drivers
- UC-22 Manage Staff
- UC-23 View Dashboard
- UC-24 View Statistics

## 6. Key Use Case Relations (Analysis Notes)
- UC-07 Place Order includes cart and checkout validation
- UC-09 Track Driver Location extends tracking behavior under delivery conditions
- UC-18/UC-19 are tied to location sharing and delivery status progression
- Exceptions are mandatory in analysis artifacts (invalid address, payment fail, cancellation)

## 7. Architecture Decisions (Current)
- Architectural style: Layered Architecture + Client-Server
- Layer direction rule: dependencies must flow top-down (Client -> Core -> Data/External)
- No circular dependency in high-level package/component design

### 7.1 High-Level Packages (from approved package diagram)
- Client subsystems:
  - Customer App
  - Driver App
  - Staff Console
  - Admin Console
- Core application logic:
  - User and Access Service
  - Order Management Service
  - Delivery Tracking Service
  - Admin Management Service
  - Payment Orchestration Service
- Data and external:
  - FoodDeliveryDB
  - Payment Gateway Adapter
  - Map/Geo Gateway Adapter

### 7.2 Component View (approved direction)
- Client components require core APIs
- Core components provide domain APIs and require external adapter interfaces
- External adapters encapsulate third-party integration details

## 8. COMET/UML Modeling Conventions (Project-Specific)
These conventions were repeatedly requested and should be treated as project defaults:
- Use COMET stereotypes consistently:
  - `<<entity>>`, `<<boundary>>`, `<<control>>`, `<<application logic>>`, `<<gateway>>`, `<<subsystem>>`
- For class diagrams, always show multiplicity where relevant
- For integrated communication diagrams (Gomaa style):
  - Merge messages across relevant use cases
  - Include main and alternative flows
  - Prefer simple messages at high-level synthesis
- For state diagrams:
  - Label transitions in `Event [Condition] / Action` form when needed
- For diagram visuals in this project:
  - Use `#dae8fc` as the standard fill color for blocks

## 9. Updated Domain Behavior to Preserve

### 9.1 Order state machine (with payment update)
Main path:
- PENDING -> CONFIRMED -> PREPARING -> READY -> PICKED_UP -> DELIVERING -> DELIVERED

Exception path:
- PENDING or CONFIRMED -> CANCELLED

Payment-related behavior:
- ONLINE payment introduces payment result handling before confirmation progression
- Payment fail can lead to cancellation/rejection flow

### 9.2 Driver operational state machine
- OFFLINE -> ONLINE/IDLE -> ASSIGNED -> NAVIGATING_TO_RESTAURANT -> WAITING_AT_RESTAURANT -> DELIVERING_TO_CUSTOMER -> ONLINE/IDLE
- Optional exceptions: reject timeout cancel back to ONLINE/IDLE

## 10. Design Pattern Decisions (Design Modeling)
Class diagram decisions already established:
- Factory Method:
  - `OrderController` -> `OrderFactory`
  - `OrderFactory` creates `Order`
- Strategy:
  - `Order` depends on `IDiscountStrategy`
  - `FreeshipStrategy` and `PercentDiscountStrategy` realize `IDiscountStrategy`
- Adapter:
  - `DeliveryService` depends on `IMapService`
  - `MapAdapter` realizes `IMapService`

## 11. Phase Map: Requirement -> Analysis -> Design -> Implement

### Phase 1 - Requirement
Input:
- Problem statement
- Major features FE-01..FE-06
- Actor responsibilities

Output:
- Scope baseline
- Functional priorities (ordering, processing, delivery, tracking, admin)

### Phase 2 - Analysis
Input:
- Use cases UC-01..UC-24
- Context and use case diagrams

Output:
- Use case relationships (include extend alternative flows)
- Analysis communication diagrams for critical flows
- Analysis state machines for Order and Driver behavior

### Phase 3 - Design
Input:
- Analysis models + architecture constraints

Output:
- Package diagram (layered + client-server)
- High-level component diagram using interfaces/assembly connectors
- Design class diagram with Factory Method, Strategy, Adapter
- Integrated communication diagrams for grouped use cases

### Phase 4 - Implement (next execution phase)
Input:
- This context file + approved diagrams and constraints

Implementation targets:
- Backend:
  - enforce module boundaries and event flow for order lifecycle
  - implement payment and map adapters behind interfaces
  - implement order and driver state transitions with validation guards
- Frontend:
  - role-based app surfaces (customer, driver, staff, admin)
  - real-time status and location tracking UI
- Integration:
  - keep API and event names aligned with design artifacts
  - preserve non-circular dependency direction

Acceptance checklist for implementation:
- All mandatory state transitions covered by code and tests
- Payment failure/invalid flows handled
- Driver tracking and ETA flow operational
- Layering and dependency direction remain compliant
- No direct infrastructure leakage into domain/application logic

## 12. Known Files for Fast Navigation
- `docs/Problem.md`
- `docs/integrated-communication-diagram.md`
- `docs/deployment-diagram.md`
- `docs/frontend-architecture.md`
- `docs/frontend-data-flow.md`
- `backend/src/modules/**`
- `frontend/src/**`

## 13. Handoff Note for AI (Implementation Prompt Starter)
Use this repository context to continue Phase 4 (Implement) under COMET-consistent boundaries.
Prioritize: Order lifecycle correctness, delivery state progression, adapter-based external integrations, and real-time tracking consistency across backend and frontend.
