@echo off
title EBI Facturacion - Build Produccion
color 0E
cls

echo ==========================================
echo    EBI FACTURACION ELECTRONICA
echo    Build para Produccion
echo ==========================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..
set "PROJECT_ROOT=%CD%"

echo [INFO] Directorio: %PROJECT_ROOT%
echo.

:: Build backend
echo [1/3] Verificando backend...
cd backend
if not exist "node_modules" (
    echo [ERROR] Dependencias no instaladas. Ejecute setup-windows.bat primero.
    pause
    exit /b 1
)
echo [OK] Backend listo
cd "%PROJECT_ROOT%"

:: Build frontend
echo [2/3] Compilando frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo [ERROR] Fallo el build del frontend.
    pause
    exit /b 1
)
echo [OK] Frontend compilado
cd "%PROJECT_ROOT%"

:: Copiar dist al backend para servir estaticos
echo [3/3] Copiando archivos estaticos...
if exist "backend\dist" rmdir /s /q "backend\dist"
xcopy /s /i /y "frontend\dist" "backend\dist" >nul
echo [OK] Archivos copiados

echo.
echo ==========================================
echo    BUILD COMPLETADO!
echo ==========================================
echo.
echo Para ejecutar en produccion:
echo   cd backend
echo   set NODE_ENV=production
echo   npm start
echo.
echo El backend servira el frontend desde /dist
echo.
pause
