# Debugging Backend/API Issues

## Quick Diagnostic Commands

### 1. Check if Backend Container is Running

```bash
docker-compose ps
```

Look for `fee_management_backend` - should show "Up" status.

### 2. Check Backend Logs

```bash
# View all backend logs
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

**Common issues to look for:**
- Database connection errors
- Port binding errors
- Missing environment variables
- TypeORM connection issues

### 3. Check if Backend is Accessible

```bash
# Test health endpoint
curl http://localhost:3000/api

# Or test from browser
# Open: http://localhost:3000/api
```

### 4. Check Database Connection

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection from backend container
docker-compose exec backend sh -c "nc -zv postgres 5432"
```

### 5. Check Port Conflicts

```bash
# Windows - Check if port 3000 is in use
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

## Common Issues & Solutions

### Issue 1: Backend Container Not Starting

**Symptoms:**
- `docker-compose ps` shows backend as "Exited" or "Restarting"
- No response on http://localhost:3000/api

**Solution:**
```bash
# Check logs
docker-compose logs backend

# Common causes:
# 1. Database not ready - wait for postgres health check
# 2. Missing .env file - check backend/.env exists
# 3. Port conflict - check if port 3000 is already in use
```

### Issue 2: Database Connection Error

**Symptoms:**
- Logs show: "Error: connect ECONNREFUSED" or "Connection refused"
- TypeORM connection errors

**Solution:**
```bash
# 1. Ensure PostgreSQL is healthy
docker-compose ps postgres

# 2. Check DB_HOST in backend environment
docker-compose exec backend env | grep DB_HOST
# Should show: DB_HOST=postgres (not localhost)

# 3. Test database connection
docker-compose exec postgres psql -U postgres -d fee_management -c "SELECT 1;"
```

### Issue 3: Port Already in Use

**Symptoms:**
- Error: "bind: address already in use"
- Backend container exits immediately

**Solution:**
```bash
# Find what's using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3000
kill -9 <PID>

# Or change port in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Issue 4: Environment Variables Missing

**Symptoms:**
- Backend starts but crashes
- Database connection fails

**Solution:**
```bash
# Check if .env file exists
ls backend/.env

# If not, create it
cd backend
cp .env.example .env

# Verify environment variables in container
docker-compose exec backend env | grep DB_
```

### Issue 5: TypeORM Synchronization Issues

**Symptoms:**
- Database schema errors
- Entity not found errors

**Solution:**
```bash
# Check database config
docker-compose exec backend cat src/database/database.config.ts

# For development, ensure synchronize: true
# Check backend/.env has NODE_ENV=development
```

## Step-by-Step Debugging

### Step 1: Verify All Containers

```bash
docker-compose ps
```

Expected output:
```
NAME                      STATUS
fee_management_db         Up (healthy)
fee_management_backend    Up
fee_management_frontend   Up
```

### Step 2: Check Backend Logs

```bash
docker-compose logs backend
```

Look for:
- ✅ "Application is running on: http://localhost:3000"
- ✅ "Connected to PostgreSQL database"
- ❌ Any ERROR messages
- ❌ Connection refused errors

### Step 3: Test Backend Health

```bash
# From terminal
curl http://localhost:3000/api

# Or from browser
# Open: http://localhost:3000/api
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "School ERP Platform API"
}
```

### Step 4: Check Database Connection

```bash
# Test PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Should return: postgres:5432 - accepting connections

# Test from backend container
docker-compose exec backend sh
# Inside container:
nc -zv postgres 5432
# Should show: postgres (172.x.x.x:5432) open
```

### Step 5: Restart Services

```bash
# Restart backend only
docker-compose restart backend

# Or restart everything
docker-compose restart

# Or rebuild and restart
docker-compose up -d --build backend
```

## Advanced Debugging

### Access Backend Container Shell

```bash
docker-compose exec backend sh

# Inside container:
# Check Node.js version
node --version

# Check if app is running
ps aux | grep node

# Check environment variables
env | grep DB_

# Test database connection manually
npm run start:dev
```

### Check Network Connectivity

```bash
# From backend container, ping postgres
docker-compose exec backend ping postgres

# Check if backend can reach postgres on port 5432
docker-compose exec backend nc -zv postgres 5432
```

### View Real-time Logs

```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Backend and postgres
docker-compose logs -f backend postgres
```

## Quick Fixes

### Fix 1: Rebuild Backend

```bash
docker-compose up -d --build backend
```

### Fix 2: Reset Everything

```bash
# Stop all
docker-compose down

# Remove volumes (WARNING: deletes database)
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Fix 3: Check Backend Environment

```bash
# View backend environment variables
docker-compose exec backend env

# Should see:
# DB_HOST=postgres
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# DB_DATABASE=fee_management
```

## Still Not Working?

1. **Share the logs:**
   ```bash
   docker-compose logs backend > backend-logs.txt
   ```

2. **Check Docker Desktop:**
   - Ensure Docker Desktop is running
   - Check Docker Desktop logs

3. **Try database-only setup:**
   ```bash
   docker-compose -f docker-compose.db-only.yml up -d
   cd backend
   npm install
   npm run start:dev
   ```

