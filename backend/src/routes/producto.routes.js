import { Router } from 'express';
import { ProductoController } from '../controllers/producto.controller.js';

const router = Router();

router.post('/', ProductoController.crear);
router.get('/', ProductoController.listar);
router.get('/:id', ProductoController.obtenerPorId);
router.put('/:id', ProductoController.actualizar);
router.delete('/:id', ProductoController.eliminar);

export default router;
