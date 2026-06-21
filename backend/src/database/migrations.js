import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Migraciones para agregar campos faltantes y tablas nuevas
 * Ejecutar: node src/database/migrations.js
 */

export const runMigrations = () => {
  const db = getDatabase();

  try {
    db.exec('BEGIN TRANSACTION');

    // ============================================
    // MIGRACIÓN 1: Agregar campos faltantes a facturas
    // ============================================
    const columnsFacturas = db.prepare("PRAGMA table_info(facturas)").all();
    const existingCols = columnsFacturas.map(c => c.name);

    const newColumns = [
      { name: 'condiciones_entrega', type: 'TEXT' },
      { name: 'moneda_oper_exportacion', type: 'TEXT' },
      { name: 'moneda_oper_exportacion_non_def', type: 'TEXT' },
      { name: 'tipo_de_cambio', type: 'REAL' },
      { name: 'monto_moneda_extranjera', type: 'REAL' },
      { name: 'puerto_embarque', type: 'TEXT' },
      // Campos adicionales del cliente para snapshot
      { name: 'cliente_tipo_identificacion', type: 'TEXT' },
      { name: 'cliente_nro_identificacion_extranjero', type: 'TEXT' },
      { name: 'cliente_pais_extranjero', type: 'TEXT' },
      { name: 'cliente_pais_otro', type: 'TEXT' },
      { name: 'cliente_telefono2', type: 'TEXT' },
      { name: 'cliente_telefono3', type: 'TEXT' },
      { name: 'cliente_correo_electronico2', type: 'TEXT' },
      { name: 'cliente_correo_electronico3', type: 'TEXT' }
    ];

    newColumns.forEach(col => {
      if (!existingCols.includes(col.name)) {
        db.exec(`ALTER TABLE facturas ADD COLUMN ${col.name} ${col.type}`);
        logger.info(`Columna agregada: facturas.${col.name}`);
      }
    });

    // ============================================
    // MIGRACIÓN 2: Agregar campos faltantes a clientes
    // ============================================
    const columnsClientes = db.prepare("PRAGMA table_info(clientes)").all();
    const existingClientesCols = columnsClientes.map(c => c.name);

    const newClientesColumns = [
      { name: 'pais_otro', type: 'TEXT' }
    ];

    newClientesColumns.forEach(col => {
      if (!existingClientesCols.includes(col.name)) {
        db.exec(`ALTER TABLE clientes ADD COLUMN ${col.name} ${col.type}`);
        logger.info(`Columna agregada: clientes.${col.name}`);
      }
    });

    // ============================================
    // MIGRACIÓN 3: Tabla de datos de exportación (normalización opcional)
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS factura_datos_exportacion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER NOT NULL UNIQUE,
        condiciones_entrega TEXT NOT NULL DEFAULT 'FOB',
        moneda_oper_exportacion TEXT NOT NULL DEFAULT 'USD',
        moneda_oper_exportacion_non_def TEXT,
        tipo_de_cambio REAL,
        monto_moneda_extranjera REAL,
        puerto_embarque TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
      )
    `);
    logger.info('Tabla factura_datos_exportacion verificada/creada');

    // ============================================
    // MIGRACIÓN 4: Tabla de configuración de tipos de documento
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS catalogo_tipos_documento (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        destino_default TEXT NOT NULL DEFAULT '1',
        requiere_exportacion INTEGER DEFAULT 0,
        requiere_tipo_venta INTEGER DEFAULT 1,
        activo INTEGER DEFAULT 1
      )
    `);

    // Insertar catálogo si está vacío
    const count = db.prepare('SELECT COUNT(*) as total FROM catalogo_tipos_documento').get();
    if (count.total === 0) {
      const tipos = [
        ['01', 'Factura de operación interna', '1', 0, 1],
        ['02', 'Factura de importación', '2', 1, 1],
        ['03', 'Factura de exportación', '2', 1, 1],
        ['04', 'Nota de Crédito referente a una FE', '1', 0, 0],
        ['05', 'Nota de Débito referente a una FE', '1', 0, 0],
        ['06', 'Nota de Crédito genérica', '1', 0, 0],
        ['07', 'Nota de Débito genérica', '1', 0, 0],
        ['08', 'Factura de Zona Franca', '1', 0, 0],
        ['09', 'Reembolso', '1', 0, 0],
        ['10', 'Factura de operación extranjera', '2', 1, 1]
      ];

      const stmt = db.prepare(`
        INSERT INTO catalogo_tipos_documento (codigo, nombre, destino_default, requiere_exportacion, requiere_tipo_venta)
        VALUES (?, ?, ?, ?, ?)
      `);
      tipos.forEach(t => stmt.run(...t));
      logger.info('Catálogo de tipos de documento insertado');
    }

    // ============================================
    // MIGRACIÓN 5: Tabla de catálogo de tipos de cliente
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS catalogo_tipos_cliente (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        requiere_ruc INTEGER DEFAULT 0,
        requiere_dv INTEGER DEFAULT 0,
        requiere_ubicacion INTEGER DEFAULT 0,
        requiere_identificacion_extranjera INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1
      )
    `);

    const countCliente = db.prepare('SELECT COUNT(*) as total FROM catalogo_tipos_cliente').get();
    if (countCliente.total === 0) {
      const tiposCliente = [
        ['01', 'Contribuyente', 1, 1, 1, 0],
        ['02', 'Consumidor final', 0, 0, 0, 0],
        ['03', 'Gobierno', 1, 1, 1, 0],
        ['04', 'Extranjero', 0, 0, 0, 1]
      ];

      const stmt = db.prepare(`
        INSERT INTO catalogo_tipos_cliente (codigo, nombre, requiere_ruc, requiere_dv, requiere_ubicacion, requiere_identificacion_extranjera)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      tiposCliente.forEach(t => stmt.run(...t));
      logger.info('Catálogo de tipos de cliente insertado');
    }

    // ============================================
    // MIGRACIÓN 6: Catálogo de INCOTERMS
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS catalogo_incoterms (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        activo INTEGER DEFAULT 1
      )
    `);

    const countIncoterms = db.prepare('SELECT COUNT(*) as total FROM catalogo_incoterms').get();
    if (countIncoterms.total === 0) {
      const incoterms = [
        ['EXW', 'Ex Works', 'En fábrica'],
        ['FCA', 'Free Carrier', 'Libre transportista'],
        ['FAS', 'Free Alongside Ship', 'Libre al costado del buque'],
        ['FOB', 'Free On Board', 'Libre a bordo'],
        ['CFR', 'Cost and Freight', 'Costo y flete'],
        ['CIF', 'Cost, Insurance and Freight', 'Costo, seguro y flete'],
        ['CPT', 'Carriage Paid To', 'Transporte pagado hasta'],
        ['CIP', 'Carriage and Insurance Paid To', 'Transporte y seguro pagados hasta'],
        ['DAP', 'Delivered at Place', 'Entregada en lugar'],
        ['DPU', 'Delivered at Place Unloaded', 'Entregada en lugar descargada'],
        ['DDP', 'Delivered Duty Paid', 'Entregada con derechos pagados']
      ];

      const stmt = db.prepare('INSERT INTO catalogo_incoterms (codigo, nombre, descripcion) VALUES (?, ?, ?)');
      incoterms.forEach(i => stmt.run(...i));
      logger.info('Catálogo de INCOTERMS insertado');
    }

    // ============================================
    // MIGRACIÓN 7: Catálogo de monedas ISO 4217
    // ============================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS catalogo_monedas (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        pais TEXT,
        activo INTEGER DEFAULT 1
      )
    `);

    const countMonedas = db.prepare('SELECT COUNT(*) as total FROM catalogo_monedas').get();
    if (countMonedas.total === 0) {
      const monedas = [
        ['USD', 'Dólar estadounidense', 'Estados Unidos'],
        ['EUR', 'Euro', 'Unión Europea'],
        ['PAB', 'Balboa', 'Panamá'],
        ['COP', 'Peso colombiano', 'Colombia'],
        ['MXN', 'Peso mexicano', 'México'],
        ['BRL', 'Real brasileño', 'Brasil'],
        ['CAD', 'Dólar canadiense', 'Canadá'],
        ['GBP', 'Libra esterlina', 'Reino Unido'],
        ['JPY', 'Yen japonés', 'Japón'],
        ['CNY', 'Yuan chino', 'China'],
        ['ZZZ', 'Otra moneda no definida', null]
      ];

      const stmt = db.prepare('INSERT INTO catalogo_monedas (codigo, nombre, pais) VALUES (?, ?, ?)');
      monedas.forEach(m => stmt.run(...m));
      logger.info('Catálogo de monedas insertado');
    }

    db.exec('COMMIT');
    logger.info('Todas las migraciones ejecutadas exitosamente');
    return true;

  } catch (error) {
    db.exec('ROLLBACK');
    logger.error('Error en migraciones:', error);
    throw error;
  }
};

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default { runMigrations };
