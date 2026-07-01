@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\allow-firewall-3080.ps1"
start "" "http://192.168.8.186:3080/"
npm start
