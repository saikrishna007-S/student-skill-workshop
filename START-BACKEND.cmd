@echo off
title Workshop API
cd /d "%~dp0"
echo.
echo === Workshop backend (port 4010) ===
echo Folder: %cd%
echo.

REM Add common Node.js install folders (double-click often has a shorter PATH)
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found.
  echo Install Node.js LTS from https://nodejs.org
  echo Then RESTART your PC or log out and back in so PATH updates.
  pause
  exit /b 1
)

echo Checking if the API is already running on port 4010...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4010/api/health' -UseBasicParsing -TimeoutSec 2; if ($r.Content.Contains('ok')) { exit 0 }; exit 1 } catch { exit 1 }"
if not errorlevel 1 (
  echo.
  echo *** The backend is ALREADY running on port 4010. ***
  echo You do NOT need to start it again.
  echo Open START-FRONTEND.cmd in the frontend folder and use the browser URL it shows.
  echo.
  echo To fully restart: close the other black window running "node server.js", then run this file again.
  echo If admin login still fails, you may be running an OLD server — close that window and start again.
  echo Default admin password: admin123
  echo.
  pause
  exit /b 0
)

echo Port is free. Installing dependencies...
call npm install
if errorlevel 1 (
  echo npm install failed. Check your internet connection and try again.
  pause
  exit /b 1
)
echo.
echo Starting server... KEEP THIS WINDOW OPEN while you use the website.
echo Test in browser: http://localhost:4010/api/health  (should show {"ok":true})
echo In the log below, look for: Admin password -- admin123
echo.
call npm start
echo.
echo Server stopped. If you saw "address already in use", port 4010 is taken:
echo   - Close any other black window running this backend, OR
echo   - In PowerShell run:  $env:PORT=4020; npm start
echo   - Then set vite proxy in the frontend to http://127.0.0.1:4020
echo.
pause
