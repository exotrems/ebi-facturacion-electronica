import { FacturaModel, FacturaItemModel, FacturaFormaPagoModel, FacturaPagoPlazoModel, FacturaDescuentoModel } from '../models/factura.model.js';
import { FacturaService } from '../services/factura.service.js';
import { logger } from '../utils/logger.js';

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

  // Obtener todas las facturas
  async listar(req, res, next) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const facturas = FacturaModel.findAll(parseInt(limit), parseInt(offset));
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

  // Actualizar factura
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

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

      const updated = FacturaModel.update(parseInt(id), updates);

      res.json({
        success: true,
        message: 'Factura actualizada exitosamente',
        data: { updated }
      });
    } catch (error) {
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
        message: resultado.mensaje || 'Operación completada',
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
          message: 'El motivo de anulación es requerido'
        });
      }

      const resultado = await FacturaService.anularFactura(parseInt(id), motivo);

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Anulación procesada',
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
          message: 'El correo electrónico es requerido'
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
