import { Router } from 'express';
import { FacturaController } from '../controllers/factura.controller.js';

const router = Router();

// CRUD Facturas
router.post('/', FacturaController.crear);
router.get('/', FacturaController.listar);
router.get('/:id', FacturaController.obtenerPorId);
router.put('/:id', FacturaController.actualizar);
router.delete('/:id', FacturaController.eliminar);

// Operaciones EBI
router.post('/:id/enviar', FacturaController.enviarEBI);
router.get('/:id/estado', FacturaController.consultarEstado);
router.post('/:id/anular', FacturaController.anular);
router.get('/:id/xml', FacturaController.descargarXML);
router.get('/:id/pdf', FacturaController.descargarPDF);
router.post('/:id/correo', FacturaController.enviarCorreo);

export default router;
