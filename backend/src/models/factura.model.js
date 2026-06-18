import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

function safeValue(value, defaultValue = '') {
  if (value === undefined || value === null) return defaultValue;
  return value;
}

function safeNumber(value, defaultValue = 0) {
  const num = Number(value);
  if (value === undefined || value === null || Number.isNaN(num)) return defaultValue;
  return num;
}

export class FacturaModel {
  static create(facturaData) {
    const db = getDatabase();

    // Datos normalizados con valores por defecto
    const data = {
      numero_documento_fiscal: safeValue(facturaData.numero_documento_fiscal, '0000000001'),
      punto_facturacion_fiscal: safeValue(facturaData.punto_facturacion_fiscal, '001'),
      codigo_sucursal_emisor: safeValue(facturaData.codigo_sucursal_emisor, '0000'),
      tipo_emision: safeValue(facturaData.tipo_emision, '01'),
      tipo_documento: safeValue(facturaData.tipo_documento, '08'),
      fecha_emision: safeValue(facturaData.fecha_emision, new Date().toISOString()),
      fecha_salida: safeValue(facturaData.fecha_salida, facturaData.fecha_emision || new Date().toISOString()),
      naturaleza_operacion: safeValue(facturaData.naturaleza_operacion, '01'),
      tipo_operacion: safeValue(facturaData.tipo_operacion, '1'),
      destino_operacion: safeValue(facturaData.destino_operacion, '1'),
      formato_cafe: safeValue(facturaData.formato_cafe, '3'),
      entrega_cafe: safeValue(facturaData.entrega_cafe, '3'),
      envio_contenedor: safeValue(facturaData.envio_contenedor, '1'),
      proceso_generacion: safeValue(facturaData.proceso_generacion, '1'),
      tipo_venta: safeValue(facturaData.tipo_venta),
      tipo_sucursal: safeValue(facturaData.tipo_sucursal),
      informacion_interes: safeValue(facturaData.informacion_interes, 'Factura Zona Franca'),
      cliente_id: safeNumber(facturaData.cliente_id),
      cliente_tipo_cliente_fe: safeValue(facturaData.cliente_tipo_cliente_fe, '01'),
      cliente_tipo_contribuyente: safeValue(facturaData.cliente_tipo_contribuyente, '2'),
      cliente_numero_ruc: safeValue(facturaData.cliente_numero_ruc),
      cliente_digito_verificador_ruc: safeValue(facturaData.cliente_digito_verificador_ruc),
      cliente_razon_social: safeValue(facturaData.cliente_razon_social),
      cliente_direccion: safeValue(facturaData.cliente_direccion),
      cliente_codigo_ubicacion: safeValue(facturaData.cliente_codigo_ubicacion),
      cliente_provincia: safeValue(facturaData.cliente_provincia),
      cliente_distrito: safeValue(facturaData.cliente_distrito),
      cliente_corregimiento: safeValue(facturaData.cliente_corregimiento),
      cliente_telefono1: safeValue(facturaData.cliente_telefono1),
      cliente_correo_electronico1: safeValue(facturaData.cliente_correo_electronico1),
      cliente_pais: safeValue(facturaData.cliente_pais, 'PA'),
      total_precio_neto: safeNumber(facturaData.total_precio_neto),
      total_itbms: safeNumber(facturaData.total_itbms),
      total_isc: safeNumber(facturaData.total_isc),
      total_monto_gravado: safeNumber(facturaData.total_monto_gravado),
      total_descuento: safeNumber(facturaData.total_descuento),
      total_acarreo_cobrado: safeNumber(facturaData.total_acarreo_cobrado),
      valor_seguro_cobrado: safeNumber(facturaData.valor_seguro_cobrado),
      total_factura: safeNumber(facturaData.total_factura),
      total_valor_recibido: safeNumber(facturaData.total_valor_recibido),
      vuelto: facturaData.vuelto === undefined || facturaData.vuelto === null ? null : safeNumber(facturaData.vuelto),
      tiempo_pago: safeValue(facturaData.tiempo_pago, '1'),
      nro_items: safeNumber(facturaData.nro_items),
      total_todos_items: safeNumber(facturaData.total_todos_items),
      total_otros_gastos: safeNumber(facturaData.total_otros_gastos)
    };

    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO facturas (${columns}) VALUES (${placeholders})`;

    logger.info(`SQL INSERT: ${sql.substring(0, 100)}...`);
    logger.info(`Valores: ${JSON.stringify(values).substring(0, 500)}`);

    const stmt = db.prepare(sql);
    const result = stmt.run(...values);

    logger.info(`Factura creada con ID: ${result.lastInsertRowid}`);
    return result.lastInsertRowid;
  }

  static findAll(limit = 100, offset = 0) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM facturas ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  }

  static findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM facturas WHERE id = ?').get(id);
  }

  static findByNumero(numeroDocumentoFiscal) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM facturas WHERE numero_documento_fiscal = ?').get(numeroDocumentoFiscal);
  }

  static findByDateRange(fechaDesde, fechaHasta, limit = 100, offset = 0) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM facturas
      WHERE fecha_emision >= ? AND fecha_emision <= ?
      ORDER BY fecha_emision DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(fechaDesde, fechaHasta, limit, offset);
  }

  static update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const stmt = db.prepare(`UPDATE facturas SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const result = stmt.run(...values, id);

    logger.info(`Factura ${id} actualizada`);
    return result.changes > 0;
  }

  static delete(id) {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM facturas WHERE id = ?').run(id);
    logger.info(`Factura ${id} eliminada`);
    return result.changes > 0;
  }

  static updateEBIStatus(id, status) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE facturas SET
        estado = ?, cufe = ?, qr = ?, fecha_recepcion_dgi = ?,
        nro_protocolo_autorizacion = ?, mensaje_ebi = ?, codigo_respuesta_ebi = ?,
        xml_enviado = ?, xml_respuesta = ?, enviada = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(
      safeValue(status.estado, 'PENDIENTE'),
      status.cufe || null,
      status.qr || null,
      status.fechaRecepcionDGI || null,
      status.nroProtocoloAutorizacion || null,
      status.mensaje || null,
      status.codigo || null,
      status.xmlEnviado || null,
      status.xmlRespuesta || null,
      status.enviada || 0,
      id
    );
    return result.changes > 0;
  }

  static anular(id, motivo) {
    const db = getDatabase();
    const result = db.prepare(`
      UPDATE facturas SET anulada = 1, motivo_anulacion = ?, estado = 'ANULADA', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(motivo, id);
    return result.changes > 0;
  }
}

export class FacturaItemModel {
  static create(itemData) {
    const db = getDatabase();

    const data = {
      factura_id: safeNumber(itemData.factura_id),
      producto_id: safeNumber(itemData.producto_id),
      descripcion: safeValue(itemData.descripcion),
      codigo: safeValue(itemData.codigo),
      unidad_medida: safeValue(itemData.unidad_medida, 'um'),
      cantidad: safeNumber(itemData.cantidad, 1),
      fecha_fabricacion: safeValue(itemData.fecha_fabricacion),
      fecha_caducidad: safeValue(itemData.fecha_caducidad),
      codigo_cpbs_abrev: safeValue(itemData.codigo_cpbs_abrev),
      codigo_cpbs: safeValue(itemData.codigo_cpbs),
      unidad_medida_cpbs: safeValue(itemData.unidad_medida_cpbs),
      info_item: safeValue(itemData.info_item),
      precio_unitario: safeNumber(itemData.precio_unitario),
      precio_unitario_descuento: safeNumber(itemData.precio_unitario_descuento),
      precio_item: safeNumber(itemData.precio_item),
      precio_acarreo: safeNumber(itemData.precio_acarreo),
      precio_seguro: safeNumber(itemData.precio_seguro),
      valor_total: safeNumber(itemData.valor_total),
      codigo_gtin: safeValue(itemData.codigo_gtin, '0'),
      cant_gtin_com: safeNumber(itemData.cant_gtin_com, 0),
      codigo_gtin_inv: safeValue(itemData.codigo_gtin_inv, '0'),
      cant_gtin_com_inv: safeNumber(itemData.cant_gtin_com_inv, 0),
      tasa_itbms: safeValue(itemData.tasa_itbms, '01'),
      valor_itbms: safeNumber(itemData.valor_itbms, 0),
      tasa_isc: safeValue(itemData.tasa_isc),
      valor_isc: safeNumber(itemData.valor_isc),
      tasa_oti: safeValue(itemData.tasa_oti),
      valor_tasa: safeNumber(itemData.valor_tasa)
    };

    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const stmt = db.prepare(`INSERT INTO factura_items (${columns}) VALUES (${placeholders})`);
    return stmt.run(...values).lastInsertRowid;
  }

  static findByFacturaId(facturaId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM factura_items WHERE factura_id = ?').all(facturaId);
  }

  static deleteByFacturaId(facturaId) {
    const db = getDatabase();
    return db.prepare('DELETE FROM factura_items WHERE factura_id = ?').run(facturaId);
  }
}

export class FacturaFormaPagoModel {
  static create(data) {
    const db = getDatabase();
    return db.prepare(`
      INSERT INTO factura_formas_pago (factura_id, forma_pago_fact, desc_forma_pago, valor_cuota_pagada)
      VALUES (?, ?, ?, ?)
    `).run(
      safeNumber(data.factura_id),
      safeValue(data.forma_pago_fact, '02'),
      safeValue(data.desc_forma_pago, ''),
      safeNumber(data.valor_cuota_pagada)
    ).lastInsertRowid;
  }

  static findByFacturaId(facturaId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM factura_formas_pago WHERE factura_id = ?').all(facturaId);
  }
}

export class FacturaPagoPlazoModel {
  static create(data) {
    const db = getDatabase();
    return db.prepare(`
      INSERT INTO factura_pagos_plazo (factura_id, fecha_vence_cuota, valor_cuota, info_pago_cuota)
      VALUES (?, ?, ?, ?)
    `).run(
      safeNumber(data.factura_id),
      safeValue(data.fecha_vence_cuota),
      safeNumber(data.valor_cuota),
      safeValue(data.info_pago_cuota, '')
    ).lastInsertRowid;
  }

  static findByFacturaId(facturaId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM factura_pagos_plazo WHERE factura_id = ?').all(facturaId);
  }
}

export class FacturaDescuentoModel {
  static create(data) {
    const db = getDatabase();
    return db.prepare(`
      INSERT INTO factura_descuentos (factura_id, desc_descuento, monto_descuento)
      VALUES (?, ?, ?)
    `).run(
      safeNumber(data.factura_id),
      safeValue(data.desc_descuento),
      safeNumber(data.monto_descuento)
    ).lastInsertRowid;
  }

  static findByFacturaId(facturaId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM factura_descuentos WHERE factura_id = ?').all(facturaId);
  }
}
