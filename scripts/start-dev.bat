@echo off
title EBI Facturacion - Servidores de Desarrollo
color 0B
cls

echo ==========================================
echo    EBI FACTURACION ELECTRONICA
echo    Iniciando Servidores
echo ==========================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..
set "PROJECT_ROOT=%CD%"

echo [INFO] Directorio: %PROJECT_ROOT%
echo.

:: Verificar .env
echo [CHECK] Verificando configuracion...
if not exist "backend\.env" (
    echo [ERROR] No se encontro backend\.env
echo [ERROR] Ejecute primero: scripts\setup-windows.bat
    pause
    exit /b 1
)
echo [OK] Configuracion encontrada

:: Verificar node_modules
echo [CHECK] Verificando dependencias...
if not exist "backend\node_modules" (
    echo [ERROR] Dependencias del backend no instaladas.
    echo [ERROR] Ejecute primero: scripts\setup-windows.bat
    pause
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo [ERROR] Dependencias del frontend no instaladas.
    echo [ERROR] Ejecute primero: scripts\setup-windows.bat
    pause
    exit /b 1
)
echo [OK] Dependencias verificadas

echo.
echo [START] Iniciando Backend en puerto 5000...
start "EBI Backend :5000" cmd /k "cd /d %PROJECT_ROOT%\backend && npm run dev"

timeout /t 5 /nobreak >nul

echo [START] Iniciando Frontend en puerto 5173...
start "EBI Frontend :5173" cmd /k "cd /d %PROJECT_ROOT%\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo    SERVIDORES INICIADOS!
echo ==========================================
echo.
echo [URLs]
echo - Frontend:    http://localhost:5173
echo - Backend API: http://localhost:5000/api
echo - Health:      http://localhost:5000/api/health
echo.
echo [NOTA]
echo - Cierre esta ventana cuando termine
echo - Los servidores se ejecutan en ventanas separadas
echo - Presione Ctrl+C en cada ventana para detener
echo.
pause
