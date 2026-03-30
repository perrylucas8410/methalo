@echo off
TITLE Methalo Browser - Bootloader
SETLOCAL EnableDelayedExpansion

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install it from https://nodejs.org/
    pause
    exit /b
)

echo ======================================================
echo           METHALO BROWSER - PREMIUM SETUP
echo ======================================================
echo.

:: Install Root Dependencies
if not exist "node_modules\" (
    echo [1/4] Installing backend dependencies...
    call npm install --silent
) else (
    echo [1/4] Backend dependencies already installed.
)

:: Setup Frontend
echo [2/4] Checking frontend status...
cd app
if not exist "node_modules\" (
    echo [3/4] Installing frontend dependencies...
    call npm install --silent
) else (
    echo [3/4] Frontend dependencies already installed.
)

if not exist "dist\" (
    echo [4/4] Building premium UI (this may take a minute)...
    call npm run build
) else (
    echo [4/4] Production build found.
)
cd ..

echo.
echo ======================================================
echo           STARTING METHALO PLATFORM...
echo ======================================================
echo.

:: Start the server
call npm start

pause
