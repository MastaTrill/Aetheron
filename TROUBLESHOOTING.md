# Aetheron Troubleshooting Guide

This guide helps you resolve common issues when running Aetheron.

## Table of Contents
- [Server Startup Issues](#server-startup-issues)
- [Database Connection Issues](#database-connection-issues)
- [Admin Dashboard Issues](#admin-dashboard-issues)
- [WebSocket Connection Issues](#websocket-connection-issues)
- [Installation Issues](#installation-issues)
- [Port Conflicts](#port-conflicts)

---

## Server Startup Issues

### Error: `ReferenceError: path is not defined`

**Cause:** The `path` module is not imported in `server.js`.

**Solution:**
1. Open `server.js`
2. Ensure these lines are at the top:
```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');
```

### Error: `require is not defined in ES module scope`

**Cause:** `package.json` has `"type": "module"` but the code uses CommonJS syntax.

**Solution:**
1. Open `package.json`
2. Remove the line `"type": "module"` (should be near the end of the file)
3. Save and restart the server

### Error: Startup validation failed - Missing required modules

**Cause:** Not all dependencies are installed.

**Solution:**
```bash
npm install --legacy-peer-deps
npm start
```

---

## Database Connection Issues

### Error: `Database connection failed`

**Cause:** Database credentials or configuration is incorrect.

**Solution:**
1. Check your `.env` file for database credentials
2. Ensure the database server is running
3. Verify connection string format:
```env
DATABASE_URL=postgres://user:password@localhost:5432/aetheron
```

### Error: `SQLite: Unable to open database file`

**Cause:** SQLite database file doesn't exist or lacks permissions.

**Solution:**
```bash
# Create the database directory if it doesn't exist
mkdir -p database/data
chmod 755 database/data
npm start
```

---

## Admin Dashboard Issues

### Admin Dashboard Not Loading

**Cause:** Server not running or incorrect URL.

**Solution:**
1. Ensure server is running: `npm start`
2. Access dashboard at: `http://localhost:3001`
3. Check browser console for errors (F12)

### Login Fails with Correct Credentials

**Cause:** Admin credentials not set or incorrect.

**Solution:**
1. Check your `.env` file:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```
2. If no `.env` file exists, create one based on `.env.example`
3. Restart the server after changing credentials

### Forms Not Submitting

**Cause:** JavaScript errors or server endpoint issues.

**Solution:**
1. Open browser console (F12) and check for errors
2. Verify server is responding: `curl http://localhost:3001/api/health`
3. Check network tab for failed requests
4. Ensure you're logged in (check for auth headers)

---

## WebSocket Connection Issues

### WebSocket Shows "Disconnected" Status

**Cause:** WebSocket server not running or connection failed.

**Solution:**
1. Check server logs for WebSocket errors
2. Verify WebSocket URL matches server URL
3. Check firewall settings
4. Try accessing WebSocket endpoint directly:
```bash
# Install wscat if needed: npm install -g wscat
wscat -c ws://localhost:3001
```

### WebSocket Repeatedly Reconnecting

**Cause:** Network issues or server overload.

**Solution:**
1. Check server logs for errors
2. Verify server has enough resources (CPU, memory)
3. Check network connectivity
4. Restart the server:
```bash
npm start
```

---

## Installation Issues

### Error: `npm install` fails with peer dependency conflicts

**Cause:** Conflicting dependency versions.

**Solution:**
```bash
npm install --legacy-peer-deps
```

### Error: Package not found or version mismatch

**Cause:** Corrupt npm cache or lock file.

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install --legacy-peer-deps
```

### Error: EACCES permission denied

**Cause:** Insufficient permissions to install packages.

**Solution:**
```bash
# Option 1: Use sudo (not recommended)
sudo npm install --legacy-peer-deps

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install --legacy-peer-deps
```

---

## Port Conflicts

### Error: `EADDRINUSE: address already in use :::3001`

**Cause:** Another process is using port 3001.

**Solution:**

**Option 1: Find and stop the process**
```bash
# Find process using port 3001
lsof -ti:3001

# Kill the process (replace PID with actual process ID)
kill <PID>

# Or forcefully kill if needed
kill -9 <PID>
```

**Option 2: Use a different port**
```bash
PORT=3002 npm start
```

**Option 3: Add to `.env` file**
```env
PORT=3002
```

---

## Common Error Messages

### JSON.parse errors in package.json

**Cause:** Syntax error in `package.json` (missing comma, duplicate keys, etc.).

**Solution:**
1. Validate JSON syntax at https://jsonlint.com/
2. Check for:
   - Missing commas between properties
   - Duplicate property keys
   - Trailing commas (not allowed in JSON)
3. Fix the errors and save the file

### Module not found errors

**Cause:** Missing dependencies or incorrect import paths.

**Solution:**
```bash
# Reinstall dependencies
npm install --legacy-peer-deps

# If still failing, check import paths in error message
# Ensure the file exists and path is correct
```

---

## Testing Your Setup

After resolving issues, test your setup:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start server
npm start

# 3. In another terminal, test health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {"success":true,"status":"healthy","timestamp":"...","uptime":...,"environment":"development"}

# 4. Open browser and access dashboard
# http://localhost:3001

# 5. Login with credentials (default: admin / admin123)
```

---

## Getting Help

If you're still experiencing issues:

1. **Check Server Logs:** Look for error messages in the terminal
2. **Check Browser Console:** Open Developer Tools (F12) and check Console tab
3. **Enable Debug Mode:** Set `NODE_ENV=development` in `.env`
4. **Check Dependencies:** Run `npm list` to see installed packages
5. **Verify Node Version:** Run `node --version` (recommended: Node 18 or later)

### Useful Debugging Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list --depth=0

# Check for security vulnerabilities
npm audit

# View server environment
node -e "console.log(process.env)" | grep -E "(PORT|NODE_ENV|ADMIN)"

# Test database connection
node -e "const {sequelize} = require('./database/models'); sequelize.authenticate().then(() => console.log('Database OK')).catch(e => console.error('Database Error:', e.message))"
```

---

## Emergency Reset

If nothing works, try a complete reset:

```bash
# 1. Backup your .env file
cp .env .env.backup

# 2. Clean everything
rm -rf node_modules package-lock.json
npm cache clean --force

# 3. Reinstall
npm install --legacy-peer-deps

# 4. Restore .env
cp .env.backup .env

# 5. Start fresh
npm start
```

---

## Production Considerations

### Security Warnings

**⚠️ WARNING: Using default admin password in production!**

**Solution:**
```bash
# Set secure password in .env
ADMIN_PASSWORD=your_very_secure_password_here

# Or use environment variable
export ADMIN_PASSWORD=your_very_secure_password_here
npm start
```

### Performance Issues

**Symptoms:** Slow response times, high CPU usage

**Solutions:**
1. Enable production mode:
```env
NODE_ENV=production
```

2. Adjust rate limits in `.env`:
```env
RATE_LIMIT_WINDOW=60000
MAX_REQUESTS=100
```

3. Use a process manager:
```bash
npm install -g pm2
pm2 start server.js --name aetheron
pm2 logs aetheron
```

---

## Additional Resources

- **Main Documentation:** [README.md](./README.md)
- **API Documentation:** [API_DOCS.md](./API_DOCS.md)
- **Security Guide:** [SECURITY.md](./SECURITY.md)
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Last Updated:** 2026-01-03
