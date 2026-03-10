@echo off
setlocal
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open-stremio-with-server.ps1"
exit /b %errorlevel%
