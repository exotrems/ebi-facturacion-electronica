import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller.js';

const router = Router();

router.post('/', ClienteController.crear);
router.get('/', ClienteController.listar);

// Buscar por RUC - DEBE ir antes de /:id para evitar conflictos de routing
router.get('/buscar-ruc/:ruc', ClienteController.obtenerPorRuc);

router.get('/:id', ClienteController.obtenerPorId);
router.put('/:id', ClienteController.actualizar);
router.delete('/:id', ClienteController.eliminar);
router.post('/consultar-ruc', ClienteController.consultarRucDV);

export default router;
