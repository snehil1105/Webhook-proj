# E-Commerce Platform for Webhook Integration

## Project Overview
This is a production-grade e-commerce platform built with Java 17 and Spring Boot 3.2.0.2.0. It consists of 7 microservices that integrate with an existing webhook delivery platform via Kafka events.

## How it integrates with the Webhook Delivery Platform
The e-commerce platform uses a dedicated webhook-bridge-service that consumes Kafka events from ecommerce.orders and ecommerce.payments topics and forwards them to the webhook platform via HTTP POST to /api/events with proper JWT authentication.

## Architecture Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   User Service  │    │ Product Service  │    │ Order Service    │
│   (port 9091)   │    │ (port 9092)      │    │ (port 9093)      │
│                 │    │                  │    │                  │
│  ┌─────────┐    │    │  ┌─────────┐    │    │  ┌─────────┐    │    │
│  │ API     │    │    │  │ API     │    │    │  │ API     │    │    │
│  └─────────┘    │    │  └─────────┘    │    │  └─────────┘    │    │
│  ┌─────────┐    │    │  ┌─────────┐    │    │  ┌─────────┐    │    │
│  │ Service │    │    │  │ Service │    │    │  │ Service │    │    │
│  └─────────┘    │    │  └─────────┘    │    │  └─────────┘    │    │
│  ┌─────────┐    │    │  ┌─────────┐    │    │  ┌─────────┐    │    │
│  │ Repo    │    │    │  │ Repo    │    │    │  │ Repo    │    │    │
│  └─────────┘    │    │  └─────────┘    │    │  └─────────┘    │    │
└─────────────────┘    └──────────────────┘    └──────────────────┘
        │                       │                       │
        └─────────────┬─────────┘                       │
                      ▼                                 │
              ┌───────────────────────┐                 │
              │   Payment Service     │                 │
              │   (port 9094)         │                 │
              │                       │                 │
              │  ┌─────────┐         │                 │
              │  │ API     │         │                 │
              │  └─────────┘         │                 │
              │  ┌─────────┐         │                 │
              │  │ Service │         │                 │
              │  └─────────┘         │                 │
              │  ┌─────────┐         │                 │
              │  │ Repo    │         │                 │
              │  └─────────┘         │                 │
              └───────────────────────┘                 │
                      │                                 │
                      ▼                                 │
              ┌───────────────────────┐                 │
              │ Inventory Service     │◄──────┐         │
              │   (port 9095)         │       │         │
              │                       │       │         │
              │  ┌─────────┐         │       │         │
              │  │ Service │         │       │         │
              │  └─────────┘         │       │         │
              │  ┌─────────┐         │       │         │
              │  │ Kafka   │◄────────┘       │         │
              │  └─────────┘         │       │         │
              └───────────────────────┘                 │
                      │                                 │
                      ▼                                 │
              ┌───────────────────────┐                 │
              │ Webhook Bridge        │◄────────────────┘
              │   (port 9096)         │
              │                       │
              │  ┌─────────┐         │
              │  │ Service │         │
              │  └─────────┘         │
              │  ┌─────────┐         │
              │  │ Kafka   │◄────────┘
              │  └─────────┘         │
              └───────────────────────┘
                      │
                      ▼
              ┌───────────────────────┐
              │ Webhook Platform      │
              │   (running separately)│
              │   localhost:8085      │
              └───────────────────────┘

┌─────────────────┐
│  API Gateway    │
│   (port 9090)   │
│                 │
│  ┌─────────────┐ │
│  │ Routing     │ │
│  │   & JWT     │ │
│  │  Filter     │ │
│  └─────────────┘ │
└─────────────────┘
        │
        ▼
┌───────────────────────────────────────────┐
│                                           │
│  Routes to all services with JWT validation│
│                                           │
└───────────────────────────────────────────┘
```

## Kafka Topic Flow Diagram
```
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.placed
                            ▼
                    ┌──────────────┐
                    │              │
                    │   Kafka      │
                    │  Topic:      │
                    │ ecommerce.orders
                    │              │
                    └───────┬──────┘
                            │
          ┌─────────────────▼─────────────────┐
          │                                   │
          │  ┌──────────────┐   ┌──────────────┐
          │  │              │   │              │
          │  │ Inventory    │   │ Webhook      │
          │  │ Service      │   │ Bridge       │
          │  │ (Consumer)   │   │ (Consumer)   │
          │  │              │   │              │
          │  └──────────────┘   │              │
          │                     │ order.placed │
          │  ┌──────────────┐   │              │
          │  │              │   │              │
          │  │ Payment      │   │              │
          │  │ Service      │   │              │
          │  │              │   │              │
          │  └──────────────┘   │              │
          │                     │              │
          │  ┌──────────────┐   │ payment.suc  │
          │  │              │   │ cess/failed  │
          │  │ Webhook      │   │              │
          │  │ Bridge       │   │              │
          │  │ (Consumer)   │   │              │
          │  │              │   │              │
          │  └──────────────┘   │              │
          │                     │              │
          │  ┌──────────────┐   │              │
          │  │              │   │              │
          │  │              │   │              │
          │  │ Webhook      │   │              │
          │  │ Platform     │   │              │
          │  │              │   │              │
          │  └──────────────┘   │              │
          │                                   │
          └───────────────────────────────────┘
                    ▲
                    │
          ┌─────────────────┐
          │                 │
          │  Payment        │
          │  Service        │
          │                 │
          └─────────────────┘
                            │ payment.suc
                            ▼
                    ┌──────────────┐
                    │              │
                    │   Kafka      │
                    │  Topic:      │
                    │ ecommerce.payments
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.placed
                            ▼
                    ┌──────────────┐
                    │              │
                    │   Kafka      │
                    │  Topic:      │
                    │ ecommerce.orders
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.shipped
                            ▼
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.cancelled
                            ▼
                    ┌──────────────┐
                    │              │
                    │   Kafka      │
                    │  Topic:      │
                    │ ecommerce.orders
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.placed
                            ▼
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.shipped
                            ▼
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.cancelled
                            ▼
                    ┌──────────────┐
                    │              │
                    │   Kafka      │
                    │  Topic:      │
                    │ ecommerce.orders
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.placed
                            ▼
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.shipped
                            ▼
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.cancelled
                            ▼
                    ┌──────────────┐
                    │              │
                    │   Kafka      │
                    │  Topic:      │
                    │ ecommerce.orders
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │ order.placed
                            ▼
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬──────┘
                            │
                    ┌──────────────┐
                    │              │
                    │  Order       │
                    │  Service     │
                    │              │
                    └───────┬────────────────────────
```

## Tech Stack Table
| Component          | Technology                     |
|--------------------|--------------------------------|
| Language           | Java 17                        |
| Framework          | Spring Boot 3.2.0              |
| Database           | PostgreSQL 15                  |
| Cache              | Redis 7                        |
| Messaging          | Apache Kafka 7.4.0             |
| Service Discovery  | Spring Cloud Gateway           |
| Security           | Spring Security + JWT          |
| Payment            | Razorpay Java SDK 1.4.5        |
| Build Tool         | Maven                          |
| Containerization   | Docker & Docker Compose        |
| API Documentation  | HTTP (REST)                    |
## Setup Instructions
1. Start webhook platform first: cd D:\Webhook\Webhook-proj && docker-compose up -d
2. Start ecommerce: cd D:\Webhook\Ecommerce-proj && docker-compose up --build
3. Wait for all services to become healthy (check with docker ps)
4. Test the API using: http://localhost:9090 (gateway) or use api-tests.http file
## Key Design Decisions
- **Why Kafka instead of direct HTTP**: Decouples services, provides resilience, enables event-driven architecture, and allows asynchronous processing
- **Why webhook-bridge pattern**: Avoids tight coupling between e-commerce and webhook platform; bridge handles translation and authentication
- **Database per service**: Ensures loose coupling, independent scaling, and technology flexibility per service
- **Redis caching strategy**: Improves read performance for product catalog (public endpoints) with automatic invalidation on updates
## Demo Flow Section
1. Start webhook platform first
2. Start ecommerce platform
3. Register as retailer via POST /business/auth/register
4. Login as retailer to get JWT token
5. Create sample products (Electronics, Clothing, Books)
6. Register as customer via POST /customer/auth/register
7. Login as customer to get JWT token
8. Browse products via GET /public/products
9. Place order with multiple items via POST /customer/orders
10. Initiate payment via POST /customer/payments/initiate
11. Verify payment with Razorpay test credentials
12. Simulate payment webhook (payment.captured)
13. Retailer views incoming orders via GET /business/orders/incoming
14. Retailer marks order as shipped via PUT /business/orders/{id}/ship
15. Verify webhook platform received events via GET http://localhost:8085/api/dashboard/stats