@echo off
REM ============================================================
REM  Quick launcher for setup.ps1 (double-click friendly)
REM ============================================================
echo.
echo  Starting DApp Certificate Verification setup...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
pause
