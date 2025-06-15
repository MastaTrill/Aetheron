@echo off
echo Starting Aetheron Admin Dashboard...
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting server...
echo.
echo ========================================
echo   Aetheron Admin Dashboard Server
echo ========================================
echo.
echo Dashboard URL: http://localhost:3000
echo Login: admin / admin123
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.
call npm start
