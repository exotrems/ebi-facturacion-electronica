import { EBIConfigModel } from '../models/ebiConfig.model.js';

export const ConfigController = {
  async obtener(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) {
        return res.status(404).json({ success: false, message: 'Configuración no encontrada' });
      }
      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  },

  async crear(req, res, next) {
    try {
      const configId = EBIConfigModel.create(req.body);
      const config = EBIConfigModel.get();
      res.status(201).json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req, res, next) {
    try {
      const config = EBIConfigModel.get();
      if (!config) {
        return res.status(404).json({ success: false, message: 'Configuración no encontrada' });
      }
      const updated = EBIConfigModel.update(config.id, req.body);
      res.json({ success: true, data: { updated } });
    } catch (error) {
      next(error);
    }
  }
};
