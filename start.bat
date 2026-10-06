@echo off
setlocal
echo ==============================================
echo   LifeQR Development Server Launcher
echo ==============================================

set "PATH=C:\Program Files\nodejs;C:\Users\tarun\AppData\Local\Programs\nodejs;%PATH%"

echo Checking Node.js and NPM...
node -v
call npm -v

echo.
echo Starting LifeQR server in development mode...
call npm --prefix backend run dev
