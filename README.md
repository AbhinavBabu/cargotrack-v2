# CargoTrack

A shipment tracking and logistics platform built as a Cloud Architecture Capstone Project.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT
- **Containerization**: Docker & Docker Compose
- **API Docs**: Swagger

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### Run

```bash
# 1. Clone the repository
git clone <repo-url> && cd cargotracker-v2

# 2. Copy environment file (optional - defaults work out of the box)
cp .env.example .env

# 3. Start the application
docker compose up -d --build
```

### Access

| Service | URL |
|---------|-----|
| Application | http://localhost |
| API | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/api/docs |
| Health Check | http://localhost:4000/api/health |

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| User | user@cargotrack.com | user123 |
| Admin | admin@cargotrack.com | admin123 |

## Features

### User Features
- Create, view, edit, and cancel shipments
- Track shipments by tracking number (public - no login required)
- Upload shipment documents (Invoice, Shipping Label, Proof of Delivery, Customs)
- View tracking timeline with real-time status updates
- Download shipment reports (CSV)
- Profile management with avatar upload

### Admin Features
- View all shipments across the platform
- Update shipment statuses
- View shipment documents

### Shipment Statuses
```
CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                    → DELAYED
                                                    → CANCELLED
```

### Tracking Numbers
Auto-generated format: `CT-YYYY-XXXXXX` (e.g., `CT-2026-123456`)

## Project Structure

```
cargotracker-v2/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── middleware/
│       ├── routes/
│       ├── providers/
│       └── swagger.ts
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── auth.tsx
        ├── components/
        └── pages/
```

## AWS Readiness

The application uses provider abstractions for easy future AWS integration:

| Provider | Current | Future |
|----------|---------|--------|
| Storage | LocalStorageProvider (disk) | S3StorageProvider |
| Notifications | DatabaseNotificationProvider | SNSNotificationProvider |
| Events | ConsoleLoggerEventPublisher | EventBridgePublisher |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get profile |
| PUT | /api/auth/me | Yes | Update profile |
| POST | /api/auth/me/avatar | Yes | Upload avatar |
| GET | /api/shipments | Yes | List shipments |
| POST | /api/shipments | Yes | Create shipment |
| GET | /api/shipments/:id | Yes | Get shipment |
| PUT | /api/shipments/:id | Yes | Update shipment |
| DELETE | /api/shipments/:id | Yes | Cancel shipment |
| GET | /api/tracking/:trackingNumber | No | Public tracking |
| POST | /api/documents/shipment/:id | Yes | Upload document |
| GET | /api/documents/shipment/:id | Yes | List documents |
| GET | /api/documents/:id/download | Yes | Download document |
| GET | /api/notifications | Yes | List notifications |
| PUT | /api/notifications/:id/read | Yes | Mark as read |
| GET | /api/reports/shipment-history | Yes | Download history CSV |
| GET | /api/reports/shipment-summary | Yes | Download summary CSV |
| GET | /api/admin/shipments | Admin | List all shipments |
| PUT | /api/admin/shipments/:id/status | Admin | Update status |
| GET | /api/admin/documents/:id | Admin | View documents |
| GET | /api/health | No | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| POSTGRES_DB | cargotrack | Database name |
| POSTGRES_USER | cargotrack | Database user |
| POSTGRES_PASSWORD | cargotrack123 | Database password |
| JWT_SECRET | (set in .env) | JWT signing secret |
| JWT_EXPIRES_IN | 7d | JWT token expiry |
| NODE_ENV | production | Node environment |
| CORS_ORIGIN | * | CORS allowed origins |
| APP_PORT | 80 | Frontend port |
| API_PORT | 4000 | Backend port |
| DB_PORT | 5432 | Database port |

## Deployment to AWS EC2

```bash
# On your EC2 Ubuntu instance:

# 1. Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose-plugin

# 2. Clone and configure
git clone <repo-url> && cd cargotracker-v2
cp .env.example .env
# Edit .env with production values (especially JWT_SECRET)

# 3. Run
sudo docker compose up -d --build

# 4. Verify
curl http://localhost/api/health
```

## Stopping

```bash
docker compose down          # Stop containers
docker compose down -v       # Stop and remove volumes (data loss!)
```
