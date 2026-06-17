import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller.js';

const router = Router();

router.get('/', ConfigController.obtener);
router.post('/', ConfigController.crear);
router.put('/', ConfigController.actualizar);

export default router;
