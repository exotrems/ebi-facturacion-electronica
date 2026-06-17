@echo off
chcp 65001 >nul
title EBI Facturacion - Implementar Cambios (Editar Factura)
color 0A

echo ============================================
echo   EBI FACTURACION ELECTRONICA
echo   Implementacion de Cambios: Editar Factura
echo ============================================
echo.

set "PROJECT_DIR=%~dp0.."
cd /d "%PROJECT_DIR%"

echo [1/6] Verificando estructura del proyecto...
if not exist "frontend\src\pages" (
    echo ERROR: No se encontro la carpeta frontend\src\pages
    pause
    exit /b 1
)
if not exist "backend\src\controllers" (
    echo ERROR: No se encontro la carpeta backend\src\controllers
    pause
    exit /b 1
)

echo [2/6] Respaldando archivos originales...
if not exist "backup" mkdir backup
if exist "frontend\src\pages\Facturas.jsx" copy "frontend\src\pages\Facturas.jsx" "backup\Facturas.jsx.bak" >nul
if exist "frontend\src\App.jsx" copy "frontend\src\App.jsx" "backup\App.jsx.bak" >nul
if exist "backend\src\controllers\factura.controller.js" copy "backend\src\controllers\factura.controller.js" "backup\factura.controller.js.bak" >nul
echo        Archivos respaldados en carpeta backup
echo [3/6] Copiando archivos frontend...
copy "update\frontend\src\pages\Facturas.jsx" "frontend\src\pages\Facturas.jsx" >nul
copy "update\frontend\src\pages\EditarFactura.jsx" "frontend\src\pages\EditarFactura.jsx" >nul
copy "update\frontend\src\App.jsx" "frontend\src\App.jsx" >nul
echo        Frontend actualizado

echo [4/6] Copiando archivos backend...
copy "update\backend\src\controllers\factura.controller.js" "backend\src\controllers\factura.controller.js" >nul
echo        Backend actualizado

echo [5/6] Verificando integridad...
if not exist "frontend\src\pages\EditarFactura.jsx" (
    echo ERROR: No se pudo copiar EditarFactura.jsx
    pause
    exit /b 1
)
echo        Verificacion completada

echo [6/6] IMPORTANTE: Agregar metodo deleteByFacturaId
echo ============================================
echo   PASO MANUAL REQUERIDO
echo ============================================
echo.
echo Abra el archivo:
echo   backend\src\models\factura.model.js
echo.
echo Busque la clase FacturaFormaPagoModel y agregue
echo este metodo antes del cierre de la clase:
echo.
echo   static deleteByFacturaId(facturaId) {
echo     const db = getDatabase();
echo     return db.prepare('DELETE FROM factura_formas_pago WHERE factura_id = ?').run(facturaId);
echo   }
echo.
echo Presione cualquier tecla cuando haya completado este paso...
pause >nul

echo.
echo Recompilando frontend...
cd frontend
if exist "node_modules" (
    echo        Recompilando...
    npm run build 2>nul
    if errorlevel 1 (
        echo        ADVERTENCIA: Error en build, pero los archivos estan actualizados.
        echo        El frontend se recompilara automaticamente en modo desarrollo.
    ) else (
        echo        Build completado exitosamente
    )
) else (
    echo        node_modules no encontrado. Ejecute setup-windows.bat primero.
)
cd ..

echo.
echo ============================================
echo   IMPLEMENTACION COMPLETADA
echo ============================================
echo.
echo Cambios aplicados:
echo   FRONTEND:
echo     - Facturas.jsx: Boton EDITAR agregado
echo     - EditarFactura.jsx: Nueva pagina de edicion
echo     - App.jsx: Ruta /facturas/editar/:id agregada
echo   BACKEND:
echo     - factura.controller.js: Metodo actualizar corregido
echo       (maneja items y formas de pago con transacciones)
echo.
echo RECUERDE: Reiniciar el servidor backend (npm run dev o node server.js)
echo.
echo Para revertir cambios, restaure desde la carpeta backupecho.
pause
