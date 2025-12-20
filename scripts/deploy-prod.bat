@echo off
REM Production Deployment Script for Aetheron Platform (Windows)

echo 🚀 Aetheron Production Deployment
echo ==================================

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found!
    echo Please copy .env.example to .env and configure your environment variables
    exit /b 1
)

echo ✓ Environment variables loaded

REM Run tests
echo.
echo 🧪 Running test suite...
call npm test
if errorlevel 1 (
    echo ❌ Tests failed! Please fix before deploying
    exit /b 1
)

echo ✓ All tests passed

REM Run linter
echo.
echo 🔍 Running code quality checks...
call npm run lint
if errorlevel 1 (
    echo ⚠️  Linting errors detected. Running auto-fix...
    call npm run lint:fix
)

echo ✓ Code quality checks passed

REM Build Docker image
echo.
echo 🐳 Building Docker image...
docker-compose -f docker-compose.prod.yml build

REM Start services
echo.
echo 🚢 Starting services...
docker-compose -f docker-compose.prod.yml up -d

REM Wait for services to be healthy
echo.
echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak > nul

REM Check health
curl -s -o nul -w "%%{http_code}" http://localhost:3001/health > health.tmp
set /p HEALTH_CHECK=<health.tmp
del health.tmp

if "%HEALTH_CHECK%"=="200" (
    echo ✅ Deployment successful!
    echo.
    echo Services running at:
    echo   • Application: http://localhost:3001
    echo   • MongoDB: localhost:27017
    echo   • Redis: localhost:6379
    echo.
    echo To view logs: docker-compose -f docker-compose.prod.yml logs -f
    echo To stop: docker-compose -f docker-compose.prod.yml down
) else (
    echo ❌ Health check failed!
    echo Check logs: docker-compose -f docker-compose.prod.yml logs
    exit /b 1
)
