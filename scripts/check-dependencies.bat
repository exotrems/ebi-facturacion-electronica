@echo off
title EBI Facturacion - Verificacion de Dependencias
color 0A
cls

echo ==========================================
echo    EBI FACTURACION ELECTRONICA
echo    Verificacion de Dependencias
echo ==========================================
echo.

echo [NODE.JS]
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js: NO INSTALADO
echo     Descargar: https://nodejs.org/
) else (
    for /f "tokens=*" %%a in ('node --version') do echo [OK] Node.js: %%a
)

echo.
echo [NPM]
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm: NO DISPONIBLE
) else (
    for /f "tokens=*" %%a in ('npm --version') do echo [OK] npm: %%a
)

echo.
echo [DEPENDENCIAS BACKEND]
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..ackend
if exist "node_modules" (
    echo [OK] node_modules: INSTALADO
    for /f "tokens=*" %%a in ('dir /b node_modules ^| find /c /v ""') do echo     Paquetes: %%a
) else (
    echo [X] node_modules: NO INSTALADO
    echo     Ejecutar: scripts\setup-windows.bat
)

echo.
echo [DEPENDENCIAS FRONTEND]
cd ..rontend
if exist "node_modules" (
    echo [OK] node_modules: INSTALADO
    for /f "tokens=*" %%a in ('dir /b node_modules ^| find /c /v ""') do echo     Paquetes: %%a
) else (
    echo [X] node_modules: NO INSTALADO
    echo     Ejecutar: scripts\setup-windows.bat
)

echo.
echo [BASE DE DATOS]
cd ..ackend
if exist "data\ebi_facturacion.db" (
    echo [OK] Base de datos: EXISTE
) else (
    echo [INFO] Base de datos: NO EXISTE (se creara al iniciar)
)

echo.
echo [CONFIGURACION]
if exist ".env" (
    echo [OK] Archivo .env: EXISTE
    findstr /B "TOKEN_EMPRESA=" .env >nul 2>&1
    if errorlevel 1 (
        echo [X] TOKEN_EMPRESA: NO CONFIGURADO
    ) else (
        echo [OK] TOKEN_EMPRESA: CONFIGURADO
    )
) else (
    echo [X] Archivo .env: NO EXISTE
)

echo.
echo ==========================================
pause
