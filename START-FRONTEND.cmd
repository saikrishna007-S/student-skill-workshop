@echo off
title Workshop Frontend
cd /d "%~dp0"
echo.
echo === Workshop frontend (Vite) ===
echo Folder: %cd%
echo.
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
echo Start the backend first: run START-BACKEND.cmd in the backend folder.
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node from https://nodejs.org then try again.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)
echo.
echo Starting dev server... open the Local URL shown below in your browser.
echo.
call npm run dev
pause
