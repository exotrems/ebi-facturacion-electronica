import { ProductoModel } from '../models/producto.model.js';

export const ProductoController = {
  async crear(req, res, next) {
    try {
      const productoId = ProductoModel.create(req.body);
      const producto = ProductoModel.findById(productoId);
      res.status(201).json({ success: true, data: producto });
    } catch (error) {
      next(error);
    }
  },

  async listar(req, res, next) {
    try {
      const productos = ProductoModel.findAll();
      res.json({ success: true, count: productos.length, data: productos });
    } catch (error) {
      next(error);
    }
  },

  async obtenerPorId(req, res, next) {
    try {
      const producto = ProductoModel.findById(parseInt(req.params.id));
      if (!producto) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
      res.json({ success: true, data: producto });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req, res, next) {
    try {
      const updated = ProductoModel.update(parseInt(req.params.id), req.body);
      res.json({ success: true, data: { updated } });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req, res, next) {
    try {
      const deleted = ProductoModel.delete(parseInt(req.params.id));
      res.json({ success: true, data: { deleted } });
    } catch (error) {
      next(error);
    }
  }
};
