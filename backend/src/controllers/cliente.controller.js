import { ClienteModel } from '../models/cliente.model.js';
import { ebiSoapService } from '../soap/ebiSoapService.js';
import { EBIConfigModel } from '../models/ebiConfig.model.js';
import { logger } from '../utils/logger.js';

export const ClienteController = {
  async crear(req, res, next) {
    try {
      const clienteId = ClienteModel.create(req.body);
      const cliente = ClienteModel.findById(clienteId);
      res.status(201).json({ success: true, data: cliente });
    } catch (error) {
      next(error);
    }
  },

  async listar(req, res, next) {
    try {
      const clientes = ClienteModel.findAll();
      res.json({ success: true, count: clientes.length, data: clientes });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req, res, next) {
    try {
      const cliente = ClienteModel.findById(parseInt(req.params.id));
      if (!cliente) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      res.json({ success: true, data: cliente });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req, res, next) {
    try {
      const updated = ClienteModel.update(parseInt(req.params.id), req.body);
      res.json({ success: true, data: { updated } });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req, res, next) {
    try {
      const deleted = ClienteModel.delete(parseInt(req.params.id));
      res.json({ success: true, data: { deleted } });
    } catch (error) {
      next(error);
    }
  },

  // Consultar RUC DV vía EBI
  async obtenerPorRuc(req, res, next) {
    try {
      const { ruc } = req.params;
      if (!ruc) {
        return res.status(400).json({ success: false, message: 'RUC es requerido' });
      }
      const cliente = ClienteModel.findByRuc(ruc);
      if (!cliente) {
        return res.status(404).json({ success: false, message: 'Cliente no encontrado con ese RUC' });
      }
      res.json({ success: true, data: cliente });
    } catch (error) {
      next(error);
    }
  },

  async consultarRucDV(req, res, next) {
    try {
      const { tipoRuc, ruc } = req.body;

      if (!tipoRuc || !ruc) {
        return res.status(400).json({
          success: false,
          message: 'tipoRuc y ruc son requeridos'
        });
      }

      const config = EBIConfigModel.get();
      if (!config) {
        return res.status(400).json({
          success: false,
          message: 'Configuración EBI no encontrada'
        });
      }

      const resultado = await ebiSoapService.consultarRucDV(
        config.token_empresa,
        config.token_password,
        tipoRuc,
        ruc
      );

      res.json({
        success: resultado.success,
        message: resultado.mensaje || 'Consulta completada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
};
