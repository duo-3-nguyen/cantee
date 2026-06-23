# Technical Specification: Canteen Food Ordering SPA MVP

**Document status:** Implementation-ready MVP specification  
**Last updated:** 2026-06-18  
**Primary language:** English  
**Target system:** Single-page web application for ordering food from a canteen

---

## 1. Specification Control

### 1.1 Purpose

This document defines the complete technical specification for an MVP web application that allows authenticated users to order food from a canteen.

The specification is optimized for:

| Priority | Requirement |
|---|---|
| Implementation readiness | Engineers and AI coding agents must be able to implement the system from this document. |
| Unambiguous behavior | Business rules, permissions, validations, and state transitions must be explicit. |
| MVP delivery | Only features required for a usable first release are included. |
| Modular architecture | The backend must be a modular monolith organized by service/domain boundaries. |

### 1.2 Confirmed Decisions

| Area | Decision |
|---|---|
| Specification language | English |
| Frontend | React + Vite (JavaScript/JSX/ES Modules) |
| Backend | Node.js + Express (JavaScript/ES Modules) |
| Database | MongoDB with Mongoose |
| Application type | Single Page Application |
| Backend architecture | Modular monolith using service/domain modules; not real microservices |
| Authentication | Required for all application features except login and user registration |
| Session storage | Session ID stored in database |
| Real-time order updates | Server-Sent Events (SSE). Server send to client |
| Payment | Have "Select payment method ui" but Cash only for MVP |
| Notifications | Dummy implementation only; function contracts must exist |
| User registration | Email/password registration without verification |
| Pickup time | User must select a pickup time within configured opening hours and timezone |
| Admin scope | Settings, account/role management, dashboard, and all staff capabilities |

### 1.3 Explicit Non-Goals for MVP

| Feature | MVP Status |
|---|---|
| Real online payment gateway | Excluded |
| Email/SMS/push notification delivery | Excluded; dummy functions only |
| Real microservice deployment | Excluded |
| Multi-canteen support | Excluded; one canteen only |
| Delivery orders | Excluded |
| Inventory management | Excluded |
| Coupons/promotions | Excluded |
| Table reservation | Excluded |
| Real-time WebSocket updates | Excluded; manual refresh is the required MVP update mechanism |
| SSR/SEO optimization | Excluded; SPA only |
| Email verification | Excluded |
| Password reset | Excluded for MVP |

---

## 2. Product Overview

### 2.1 Product Goal

The system must allow authenticated canteen customers to browse available dishes, customize items using modifier groups, maintain a database-persisted cart, submit cash-payment orders with a selected pickup time, and track order status.

Staff must manage products and process orders.

Admins must manage canteen settings, accounts, roles, and view operational dashboard summaries.

### 2.2 Primary Actors

| Actor | Role Code | Description |
|---|---:|---|
| Guest | `guest` | Unauthenticated visitor. Can only access login and user registration. |
| User | `user` | Customer who can browse products, manage cart, create orders, and view own orders. |
| Staff | `staff` | Canteen operator who can manage products and update order statuses. |
| Admin | `admin` | System operator with staff permissions plus settings, account, role, and dashboard permissions. |

### 2.3 Authentication Gate Rule

| Rule ID | Rule |
|---|---|
| AUTH-GATE-001 | Every route, API, and screen except login and user registration requires a valid active session. |
| AUTH-GATE-002 | A guest who attempts to access a protected frontend route must be redirected to `/login`. |
| AUTH-GATE-003 | An authenticated frontend user who attempts to access a route not allowed for their role must be redirected to that role's default home route. |
| AUTH-GATE-004 | Backend APIs must enforce authorization independently from frontend route guards. |
| AUTH-GATE-005 | A backend API request from an authenticated user without sufficient role permission must return `403 Forbidden`. |

---

## 3. Technology Stack

### 3.1 Frontend Stack

| Layer | Technology | Requirement |
|---|---|---|
| UI runtime | React | Use functional components and hooks. |
| Build tool | Vite | Use JavaScript template. |
| Language | JavaScript | ES Modules ("type": "module") and Strict Mode required. |
| Routing | React Router | Required for SPA route guards. |
| API client | Axios | Must support credentials/cookies with `withCredentials=true`. |
| Forms | React Hook Form | Must provide validation feedback. |
| Styling | Tailwind CSS | Use consistently for MVP UI styling. |
| Server state | TanStack Query | Use for API reads/mutations and cache invalidation. |

### 3.2 Backend Stack

| Layer | Technology | Requirement |
|---|---|---|
| Runtime | Node.js 24 LTS | Required runtime version for MVP implementation. |
| Framework | Express | REST API. |
| Language | JavaScript | ES Modules ("type": "module") and Strict Mode required. |
| Database driver | Mongoose | All MongoDB access must go through models/repositories. |
| Password hashing | argon2 | Required for password hashing. |
| Session ID generation | crypto random UUID/token | Must be high entropy. |
| Validation | Zod | Required for all request bodies, params, and query strings. |
| Logging | pino | Required for key events. |

### 3.3 Database

| Component | Requirement |
|---|---|
| Database | MongoDB |
| Persistence | All users, sessions, products, carts, orders, payments, and settings must be persisted. |
| Schema layer | Mongoose schemas with indexes. |
| IDs | MongoDB `ObjectId` for primary document IDs unless explicitly stated. |

---

## 4. Architecture

### 4.1 Architecture Style

The backend must be implemented as a **modular monolith**.

| Rule ID | Rule |
|---|---|
| ARCH-001 | The backend is deployed as one Express application. |
| ARCH-002 | Code must be organized by service/domain boundaries similar to microservices. |
| ARCH-003 | Services must communicate through direct function calls, not HTTP between services. |
| ARCH-004 | Each service owns its own domain logic, validation, model access, and route registration. |
| ARCH-005 | Shared cross-cutting code is allowed only for configuration, database connection, errors, middleware, auth utilities, and common types. |

### 4.2 Backend Service Domains

| Service | Primary Responsibility |
|---|---|
| Auth Service | Registration, login, logout, session persistence, current session lookup, role authorization. |
| User Service | User profile, account management, role/status management by admin. |
| Product Service | Dish catalog, product status, modifier groups, product pricing validation. |
| Cart Service | Database-persisted cart per user, item customization, cart price calculation. |
| Order Service | Order creation, order lifecycle, pickup time validation, order queries. |
| Payment Service | Cash payment record creation and payment status handling. |
| Notification Service | Dummy notification function contracts. No real delivery. |
| Settings Service | Canteen name, address, timezone, opening hours. |
| Dashboard Service | Admin operational summaries using users, orders, products, and payments. |

### 4.3 Required Repository Structure

```text
project-root/
  frontend/
    src/
      app/
      features/
        auth/
        user/
        products/
        cart/
        orders/
        staff/
        admin/
      shared/
        api/
        components/
        types/
        utils/
      main.jsx
  backend/
    src/
      app.js
      server.js
      config/
      db/
      middleware/
      shared/
        errors/
        types/
        utils/
      services/
        auth/
        users/
        products/
        cart/
        orders/
        payments/
        notifications/
        settings/
        dashboard/
  doc/
    technical-specification.md
```

### 4.4 Backend Service Folder Pattern

Each service must be cohesive and avoid excessive tiny files.

Required pattern:

```text
services/<service-name>/
  <service-name>.model.js       # if the service owns MongoDB collections
  <service-name>.types.js       # service-specific JavaScript types like Enums, Constants
  <service-name>.validation.js  # request validation schemas
  <service-name>.service.js     # business logic
  <service-name>.routes.js      # Express route definitions
```

A service must omit files that have no responsibility for that service. Example: a service without an owned MongoDB collection must omit `<service-name>.model.js`.

---

## 5. Roles and Permissions

### 5.1 Role Definitions

| Role | Can Login | Can Register Directly | Managed By Admin | Description |
|---|---:|---:|---:|---|
| `guest` | No | N/A | N/A | Anonymous visitor. |
| `user` | Yes | Yes | Yes | Customer role. |
| `staff` | Yes | No | Yes | Canteen staff role. |
| `admin` | Yes | No | Yes | Full administrative role. |

### 5.2 Permission Matrix

| Capability | Guest | User | Staff | Admin |
|---|---:|---:|---:|---:|
| Register customer account | Yes | No | No | No |
| Login | Yes | Yes | Yes | Yes |
| Logout | No | Yes | Yes | Yes |
| View own profile | No | Yes | Yes | Yes |
| View active products | No | Yes | Yes | Yes |
| View unavailable/hidden products | No | No | Yes | Yes |
| Create cart item | No | Yes | No | No |
| Update own cart | No | Yes | No | No |
| Submit own order | No | Yes | No | No |
| View own orders | No | Yes | No | No |
| View all orders | No | No | Yes | Yes |
| Update order status | No | No | Yes | Yes |
| Create product | No | No | Yes | Yes |
| Edit product | No | No | Yes | Yes |
| Change product status | No | No | Yes | Yes |
| Delete product | No | No | No | No for MVP; use `hidden` or `unavailable` status instead. |
| Manage canteen settings | No | No | No | Yes |
| Manage accounts and roles | No | No | No | Yes |
| View dashboard | No | No | No | Yes |

### 5.3 Admin Role Requirements

| Rule ID | Rule |
|---|---|
| ADMIN-001 | Admin must have every permission available to staff. |
| ADMIN-002 | Admin may create, update, disable, and re-enable accounts. |
| ADMIN-003 | Admin may assign roles `user`, `staff`, or `admin`. |
| ADMIN-004 | Admin may not disable their own account. |
| ADMIN-005 | Admin may not demote their own role from `admin` to another role. |
| ADMIN-006 | Admin may update canteen name, address, timezone, and opening hours. |
| ADMIN-007 | Admin may view dashboard summaries for orders, cash revenue, and product sales. |

---

## 6. Global Data and API Conventions

### 6.1 Date and Time Rules

| Rule ID | Rule |
|---|---|
| TIME-001 | All timestamps stored in MongoDB must be UTC `Date` values. |
| TIME-002 | Canteen business rules must use the configured `timezone` from `CanteenSettings`. |
| TIME-003 | API responses must return datetime values as ISO 8601 strings. |
| TIME-004 | Pickup time validation must convert user input into canteen local time before checking opening hours. |

### 6.2 Currency Rules

| Rule ID | Rule |
|---|---|
| MONEY-001 | All monetary values must be stored as integer minor units. |
| MONEY-002 | For Vietnamese Dong, `priceAmount` represents whole VND because VND has no decimal minor unit in normal usage. |
| MONEY-003 | Floating-point numbers must not be used for persisted money values. |
| MONEY-004 | API must reject negative prices. |

### 6.3 Standard API Response Shapes

Successful response:

```json
{
  "data": {},
  "meta": {}
}
```

Error response:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### 6.4 Standard HTTP Status Usage

| Status | Usage |
|---:|---|
| 200 | Successful read/update/delete-like operation. |
| 201 | Successful create operation. |
| 204 | Successful operation with no response body. |
| 400 | Invalid request body, invalid state transition, or business validation failure. |
| 401 | Missing, expired, revoked, or invalid session. |
| 403 | Authenticated but role is not allowed. |
| 404 | Resource not found or not visible to requester. |
| 409 | Conflict, duplicate email, or concurrent state conflict. |
| 422 | Semantically invalid input if validation library distinguishes it from `400`. |
| 500 | Unexpected server error. |

### 6.5 Pagination Convention

For list endpoints:

| Query Param | Type | Default | Rule |
|---|---|---:|---|
| `page` | integer | 1 | Must be `>= 1`. |
| `limit` | integer | 20 | Must be between `1` and `100`. |
| `sort` | string | endpoint-specific | Must use allowlisted fields only. |

Paginated response meta:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

---

## 7. Domain Models and MongoDB Schemas

### 7.1 User

Collection: `users`

| Field | Type | Required | Rules |
|---|---|---:|---|
| `_id` | ObjectId | Yes | MongoDB primary key. |
| `email` | string | Yes | Unique, lowercase, trimmed. |
| `passwordHash` | string | Yes | Never returned by API. |
| `fullName` | string | Yes | 1-120 characters. |
| `role` | enum | Yes | One of `user`, `staff`, `admin`. |
| `status` | enum | Yes | One of `active`, `disabled`. |
| `createdAt` | Date | Yes | UTC. |
| `updatedAt` | Date | Yes | UTC. |

Indexes:

| Index | Type | Purpose |
|---|---|---|
| `email` | unique | Login and duplicate prevention. |
| `role` | normal | Admin filtering. |
| `status` | normal | Account management filtering. |

Validation rules:

| Rule ID | Rule |
|---|---|
| USER-001 | Public registration can create only role `user`. |
| USER-002 | Only admin can create `staff` or `admin` accounts. |
| USER-003 | Disabled users cannot log in. |
| USER-004 | API responses must not include `passwordHash`. |

### 7.2 Session

Collection: `sessions`

| Field | Type | Required | Rules |
|---|---|---:|---|
| `_id` | ObjectId | Yes | MongoDB primary key. |
| `sessionIdHash` | string | Yes | Hash of raw session ID. Raw session ID must not be stored. |
| `userId` | ObjectId | Yes | References `users._id`. |
| `roleAtLogin` | enum | Yes | Snapshot role at login: `user`, `staff`, `admin`. |
| `expiresAt` | Date | Yes | UTC expiration. |
| `revokedAt` | Date/null | No | Set on logout/admin invalidation. |
| `createdAt` | Date | Yes | UTC. |
| `lastSeenAt` | Date | Yes | UTC. |

Indexes:

| Index | Type | Purpose |
|---|---|---|
| `sessionIdHash` | unique | Session lookup. |
| `userId` | normal | Session management. |
| `expiresAt` | TTL | Cleanup expired sessions. |

Session cookie requirements:

| Rule ID | Rule |
|---|---|
| SESSION-001 | Server must generate a high-entropy raw session ID. |
| SESSION-002 | Only a hash of the session ID may be stored in DB. |
| SESSION-003 | Raw session ID must be sent to client using an HTTP-only cookie. |
| SESSION-004 | Cookie must use `HttpOnly=true`. |
| SESSION-005 | Cookie must use `SameSite=Lax` for MVP. |
| SESSION-006 | Cookie must use `Secure=true` in production HTTPS. |
| SESSION-007 | Logout must revoke the database session and clear the cookie. |
| SESSION-008 | Expired or revoked sessions must return `401`. |
| SESSION-009 | Session duration default is 7 days. If `SESSION_TTL_DAYS` is configured, the configured value must override the default. |

### 7.3 CanteenSettings

Collection: `canteen_settings`

MVP supports exactly one active settings document.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `_id` | ObjectId | Yes | MongoDB primary key. |
| `canteenName` | string | Yes | 1-120 characters. |
| `address` | string | Yes | 1-300 characters. |
| `timezone` | string | Yes | Valid IANA timezone, e.g. `Asia/Ho_Chi_Minh`. |
| `openingHours` | array | Yes | One item per weekday. |
| `createdAt` | Date | Yes | UTC. |
| `updatedAt` | Date | Yes | UTC. |

Opening hours item:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `dayOfWeek` | integer | Yes | `0` = Sunday, `1` = Monday, ..., `6` = Saturday. |
| `isOpen` | boolean | Yes | If false, `openTime` and `closeTime` may be null. |
| `openTime` | string/null | Conditional | `HH:mm` in canteen local time. Required when `isOpen=true`. |
| `closeTime` | string/null | Conditional | `HH:mm` in canteen local time. Required when `isOpen=true`. |

Validation rules:

| Rule ID | Rule |
|---|---|
| SETTINGS-001 | Only admin can update settings. |
| SETTINGS-002 | Exactly one settings document must be used by application logic. |
| SETTINGS-003 | `timezone` must be a valid IANA timezone. |
| SETTINGS-004 | For an open day, `openTime` must be earlier than `closeTime`. |
| SETTINGS-005 | MVP does not support overnight opening hours where close time is on the next day. |
| SETTINGS-006 | Order pickup time must be rejected if selected local day has `isOpen=false`. |
| SETTINGS-007 | Order pickup time must be rejected if selected local time is before `openTime` or after `closeTime`. |

### 7.4 Product

Collection: `products`

| Field | Type | Required | Rules |
|---|---|---:|---|
| `_id` | ObjectId | Yes | MongoDB primary key. |
| `name` | string | Yes | 1-120 characters. |
| `description` | string | No | Max 1000 characters. |
| `basePriceAmount` | integer | Yes | `>= 0`, VND amount. |
| `imageUrl` | string/null | No | Optional URL or null. |
| `status` | enum | Yes | `available`, `unavailable`, `hidden`, `deleted`. |
| `modifierGroups` | array | Yes | May be empty. |
| `createdBy` | ObjectId | Yes | Staff/admin user ID. |
| `updatedBy` | ObjectId | Yes | Staff/admin user ID. |
| `createdAt` | Date | Yes | UTC. |
| `updatedAt` | Date | Yes | UTC. |

Modifier group:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `groupId` | string | Yes | Stable unique ID within product. |
| `name` | string | Yes | 1-120 characters. |
| `modifiers` | array | Yes | Must contain at least one modifier if group exists. |
| `defaultModifierIds` | string[] | Yes | Modifier IDs selected by default. May be empty. |
| `minSelected` | integer | Yes | `>= 0`. |
| `maxSelected` | integer | Yes | `>= minSelected`. |

Modifier:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `modifierId` | string | Yes | Stable unique ID within modifier group. |
| `name` | string | Yes | 1-120 characters. |
| `priceAmount` | integer | Yes | `>= 0`, VND amount. |
| `isActive` | boolean | Yes | Inactive modifiers cannot be selected for new cart/order items. |

Product validation rules:

| Rule ID | Rule |
|---|---|
| PRODUCT-001 | Users can only see products with `status=available`. |
| PRODUCT-002 | Staff and admin can see products with statuses `available`, `unavailable`, and `hidden`. |
| PRODUCT-003 | Products with `status=deleted` must not appear in normal list endpoints. |
| PRODUCT-004 | Staff/admin can create and edit products. |
| PRODUCT-005 | Product status transitions are allowed between `available`, `unavailable`, and `hidden`. |
| PRODUCT-006 | `deleted` is a reserved status for future soft-delete support; MVP APIs must not set products to `deleted`. |
| PRODUCT-007 | `groupId` must be unique within a product. |
| PRODUCT-008 | `modifierId` must be unique within a modifier group. |
| PRODUCT-009 | `defaultModifierIds` must reference existing active modifiers in the same group. |
| PRODUCT-010 | `defaultModifierIds.length` must be between `minSelected` and `maxSelected`. |
| PRODUCT-011 | If `minSelected=0`, user may select no modifiers for that group. |
| PRODUCT-012 | If `maxSelected=0`, no modifier can be selected and `defaultModifierIds` must be empty. |

### 7.5 Cart

Collection: `carts`

MVP rule: each user has at most one active cart.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `_id` | ObjectId | Yes | MongoDB primary key. |
| `userId` | ObjectId | Yes | References `users._id`; unique. |
| `items` | array | Yes | Cart item array. May be empty. |
| `diningMode` | enum/null | No | `takeaway`, `eat_in`, or null before checkout. |
| `pickupTime` | Date/null | No | UTC selected pickup time before checkout. |
| `subtotalAmount` | integer | Yes | Calculated server-side. |
| `createdAt` | Date | Yes | UTC. |
| `updatedAt` | Date | Yes | UTC. |

Cart item:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `cartItemId` | string | Yes | Stable generated ID. |
| `productId` | ObjectId | Yes | References `products._id`. |
| `productNameSnapshot` | string | Yes | Captured from product at time item was added/updated. |
| `basePriceAmountSnapshot` | integer | Yes | Captured from product. |
| `quantity` | integer | Yes | `1` to `99`. |
| `selectedModifierGroups` | array | Yes | Selected modifiers by group. |
| `itemSubtotalAmount` | integer | Yes | Server-calculated. |

Selected modifier group:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `groupId` | string | Yes | Product modifier group ID. |
| `groupNameSnapshot` | string | Yes | Captured at selection time. |
| `selectedModifiers` | array | Yes | Selected modifier snapshots. |

Selected modifier snapshot:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `modifierId` | string | Yes | Product modifier ID. |
| `nameSnapshot` | string | Yes | Captured at selection time. |
| `priceAmountSnapshot` | integer | Yes | Captured at selection time. |

Cart rules:

| Rule ID | Rule |
|---|---|
| CART-001 | Cart must be stored in database. |
| CART-002 | Only role `user` can create or update their own cart. |
| CART-003 | A user cannot access another user's cart. |
| CART-004 | Adding a product to cart requires product `status=available`. |
| CART-005 | Cart item modifier selections must satisfy all product modifier group constraints. |
| CART-006 | Server must calculate all cart item totals and cart subtotal. |
| CART-007 | Client-provided prices must be ignored. |
| CART-008 | If product or modifier price changes after item is added, cart recalculation must refresh snapshots on next cart update or checkout validation. |
| CART-009 | On successful order creation, the user's cart must be cleared. |

### 7.6 Order

Collection: `orders`

| Field | Type | Required | Rules |
|---|---|---:|---|
| `_id` | ObjectId | Yes | MongoDB primary key. |
| `orderNumber` | string | Yes | Human-readable unique order code. |
| `userId` | ObjectId | Yes | Customer user ID. |
| `customerNameSnapshot` | string | Yes | Captured from user. |
| `items` | array | Yes | Snapshot from cart. |
| `diningMode` | enum | Yes | `takeaway` or `eat_in`. |
| `pickupTime` | Date | Yes | UTC selected pickup time. |
| `status` | enum | Yes | Order status lifecycle. |
| `paymentMethod` | enum | Yes | `cash`. |
| `paymentStatus` | enum | Yes | `pending`, `paid`, `cancelled`. |
| `subtotalAmount` | integer | Yes | Server-calculated. |
| `totalAmount` | integer | Yes | Same as subtotal for MVP. |
| `createdAt` | Date | Yes | UTC. |
| `updatedAt` | Date | Yes | UTC. |
| `cancelledAt` | Date/null | No | UTC. |
| `completedAt` | Date/null | No | UTC. |

Order item uses the same snapshot structure as cart item. In the order document, `cartItemId` must be replaced by a generated `orderItemId`.

Order statuses:

| Status | Meaning | Set By |
|---|---|---|
| `submitted` | User submitted order; staff has not accepted yet. | System on order creation. |
| `accepted` | Staff/admin accepted order for preparation. | Staff/admin. |
| `preparing` | Order is being prepared. | Staff/admin. |
| `ready` | Order is ready for pickup/eat-in handoff. | Staff/admin. |
| `completed` | Order has been handed to customer. | Staff/admin. |
| `cancelled` | Order has been cancelled. | Staff/admin for MVP. |

Allowed order status transitions:

| From | To | Allowed Roles |
|---|---|---|
| `submitted` | `accepted` | staff, admin |
| `submitted` | `cancelled` | staff, admin |
| `accepted` | `preparing` | staff, admin |
| `accepted` | `cancelled` | staff, admin |
| `preparing` | `ready` | staff, admin |
| `preparing` | `cancelled` | staff, admin |
| `ready` | `completed` | staff, admin |
| `ready` | `cancelled` | staff, admin |
| `completed` | none | none |
| `cancelled` | none | none |

Order rules:

| Rule ID | Rule |
|---|---|
| ORDER-001 | Only role `user` can submit an order from their own cart. |
| ORDER-002 | Cart must contain at least one valid item before order creation. |
| ORDER-003 | Order creation must validate current product availability and modifier constraints. |
| ORDER-004 | Order creation must use server-calculated prices. |
| ORDER-005 | Order must snapshot product and modifier names/prices at time of creation. |
| ORDER-006 | `pickupTime` must be within configured canteen opening hours in the configured timezone. |
| ORDER-007 | `pickupTime` must not be in the past. |
| ORDER-008 | `diningMode` must be either `takeaway` or `eat_in`. |
| ORDER-009 | Staff/admin can view all orders. |
| ORDER-010 | User can only view their own orders. |
| ORDER-011 | User cannot update order status in MVP. |
| ORDER-012 | Invalid status transitions must return `400`. |
| ORDER-013 | Order creation, cash payment creation, and cart clearing must be performed in a MongoDB transaction. |

### 7.7 Payment

Collection: `payments`

| Field | Type | Required | Rules |
|---|---|---:|---|
| `_id` | ObjectId | Yes | MongoDB primary key. |
| `orderId` | ObjectId | Yes | References `orders._id`; unique. |
| `method` | enum | Yes | Must be `cash` for MVP. |
| `status` | enum | Yes | `pending`, `paid`, `cancelled`. |
| `amount` | integer | Yes | Must match order `totalAmount`. |
| `createdAt` | Date | Yes | UTC. |
| `updatedAt` | Date | Yes | UTC. |
| `paidAt` | Date/null | No | UTC when marked paid. |

Payment rules:

| Rule ID | Rule |
|---|---|
| PAYMENT-001 | MVP supports only `cash`. |
| PAYMENT-002 | Payment record must be created when order is created. |
| PAYMENT-003 | New cash payment status must be `pending`. |
| PAYMENT-004 | Staff/admin can mark payment as `paid` when customer pays cash. |
| PAYMENT-005 | Cancelling an order must set payment status to `cancelled` if not already `paid`. |

### 7.8 Notification

MVP notification implementation is dummy only.

| Function | Trigger | Behavior |
|---|---|---|
| `notifyOrderSubmitted(order)` | After successful order creation | Log or no-op. |
| `notifyOrderStatusChanged(order, previousStatus)` | After status update | Log or no-op. |
| `notifyPaymentStatusChanged(payment, previousStatus)` | After payment update | Log or no-op. |

Notification rules:

| Rule ID | Rule |
|---|---|
| NOTIF-001 | Notification functions must not fail the primary business operation in MVP. |
| NOTIF-002 | Notification functions must be asynchronous and isolated by try/catch. |
| NOTIF-003 | No email, SMS, or push provider integration is required. |

---

## 8. API Contract

Base API path: `/api`

### 8.1 Auth API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| POST | `/auth/register` | No | guest | Register a new `user` account. |
| POST | `/auth/login` | No | guest | Login and create DB session. |
| POST | `/auth/logout` | Yes | user, staff, admin | Revoke current session. |
| GET | `/auth/session` | Yes | user, staff, admin | Return current authenticated session and user. |

#### POST `/api/auth/register`

Request body:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `email` | string | Yes | Valid email, lowercase normalized. |
| `password` | string | Yes | Minimum 8 characters. |
| `fullName` | string | Yes | 1-120 characters. |

Behavior:

| Rule ID | Rule |
|---|---|
| AUTH-REG-001 | Created role must always be `user`. |
| AUTH-REG-002 | Created status must be `active`. |
| AUTH-REG-003 | Duplicate email must return `409`. |
| AUTH-REG-004 | Password must be hashed before storage. |
| AUTH-REG-005 | Response must not include password hash. |

Success response: `201`

```json
{
  "data": {
    "user": {
      "id": "string",
      "email": "user@example.com",
      "fullName": "Example User",
      "role": "user",
      "status": "active"
    }
  },
  "meta": {}
}
```

#### POST `/api/auth/login`

Request body:

| Field | Type | Required |
|---|---|---:|
| `email` | string | Yes |
| `password` | string | Yes |

Behavior:

| Rule ID | Rule |
|---|---|
| AUTH-LOGIN-001 | Invalid credentials must return `401`. |
| AUTH-LOGIN-002 | Disabled account must return `403`. |
| AUTH-LOGIN-003 | Successful login must create a session document. |
| AUTH-LOGIN-004 | Successful login must set HTTP-only session cookie. |
| AUTH-LOGIN-005 | Response must include safe user fields and default route. |

Default route mapping:

| Role | Default Frontend Route |
|---|---|
| `user` | `/user` |
| `staff` | `/staff` |
| `admin` | `/admin` |

#### POST `/api/auth/logout`

Behavior:

| Rule ID | Rule |
|---|---|
| AUTH-LOGOUT-001 | Revoke current session by setting `revokedAt`. |
| AUTH-LOGOUT-002 | Clear session cookie. |
| AUTH-LOGOUT-003 | Return `204` on success. |

### 8.2 User API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| GET | `/users/me` | Yes | user, staff, admin | Get current profile. |
| GET | `/users` | Yes | admin | List accounts. |
| POST | `/users` | Yes | admin | Create account with selected role. |
| PATCH | `/users/:userId` | Yes | admin | Update account profile, status, or role. |
| POST | `/users/:userId/disable` | Yes | admin | Disable account. |
| POST | `/users/:userId/enable` | Yes | admin | Enable account. |

Admin update rules:

| Rule ID | Rule |
|---|---|
| USER-ADMIN-001 | Admin cannot disable their own account. |
| USER-ADMIN-002 | Admin cannot demote their own role. |
| USER-ADMIN-003 | Admin-created accounts must include an explicit initial password in the request body. |
| USER-ADMIN-004 | Changing a user's role must affect authorization immediately by reading current user role from DB during session authentication. |

### 8.3 Settings API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| GET | `/settings/canteen` | Yes | user, staff, admin | Get public canteen settings. |
| PUT | `/settings/canteen` | Yes | admin | Replace/update canteen settings. |

#### PUT `/api/settings/canteen`

Request body:

| Field | Type | Required |
|---|---|---:|
| `canteenName` | string | Yes |
| `address` | string | Yes |
| `timezone` | string | Yes |
| `openingHours` | array | Yes |

Validation:

| Rule ID | Rule |
|---|---|
| SETTINGS-API-001 | `openingHours` must contain entries for all days `0` through `6`. |
| SETTINGS-API-002 | Time strings must match `HH:mm` 24-hour format. |
| SETTINGS-API-003 | Invalid timezone must return `400`. |

### 8.4 Product API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| GET | `/products` | Yes | user, staff, admin | List products visible to role. |
| GET | `/products/:productId` | Yes | user, staff, admin | Get product detail visible to role. |
| POST | `/products` | Yes | staff, admin | Create product. |
| PUT | `/products/:productId` | Yes | staff, admin | Replace product fields and modifier groups. |
| PATCH | `/products/:productId/status` | Yes | staff, admin | Change product status. |

Product create/update request body:

| Field | Type | Required |
|---|---|---:|
| `name` | string | Yes |
| `description` | string | No |
| `basePriceAmount` | integer | Yes |
| `imageUrl` | string/null | No |
| `status` | enum | Yes |
| `modifierGroups` | array | Yes |

Product list behavior:

| Role | Visible Product Statuses |
|---|---|
| `user` | `available` only |
| `staff` | `available`, `unavailable`, `hidden` |
| `admin` | `available`, `unavailable`, `hidden` |

### 8.5 Cart API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| GET | `/cart` | Yes | user | Get current user's cart. |
| POST | `/cart/items` | Yes | user | Add item to cart. |
| PATCH | `/cart/items/:cartItemId` | Yes | user | Update quantity or modifiers. |
| DELETE | `/cart/items/:cartItemId` | Yes | user | Remove item from cart. |
| DELETE | `/cart` | Yes | user | Clear cart. |
| PATCH | `/cart/checkout-details` | Yes | user | Set `diningMode` and `pickupTime`. |

Add item request body:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `productId` | string | Yes | Must reference available product. |
| `quantity` | integer | Yes | `1` to `99`. |
| `selectedModifierGroups` | array | Yes | Must satisfy product constraints. |

Checkout details request body:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `diningMode` | enum | Yes | `takeaway` or `eat_in`. |
| `pickupTime` | string | Yes | ISO 8601 datetime. Must be valid per settings. |

### 8.6 Order API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| POST | `/orders` | Yes | user | Create order from current cart. |
| GET | `/orders/my` | Yes | user | List current user's orders. |
| GET | `/orders/my/:orderId` | Yes | user | Get own order detail. |
| GET | `/orders` | Yes | staff, admin | List all orders. |
| GET | `/orders/:orderId` | Yes | staff, admin | Get any order detail. |
| PATCH | `/orders/:orderId/status` | Yes | staff, admin | Update order status. |

Create order behavior:

| Rule ID | Rule |
|---|---|
| ORDER-API-001 | Server creates order from persisted cart. |
| ORDER-API-002 | Request body must be empty. Checkout details must be set through `/cart/checkout-details` before order creation. |
| ORDER-API-003 | If cart lacks `diningMode` or `pickupTime`, order creation must return `400`. |
| ORDER-API-004 | On success, create order, create cash payment, call dummy notification, clear cart. |

Update status request body:

| Field | Type | Required |
|---|---|---:|
| `status` | enum | Yes |

Status update behavior:

| Rule ID | Rule |
|---|---|
| ORDER-STATUS-API-001 | Requested transition must exist in the allowed transition table. |
| ORDER-STATUS-API-002 | If new status is `completed`, set `completedAt`. |
| ORDER-STATUS-API-003 | If new status is `cancelled`, set `cancelledAt` and update payment status if applicable. |
| ORDER-STATUS-API-004 | After status change, call dummy notification function. |

### 8.7 Payment API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| GET | `/orders/:orderId/payment` | Yes | user, staff, admin | Get payment for visible order. |
| PATCH | `/payments/:paymentId/status` | Yes | staff, admin | Mark cash payment status. |

Payment status update request body:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `status` | enum | Yes | `paid` or `cancelled`. |

Visibility rules:

| Role | Payment Visibility |
|---|---|
| `user` | Own order payments only. |
| `staff` | All order payments. |
| `admin` | All order payments. |

### 8.8 Dashboard API

| Method | Path | Auth | Roles | Purpose |
|---|---|---:|---|---|
| GET | `/dashboard/summary` | Yes | admin | Dashboard summary. |

Query params:

| Param | Type | Required | Rules |
|---|---|---:|---|
| `from` | ISO date | No | Default: start of current local day. |
| `to` | ISO date | No | Default: end of current local day. |

Dashboard response fields:

| Field | Type | Rule |
|---|---|---|
| `totalOrders` | integer | Count of orders in range. |
| `ordersByStatus` | object | Count grouped by order status. |
| `cashRevenueAmount` | integer | Sum of paid cash payments in range. |
| `topProducts` | array | Product sales summary from order item snapshots. |
| `activeUsers` | integer | Count of active accounts. |
| `activeStaff` | integer | Count of active staff/admin accounts. |

---

## 9. Frontend Specification

### 9.1 SPA Routes

| Route | Access | Screen |
|---|---|---|
| `/login` | guest only, authenticated users redirected by role | Login screen |
| `/register` | guest only | User registration screen |
| `/user` | user | User home/product browsing |
| `/user/cart` | user | Cart and checkout details |
| `/user/orders` | user | Own order list |
| `/user/orders/:orderId` | user | Own order detail/status |
| `/staff` | staff | Staff order management default |
| `/staff/products` | staff | Product management |
| `/staff/orders` | staff | Order management |
| `/admin` | admin | Admin dashboard default |
| `/admin/settings` | admin | Canteen settings |
| `/admin/users` | admin | Account and role management |
| `/admin/products` | admin | Product management |
| `/admin/orders` | admin | Order management |

### 9.2 Route Guard Rules

| Rule ID | Rule |
|---|---|
| FE-ROUTE-001 | On app load, frontend must call `/api/auth/session` to determine current user. |
| FE-ROUTE-002 | Protected routes must show a loading state while session check is pending. |
| FE-ROUTE-003 | If session check returns `401`, redirect to `/login`. |
| FE-ROUTE-004 | If authenticated user visits `/login` or `/register`, redirect to role default route. |
| FE-ROUTE-005 | If role does not match route access, redirect to role default route. |

### 9.3 Login Screen

| Requirement ID | Requirement |
|---|---|
| FE-LOGIN-001 | Must contain email and password fields. |
| FE-LOGIN-002 | Must submit to `/api/auth/login`. |
| FE-LOGIN-003 | Must show validation errors returned by API. |
| FE-LOGIN-004 | On success, redirect by role default route. |
| FE-LOGIN-005 | Must link to `/register` for customer registration. |

### 9.4 Registration Screen

| Requirement ID | Requirement |
|---|---|
| FE-REG-001 | Must contain full name, email, password, and confirm password fields. |
| FE-REG-002 | Must submit to `/api/auth/register`. |
| FE-REG-003 | Must create only customer role `user`. |
| FE-REG-004 | On success, redirect to `/login`. Registration must not automatically log the user in for MVP. |

### 9.5 User Screens

| Screen | Required Features |
|---|---|
| Product list | Show available products, base price, description, image if available, unavailable products must not appear. |
| Product customization | Show modifier groups, default modifiers, min/max selection errors, calculated item subtotal. |
| Cart | Show persisted cart items, update quantity, remove item, clear cart, show subtotal. |
| Checkout details | Select pickup time, select `takeaway` or `eat_in`, validate opening hours errors. |
| Submit order | Submit cart as order, show order number on success, clear cart state. |
| Own orders | Show order status, pickup time, dining mode, total, payment status. |

### 9.6 Staff Screens

| Screen | Required Features |
|---|---|
| Product management | List all non-deleted products visible to staff, create product, edit product, edit modifier groups, change status. |
| Order management | Kanban-style dashboard (Trello-like board) displaying active orders partitioned into columns by status, sort by pickupTime. Support next status or cancel, detail, and payment status. |

### 9.7 Admin Screens

| Screen | Required Features |
|---|---|
| Dashboard | Show total orders, orders by status, paid cash revenue, top products, active users/staff. |
| Settings | Edit canteen name, address, timezone, opening hours by weekday. |
| Account management | List users, create staff/admin/user, change roles, enable/disable accounts. |
| Product management | Same capabilities as staff. |
| Order management | Same capabilities as staff. |

---

## 10. Backend Business Logic

### 10.1 Price Calculation

Item subtotal formula:

```text
itemSubtotalAmount = quantity * (basePriceAmountSnapshot + sum(selected modifier priceAmountSnapshot))
```

Cart subtotal formula:

```text
cartSubtotalAmount = sum(item.itemSubtotalAmount)
```

Order total formula for MVP:

```text
order.totalAmount = order.subtotalAmount
```

Rules:

| Rule ID | Rule |
|---|---|
| PRICE-001 | Server must be the source of truth for all prices. |
| PRICE-002 | Client must never submit trusted price values. |
| PRICE-003 | Order total must be recalculated at order creation. |
| PRICE-004 | Cart subtotal must be recalculated after every cart mutation. |

### 10.2 Modifier Selection Validation

For each product modifier group:

| Rule ID | Rule |
|---|---|
| MOD-001 | Count selected active modifiers in the group. |
| MOD-002 | Reject if selected count is less than `minSelected`. |
| MOD-003 | Reject if selected count is greater than `maxSelected`. |
| MOD-004 | Reject unknown `groupId`. |
| MOD-005 | Reject unknown `modifierId`. |
| MOD-006 | Reject inactive selected modifiers. |
| MOD-007 | Reject duplicate selected modifier IDs within the same group. |
| MOD-008 | If a modifier group is omitted by client, backend must apply `defaultModifierIds` when defaults satisfy all constraints. |

### 10.3 Pickup Time Validation

Algorithm:

| Step | Rule |
|---:|---|
| 1 | Load `CanteenSettings`. |
| 2 | Parse requested pickup time as a valid datetime. |
| 3 | Convert pickup time to canteen local timezone. |
| 4 | Reject if pickup time is in the past. |
| 5 | Determine local day of week. |
| 6 | Load opening hours for that day. |
| 7 | Reject if `isOpen=false`. |
| 8 | Reject if local time is before `openTime`. |
| 9 | Reject if local time is after `closeTime`. |
| 10 | Accept and store as UTC Date. |

Boundary rule:

| Case | Result |
|---|---|
| pickup time equals `openTime` | Allowed |
| pickup time equals `closeTime` | Allowed |
| pickup time before `openTime` by any amount | Rejected |
| pickup time after `closeTime` by any amount | Rejected |

### 10.4 Order Creation Sequence

| Step | Operation |
|---:|---|
| 1 | Authenticate user role `user`. |
| 2 | Load user's cart. |
| 3 | Validate cart has at least one item. |
| 4 | Validate dining mode. |
| 5 | Validate pickup time. |
| 6 | Revalidate every product and modifier selection. |
| 7 | Recalculate all item totals and order total. |
| 8 | Create order with snapshots. |
| 9 | Create cash payment with status `pending`. |
| 10 | Clear user's cart. |
| 11 | Call dummy `notifyOrderSubmitted`. |
| 12 | Return created order. |

---

## 11. Security Requirements

| Requirement ID | Requirement |
|---|---|
| SEC-001 | Passwords must be hashed using argon2. |
| SEC-002 | Password hash must never be returned in API responses. |
| SEC-003 | Session cookie must be HTTP-only. |
| SEC-004 | Backend must enforce role authorization on every protected route. |
| SEC-005 | All request bodies, params, and query values must be validated. |
| SEC-006 | MongoDB queries must not use unvalidated user-controlled objects directly. |
| SEC-007 | Error messages must not reveal password validity details separately from email validity. |
| SEC-008 | CORS must allow only configured frontend origins in production. |
| SEC-009 | Admin account management must prevent self-disable and self-demotion. |
| SEC-010 | API must use HTTPS in production deployment. |

---

## 12. Database Index Requirements

| Collection | Index | Type | Purpose |
|---|---|---|---|
| `users` | `{ email: 1 }` | unique | Login and duplicate registration. |
| `users` | `{ role: 1, status: 1 }` | normal | Admin filters. |
| `sessions` | `{ sessionIdHash: 1 }` | unique | Session lookup. |
| `sessions` | `{ userId: 1 }` | normal | User session management. |
| `sessions` | `{ expiresAt: 1 }` | TTL | Cleanup expired sessions. |
| `products` | `{ status: 1, name: 1 }` | normal | Product listing. |
| `carts` | `{ userId: 1 }` | unique | One cart per user. |
| `orders` | `{ userId: 1, createdAt: -1 }` | normal | User order history. |
| `orders` | `{ status: 1, pickupTime: 1 }` | normal | Staff order queue. |
| `orders` | `{ orderNumber: 1 }` | unique | Human-readable lookup. |
| `payments` | `{ orderId: 1 }` | unique | Payment lookup by order. |
| `payments` | `{ status: 1, updatedAt: -1 }` | normal | Dashboard revenue queries. |

---

## 13. Seed and Bootstrap Data

### 13.1 Initial Admin Strategy

| Rule ID | Rule |
|---|---|
| SEED-001 | Application must provide a seed script or bootstrap path to create the first admin account. |
| SEED-002 | First admin credentials must come from environment variables or a one-time local seed command. |
| SEED-003 | Seed script must not overwrite an existing admin unless explicitly configured. |

### 13.2 Default Canteen Settings

If no settings document exists, seed with:

| Field | Value |
|---|---|
| `canteenName` | `CMC Main Canteen` |
| `address` | `Default Address` |
| `timezone` | `Asia/Ho_Chi_Minh` |
| Monday-Friday | open `07:00`, close `17:00` |
| Saturday | open `07:00`, close `12:00` |
| Sunday | closed |

### 13.3 Example Products

Seed products are required for development environments and must not be inserted in production unless an explicit seed command is executed.

| Product | Base Price | Status | Example Modifier Groups |
|---|---:|---|---|
| Cơm Gà | 30000 | available | Thêm (cơm, gà), Lựa chọn canh (Canh chua, Canh rau) |
| Bún Chả Giò Thịt Nướng | 25000 | available | Kích cỡ (Thêm bún), Topping (Thêm chả giò), Yêu cầu rau (Không giá) |
| Sữa Đậu Nành | 10000 | available | Mức độ ngọt (Nhiều đường, Không đường), Nhiệt độ (Thường, Uống đá, Uống nóng) |
| Nước Sấu Đá | 12000 | available | Kích cỡ ly (Ly lớn, Ly vừa), Topping (Thêm quả sấu dầm) |

---

## 14. Environment Variables

| Variable | Required | Example | Purpose |
|---|---:|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment. |
| `PORT` | Yes | `3000` | Backend port. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/canteen_mvp` | MongoDB connection. |
| `SESSION_COOKIE_NAME` | Yes | `canteen_sid` | Session cookie name. |
| `SESSION_SECRET` | Yes | random string | Used for hashing/signing where applicable. |
| `SESSION_TTL_DAYS` | No | `7` | Session expiration days. |
| `FRONTEND_ORIGIN` | Yes | `http://localhost:5173` | Allowed CORS origin. |
| `SEED_ADMIN_EMAIL` | Seed only | `admin@example.com` | Initial admin email. |
| `SEED_ADMIN_PASSWORD` | Seed only | secure password | Initial admin password. |
| `SEED_ADMIN_FULL_NAME` | Seed only | `System Admin` | Initial admin name. |

---

## 15. Testing Requirements

### 15.1 Backend Tests

| Area | Required Test Cases |
|---|---|
| Auth | Register user, duplicate email, login success, login failure, disabled user login failure, logout revokes session. |
| Authorization | User cannot access staff/admin APIs, staff cannot access admin APIs, admin can access staff APIs. |
| Products | Product create/update, modifier validation, user visibility only available products. |
| Cart | Add/update/remove item, invalid modifiers rejected, subtotal calculation, one cart per user. |
| Orders | Create order, pickup time validation, cart clearing, snapshots, status transitions. |
| Payments | Cash payment created with order, mark paid, cancel behavior. |
| Settings | Admin update only, timezone validation, opening hours validation. |

### 15.2 Frontend Tests

| Area | Required Test Cases |
|---|---|
| Route guards | Guest redirect, authenticated role redirects, forbidden role behavior. |
| Login/register | Form validation, API error display, success redirect. |
| User flow | Browse products, customize item, cart update, submit order, view status. |
| Staff flow | Product management and order status update. |
| Admin flow | Settings update, account role update, dashboard display. |

### 15.3 Manual Acceptance Test Scenarios

| Scenario ID | Steps | Expected Result |
|---|---|---|
| ACC-001 | Guest opens app root. | Redirected to login. |
| ACC-002 | Guest registers account. | User account created with role `user`. |
| ACC-003 | User logs in. | Redirected to `/user`. |
| ACC-004 | User adds available product with valid modifiers to cart. | Cart persists after page refresh. |
| ACC-005 | User selects pickup time within opening hours and submits order. | Order created, cash payment pending, cart cleared. |
| ACC-006 | User selects pickup time outside opening hours. | Submission rejected with validation error. |
| ACC-007 | Staff logs in. | Redirected to `/staff`. |
| ACC-008 | Staff changes order status from `submitted` to `accepted`. | Order status updates and appears to user. |
| ACC-009 | Staff marks payment as paid. | Payment status becomes `paid`. |
| ACC-010 | Admin updates canteen timezone/opening hours. | New order pickup validation uses updated settings. |
| ACC-011 | Admin disables a user account. | Disabled user cannot log in. |
| ACC-012 | Admin views dashboard. | Summary metrics are displayed. |

---

## 16. Implementation Constraints

| Constraint ID | Constraint |
|---|---|
| IMPL-001 | Do not implement real microservices for MVP. |
| IMPL-002 | Do not trust frontend-calculated prices. |
| IMPL-003 | Do not allow unauthenticated app usage except login/register. |
| IMPL-004 | Do not store raw session IDs in MongoDB. |
| IMPL-005 | Do not allow staff to manage accounts, roles, settings, or dashboard. |
| IMPL-006 | Do not allow users to view all orders. |
| IMPL-007 | Do not allow users to update order status. |
| IMPL-008 | Do not implement non-cash payment as part of MVP. |
| IMPL-009 | Do not implement real notifications as part of MVP. |
| IMPL-010 | Keep modules cohesive; avoid splitting code into many tiny files without clear domain value. |

---

## 17. Definition of Done

The MVP is complete when all conditions are true:

| ID | Condition |
|---|---|
| DOD-001 | Guest can only access login and registration. |
| DOD-002 | User registration creates active `user` accounts only. |
| DOD-003 | Login creates DB-backed session and role-based redirect works. |
| DOD-004 | User can browse available products. |
| DOD-005 | Product modifier groups enforce defaults, min, max, and prices. |
| DOD-006 | User cart is persisted in MongoDB. |
| DOD-007 | User can submit order with selected pickup time and dining mode. |
| DOD-008 | Pickup time is validated against canteen timezone and opening hours. |
| DOD-009 | Cash payment record is created for each order. |
| DOD-010 | User can view own order status. |
| DOD-011 | Staff can manage products and update order statuses. |
| DOD-012 | Admin can manage settings, accounts, roles, dashboard, products, and orders. |
| DOD-013 | Backend enforces authorization for every protected API. |
| DOD-014 | Dummy notification functions exist and are called from order/payment events. |
| DOD-015 | Automated or manual acceptance tests cover all scenarios in Section 15.3. |

---

## 18. Future Extension Points

These are not MVP requirements. They are listed only to avoid architectural dead ends.

| Future Feature | Design Consideration |
|---|---|
| Online payment | Add payment providers behind Payment Service without changing Order Service public API heavily. |
| Real notifications | Replace dummy Notification Service internals with email/SMS/push adapters. |
| WebSocket updates | Add real-time order updates while keeping REST endpoints. |
| Multiple canteens | Introduce `canteenId` to settings, products, orders, staff assignment. |
| Inventory | Add stock fields and reservation logic to Product Service. |
| Password reset | Extend Auth Service with reset token collection. |

---

## 19. Glossary

| Term | Definition |
|---|---|
| SPA | Single Page Application rendered in browser. |
| MVP | Minimum Viable Product. |
| Modular monolith | One deployable backend application split internally by domain modules. |
| Modifier group | A named group of product customization options, such as size or toppings. |
| Modifier | A selectable customization option inside a modifier group. |
| Dining mode | Whether the order is `takeaway` or `eat_in`. |
| Pickup time | User-selected time when the order should be ready. |
| Session ID | High-entropy token stored in HTTP-only cookie and hashed in database. |
