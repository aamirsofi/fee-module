# Application URLs

Once `docker-compose up -d` completes, access your application at these URLs:

## 🌐 Frontend (React App)
**URL:** http://localhost:5173

- Login page
- User interface
- Main application

## 🔌 Backend API (NestJS)
**URL:** http://localhost:3000/api

- REST API endpoints
- Health check: http://localhost:3000/api
- All API routes are prefixed with `/api`

## 📚 Swagger API Documentation
**URL:** http://localhost:3000/api-docs

- Interactive API documentation
- Test endpoints directly
- View all available routes
- Login with JWT token here

## 🗄️ PostgreSQL Database
**Host:** localhost  
**Port:** 5432  
**Database:** fee_management  
**Username:** postgres  
**Password:** postgres

### Connect via psql:
```bash
docker-compose exec postgres psql -U postgres -d fee_management
```

### Connect via GUI (pgAdmin, DBeaver, etc.):
- Host: localhost
- Port: 5432
- Database: fee_management
- Username: postgres
- Password: postgres

## Quick Test

### 1. Check if services are running:
```bash
docker-compose ps
```

You should see:
- `fee_management_db` (postgres) - Up
- `fee_management_backend` (backend) - Up
- `fee_management_frontend` (frontend) - Up

### 2. Test Backend Health:
Open in browser: http://localhost:3000/api

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "School ERP Platform API",
  "version": "1.0.0"
}
```

### 3. Test Frontend:
Open in browser: http://localhost:5173

Should show the login page.

### 4. Test Swagger:
Open in browser: http://localhost:3000/api-docs

Should show interactive API documentation.

## First Steps After Starting

1. **Open Swagger Docs:** http://localhost:3000/api-docs
2. **Register a user:**
   - Click `POST /api/auth/register`
   - Click "Try it out"
   - Enter user data:
     ```json
     {
       "name": "Admin User",
       "email": "admin@example.com",
       "password": "password123"
     }
     ```
   - Click "Execute"

3. **Login:**
   - Click `POST /api/auth/login`
   - Click "Try it out"
   - Enter credentials:
     ```json
     {
       "email": "admin@example.com",
       "password": "password123"
     }
     ```
   - Click "Execute"
   - Copy the `access_token` from response

4. **Use the token:**
   - Click "Authorize" button at top of Swagger page
   - Enter: `Bearer <your-access-token>`
   - Now you can test protected endpoints

5. **Access Frontend:**
   - Open: http://localhost:5173
   - Login with the same credentials

## Troubleshooting URLs

### If Frontend (5173) doesn't load:
```bash
docker-compose logs frontend
```

### If Backend (3000) doesn't load:
```bash
docker-compose logs backend
```

### If Database (5432) connection fails:
```bash
docker-compose logs postgres
docker-compose ps postgres
```

### Check if ports are in use:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :5432

# Linux/Mac
lsof -i :3000
lsof -i :5173
lsof -i :5432
```

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 3000 | http://localhost:3000/api |
| Swagger Docs | 3000 | http://localhost:3000/api-docs |
| PostgreSQL | 5432 | localhost:5432 |

## Changing Ports

If you need to change ports, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "3001:3000"  # Change 3001 to your desired port
      
  frontend:
    ports:
      - "5174:5173"  # Change 5174 to your desired port
      
  postgres:
    ports:
      - "5433:5432"  # Change 5433 to your desired port
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

