@echo off
echo Starting Claim Navigator AI...
echo.

REM Change to the project directory
cd /d "%~dp0"

REM Start Python server in background
start /B python -m http.server 8000

REM Wait 2 seconds for server to start
timeout /t 2 /nobreak >nul

REM Open browser
start http://localhost:8000/START_HERE.html

echo.
echo Claim Navigator AI is now running!
echo Browser should open automatically.
echo.
echo To stop the server, close this window.
echo.
pause

