# Fee Management System

A full-stack school fee management system built with **NestJS** (backend) and **React** (frontend).

## Tech Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator & class-transformer
- **Rate Limiting**: @nestjs/throttler
- **Testing**: Jest

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Routing**: React Router DOM

## Project Structure

```
.
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # Users module
│   │   ├── common/         # Shared utilities
│   │   ├── database/       # Database configuration
│   │   └── main.ts         # Application entry point
│   ├── docker-compose.yml  # PostgreSQL container
│   └── package.json
│
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── contexts/       # React contexts
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   └── types/          # TypeScript types
    └── package.json
```

## Getting Started

### Prerequisites

- Docker and Docker Compose (recommended)
- OR Node.js 20+ and npm (for local development without Docker)
- PostgreSQL 16+ (if not using Docker)

### Option 1: Docker Compose (Recommended)

Run everything with Docker Compose:

1. **Start all services** (PostgreSQL, Backend, Frontend):
   ```bash
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f
   ```

3. **Stop all services**:
   ```bash
   docker-compose down
   ```

4. **Rebuild after code changes**:
   ```bash
   docker-compose up -d --build
   ```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api-docs
- PostgreSQL: localhost:5432

### Option 2: Local Development (Without Docker)

#### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. **Start PostgreSQL** (using Docker or local):
   ```bash
   docker-compose up -d
   ```

5. **Start the development server**:
   ```bash
   npm run start:dev
   ```

The backend will be running on `http://localhost:3000`
- API: `http://localhost:3000/api`
- Swagger Docs: `http://localhost:3000/api-docs`

#### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

The frontend will be running on `http://localhost:5173`

### Production Deployment

For production, use the production Docker Compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `POST /api/users` - Create user (protected)
- `PATCH /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=fee_management

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173

THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## Development Commands

### Backend
```bash
npm run start:dev      # Start development server with hot reload
npm run build          # Build for production
npm run start:prod     # Start production server
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
```

### Frontend
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## Features

- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Swagger API documentation
- ✅ Request validation with DTOs
- ✅ Rate limiting
- ✅ Global error handling
- ✅ CORS configuration
- ✅ TypeScript strict mode
- ✅ Hot reload in development
- ✅ Docker Compose for PostgreSQL

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
(Add your testing framework as needed)

## Docker Commands

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Rebuild containers
docker-compose up -d --build

# Execute commands in containers
docker-compose exec backend npm run migrate:run
docker-compose exec backend npm run test
```

### Production
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

## License

MIT
