@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or later is required: https://nodejs.org/
  pause
  exit /b 1
)
echo Open http://127.0.0.1:46321 in your browser.
echo Keep this console open while using the manager. Ctrl+C stops the manager.
node "%~dp0scripts\controller.mjs"
pause
