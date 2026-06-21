import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { generateEBIXML } from '../xml/generator.js';

/**
 * Reglas de validación cruzada según documentación EBI PAC
 */
const VALIDACIONES = {
  // Tipos de documento y su destino operación por defecto
  tiposDocumento: {
    '01': { nombre: 'Factura Operación Interna', destinoDefault: '1', requiereExportacion: false, tipoVentaRequerido: true },
    '02': { nombre: 'Factura Importación', destinoDefault: '2', requiereExportacion: true, tipoVentaRequerido: true },
    '03': { nombre: 'Factura Exportación', destinoDefault: '2', requiereExportacion: true, tipoVentaRequerido: true },
    '04': { nombre: 'Nota de Crédito referente a FE', destinoDefault: '1', requiereExportacion: false, tipoVentaRequerido: false },
    '05': { nombre: 'Nota de Débito referente a FE', destinoDefault: '1', requiereExportacion: false, tipoVentaRequerido: false },
    '06': { nombre: 'Nota de Crédito genérica', destinoDefault: '1', requiereExportacion: false, tipoVentaRequerido: false },
    '07': { nombre: 'Nota de Débito genérica', destinoDefault: '1', requiereExportacion: false, tipoVentaRequerido: false },
    '08': { nombre: 'Factura de Zona Franca', destinoDefault: '1', requiereExportacion: false, tipoVentaRequerido: false },
    '09': { nombre: 'Reembolso', destinoDefault: '1', requiereExportacion: false, tipoVentaRequerido: false },
    '10': { nombre: 'Factura Operación Extranjera', destinoDefault: '2', requiereExportacion: true, tipoVentaRequerido: true }
  },

  // Tipos de cliente
  tiposCliente: {
    '01': { nombre: 'Contribuyente', requiereRUC: true, requiereDV: true, requiereUbicacion: true },
    '02': { nombre: 'Consumidor Final', requiereRUC: false, requiereDV: false, requiereUbicacion: false },
    '03': { nombre: 'Gobierno', requiereRUC: true, requiereDV: true, requiereUbicacion: true },
    '04': { nombre: 'Extranjero', requiereRUC: false, requiereDV: false, requiereUbicacion: false, requiereIdentificacionExtranjera: true }
  }
};

/**
 * Valida los datos de la factura antes de guardar/enviar
 */
const validarFactura = (factura, cliente, items, datosExportacion) => {
  const errores = [];
  const tipoDoc = factura.tipo_documento || '08';
  const tipoCliente = cliente.tipo_cliente_fe || '02';
  const destino = factura.destino_operacion || '1';
  const config = VALIDACIONES.tiposDocumento[tipoDoc];
  const configCliente = VALIDACIONES.tiposCliente[tipoCliente];

  if (!config) {
    errores.push(`Tipo de documento ${tipoDoc} no válido`);
  }

  if (!configCliente) {
    errores.push(`Tipo de cliente ${tipoCliente} no válido`);
  }

  // Validación cruzada: Cliente Extranjero vs Destino
  if (tipoCliente === '04' && destino !== '2') {
    errores.push('Cliente extranjero (tipo 04) requiere destino de operación = 2 (Extranjero)');
  }

  // Validación cruzada: País vs Destino
  if (cliente.pais === 'PA' && destino === '2') {
    errores.push('País Panamá (PA) no puede tener destino de operación = 2 (Extranjero)');
  }
  if (cliente.pais !== 'PA' && cliente.pais !== 'ZZ' && destino === '1') {
    errores.push(`País ${cliente.pais} requiere destino de operación = 2 (Extranjero)`);
  }

  // Validación: Zona Franca no requiere tipoVenta
  if (tipoDoc === '08' && factura.tipo_venta) {
    logger.warn('Factura Zona Franca (08) no debe tener tipoVenta. Se limpiará automáticamente.');
  }

  // Validación: Exportación requiere datos de exportación
  if (config?.requiereExportacion && (!datosExportacion || !datosExportacion.condiciones_entrega)) {
    errores.push(`Tipo de documento ${config.nombre} requiere datos de exportación (condiciones de entrega, moneda)`);
  }

  // Validación cliente: Contribuyente/Gobierno
  if (configCliente?.requiereRUC && !cliente.numero_ruc) {
    errores.push(`Cliente tipo ${configCliente.nombre} requiere número de RUC`);
  }
  if (configCliente?.requiereDV && !cliente.digito_verificador_ruc) {
    errores.push(`Cliente tipo ${configCliente.nombre} requiere dígito verificador del RUC`);
  }
  if (configCliente?.requiereUbicacion) {
    if (!cliente.codigo_ubicacion) errores.push('Código de ubicación requerido');
    if (!cliente.provincia) errores.push('Provincia requerida');
    if (!cliente.distrito) errores.push('Distrito requerido');
    if (!cliente.corregimiento) errores.push('Corregimiento requerido');
  }

  // Validación cliente: Extranjero
  if (configCliente?.requiereIdentificacionExtranjera) {
    if (!cliente.tipo_identificacion) errores.push('Tipo de identificación extranjera requerido (01:Pasaporte, 02:NIT, 99:Otro)');
    if (!cliente.nro_identificacion_extranjero) errores.push('Número de identificación extranjera requerido');
    if (cliente.tipo_identificacion === '01' && !cliente.pais_extranjero) {
      errores.push('País extranjero requerido cuando la identificación es pasaporte');
    }
  }

  // Validación items
  if (!items || items.length === 0) {
    errores.push('La factura debe tener al menos un item');
  }

  items.forEach((item, idx) => {
    if (!item.descripcion) errores.push(`Item ${idx + 1}: Descripción requerida`);
    if (item.precio_unitario === undefined || item.precio_unitario === null) {
      errores.push(`Item ${idx + 1}: Precio unitario requerido`);
    }
  });

  // Validación formas de pago
  if (factura.tiempo_pago === '2' || factura.tiempo_pago === '3') {
    // Se validará en el controlador donde se tienen las formas de pago
  }

  if (errores.length > 0) {
    throw new Error(`VALIDACION_EBI: ${errores.join(' | ')}`);
  }

  return true;
};

/**
 * Calcula totales de la factura
 */
const calcularTotales = (items, descuentos = []) => {
  let totalPrecioNeto = 0;
  let totalITBMS = 0;
  let totalISC = 0;
  let totalTodosItems = 0;

  items.forEach(item => {
    const precioItem = parseFloat(item.precio_item) || 0;
    const valorITBMS = parseFloat(item.valor_itbms) || 0;
    const valorISC = parseFloat(item.valor_isc) || 0;
    const valorTotal = parseFloat(item.valor_total) || 0;

    totalPrecioNeto += precioItem;
    totalITBMS += valorITBMS;
    totalISC += valorISC;
    totalTodosItems += valorTotal;
  });

  const totalDescuento = descuentos.reduce((sum, d) => sum + (parseFloat(d.monto_descuento) || 0), 0);
  const totalMontoGravado = totalITBMS + totalISC;
  const totalFactura = totalTodosItems - totalDescuento;

  return {
    total_precio_neto: totalPrecioNeto.toFixed(2),
    total_itbms: totalITBMS.toFixed(2),
    total_isc: totalISC.toFixed(2),
    total_monto_gravado: totalMontoGravado.toFixed(2),
    total_descuento: totalDescuento.toFixed(2),
    total_todos_items: totalTodosItems.toFixed(2),
    total_factura: totalFactura.toFixed(2),
    total_valor_recibido: totalFactura.toFixed(2),
    nro_items: items.length
  };
};

/**
 * Crea una nueva factura con todos sus datos relacionados
 */
export const crearFactura = async (datos) => {
  const db = getDatabase();

  try {
    const {
      factura: facturaData,
      cliente,
      items,
      formas_pago = [],
      pagos_plazo = [],
      descuentos = [],
      datos_exportacion = null
    } = datos;

    // Validar antes de guardar
    validarFactura(facturaData, cliente, items, datos_exportacion);

    // Calcular totales automáticamente
    const totales = calcularTotales(items, descuentos);

    // Ajustar tipoVenta para Zona Franca
    if (facturaData.tipo_documento === '08') {
      facturaData.tipo_venta = null;
    }

    // Ajustar destinoOperacion para extranjero
    if (cliente.tipo_cliente_fe === '04') {
      facturaData.destino_operacion = '2';
    }

    const facturaFinal = { ...facturaData, ...totales };

    db.exec('BEGIN TRANSACTION');

    // Insertar factura
    const stmtFactura = db.prepare(`
      INSERT INTO facturas (
        numero_documento_fiscal, punto_facturacion_fiscal, codigo_sucursal_emisor,
        tipo_emision, tipo_documento, fecha_emision, fecha_salida,
        naturaleza_operacion, tipo_operacion, destino_operacion,
        formato_cafe, entrega_cafe, envio_contenedor, proceso_generacion,
        tipo_venta, tipo_sucursal, informacion_interes,
        cliente_id, cliente_tipo_cliente_fe, cliente_tipo_contribuyente,
        cliente_numero_ruc, cliente_digito_verificador_ruc, cliente_razon_social,
        cliente_direccion, cliente_codigo_ubicacion, cliente_provincia,
        cliente_distrito, cliente_corregimiento, cliente_telefono1,
        cliente_correo_electronico1, cliente_pais,
        total_precio_neto, total_itbms, total_isc, total_monto_gravado,
        total_descuento, total_acarreo_cobrado, valor_seguro_cobrado,
        total_factura, total_valor_recibido, vuelto, tiempo_pago,
        nro_items, total_todos_items, total_otros_gastos,
        estado, condiciones_entrega, moneda_oper_exportacion,
        moneda_oper_exportacion_non_def, tipo_de_cambio, monto_moneda_extranjera,
        puerto_embarque
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmtFactura.run(
      facturaFinal.numero_documento_fiscal,
      facturaFinal.punto_facturacion_fiscal || '001',
      facturaFinal.codigo_sucursal_emisor || '0000',
      facturaFinal.tipo_emision || '01',
      facturaFinal.tipo_documento || '08',
      facturaFinal.fecha_emision,
      facturaFinal.fecha_salida || null,
      facturaFinal.naturaleza_operacion || '01',
      facturaFinal.tipo_operacion || '1',
      facturaFinal.destino_operacion || '1',
      facturaFinal.formato_cafe || '1',
      facturaFinal.entrega_cafe || '1',
      facturaFinal.envio_contenedor || '1',
      facturaFinal.proceso_generacion || '1',
      facturaFinal.tipo_venta || null,
      facturaFinal.tipo_sucursal || null,
      facturaFinal.informacion_interes || null,
      cliente.id || null,
      cliente.tipo_cliente_fe || '02',
      cliente.tipo_contribuyente || null,
      cliente.numero_ruc || null,
      cliente.digito_verificador_ruc || null,
      cliente.razon_social || null,
      cliente.direccion || null,
      cliente.codigo_ubicacion || null,
      cliente.provincia || null,
      cliente.distrito || null,
      cliente.corregimiento || null,
      cliente.telefono1 || null,
      cliente.correo_electronico1 || null,
      cliente.pais || 'PA',
      totales.total_precio_neto,
      totales.total_itbms,
      totales.total_isc,
      totales.total_monto_gravado,
      totales.total_descuento,
      facturaFinal.total_acarreo_cobrado || 0,
      facturaFinal.valor_seguro_cobrado || 0,
      totales.total_factura,
      totales.total_valor_recibido,
      facturaFinal.vuelto || null,
      facturaFinal.tiempo_pago || '1',
      totales.nro_items,
      totales.total_todos_items,
      facturaFinal.total_otros_gastos || 0,
      'PENDIENTE',
      datos_exportacion?.condiciones_entrega || null,
      datos_exportacion?.moneda_oper_exportacion || null,
      datos_exportacion?.moneda_oper_exportacion_non_def || null,
      datos_exportacion?.tipo_de_cambio || null,
      datos_exportacion?.monto_moneda_extranjera || null,
      datos_exportacion?.puerto_embarque || null
    );

    const facturaId = result.lastInsertRowid;

    // Insertar items
    if (items && items.length > 0) {
      const stmtItem = db.prepare(`
        INSERT INTO factura_items (
          factura_id, producto_id, descripcion, codigo, unidad_medida, cantidad,
          fecha_fabricacion, fecha_caducidad, codigo_cpbs_abrev, codigo_cpbs,
          unidad_medida_cpbs, info_item, precio_unitario, precio_unitario_descuento,
          precio_item, precio_acarreo, precio_seguro, valor_total,
          codigo_gtin, cant_gtin_com, codigo_gtin_inv, cant_gtin_com_inv,
          tasa_itbms, valor_itbms, tasa_isc, valor_isc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        stmtItem.run(
          facturaId,
          item.producto_id || null,
          item.descripcion,
          item.codigo || null,
          item.unidad_medida || 'um',
          item.cantidad || 1,
          item.fecha_fabricacion || null,
          item.fecha_caducidad || null,
          item.codigo_cpbs_abrev || null,
          item.codigo_cpbs || null,
          item.unidad_medida_cpbs || null,
          item.info_item || null,
          item.precio_unitario || 0,
          item.precio_unitario_descuento || null,
          item.precio_item || 0,
          item.precio_acarreo || null,
          item.precio_seguro || null,
          item.valor_total || 0,
          item.codigo_gtin || '0',
          item.cant_gtin_com || 0,
          item.codigo_gtin_inv || '0',
          item.cant_gtin_com_inv || 0,
          item.tasa_itbms || '00',
          item.valor_itbms || 0,
          item.tasa_isc || null,
          item.valor_isc || null
        );
      });
    }

    // Insertar formas de pago
    if (formas_pago && formas_pago.length > 0) {
      const stmtFP = db.prepare(`
        INSERT INTO factura_formas_pago (factura_id, forma_pago_fact, desc_forma_pago, valor_cuota_pagada)
        VALUES (?, ?, ?, ?)
      `);
      formas_pago.forEach(fp => {
        stmtFP.run(facturaId, fp.forma_pago_fact || '02', fp.desc_forma_pago || null, fp.valor_cuota_pagada || 0);
      });
    }

    // Insertar pagos a plazo
    if (pagos_plazo && pagos_plazo.length > 0) {
      const stmtPP = db.prepare(`
        INSERT INTO factura_pagos_plazo (factura_id, fecha_vence_cuota, valor_cuota, info_pago_cuota)
        VALUES (?, ?, ?, ?)
      `);
      pagos_plazo.forEach(pp => {
        stmtPP.run(facturaId, pp.fecha_vence_cuota, pp.valor_cuota || 0, pp.info_pago_cuota || null);
      });
    }

    // Insertar descuentos
    if (descuentos && descuentos.length > 0) {
      const stmtDesc = db.prepare(`
        INSERT INTO factura_descuentos (factura_id, desc_descuento, monto_descuento)
        VALUES (?, ?, ?)
      `);
      descuentos.forEach(d => {
        stmtDesc.run(facturaId, d.desc_descuento, d.monto_descuento || 0);
      });
    }

    db.exec('COMMIT');

    logger.info(`Factura ${facturaId} creada exitosamente`);
    return { id: facturaId, ...facturaFinal, totales };

  } catch (error) {
    db.exec('ROLLBACK');
    logger.error('Error creando factura:', error);
    throw error;
  }
};

/**
 * Genera XML para enviar a EBI
 */
export const generarXMLEnviar = async (facturaId) => {
  const db = getDatabase();

  try {
    // Obtener factura
    const factura = db.prepare('SELECT * FROM facturas WHERE id = ?').get(facturaId);
    if (!factura) throw new Error('Factura no encontrada');

    // Obtener cliente
    const cliente = {
      tipo_cliente_fe: factura.cliente_tipo_cliente_fe,
      tipo_contribuyente: factura.cliente_tipo_contribuyente,
      numero_ruc: factura.cliente_numero_ruc,
      digito_verificador_ruc: factura.cliente_digito_verificador_ruc,
      razon_social: factura.cliente_razon_social,
      direccion: factura.cliente_direccion,
      codigo_ubicacion: factura.cliente_codigo_ubicacion,
      provincia: factura.cliente_provincia,
      distrito: factura.cliente_distrito,
      corregimiento: factura.cliente_corregimiento,
      telefono1: factura.cliente_telefono1,
      correo_electronico1: factura.cliente_correo_electronico1,
      pais: factura.cliente_pais
    };

    // Si hay cliente_id, obtener datos completos del cliente
    if (factura.cliente_id) {
      const clienteDB = db.prepare('SELECT * FROM clientes WHERE id = ?').get(factura.cliente_id);
      if (clienteDB) {
        Object.assign(cliente, clienteDB);
      }
    }

    // Obtener items
    const items = db.prepare('SELECT * FROM factura_items WHERE factura_id = ?').all(facturaId);

    // Obtener formas de pago
    const formasPago = db.prepare('SELECT * FROM factura_formas_pago WHERE factura_id = ?').all(facturaId);

    // Obtener pagos plazo
    const pagosPlazo = db.prepare('SELECT * FROM factura_pagos_plazo WHERE factura_id = ?').all(facturaId);

    // Datos exportación
    const datosExportacion = factura.destino_operacion === '2' ? {
      condiciones_entrega: factura.condiciones_entrega,
      moneda_oper_exportacion: factura.moneda_oper_exportacion,
      moneda_oper_exportacion_non_def: factura.moneda_oper_exportacion_non_def,
      tipo_de_cambio: factura.tipo_de_cambio,
      monto_moneda_extranjera: factura.monto_moneda_extranjera,
      puerto_embarque: factura.puerto_embarque
    } : null;

    // Generar XML
    const xml = generateEBIXML(factura, cliente, items, formasPago, pagosPlazo, datosExportacion);

    // Guardar XML en la factura
    db.prepare('UPDATE facturas SET xml_enviado = ? WHERE id = ?').run(xml, facturaId);

    return xml;

  } catch (error) {
    logger.error('Error generando XML para enviar:', error);
    throw error;
  }
};

export default { crearFactura, generarXMLEnviar, calcularTotales, validarFactura };
