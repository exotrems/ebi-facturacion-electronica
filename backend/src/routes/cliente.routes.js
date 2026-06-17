import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller.js';

const router = Router();

router.post('/', ClienteController.crear);
router.get('/', ClienteController.listar);
router.get('/:id', ClienteController.obtenerPorId);
router.put('/:id', ClienteController.actualizar);
router.delete('/:id', ClienteController.eliminar);
router.post('/consultar-ruc', ClienteController.consultarRucDV);

export default router;
