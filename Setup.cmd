@echo off
setlocal
cd /d "%~dp0"
set "MOON_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "MOON_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
echo Configure Moon Garden for this Windows user.
echo A local on-demand manager task will be registered. Codex will not be stopped.
"%MOON_NODE%" "%~dp0scripts\setup.mjs"
echo.
pause
