# Microservices E-Commerce Platform

## Overview

This project is a microservices-based e-commerce platform where users can sign up, buy and sell products, manage orders, and receive real-time notifications. The system is built using multiple services that communicate via Kafka and REST APIs.

## Architecture

The platform is structured into the following microservices:

### 1. **Product Service**

- Manages product-related operations.
- Stores product data in MongoDB.
- Exposes APIs for listing, adding, and updating products.
- **Port:** `5010`

### 2. **Order Service**

- Manages order creation and status updates.
- Stores order data in PostgreSQL.
- Publishes order-related events to Kafka.
- **Port:** `5014`

### 3. **Wishlist Service**

- Allows users to add products to their wishlist.
- Uses Kafka to notify the notification service when an item is added.
- **Port:** `5011`

### 4. **Chat Service**

- Enables real-time messaging between users using WebSockets.
- Stores chat messages in MongoDB.
- **Ports:** `5012`, `5015`

### 5. **Notification Service**

- Listens to Kafka events for order and wishlist updates.
- Sends real-time notifications via WebSockets.
- **Port:** `8080`

### 6. **Consumer Service**

- Handles background Kafka consumers for processing events.
- **Ports:** `5013`, `8080`, `8081`

### 7. **Frontend (Next.js Dashboard)**

- Provides the UI for users to interact with the platform.
- Uses WebSockets to receive live notifications.
- Runs separately from the microservices.

### 8. **WebSocket Chat Service**

- Dedicated service for handling chat WebSocket connections.
- **Port:** `5015`

### 9. **Infrastructure Services**

- **Kafka** (Port: `9092`) - Message broker for inter-service communication.
- **Zookeeper** (Port: `2181`) - Manages Kafka broker metadata.
- **PostgreSQL** (Port: `5432`) - Stores order data.
- **MongoDB** - Stores product and chat data.

## Prerequisites

Ensure you have the following installed:

- Docker & Docker Compose
- Node.js & npm
- PostgreSQL & MongoDB (if running services locally)

## Running the Project

### 1. **Clone the Repository**

```sh
git clone <repository-url>
cd microservices
```

### 2. **Start Services with Docker Compose**

```sh
docker-compose up --build
```

This will start all services along with Kafka, PostgreSQL, and other dependencies.

### 3. **Running Services Locally**

To run a specific service manually:

```sh
cd <service-name>
npm install
npm run dev
```

### 4. **Accessing the Services**

| Service                | Endpoint                |
| ---------------------- | ----------------------- |
| Product Service        | `http://localhost:5010` |
| Order Service          | `http://localhost:5014` |
| Wishlist Service       | `http://localhost:5011` |
| Chat Service           | `http://localhost:5012` |
| Notification Service   | `ws://localhost:8080`   |
| Consumer Service       | `http://localhost:5013` |
| WebSocket Chat Service | `ws://localhost:5015`   |
| PostgreSQL             | `localhost:5432`        |
| Kafka                  | `localhost:9092`        |

## Kafka Topics

| Topic Name        | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `wishlist-events` | Triggers notifications when a product is added to a wishlist. |
| `order-events`    | Used for processing orders asynchronously.                    |

## Authentication

Authentication is handled via Clerk. Ensure you configure the Clerk API keys in the environment variables before starting the services.

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch`
3. Commit changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature-branch`
5. Submit a Pull Request.

## License

This project is licensed under the MIT License.
