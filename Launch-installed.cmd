@echo off
setlocal
set "MOON_RUNTIME=%LOCALAPPDATA%\GPTMoonGarden\app"
if not exist "%MOON_RUNTIME%\Enable.cmd" (
  echo Run Setup.cmd or ask the Moon Garden plugin to configure this computer first.
  pause
  exit /b 1
)
call "%MOON_RUNTIME%\Enable.cmd"
