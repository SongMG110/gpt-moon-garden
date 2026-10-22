@echo off
setlocal
cd /d "%~dp0"
set "MOON_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  set "MOON_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
echo Moon Garden - enable theme
echo If Codex is already running without debugging, use File - Quit first.
echo No running app will be stopped by this launcher.
"%MOON_NODE%" "%~dp0scripts\activate.mjs"
echo.
if errorlevel 1 echo Activation did not complete. The message above explains why.
pause
