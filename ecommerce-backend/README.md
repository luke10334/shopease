# ShopEase Backend 🛒

A production-style **Java 21 + Spring Boot 3** e-commerce REST API with JWT auth, role-based access control, async order processing via RabbitMQ, and a fully Dockerized setup.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.2 |
| Security | Spring Security + JWT (JJWT 0.12) |
| Persistence | Spring Data JPA / Hibernate + MySQL 8 |
| Messaging | RabbitMQ 3.13 (async order processing) |
| Build | Maven 3.9 |
| Docs | Springdoc OpenAPI / Swagger UI |
| Container | Docker + Docker Compose |

---

## Project Structure

```
shopease-backend/
├── src/main/java/com/shopease/
│   ├── ShopEaseApplication.java
│   ├── config/
│   │   ├── DataSeeder.java          # Seeds initial data on startup
│   │   ├── OpenApiConfig.java
│   │   ├── RabbitMQConfig.java      # Exchange, queues, DLQ setup
│   │   └── SecurityConfig.java      # JWT filter chain + RBAC rules
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── ProductController.java
│   │   ├── CategoryController.java
│   │   ├── CartController.java
│   │   ├── OrderController.java
│   │   ├── UserController.java
│   │   └── AdminController.java
│   ├── dto/
│   │   ├── request/                 # Validated inbound DTOs
│   │   └── response/                # Outbound response DTOs
│   ├── entity/                      # JPA entities (User, Product, Cart, Order…)
│   ├── exception/                   # Custom exceptions + GlobalExceptionHandler
│   ├── messaging/
│   │   ├── OrderPlacedEvent.java
│   │   ├── OrderEventProducer.java
│   │   └── OrderEventConsumer.java  # Confirms order + sends notification log
│   ├── repository/                  # Spring Data JPA repositories
│   ├── security/
│   │   ├── JwtUtil.java             # Token generation & validation
│   │   ├── JwtAuthFilter.java       # OncePerRequestFilter
│   │   ├── UserPrincipal.java
│   │   └── UserDetailsServiceImpl.java
│   └── service/                     # Business logic layer
├── src/main/resources/
│   ├── application.yml
│   └── application-test.yml
├── src/test/java/com/shopease/
│   └── AuthServiceTest.java
├── scripts/
│   └── schema.sql                   # MySQL DDL (used by Docker init)
├── Dockerfile                       # Multi-stage build
├── docker-compose.yml               # App + MySQL + RabbitMQ
├── .env.example
└── pom.xml
```

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
git clone <repo-url> && cd shopease-backend

# Build and start all services
docker compose up --build

# App:         http://localhost:8080
# Swagger UI:  http://localhost:8080/swagger-ui.html
# RabbitMQ UI: http://localhost:15672  (guest / guest)
```

### Option B — Local development

```bash
# 1. Start MySQL and RabbitMQ (Docker)
docker compose up mysql rabbitmq -d

# 2. Apply schema
mysql -u shopease_user -pshopease_pass shopease < scripts/schema.sql

# 3. Run the app
./mvnw spring-boot:run
```

---

## Seed Credentials

| Role  | Email                 | Password    |
|-------|-----------------------|-------------|
| ADMIN | admin@shopease.com    | Admin@123   |
| USER  | john@example.com      | User@1234   |

---

## API Reference

### Auth

| Method | Endpoint             | Access | Description |
|--------|----------------------|--------|-------------|
| POST   | /api/auth/register   | Public | Register new user |
| POST   | /api/auth/login      | Public | Login, returns JWT |

### Products

| Method | Endpoint                | Access | Description |
|--------|-------------------------|--------|-------------|
| GET    | /api/products           | Public | List products (paginated, filterable by category) |
| GET    | /api/products/search?q= | Public | Full-text search |
| GET    | /api/products/{id}      | Public | Get product |
| POST   | /api/products           | ADMIN  | Create product |
| PUT    | /api/products/{id}      | ADMIN  | Update product |
| DELETE | /api/products/{id}      | ADMIN  | Deactivate product |

### Cart

| Method | Endpoint                    | Access | Description |
|--------|-----------------------------|--------|-------------|
| GET    | /api/cart                   | USER   | View cart |
| POST   | /api/cart/items             | USER   | Add item |
| PATCH  | /api/cart/items/{id}?qty=N  | USER   | Update quantity |
| DELETE | /api/cart/items/{id}        | USER   | Remove item |
| DELETE | /api/cart                   | USER   | Clear cart |

### Orders

| Method | Endpoint           | Access | Description |
|--------|--------------------|--------|-------------|
| POST   | /api/orders        | USER   | Place order from cart |
| GET    | /api/orders        | USER   | Order history (paginated) |
| GET    | /api/orders/{id}   | USER   | Get specific order |

### Admin

| Method | Endpoint                          | Access | Description |
|--------|-----------------------------------|--------|-------------|
| GET    | /api/admin/orders                 | ADMIN  | All orders (filter by status) |
| GET    | /api/admin/orders/{id}            | ADMIN  | Any order |
| PATCH  | /api/admin/orders/{id}/status     | ADMIN  | Update order status |
| GET    | /api/admin/users                  | ADMIN  | List all users |

---

## RabbitMQ Flow

```
[OrderController] → placeOrder()
        │
        ▼
[OrderService] saves Order(PENDING) → publishes OrderPlacedEvent
        │
        ▼  (async, via RabbitMQ direct exchange)
[OrderEventConsumer] receives event
        │
        ├─ Updates Order status: PENDING → CONFIRMED
        └─ Logs notification (plug in JavaMailSender here)

Dead Letter Queue (DLQ): order.processing.dlq
Retry: 3 attempts, 3s initial interval, 2x backoff
```

---

## Order Status Transitions

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
   └──────────────────────────────► CANCELLED
```

---

## Interview Talking Points

1. **Why monolith first?** Avoids distributed systems complexity before product-market fit. Easy to extract services later.
2. **Why RabbitMQ only for orders?** Order confirmation is the only genuinely async operation — clearing cart, deducting stock are synchronous within the same transaction.
3. **JWT over sessions?** Stateless, scales horizontally without shared session store.
4. **Soft delete on products** (`active = false`) preserves order history integrity.
5. **Price snapshot** (`price_at_purchase`) in `order_items` prevents order history corruption when prices change.
6. **DLQ pattern** ensures failed order messages don't get lost.
7. **`@PreAuthorize` + `SecurityConfig`** provide two layers of RBAC enforcement.
