# Troubleshooting Docker Issues

## Docker Desktop API Errors (500 Internal Server Error)

If you see errors like:
```
request returned 500 Internal Server Error for API route
unable to get image 'fee-frontend'
```

This usually means Docker Desktop is not running properly.

### Solution 1: Restart Docker Desktop

1. **Close Docker Desktop completely**
   - Right-click Docker icon in system tray
   - Click "Quit Docker Desktop"
   - Wait for it to fully close

2. **Restart Docker Desktop**
   - Open Docker Desktop from Start Menu
   - Wait for it to fully start (whale icon should be steady, not animating)

3. **Verify Docker is running**
   ```bash
   docker ps
   ```
   Should return empty list or running containers (not an error)

4. **Try again**
   ```bash
   docker-compose up -d
   ```

### Solution 2: Reset Docker Desktop

If restart doesn't work:

1. **Open Docker Desktop Settings**
   - Click gear icon (⚙️) in Docker Desktop

2. **Troubleshoot → Reset to factory defaults**
   - This will reset Docker Desktop but keep your images/containers

3. **Or use WSL2 backend** (if on Windows)
   - Settings → General → Use WSL 2 based engine (check this)
   - Apply & Restart

### Solution 3: Check Docker Desktop Status

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Check if Docker daemon is running
docker info
```

If `docker info` fails, Docker Desktop is not running properly.

### Solution 4: Clean Up and Rebuild

```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove unused images
docker image prune -a

# Try again
docker-compose up -d --build
```

### Solution 5: Check Windows/WSL2 Integration

If using WSL2:

1. **Ensure WSL2 is installed**
   ```bash
   wsl --list --verbose
   ```

2. **Update WSL2**
   ```bash
   wsl --update
   ```

3. **In Docker Desktop Settings**
   - Settings → Resources → WSL Integration
   - Enable integration with your WSL distro
   - Apply & Restart

### Solution 6: Use Docker CLI Directly

If Docker Desktop GUI is problematic:

```bash
# Start Docker daemon manually (if possible)
# Or use Docker CLI commands directly

# Build images manually
cd backend
docker build -f Dockerfile.dev -t fee-management-backend:dev .

cd ../frontend
docker build -f Dockerfile.dev -t fee-management-frontend:dev .
```

### Solution 7: Alternative - Run Without Docker

If Docker continues to have issues, run database only:

```bash
# Start only PostgreSQL
docker-compose -f docker-compose.db-only.yml up -d

# Run backend locally
cd backend
npm install
npm run start:dev

# Run frontend locally (new terminal)
cd frontend
npm install
npm run dev
```

## Common Error Messages

### "unable to get image"
- **Cause**: Docker Desktop not running or API not accessible
- **Fix**: Restart Docker Desktop

### "500 Internal Server Error"
- **Cause**: Docker Desktop daemon issue
- **Fix**: Restart Docker Desktop or reset to factory defaults

### "Cannot connect to Docker daemon"
- **Cause**: Docker Desktop not started
- **Fix**: Start Docker Desktop application

### Port already in use
- **Cause**: Another service using the port
- **Fix**: 
  ```bash
  # Windows - find process using port
  netstat -ano | findstr :3000
  netstat -ano | findstr :5173
  
  # Kill the process (replace PID with actual process ID)
  taskkill /PID <PID> /F
  ```

## Still Having Issues?

1. **Check Docker Desktop logs**
   - Docker Desktop → Troubleshoot → View logs

2. **Check Windows Event Viewer**
   - Look for Docker-related errors

3. **Reinstall Docker Desktop**
   - Download latest from docker.com
   - Uninstall current version
   - Install fresh copy

4. **Check system requirements**
   - Windows 10/11 64-bit
   - WSL2 enabled (if using WSL2 backend)
   - Virtualization enabled in BIOS

## Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Check Docker is running
docker ps

# 2. Check Docker Compose works
docker-compose --version

# 3. Test with a simple container
docker run hello-world

# 4. If all above work, try your project
docker-compose up -d
```

