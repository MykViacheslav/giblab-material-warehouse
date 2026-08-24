@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-warehouse-client.ps1" "http://192.168.8.186:3080/?station=CNC"
