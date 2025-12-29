# Quick Start Guide

Follow these commands in order to get your School ERP Platform running.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (optional, if you want to run backend/frontend locally)

## Option 1: Everything in Docker (Recommended) 🐳

### Step 1: Start Everything

```bash
docker-compose up -d
```

This single command starts:

- ✅ PostgreSQL database
- ✅ NestJS backend API
- ✅ React frontend

### Step 2: Wait for Services to Start

Check if everything is running:

```bash
docker-compose ps
```

You should see all 3 services with status "Up" or "healthy".

### Step 3: View Logs (Optional)

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Step 4: Access Your Application

Once containers are running, access:

- 🌐 **Frontend**: http://localhost:5173
  - Login page and user interface
  
- 🔌 **Backend API**: http://localhost:3000/api
  - REST API endpoints
  - Health check endpoint
  
- 📚 **Swagger Docs**: http://localhost:3000/api-docs
  - Interactive API documentation
  - Test endpoints directly
  
- 🗄️ **PostgreSQL**: localhost:5432
  - Database: fee_management
  - Username: postgres
  - Password: postgres

**See `URLS.md` for detailed URL information and first steps.**

### Step 5: Test the API

1. Open Swagger: http://localhost:3000/api-docs
2. Register a user: `POST /api/auth/register`
3. Login: `POST /api/auth/login`
4. Use the token to access protected endpoints

## Option 2: Database Only + Local Development

If you prefer to run backend/frontend locally:

### Step 1: Start Database Only

```bash
docker-compose -f docker-compose.db-only.yml up -d
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Set Up Backend Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env and set:
# DB_HOST=localhost (not 'postgres')
```

### Step 4: Start Backend

```bash
npm run start:dev
```

### Step 5: Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### Step 6: Start Frontend

```bash
npm run dev
```

## Common Commands

### Docker Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Check service status
docker-compose ps

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Backend Commands (if running locally)

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Frontend Commands (if running locally)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Troubleshooting

### Issue: Docker Desktop API Errors (500 Internal Server Error)

If you see errors like:

```
request returned 500 Internal Server Error
unable to get image 'fee-frontend'
```

**Quick Fix:**

1. **Restart Docker Desktop**

   - Right-click Docker icon in system tray → Quit Docker Desktop
   - Wait 10 seconds
   - Start Docker Desktop again
   - Wait for it to fully start (whale icon steady)

2. **Verify Docker is running**

   ```bash
   docker ps
   ```

3. **Try again**
   ```bash
   docker-compose up -d
   ```

**If still not working:**

- See `TROUBLESHOOTING.md` for detailed solutions
- Or use database-only setup: `docker-compose -f docker-compose.db-only.yml up -d`

### Issue: Port already in use

**Solution:**

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3000
lsof -i :5173

# Stop the conflicting service or change ports in docker-compose.yml
```

### Issue: Backend can't connect to database

**Solution:**

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Ensure DB_HOST=postgres (not localhost) when using Docker
```

### Issue: Services won't start

**Solution:**

```bash
# Stop everything
docker-compose down

# Remove volumes (WARNING: deletes database data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

### Issue: Frontend can't reach backend

**Solution:**

- Check CORS_ORIGIN in backend environment matches frontend URL
- Ensure backend is running: `docker-compose ps backend`
- Check backend logs: `docker-compose logs backend`

## Next Steps

1. ✅ Access Swagger docs: http://localhost:3000/api-docs
2. ✅ Register a test user
3. ✅ Login and get JWT token
4. ✅ Test protected endpoints
5. ✅ Start building your features!

## Need Help?

- Check logs: `docker-compose logs -f`
- Check service status: `docker-compose ps`
- View Docker documentation: See `DOCKER.md`
