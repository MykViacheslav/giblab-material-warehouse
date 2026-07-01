@echo off
set SERVER_URL=http://192.168.8.186:3080/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-warehouse-client.ps1" %SERVER_URL%
