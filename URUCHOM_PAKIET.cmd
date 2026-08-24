@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Brak Node.js. Zainstaluj Node.js LTS i uruchom ten plik ponownie.
  pause
  exit /b 1
)

start "Magazyn GibLab - serwer" cmd /k "cd /d ""%~dp0"" && node server.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:3080"
