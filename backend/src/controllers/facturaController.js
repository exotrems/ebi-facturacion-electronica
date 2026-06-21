import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { crearFactura, generarXMLEnviar } from '../services/facturaService.js';

/**
 * POST /api/facturas - Crear nueva factura
 */
export const createFactura = async (req, res) => {
  try {
    const datos = req.body;

    // Validación básica de entrada
    if (!datos.factura) {
      return res.status(400).json({ error: 'Datos de factura requeridos' });
    }
    if (!datos.cliente) {
      return res.status(400).json({ error: 'Datos de cliente requeridos' });
    }
    if (!datos.items || datos.items.length === 0) {
      return res.status(400).json({ error: 'Items de factura requeridos' });
    }

    const resultado = await crearFactura(datos);

    res.status(201).json({
      success: true,
      message: 'Factura creada exitosamente',
      data: resultado
    });

  } catch (error) {
    logger.error('Error en createFactura:', error);

    // Si es error de validación, devolver 400 con detalles
    if (error.message.startsWith('VALIDACION_EBI:')) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación EBI',
        detalles: error.message.replace('VALIDACION_EBI: ', '').split(' | ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno al crear factura',
      message: error.message
    });
  }
};

/**
 * GET /api/facturas - Listar facturas
 */
export const getFacturas = async (req, res) => {
  try {
    const db = getDatabase();
    const { estado, tipo_documento, desde, hasta, page = 1, limit = 50 } = req.query;

    let query = 'SELECT * FROM facturas WHERE 1=1';
    const params = [];

    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }
    if (tipo_documento) {
      query += ' AND tipo_documento = ?';
      params.push(tipo_documento);
    }
    if (desde) {
      query += ' AND fecha_emision >= ?';
      params.push(desde);
    }
    if (hasta) {
      query += ' AND fecha_emision <= ?';
      params.push(hasta);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const facturas = db.prepare(query).all(...params);

    // Contar total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total').split('LIMIT')[0];
    const countParams = params.slice(0, -2);
    const { total } = db.prepare(countQuery).get(...countParams) || { total: 0 };

    res.json({
      success: true,
      data: facturas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error en getFacturas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/facturas/:id - Obtener factura con detalles
 */
export const getFacturaById = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const factura = db.prepare('SELECT * FROM facturas WHERE id = ?').get(id);
    if (!factura) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    const items = db.prepare('SELECT * FROM factura_items WHERE factura_id = ?').all(id);
    const formasPago = db.prepare('SELECT * FROM factura_formas_pago WHERE factura_id = ?').all(id);
    const pagosPlazo = db.prepare('SELECT * FROM factura_pagos_plazo WHERE factura_id = ?').all(id);
    const descuentos = db.prepare('SELECT * FROM factura_descuentos WHERE factura_id = ?').all(id);

    res.json({
      success: true,
      data: {
        ...factura,
        items,
        formas_pago: formasPago,
        pagos_plazo: pagosPlazo,
        descuentos
      }
    });

  } catch (error) {
    logger.error('Error en getFacturaById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/facturas/:id/enviar - Generar XML y enviar a EBI
 */
export const enviarFacturaEBI = async (req, res) => {
  try {
    const { id } = req.params;

    const xml = await generarXMLEnviar(id);

    // Aquí iría la llamada SOAP real a EBI
    // Por ahora devolvemos el XML generado para revisión

    res.json({
      success: true,
      message: 'XML generado para envío a EBI',
      xml_preview: xml.substring(0, 500) + '...',
      // En producción: resultado de la llamada SOAP
    });

  } catch (error) {
    logger.error('Error en enviarFacturaEBI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/facturas/:id/xml - Descargar XML
 */
export const descargarXML = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const factura = db.prepare('SELECT xml_enviado, numero_documento_fiscal FROM facturas WHERE id = ?').get(id);
    if (!factura || !factura.xml_enviado) {
      return res.status(404).json({ success: false, error: 'XML no encontrado' });
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="FE_${factura.numero_documento_fiscal}.xml"`);
    res.send(factura.xml_enviado);

  } catch (error) {
    logger.error('Error en descargarXML:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/facturas/:id - Actualizar factura (solo si no enviada)
 */
export const updateFactura = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const updates = req.body;

    const factura = db.prepare('SELECT estado, enviada FROM facturas WHERE id = ?').get(id);
    if (!factura) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    if (factura.enviada === 1) {
      return res.status(400).json({ success: false, error: 'No se puede modificar una factura ya enviada a EBI' });
    }

    // Construir query dinámica
    const campos = Object.keys(updates).filter(k => k !== 'id' && k !== 'items');
    if (campos.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    const setClause = campos.map(c => `${c} = ?`).join(', ');
    const values = campos.map(c => updates[c]);

    db.prepare(`UPDATE facturas SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...values, id);

    res.json({ success: true, message: 'Factura actualizada' });

  } catch (error) {
    logger.error('Error en updateFactura:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/facturas/:id - Eliminar factura (solo si no enviada)
 */
export const deleteFactura = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const factura = db.prepare('SELECT enviada FROM facturas WHERE id = ?').get(id);
    if (!factura) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    if (factura.enviada === 1) {
      return res.status(400).json({ success: false, error: 'No se puede eliminar una factura enviada' });
    }

    db.prepare('DELETE FROM facturas WHERE id = ?').run(id);

    res.json({ success: true, message: 'Factura eliminada' });

  } catch (error) {
    logger.error('Error en deleteFactura:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  createFactura,
  getFacturas,
  getFacturaById,
  enviarFacturaEBI,
  descargarXML,
  updateFactura,
  deleteFactura
};
