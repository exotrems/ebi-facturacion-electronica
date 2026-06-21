# 🚀 Corrección EBI PAC - Implementación Inmediata

## Archivos Incluidos

### Backend (Node.js)
| Archivo | Descripción |
|---------|-------------|
| `backend/src/xml/generator.js` | **Generador XML condicional** - Omite nodos según tipoClienteFE |
| `backend/src/services/facturaService.js` | **Servicio con validaciones cruzadas** EBI |
| `backend/src/controllers/facturaController.js` | **Controlador** con manejo de errores de validación |
| `backend/src/database/migrations.js` | **Migraciones** - Agrega campos faltantes y catálogos |

### Frontend (React)
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/components/ClienteForm.jsx` | **Formulario dinámico de cliente** - Muestra/oculta campos según tipoClienteFE |
| `frontend/src/components/DatosExportacionForm.jsx` | **Formulario de exportación** - INCOTERMS, monedas ISO 4217 |
| `frontend/src/pages/NuevaFactura.jsx` | **Página completa** con lógica condicional por tipo de documento |
| `frontend/src/services/api.js` | **Servicio API** para comunicación con backend |

---

## ⚡ Pasos de Implementación

### 1. Backup
```bash
cd tu-proyecto
copy backend\src\xml\generator.js backup-generator.js
copy backend\src\services\facturaService.js backup-service.js
```

### 2. Copiar archivos del backend
```bash
copy ebi-correccion\backend\src\xml\generator.js backend\src\xml\generator.js
copy ebi-correccion\backend\src\services\facturaService.js backend\src\services\facturaService.js
copy ebi-correccion\backend\src\controllers\facturaController.js backend\src\controllers\facturaController.js
copy ebi-correccion\backend\src\database\migrations.js backend\src\database\migrations.js
```

### 3. Copiar archivos del frontend
```bash
copy ebi-correccion\frontend\src\components\ClienteForm.jsx frontend\src\components\ClienteForm.jsx
copy ebi-correccion\frontend\src\components\DatosExportacionForm.jsx frontend\src\components\DatosExportacionForm.jsx
copy ebi-correccion\frontend\src\pages\NuevaFactura.jsx frontend\src\pages\NuevaFactura.jsx
copy ebi-correccion\frontend\src\services\api.js frontend\src\services\api.js
```

### 4. Ejecutar migraciones de base de datos
```bash
cd backend
node src/database/migrations.js
```

Esto creará:
- Campos faltantes en `facturas` (condiciones_entrega, moneda_oper_exportacion, etc.)
- Tabla `factura_datos_exportacion`
- Catálogos: tipos_documento, tipos_cliente, incoterms, monedas

### 5. Reiniciar servidores
```bash
# Backend
npm run dev

# Frontend (nueva terminal)
npm run dev
```

---

## ✅ Qué se corrige

### Antes (Problemas)
- ❌ XML enviaba nodos vacíos para cliente extranjero (RUC, DV, ubicación)
- ❌ No existía tabla de datos de exportación
- ❌ Formulario mostraba todos los campos sin importar el tipo de cliente
- ❌ No validaba que cliente extranjero requiera destino=2
- ❌ Zona Franca no limpiaba tipoVenta
- ❌ No había catálogos de INCOTERMS ni monedas

### Después (Correcciones)
- ✅ XML omite nodos prohibidos según tipoClienteFE (01/02/03 vs 04)
- ✅ Tabla y formulario de datos de exportación completo
- ✅ Formulario dinámico: muestra/oculta campos en tiempo real
- ✅ Validaciones cruzadas: cliente vs destino, país vs destino, tipoDoc vs exportación
- ✅ Zona Franca (08) fuerza tipoVenta vacío automáticamente
- ✅ Catálogos de INCOTERMS y monedas ISO 4217 integrados

---

## 📋 Matriz de Tipos de Documento vs Cliente

| Tipo Doc | Nombre | Destino | Exportación | Tipo Venta |
|----------|--------|---------|-------------|------------|
| 01 | Operación Interna | 1 Panamá | No | Sí |
| 02 | Importación | 2 Extranjero | **Sí** | Sí |
| 03 | Exportación | 2 Extranjero | **Sí** | Sí |
| 04 | Nota Crédito FE | 1 Panamá | No | No |
| 05 | Nota Débito FE | 1 Panamá | No | No |
| 06 | Nota Crédito Genérica | 1 Panamá | No | No |
| 07 | Nota Débito Genérica | 1 Panamá | No | No |
| 08 | **Zona Franca** | 1 Panamá | No | **No** |
| 09 | Reembolso | 1 Panamá | No | No |
| 10 | Operación Extranjera | 2 Extranjero | **Sí** | Sí |

---

## 🧪 Pruebas Recomendadas

### Test 1: Factura Zona Franca (tipo 08) + Cliente Panameño (01)
1. Seleccionar tipo documento 08
2. Seleccionar cliente tipo 01
3. Verificar que tipoVenta no aparece
4. Verificar que destino = 1 (Panamá)
5. Guardar y revisar XML generado

### Test 2: Factura Exportación (tipo 03) + Cliente Extranjero (04)
1. Seleccionar tipo documento 03
2. Seleccionar cliente tipo 04
3. Verificar que aparece formulario de exportación
4. Llenar INCOTERMS (FOB), moneda (EUR), tipo de cambio
5. Verificar que destino = 2 (Extranjero) forzado
6. Verificar que RUC/DV/ubicación no aparecen en cliente
7. Guardar y revisar XML generado

### Test 3: Validación de errores
1. Intentar cliente tipo 04 con destino 1 → debe dar error
2. Intentar tipo 03 sin datos de exportación → debe dar error
3. Intentar cliente tipo 01 sin RUC → debe dar error

---

## 📞 Soporte

Para dudas sobre la documentación oficial EBI PAC:
- https://wiki.ebi-pac.com/enviar
- https://wiki.ebi-pac.com/factura_de_zona_franca
- https://wiki.ebi-pac.com/factura_a_cliente_extranjero

---

**Versión:** 1.0.0 | **Fecha:** 2026-06-19
