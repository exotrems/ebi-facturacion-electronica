import { FacturaModel, FacturaItemModel, FacturaFormaPagoModel, FacturaPagoPlazoModel, FacturaDescuentoModel } from '../models/factura.model.js';
import { FacturaService } from '../services/factura.service.js';
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

// Helper para normalizar fechas recibidas del frontend
// El frontend envia YYYY-MM-DD, pero a veces llega como ISO completo
function normalizarFecha(fechaStr) {
  if (!fechaStr) return null;
  // Si ya es formato YYYY-MM-DD, devolver tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    return fechaStr;
  }
  // Si es ISO completo, extraer solo la parte de fecha
  if (typeof fechaStr === 'string') {
    const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  return fechaStr;
}

export const FacturaController = {
  // Crear nueva factura
  async crear(req, res, next) {
    try {
      const factura = await FacturaService.crearFactura(req.body);
      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: factura
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener todas las facturas (con filtro opcional por fecha)
  async listar(req, res, next) {
    try {
      const { limit = 100, offset = 0, fecha_desde, fecha_hasta } = req.query;
      let facturas;

      if (fecha_desde && fecha_hasta) {
        // Filtrar por rango de fechas
        facturas = FacturaModel.findByDateRange(
          fecha_desde,
          fecha_hasta,
          parseInt(limit),
          parseInt(offset)
        );
      } else {
        // Listar todas
        facturas = FacturaModel.findAll(parseInt(limit), parseInt(offset));
      }

      res.json({
        success: true,
        count: facturas.length,
        data: facturas
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener factura por ID con todos sus detalles
  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const factura = await FacturaService.obtenerFacturaCompleta(parseInt(id));

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.json({
        success: true,
        data: factura
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== ACTUALIZAR FACTURA - CORREGIDO ==========
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const body = req.body;

      const factura = FacturaModel.findById(parseInt(id));
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      // No permitir modificar facturas ya enviadas
      if (factura.enviada) {
        return res.status(400).json({
          success: false,
          message: 'No se puede modificar una factura ya enviada a EBI'
        });
      }

      const db = getDatabase();

      // Separar datos de la factura de items y formas de pago
      const { items, formas_pago, ...facturaData } = body;

      // Datos de la factura principal (solo campos que existen en la tabla)
      const updates = {
        numero_documento_fiscal: safeValue(facturaData.numero_documento_fiscal, factura.numero_documento_fiscal),
        punto_facturacion_fiscal: safeValue(facturaData.punto_facturacion_fiscal, factura.punto_facturacion_fiscal),
        codigo_sucursal_emisor: safeValue(facturaData.codigo_sucursal_emisor, factura.codigo_sucursal_emisor),
        tipo_emision: safeValue(facturaData.tipo_emision, factura.tipo_emision),
        tipo_documento: safeValue(facturaData.tipo_documento, factura.tipo_documento),
        fecha_emision: normalizarFecha(safeValue(facturaData.fecha_emision, factura.fecha_emision)),
        fecha_salida: normalizarFecha(safeValue(facturaData.fecha_salida, factura.fecha_salida)),
        naturaleza_operacion: safeValue(facturaData.naturaleza_operacion, factura.naturaleza_operacion),
        tipo_operacion: safeValue(facturaData.tipo_operacion, factura.tipo_operacion),
        destino_operacion: safeValue(facturaData.destino_operacion, factura.destino_operacion),
        formato_cafe: safeValue(facturaData.formato_cafe, factura.formato_cafe),
        entrega_cafe: safeValue(facturaData.entrega_cafe, factura.entrega_cafe),
        envio_contenedor: safeValue(facturaData.envio_contenedor, factura.envio_contenedor),
        proceso_generacion: safeValue(facturaData.proceso_generacion, factura.proceso_generacion),
        tipo_venta: safeValue(facturaData.tipo_venta, factura.tipo_venta),
        tipo_sucursal: safeValue(facturaData.tipo_sucursal, factura.tipo_sucursal),
        informacion_interes: safeValue(facturaData.informacion_interes, factura.informacion_interes),
        cliente_id: safeNumber(facturaData.cliente_id, factura.cliente_id),
        cliente_tipo_cliente_fe: safeValue(facturaData.cliente_tipo_cliente_fe, factura.cliente_tipo_cliente_fe),
        cliente_tipo_contribuyente: safeValue(facturaData.cliente_tipo_contribuyente, factura.cliente_tipo_contribuyente),
        cliente_numero_ruc: safeValue(facturaData.cliente_numero_ruc, factura.cliente_numero_ruc),
        cliente_digito_verificador_ruc: safeValue(facturaData.cliente_digito_verificador_ruc, factura.cliente_digito_verificador_ruc),
        cliente_razon_social: safeValue(facturaData.cliente_razon_social, factura.cliente_razon_social),
        cliente_direccion: safeValue(facturaData.cliente_direccion, factura.cliente_direccion),
        cliente_codigo_ubicacion: safeValue(facturaData.cliente_codigo_ubicacion, factura.cliente_codigo_ubicacion),
        cliente_provincia: safeValue(facturaData.cliente_provincia, factura.cliente_provincia),
        cliente_distrito: safeValue(facturaData.cliente_distrito, factura.cliente_distrito),
        cliente_corregimiento: safeValue(facturaData.cliente_corregimiento, factura.cliente_corregimiento),
        cliente_telefono1: safeValue(facturaData.cliente_telefono1, factura.cliente_telefono1),
        cliente_correo_electronico1: safeValue(facturaData.cliente_correo_electronico1, factura.cliente_correo_electronico1),
        cliente_pais: safeValue(facturaData.cliente_pais, factura.cliente_pais),
        total_precio_neto: safeNumber(facturaData.total_precio_neto, factura.total_precio_neto),
        total_itbms: safeNumber(facturaData.total_itbms, factura.total_itbms),
        total_isc: safeNumber(facturaData.total_isc, factura.total_isc),
        total_monto_gravado: safeNumber(facturaData.total_monto_gravado, factura.total_monto_gravado),
        total_descuento: safeNumber(facturaData.total_descuento, factura.total_descuento),
        total_acarreo_cobrado: safeNumber(facturaData.total_acarreo_cobrado, factura.total_acarreo_cobrado),
        valor_seguro_cobrado: safeNumber(facturaData.valor_seguro_cobrado, factura.valor_seguro_cobrado),
        total_factura: safeNumber(facturaData.total_factura, factura.total_factura),
        total_valor_recibido: safeNumber(facturaData.total_valor_recibido, factura.total_valor_recibido),
        vuelto: facturaData.vuelto === undefined || facturaData.vuelto === null ? factura.vuelto : safeNumber(facturaData.vuelto),
        tiempo_pago: safeValue(facturaData.tiempo_pago, factura.tiempo_pago),
        nro_items: safeNumber(facturaData.nro_items, factura.nro_items),
        total_todos_items: safeNumber(facturaData.total_todos_items, factura.total_todos_items),
        total_otros_gastos: safeNumber(facturaData.total_otros_gastos, factura.total_otros_gastos)
      };

      // Transaccion para integridad
      const updateFactura = db.transaction(() => {
        // 1. Actualizar factura principal
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE facturas SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        stmt.run(...values, parseInt(id));

        // 2. Eliminar items antiguos
        FacturaItemModel.deleteByFacturaId(parseInt(id));

        // 3. Insertar nuevos items
        if (items && Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            FacturaItemModel.create({
              ...item,
              factura_id: parseInt(id)
            });
          }
        }

        // 4. Eliminar formas de pago antiguas
        FacturaFormaPagoModel.deleteByFacturaId(parseInt(id));

        // 5. Insertar nuevas formas de pago
        if (formas_pago && Array.isArray(formas_pago) && formas_pago.length > 0) {
          for (const fp of formas_pago) {
            FacturaFormaPagoModel.create({
              ...fp,
              factura_id: parseInt(id)
            });
          }
        }

        return true;
      });

      updateFactura();

      logger.info(`Factura ${id} actualizada correctamente`);

      res.json({
        success: true,
        message: 'Factura actualizada exitosamente',
        data: { id: parseInt(id) }
      });
    } catch (error) {
      logger.error(`Error actualizando factura ${req.params.id}:`, error);
      next(error);
    }
  },

  // Eliminar factura
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;

      const factura = FacturaModel.findById(parseInt(id));
      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      // No permitir eliminar facturas ya enviadas
      if (factura.enviada) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar una factura ya enviada a EBI'
        });
      }

      // Eliminar items relacionados
      FacturaItemModel.deleteByFacturaId(parseInt(id));

      // Eliminar formas de pago relacionadas
      FacturaFormaPagoModel.deleteByFacturaId(parseInt(id));

      const deleted = FacturaModel.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Factura eliminada exitosamente',
        data: { deleted }
      });
    } catch (error) {
      next(error);
    }
  },

  // ========== OPERACIONES EBI ==========

  // Enviar factura a EBI
  async enviarEBI(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await FacturaService.enviarEBI(parseInt(id));

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Operacion completada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  },

  // Consultar estado en EBI
  async consultarEstado(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await FacturaService.consultarEstadoEBI(parseInt(id));

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Estado consultado',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  },

  // Anular factura
  async anular(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({
          success: false,
          message: 'El motivo de anulacion es requerido'
        });
      }

      const resultado = await FacturaService.anularFactura(parseInt(id), motivo);

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Anulacion procesada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  },

  // Descargar XML
  async descargarXML(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await FacturaService.descargarXML(parseInt(id));

      if (resultado.success && resultado.documento) {
        const buffer = Buffer.from(resultado.documento, 'base64');
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=factura_${id}.xml`);
        return res.send(buffer);
      }

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Descarga procesada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  },

  // Descargar PDF
  async descargarPDF(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await FacturaService.descargarPDF(parseInt(id));

      if (resultado.success && resultado.documento) {
        const buffer = Buffer.from(resultado.documento, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura_${id}.pdf`);
        return res.send(buffer);
      }

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Descarga procesada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  },

  // Enviar por correo
  async enviarCorreo(req, res, next) {
    try {
      const { id } = req.params;
      const { correo } = req.body;

      if (!correo) {
        return res.status(400).json({
          success: false,
          message: 'El correo electronico es requerido'
        });
      }

      const resultado = await FacturaService.enviarCorreo(parseInt(id), correo);

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Correo enviado',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
};
