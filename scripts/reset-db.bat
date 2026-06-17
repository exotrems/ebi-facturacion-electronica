@echo off
title EBI Facturacion - Reset Base de Datos
color 0C
cls

echo ==========================================
echo    EBI FACTURACION ELECTRONICA
echo    REINICIO DE BASE DE DATOS
echo ==========================================
echo.
echo [ADVERTENCIA] ESTO ELIMINARA TODOS LOS DATOS!
echo.
choice /C SN /M "Esta seguro de continuar"
if errorlevel 2 exit /b 0

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..

echo.
echo [1/2] Eliminando base de datos...
if exist "backend\data\ebi_facturacion.db" (
    del /f /q "backend\data\ebi_facturacion.db"
    echo [OK] Base de datos eliminada
) else (
    echo [INFO] No existe base de datos previa
)

echo [2/2] Reinicializando...
cd backend
call npm run db:init
echo [OK] Base de datos reinicializada
cd ..

echo.
echo ==========================================
echo    BASE DE DATOS REINICIADA
echo ==========================================
echo.
pause
