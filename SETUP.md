# Setup Guide - Step by Step

Follow these steps to get your Fee Management System up and running:

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Set Up Environment Variables

### Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and ensure these values are set:
```env
NODE_ENV=development
PORT=3000

DB_HOST=postgres
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

**Note:** When using Docker Compose, `DB_HOST` should be `postgres` (the service name), not `localhost`.

### Frontend Environment (Optional)
Create `frontend/.env` if you need to override the API URL:
```env
VITE_API_URL=http://localhost:3000/api
```

## Step 3: Start Docker Services

From the root directory:

```bash
# Start PostgreSQL, Backend, and Frontend
docker-compose up -d

# Or start only PostgreSQL (if running backend/frontend locally)
cd backend
docker-compose up -d
```

## Step 4: Wait for Services to Start

Check if all services are running:
```bash
docker-compose ps
```

You should see all services with status "Up" or "healthy".

## Step 5: Run Database Migrations

If you have migrations set up, run them:

```bash
# Using Docker
docker-compose exec backend npm run migration:run

# Or locally (if backend is running locally)
cd backend
npm run migration:run
```

**Note:** For development, TypeORM will auto-sync the database schema if `synchronize: true` is set in the database config.

## Step 6: Verify Everything is Working

### Check Backend
- Open: http://localhost:3000/api
- Should see: Health check response
- Swagger Docs: http://localhost:3000/api-docs

### Check Frontend
- Open: http://localhost:5173
- Should see: Login page

### Check Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d fee_management

# List tables
\dt

# Exit
\q
```

## Step 7: Test Authentication

1. **Register a new user** via Swagger or API:
   ```bash
   POST http://localhost:3000/api/auth/register
   {
     "name": "Admin User",
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

2. **Login**:
   ```bash
   POST http://localhost:3000/api/auth/login
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

3. **Use the token** to access protected endpoints:
   ```bash
   GET http://localhost:3000/api/auth/me
   Authorization: Bearer <your-token>
   ```

## Common Issues & Solutions

### Issue: Backend can't connect to database
**Solution:** Make sure PostgreSQL container is running and healthy:
```bash
docker-compose ps
docker-compose logs postgres
```

### Issue: Port already in use
**Solution:** Stop the conflicting service or change ports in docker-compose.yml

### Issue: Frontend can't reach backend
**Solution:** Check CORS_ORIGIN in backend/.env matches frontend URL

### Issue: Database connection errors
**Solution:** 
- Verify DB_HOST is `postgres` (not `localhost`) when using Docker
- Check database credentials match docker-compose.yml
- Ensure PostgreSQL container is healthy

## Development Workflow

### Start Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose down
```

### Rebuild After Changes
```bash
docker-compose up -d --build
```

### Run Backend Locally (without Docker)
```bash
cd backend
npm run start:dev
```

### Run Frontend Locally (without Docker)
```bash
cd frontend
npm run dev
```

## Next Steps After Setup

1. ✅ Create additional entities (Students, Schools, FeeStructures, Payments)
2. ✅ Implement CRUD operations for each entity
3. ✅ Add role-based access control
4. ✅ Create React components for admin panels
5. ✅ Add form validation and error handling
6. ✅ Write unit and integration tests
7. ✅ Set up CI/CD pipeline

## Useful Commands

```bash
# Backend
cd backend
npm run start:dev      # Start with hot reload
npm run build          # Build for production
npm run lint           # Run ESLint
npm run format         # Format code
npm test               # Run tests

# Frontend
cd frontend
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint

# Docker
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services
docker-compose logs -f                  # View all logs
docker-compose exec backend bash        # Access backend container
docker-compose exec postgres psql -U postgres -d fee_management  # Access database
```

