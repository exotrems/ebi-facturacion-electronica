import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const initializeDatabase = () => {
  const db = getDatabase();

  try {
    // Tabla de Configuración EBI
    db.exec(`
      CREATE TABLE IF NOT EXISTS ebi_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_empresa TEXT NOT NULL,
        token_password TEXT NOT NULL,
        codigo_sucursal TEXT DEFAULT '0000',
        punto_facturacion TEXT DEFAULT '001',
        ambiente TEXT DEFAULT 'test',
        url_wsdl TEXT DEFAULT 'https://test.ebi-pac.com/Service.svc?wsdl',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Clientes
    db.exec(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo_cliente_fe TEXT NOT NULL DEFAULT '02',
        tipo_contribuyente TEXT,
        numero_ruc TEXT,
        digito_verificador_ruc TEXT,
        razon_social TEXT,
        direccion TEXT,
        codigo_ubicacion TEXT,
        provincia TEXT,
        distrito TEXT,
        corregimiento TEXT,
        tipo_identificacion TEXT,
        nro_identificacion_extranjero TEXT,
        pais_extranjero TEXT,
        telefono1 TEXT,
        telefono2 TEXT,
        telefono3 TEXT,
        correo_electronico1 TEXT,
        correo_electronico2 TEXT,
        correo_electronico3 TEXT,
        pais TEXT DEFAULT 'PA',
        pais_otro TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Productos
    db.exec(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE,
        descripcion TEXT NOT NULL,
        unidad_medida TEXT,
        codigo_cpbs TEXT,
        codigo_cpbs_abrev TEXT,
        unidad_medida_cpbs TEXT,
        precio_unitario REAL DEFAULT 0,
        tasa_itbms TEXT DEFAULT '01',
        codigo_gtin TEXT DEFAULT '0',
        codigo_gtin_inv TEXT DEFAULT '0',
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de Facturas
    db.exec(`
      CREATE TABLE IF NOT EXISTS facturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_documento_fiscal TEXT NOT NULL,
        punto_facturacion_fiscal TEXT NOT NULL DEFAULT '001',
        codigo_sucursal_emisor TEXT NOT NULL DEFAULT '0000',
        tipo_emision TEXT NOT NULL DEFAULT '01',
        tipo_documento TEXT NOT NULL DEFAULT '08',
        fecha_emision TEXT NOT NULL,
        fecha_salida TEXT,
        naturaleza_operacion TEXT NOT NULL DEFAULT '01',
        tipo_operacion TEXT NOT NULL DEFAULT '1',
        destino_operacion TEXT NOT NULL DEFAULT '1',
        formato_cafe TEXT NOT NULL DEFAULT '1',
        entrega_cafe TEXT NOT NULL DEFAULT '1',
        envio_contenedor TEXT NOT NULL DEFAULT '1',
        proceso_generacion TEXT NOT NULL DEFAULT '1',
        tipo_venta TEXT,
        tipo_sucursal TEXT,
        informacion_interes TEXT,

        -- Datos del cliente
        cliente_id INTEGER,
        cliente_tipo_cliente_fe TEXT,
        cliente_tipo_contribuyente TEXT,
        cliente_numero_ruc TEXT,
        cliente_digito_verificador_ruc TEXT,
        cliente_razon_social TEXT,
        cliente_direccion TEXT,
        cliente_codigo_ubicacion TEXT,
        cliente_provincia TEXT,
        cliente_distrito TEXT,
        cliente_corregimiento TEXT,
        cliente_telefono1 TEXT,
        cliente_correo_electronico1 TEXT,
        cliente_pais TEXT DEFAULT 'PA',

        -- Totales
        total_precio_neto REAL DEFAULT 0,
        total_itbms REAL DEFAULT 0,
        total_isc REAL DEFAULT 0,
        total_monto_gravado REAL DEFAULT 0,
        total_descuento REAL DEFAULT 0,
        total_acarreo_cobrado REAL DEFAULT 0,
        valor_seguro_cobrado REAL DEFAULT 0,
        total_factura REAL DEFAULT 0,
        total_valor_recibido REAL DEFAULT 0,
        vuelto REAL,
        tiempo_pago TEXT DEFAULT '1',
        nro_items INTEGER DEFAULT 0,
        total_todos_items REAL DEFAULT 0,
        total_otros_gastos REAL DEFAULT 0,

        -- Estado EBI
        estado TEXT DEFAULT 'PENDIENTE',
        cufe TEXT,
        qr TEXT,
        fecha_recepcion_dgi TEXT,
        nro_protocolo_autorizacion TEXT,
        mensaje_ebi TEXT,
        codigo_respuesta_ebi TEXT,
        xml_enviado TEXT,
        xml_respuesta TEXT,

        -- Metadata
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        enviada INTEGER DEFAULT 0,
        anulada INTEGER DEFAULT 0,
        motivo_anulacion TEXT
      )
    `);

    // Tabla de Items de Factura
    db.exec(`
      CREATE TABLE IF NOT EXISTS factura_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER NOT NULL,
        producto_id INTEGER,
        descripcion TEXT NOT NULL,
        codigo TEXT,
        unidad_medida TEXT,
        cantidad REAL NOT NULL DEFAULT 1,
        fecha_fabricacion TEXT,
        fecha_caducidad TEXT,
        codigo_cpbs_abrev TEXT,
        codigo_cpbs TEXT,
        unidad_medida_cpbs TEXT,
        info_item TEXT,
        precio_unitario REAL NOT NULL DEFAULT 0,
        precio_unitario_descuento REAL,
        precio_item REAL NOT NULL DEFAULT 0,
        precio_acarreo REAL,
        precio_seguro REAL,
        valor_total REAL NOT NULL DEFAULT 0,
        codigo_gtin TEXT DEFAULT '0',
        cant_gtin_com REAL DEFAULT 0,
        codigo_gtin_inv TEXT DEFAULT '0',
        cant_gtin_com_inv REAL DEFAULT 0,
        tasa_itbms TEXT DEFAULT '01',
        valor_itbms REAL DEFAULT 0,
        tasa_isc REAL,
        valor_isc REAL,
        tasa_oti TEXT,
        valor_tasa REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
      )
    `);

    // Tabla de Formas de Pago
    db.exec(`
      CREATE TABLE IF NOT EXISTS factura_formas_pago (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER NOT NULL,
        forma_pago_fact TEXT NOT NULL DEFAULT '02',
        desc_forma_pago TEXT,
        valor_cuota_pagada REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
      )
    `);

    // Tabla de Pagos a Plazo
    db.exec(`
      CREATE TABLE IF NOT EXISTS factura_pagos_plazo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER NOT NULL,
        fecha_vence_cuota TEXT NOT NULL,
        valor_cuota REAL NOT NULL DEFAULT 0,
        info_pago_cuota TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
      )
    `);

    // Tabla de Descuentos/Bonificaciones
    db.exec(`
      CREATE TABLE IF NOT EXISTS factura_descuentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factura_id INTEGER NOT NULL,
        desc_descuento TEXT NOT NULL,
        monto_descuento REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
      )
    `);

    // Tabla de Logs de Operaciones EBI
    db.exec(`
      CREATE TABLE IF NOT EXISTS ebi_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo_operacion TEXT NOT NULL,
        factura_id INTEGER,
        request_xml TEXT,
        response_xml TEXT,
        codigo_respuesta TEXT,
        mensaje TEXT,
        exito INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (factura_id) REFERENCES facturas(id)
      )
    `);

    // Tabla de Usuarios (para autenticación básica)
    db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT,
        email TEXT,
        rol TEXT DEFAULT 'usuario',
        activo INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices para optimización
    db.exec(`CREATE INDEX IF NOT EXISTS idx_facturas_numero ON facturas(numero_documento_fiscal)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_emision)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_factura_items_factura ON factura_items(factura_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_clientes_ruc ON clientes(numero_ruc)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo)`);

    logger.info('Todas las tablas e índices creados exitosamente');
    return true;
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    throw error;
  }
};
