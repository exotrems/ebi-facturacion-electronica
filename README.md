# EBI Facturación Electrónica - Panamá

Sistema completo de facturación electrónica integrado con **EBI PAC** (Electronic Business Intelligence) para Panamá, cumpliendo con los requisitos de la DGI (Dirección General de Ingresos).

## Características

- **Backend**: Node.js 22+ con Express, SQLite, SOAP
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Integración EBI**: 7 métodos SOAP completos
- **Esquema**: Factura de Zona Franca (tipo 08)
- **Base de datos**: SQLite local
- **Autenticación**: JWT lista para implementar

## Requisitos

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **Windows 10/11** o **Linux/macOS**

## Instalación Rápida (Windows)

### Opción 1: Script Automático (Recomendado)

1. Extraiga el proyecto en una carpeta
2. Ejecute como Administrador: `scripts\setup-windows.bat`
3. Siga las instrucciones en pantalla
4. Ejecute: `scripts\start-dev.bat`

### Opción 2: Manual

```bash
# Backend
cd backend
npm install
copy .env.example .env
# Editar .env con sus credenciales EBI
npm run db:init
npm run dev

# Frontend (nueva terminal)
cd frontend
npm install
npm run dev
```

## Scripts Disponibles

### Windows (`scripts/`)

| Script | Descripción |
|--------|-------------|
| `setup-windows.bat` | Instalación completa con 1 clic |
| `start-dev.bat` | Inicia backend + frontend |
| `build-production.bat` | Compila para producción |
| `reset-db.bat` | Reinicia la base de datos |
| `check-dependencies.bat` | Verifica dependencias |

### Linux/Mac (`scripts/`)

| Script | Descripción |
|--------|-------------|
| `setup-linux.sh` | Instalación completa |
| `start-dev.sh` | Inicia backend + frontend |

## Configuración EBI

Edite `backend/.env`:

```env
# Credenciales proporcionadas por EBI
TOKEN_EMPRESA=su_token_aqui
TOKEN_PASSWORD=su_password_aqui

# Ambiente
EBI_WSDL_URL=https://test.ebi-pac.com/Service.svc?wsdl
# Producción: https://ebi-pac.com/Service.svc?wsdl
```

## API Endpoints

### Facturas
- `POST /api/facturas` - Crear factura
- `GET /api/facturas` - Listar facturas
- `GET /api/facturas/:id` - Obtener factura
- `PUT /api/facturas/:id` - Actualizar factura
- `DELETE /api/facturas/:id` - Eliminar factura

### Operaciones EBI
- `POST /api/facturas/:id/enviar` - Enviar a EBI
- `GET /api/facturas/:id/estado` - Consultar estado
- `POST /api/facturas/:id/anular` - Anular documento
- `GET /api/facturas/:id/xml` - Descargar XML
- `GET /api/facturas/:id/pdf` - Descargar PDF
- `POST /api/facturas/:id/correo` - Enviar por correo

### Clientes
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes/consultar-ruc` - Consultar RUC DV

### Productos
- `POST /api/productos` - Crear producto
- `GET /api/productos` - Listar productos

### Configuración
- `GET /api/config` - Obtener configuración
- `POST /api/config` - Crear configuración

## Estructura del Proyecto

```
ebi-facturacion-electronica/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración (DB, etc.)
│   │   ├── controllers/    # Controladores API
│   │   ├── database/       # Inicialización DB
│   │   ├── middleware/     # Middlewares
│   │   ├── models/         # Modelos SQLite
│   │   ├── routes/         # Rutas API
│   │   ├── services/       # Lógica de negocio
│   │   ├── soap/           # Servicio SOAP EBI
│   │   ├── utils/          # Utilidades
│   │   ├── xml/            # Generador XML
│   │   └── server.js       # Punto de entrada
│   ├── data/               # Base de datos SQLite
│   ├── logs/               # Logs de la aplicación
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Páginas
│   │   ├── services/       # Servicios API
│   │   └── styles/         # Estilos CSS
│   └── package.json
└── scripts/                # Scripts de automatización
```

## Métodos EBI Implementados

| Método | Descripción | Documentación |
|--------|-------------|---------------|
| `Enviar()` | Enviar documento electrónico | [wiki.ebi-pac.com/enviar](https://wiki.ebi-pac.com/enviar) |
| `EstadoDocumento()` | Consultar estado | [wiki.ebi-pac.com/estadodocumento](https://wiki.ebi-pac.com/estadodocumento) |
| `Anulacion()` | Anular documento | [wiki.ebi-pac.com/anulacion](https://wiki.ebi-pac.com/anulacion) |
| `DescargaXML()` | Descargar XML | [wiki.ebi-pac.com/descargaxml](https://wiki.ebi-pac.com/descargaxml) |
| `EnvioCorreo()` | Enviar por correo | [wiki.ebi-pac.com/enviocorreo](https://wiki.ebi-pac.com/enviocorreo) |
| `DescargaPDF()` | Descargar PDF | [wiki.ebi-pac.com/descargapdf](https://wiki.ebi-pac.com/descargapdf) |
| `ConsultarRucDV()` | Consultar RUC | [wiki.ebi-pac.com/consultarrucdv](https://wiki.ebi-pac.com/consultarrucdv) |

## Esquema XML - Factura Zona Franca

Basado en: [wiki.ebi-pac.com/factura_de_zona_franca](https://wiki.ebi-pac.com/factura_de_zona_franca)

Tipo de documento: **08 - Factura de Zona Franca**

## Licencia

MIT

## Soporte

Para soporte de EBI PAC: [wiki.ebi-pac.com](https://wiki.ebi-pac.com)
