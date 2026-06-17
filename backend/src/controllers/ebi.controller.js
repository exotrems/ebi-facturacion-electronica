import { ebiSoapService } from '../soap/ebiSoapService.js';
import { EBIConfigModel } from '../models/ebiConfig.model.js';
import { FacturaModel } from '../models/factura.model.js';
import { logger } from '../utils/logger.js';

export const EBIController = {
  // Enviar documento directamente
  async enviar(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) return res.status(400).json({ success: false, message: 'Configuración EBI no encontrada' });

      const resultado = await ebiSoapService.enviar(
        config.token_empresa,
        config.token_password,
        req.body.documento
      );

      res.json({ success: resultado.success, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  // Estado de documento
  async estadoDocumento(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) return res.status(400).json({ success: false, message: 'Configuración EBI no encontrada' });

      const resultado = await ebiSoapService.estadoDocumento(
        config.token_empresa,
        config.token_password,
        req.body.datosDocumento
      );

      res.json({ success: resultado.success, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  // Anulación
  async anulacion(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) return res.status(400).json({ success: false, message: 'Configuración EBI no encontrada' });

      const resultado = await ebiSoapService.anulacion(
        config.token_empresa,
        config.token_password,
        req.body.motivoAnulacion,
        req.body.datosDocumento
      );

      res.json({ success: resultado.success, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  // Descarga XML
  async descargaXML(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) return res.status(400).json({ success: false, message: 'Configuración EBI no encontrada' });

      const resultado = await ebiSoapService.descargaXML(
        config.token_empresa,
        config.token_password,
        req.body.datosDocumento
      );

      if (resultado.success && resultado.documento) {
        const buffer = Buffer.from(resultado.documento, 'base64');
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=documento.xml');
        return res.send(buffer);
      }

      res.json({ success: resultado.success, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  // Envío Correo
  async envioCorreo(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) return res.status(400).json({ success: false, message: 'Configuración EBI no encontrada' });

      const resultado = await ebiSoapService.envioCorreo(
        config.token_empresa,
        config.token_password,
        req.body.datosDocumento,
        req.body.correo
      );

      res.json({ success: resultado.success, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  // Descarga PDF
  async descargaPDF(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) return res.status(400).json({ success: false, message: 'Configuración EBI no encontrada' });

      const resultado = await ebiSoapService.descargaPDF(
        config.token_empresa,
        config.token_password,
        req.body.datosDocumento
      );

      if (resultado.success && resultado.documento) {
        const buffer = Buffer.from(resultado.documento, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=documento.pdf');
        return res.send(buffer);
      }

      res.json({ success: resultado.success, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  // Consultar RUC DV
  async consultarRucDV(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) return res.status(400).json({ success: false, message: 'Configuración EBI no encontrada' });

      const { tipoRuc, ruc } = req.body;
      const resultado = await ebiSoapService.consultarRucDV(
        config.token_empresa,
        config.token_password,
        tipoRuc,
        ruc
      );

      res.json({ success: resultado.success, data: resultado });
    } catch (error) {
      next(error);
    }
  }
};
