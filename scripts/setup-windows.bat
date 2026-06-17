@echo off
chcp 65001 >nul
title EBI Facturacion Electronica - Instalador
color 0A
cls

echo ==========================================
echo    EBI FACTURACION ELECTRONICA
echo    Instalador Automatico Windows
echo    Node.js 22+ Requerido
echo ==========================================
echo.

:: Obtener directorio del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
cd ..
set "PROJECT_ROOT=%CD%"

echo [INFO] Directorio del proyecto: %PROJECT_ROOT%
echo.

:: ==========================================
:: PASO 1: Verificar Node.js
:: ==========================================
echo [1/7] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado.
    echo.
    echo Por favor instale Node.js 22.x o superior desde:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo [OK] Node.js %NODE_VERSION%

:: ==========================================
:: PASO 2: Verificar version minima (v22+)
:: ==========================================
echo [2/7] Verificando version minima de Node.js...
node -e "const m=process.version.match(/v(\d+)/); if(!m||m[1]<22){process.exit(1)}" >nul 2>&1
if errorlevel 1 (
    echo [ADVERTENCIA] Se recomienda Node.js 22 o superior.
    echo Version actual: %NODE_VERSION%
    echo.
    choice /C SN /M "Desea continuar de todos modos"
    if errorlevel 2 (
        echo Instalacion cancelada por el usuario.
        pause
        exit /b 1
    )
) else (
    echo [OK] Version compatible
)



:: ==========================================
:: PASO 4: Crear estructura de directorios
:: ==========================================
echo [4/7] Creando estructura de directorios...
cd /d "%PROJECT_ROOT%"
if not exist "backend\data" mkdir "backend\data"
if not exist "backend\logs" mkdir "backend\logs"
if not exist "frontend\dist" mkdir "frontend\dist"
echo [OK] Directorios creados

:: ==========================================
:: PASO 5: Crear archivo .env si no existe
:: ==========================================
echo [5/7] Verificando configuracion...
if not exist "backend\.env" (
    echo [INFO] Creando archivo .env de ejemplo...
    (
        echo # Configuracion del Servidor
        echo PORT=5000
        echo NODE_ENV=development
        echo FRONTEND_URL=http://localhost:5173
        echo.
        echo # Configuracion Base de Datos
        echo DB_PATH=./data/ebi_facturacion.db
        echo.
        echo # Configuracion EBI PAC - REEMPLACE CON SUS CREDENCIALES
        echo EBI_WSDL_URL=https://test.ebi-pac.com/Service.svc?wsdl
        echo TOKEN_EMPRESA=SU_TOKEN_EMPRESA_AQUI
        echo TOKEN_PASSWORD=SU_TOKEN_PASSWORD_AQUI
        echo.
        echo # Configuracion de Logs
        echo LOG_LEVEL=info
    ) > "backend\.env"
    echo [OK] Archivo .env creado.
    echo [IMPORTANTE] EDITAR backend\.env con sus credenciales de EBI antes de usar.
) else (
    echo [OK] Archivo .env ya existe
)

:: ==========================================
:: PASO 6: Instalar dependencias del backend
:: ==========================================
echo [6/7] Instalando dependencias del backend...
cd /d "%PROJECT_ROOT%\backend"

echo   - Ejecutando: npm install
npm install 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Fallo la instalacion del backend.
    echo Intente manualmente: cd backend ^&^& npm install
    pause
    exit /b 1
)
echo [OK] Backend instalado correctamente

:: Inicializar base de datos
echo   - Inicializando base de datos...
npm run db:init 2>&1
if errorlevel 1 (
    echo [ADVERTENCIA] No se pudo inicializar la base de datos automaticamente.
    echo Se inicializara al iniciar el servidor.
)

:: ==========================================
:: PASO 7: Instalar dependencias del frontend
:: ==========================================
echo [7/7] Instalando dependencias del frontend...
cd /d "%PROJECT_ROOT%\frontend"

echo   - Ejecutando: npm install
npm install 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Fallo la instalacion del frontend.
    echo Intente manualmente: cd frontend ^&^& npm install
    pause
    exit /b 1
)
echo [OK] Frontend instalado correctamente

:: ==========================================
:: RESUMEN FINAL
:: ==========================================
cd /d "%PROJECT_ROOT%"
echo.
echo ==========================================
echo    INSTALACION COMPLETADA EXITOSAMENTE!
echo ==========================================
echo.
echo [RESUMEN]
echo - Node.js: %NODE_VERSION%
echo - npm: %NPM_VERSION%
echo - Proyecto: %PROJECT_ROOT%
echo.
echo [IMPORTANTE]
echo 1. Edite el archivo: backend\.env
echo 2. Configure TOKEN_EMPRESA y TOKEN_PASSWORD
echo 3. Obtenga credenciales en: https://ebi-pac.com
echo.
echo [INICIAR PROYECTO]
echo Opcion 1 - Ejecutar: scripts\start-dev.bat
echo Opcion 2 - Manual:
echo   Terminal 1: cd backend ^&^& npm run dev
echo   Terminal 2: cd frontend ^&^& npm run dev
echo.
echo [ACCESO]
echo Frontend:    http://localhost:5173
echo Backend API: http://localhost:5000/api
echo API Health:  http://localhost:5000/api/health
echo.
echo Presione cualquier tecla para salir...
pause >nul
