import { Router } from 'express';
import { EBIController } from '../controllers/ebi.controller.js';

const router = Router();

router.post('/enviar', EBIController.enviar);
router.post('/estado-documento', EBIController.estadoDocumento);
router.post('/anulacion', EBIController.anulacion);
router.post('/descarga-xml', EBIController.descargaXML);
router.post('/envio-correo', EBIController.envioCorreo);
router.post('/descarga-pdf', EBIController.descargaPDF);
router.post('/consultar-ruc-dv', EBIController.consultarRucDV);

export default router;
