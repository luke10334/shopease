# ShopEase Backend

ShopEase is a Java-based e-commerce backend built using Spring Boot. It provides REST APIs for user authentication, product management, shopping carts, and order management.

The application uses JWT for authentication, role-based access control for authorization, and RabbitMQ for asynchronous order processing. MySQL is used to store application data, and Docker Compose is used to run the application along with its dependencies.

## Technologies Used

| Component | Technology |
|---|---|
| Language | Java 21 |
| Backend Framework | Spring Boot 3.2 |
| Security | Spring Security, JWT |
| Database | MySQL 8 |
| ORM | Spring Data JPA, Hibernate |
| Message Broker | RabbitMQ 3.13 |
| Build Tool | Maven |
| API Documentation | Springdoc OpenAPI, Swagger UI |
| Containerization | Docker, Docker Compose |

## Project Structure

```text
shopease-backend/
├── src/
│   ├── main/
│   │   ├── java/com/shopease/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   └── response/
│   │   │   ├── entity/
│   │   │   ├── exception/
│   │   │   ├── messaging/
│   │   │   ├── repository/
│   │   │   ├── security/
│   │   │   └── service/
│   │   └── resources/
│   └── test/
├── scripts/
│   └── schema.sql
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── pom.xml
```

## Features

### 1. User Authentication and Authorization
- User registration and login.
- JWT-based authentication.
- Separate USER and ADMIN roles.
- Protected endpoints using Spring Security.
- Role-based access using security configuration and `@PreAuthorize`.

### 2. Product Management
- View available products.
- Search products.
- Filter products by category.
- Pagination for product listings.
- Admin operations to add, update, and deactivate products.

### 3. Shopping Cart
- Add products to the cart.
- Update item quantities.
- Remove individual items.
- View and clear the cart.

### 4. Order Management
- Place orders using cart items.
- View order history.
- Retrieve individual order details.
- Admin access to all customer orders.
- Update order status.

### 5. Asynchronous Order Processing
RabbitMQ is used to process order events asynchronously.

The order is initially saved with a `PENDING` status. An event is then published to RabbitMQ, where a consumer handles order confirmation and notification logging.

The messaging configuration also includes:
- Direct exchange and queues.
- Dead Letter Queue (DLQ).
- Retry mechanism with exponential backoff.

### 6. API Documentation
Swagger UI is available for exploring and testing the REST endpoints.

## Running the Project

### Using Docker Compose

Clone the repository:

```bash
git clone <your-repository-url>
cd shopease-backend
```

Build and start the application:

```bash
docker compose up --build
```

The following services will be available:

| Service | URL |
|---|---|
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| RabbitMQ Management | http://localhost:15672 |

### Local Development

Start MySQL and RabbitMQ:

```bash
docker compose up -d mysql rabbitmq
```

Apply the database schema if required:

```bash
mysql -u shopease_user -p shopease < scripts/schema.sql
```

Run the Spring Boot application:

```bash
./mvnw spring-boot:run
```

## API Endpoints

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |

### Products

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/products` | Public |
| GET | `/api/products/search?q=` | Public |
| GET | `/api/products/{id}` | Public |
| POST | `/api/products` | ADMIN |
| PUT | `/api/products/{id}` | ADMIN |
| DELETE | `/api/products/{id}` | ADMIN |

### Cart

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/cart` | USER |
| POST | `/api/cart/items` | USER |
| PATCH | `/api/cart/items/{id}?qty=N` | USER |
| DELETE | `/api/cart/items/{id}` | USER |
| DELETE | `/api/cart` | USER |

### Orders

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/orders` | USER |
| GET | `/api/orders` | USER |
| GET | `/api/orders/{id}` | USER |

### Admin

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/admin/orders` | ADMIN |
| GET | `/api/admin/orders/{id}` | ADMIN |
| PATCH | `/api/admin/orders/{id}/status` | ADMIN |
| GET | `/api/admin/users` | ADMIN |

## Order Processing Flow

```text
OrderController
      |
      v
OrderService
      |
      v
Save Order (PENDING)
      |
      v
Publish OrderPlacedEvent
      |
      v
RabbitMQ Exchange
      |
      v
OrderEventConsumer
      |
      v
Update Order Status
      |
      v
CONFIRMED
```

Failed messages can be routed to the Dead Letter Queue for further inspection.

## Order Status

```text
PENDING
   |
   v
CONFIRMED
   |
   v
PROCESSING
   |
   v
SHIPPED
   |
   v
DELIVERED

PENDING / CONFIRMED / PROCESSING
   |
   v
CANCELLED
```

## Design Decisions

- **JWT authentication:** Used to authenticate API requests without maintaining server-side sessions.
- **Layered architecture:** Controllers handle HTTP requests, services contain business logic, and repositories handle database operations.
- **RabbitMQ:** Used to handle order confirmation asynchronously.
- **Soft deletion:** Products are deactivated instead of permanently deleted.
- **Price snapshot:** The purchase price is stored with each order item so that historical orders retain their original prices.
- **Global exception handling:** Centralized exception handling provides consistent API error responses.

## Testing

The project includes a test structure using Spring Boot's testing support.

Additional integration tests can be added for authentication, product operations, cart management, and order processing.

## Future Improvements

- Payment gateway integration.
- Email notifications.
- Product image uploads.
- Automated integration testing.
- CI/CD pipeline.
- Frontend integration.
