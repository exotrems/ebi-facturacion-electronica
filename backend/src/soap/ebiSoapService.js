import soap from 'soap';
import { logger } from '../utils/logger.js';
import { getDatabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const EBI_WSDL_URL = process.env.EBI_WSDL_URL || 'https://test.ebi-pac.com/Service.svc?wsdl';

class EBISoapService {
  constructor() {
    this.client = null;
    this.wsdlUrl = EBI_WSDL_URL;
  }

  async initializeClient() {
    if (!this.client) {
      try {
        this.client = await soap.createClientAsync(this.wsdlUrl, {
          request: {
            timeout: 30000,
            headers: {
              'Content-Type': 'text/xml; charset=utf-8'
            }
          }
        });
        logger.info('Cliente SOAP EBI inicializado correctamente');
      } catch (error) {
        logger.error('Error al inicializar cliente SOAP EBI:', error);
        throw new Error(`No se pudo conectar con el servicio EBI: ${error.message}`);
      }
    }
    return this.client;
  }

  // 1. ENVIAR - Enviar documento electrónico
  async enviar(tokenEmpresa, tokenPassword, documento) {
    const client = await this.initializeClient();

    const args = {
      tokenEmpresa,
      tokenPassword,
      documento
    };

    try {
      logger.info('Enviando documento a EBI...');
      const [result] = await client.EnviarAsync(args);

      logger.info('Respuesta EBI Enviar:', { codigo: result?.EnviarResult?.codigo });

      return {
        success: result?.EnviarResult?.codigo === '200',
        codigo: result?.EnviarResult?.codigo,
        resultado: result?.EnviarResult?.resultado,
        mensaje: result?.EnviarResult?.mensaje,
        cufe: result?.EnviarResult?.cufe,
        qr: result?.EnviarResult?.qr,
        fechaRecepcionDGI: result?.EnviarResult?.fechaRecepcionDGI,
        nroProtocoloAutorizacion: result?.EnviarResult?.nroProtocoloAutorizacion,
        raw: result
      };
    } catch (error) {
      logger.error('Error al enviar documento a EBI:', error);
      throw error;
    }
  }

  // 2. ESTADO DOCUMENTO - Consultar estado
  async estadoDocumento(tokenEmpresa, tokenPassword, datosDocumento) {
    const client = await this.initializeClient();

    const args = {
      tokenEmpresa,
      tokenPassword,
      datosDocumento
    };

    try {
      logger.info('Consultando estado de documento en EBI...');
      const [result] = await client.EstadoDocumentoAsync(args);

      return {
        success: result?.EstadoDocumentoResult?.codigo === '200',
        codigo: result?.EstadoDocumentoResult?.codigo,
        mensaje: result?.EstadoDocumentoResult?.mensaje,
        cufe: result?.EstadoDocumentoResult?.cufe,
        fechaEmisionDocumento: result?.EstadoDocumentoResult?.fechaEmisionDocumento,
        fechaRecepcionDocumento: result?.EstadoDocumentoResult?.fechaRecepcionDocumento,
        estatusDocumento: result?.EstadoDocumentoResult?.estatusDocumento,
        mensajeDocumento: result?.EstadoDocumentoResult?.mensajeDocumento,
        resultado: result?.EstadoDocumentoResult?.resultado,
        raw: result
      };
    } catch (error) {
      logger.error('Error al consultar estado en EBI:', error);
      throw error;
    }
  }

  // 3. ANULACIÓN - Anular documento
  async anulacion(tokenEmpresa, tokenPassword, motivoAnulacion, datosDocumento) {
    const client = await this.initializeClient();

    const args = {
      tokenEmpresa,
      tokenPassword,
      motivoAnulacion,
      datosDocumento
    };

    try {
      logger.info('Anulando documento en EBI...');
      const [result] = await client.AnulacionDocumentoAsync(args);

      return {
        success: result?.AnulacionDocumentoResult?.codigo === '200',
        codigo: result?.AnulacionDocumentoResult?.codigo,
        resultado: result?.AnulacionDocumentoResult?.resultado,
        mensaje: result?.AnulacionDocumentoResult?.mensaje,
        raw: result
      };
    } catch (error) {
      logger.error('Error al anular documento en EBI:', error);
      throw error;
    }
  }

  // 4. DESCARGA XML - Descargar documento XML
  async descargaXML(tokenEmpresa, tokenPassword, datosDocumento) {
    const client = await this.initializeClient();

    const args = {
      tokenEmpresa,
      tokenPassword,
      datosDocumento
    };

    try {
      logger.info('Descargando XML de EBI...');
      const [result] = await client.DescargaXMLAsync(args);

      return {
        success: result?.DescargaXMLResult?.codigo === '200',
        codigo: result?.DescargaXMLResult?.codigo,
        resultado: result?.DescargaXMLResult?.resultado,
        mensaje: result?.DescargaXMLResult?.mensaje,
        documento: result?.DescargaXMLResult?.documento, // Base64
        raw: result
      };
    } catch (error) {
      logger.error('Error al descargar XML de EBI:', error);
      throw error;
    }
  }

  // 5. ENVIO CORREO - Enviar documento por correo
  async envioCorreo(tokenEmpresa, tokenPassword, datosDocumento, correo) {
    const client = await this.initializeClient();

    const args = {
      tokenEmpresa,
      tokenPassword,
      datosDocumento,
      correo
    };

    try {
      logger.info('Enviando documento por correo vía EBI...');
      const [result] = await client.EnvioCorreoAsync(args);

      return {
        success: result?.EnvioCorreoResult?.codigo === '200',
        codigo: result?.EnvioCorreoResult?.codigo,
        resultado: result?.EnvioCorreoResult?.resultado,
        mensaje: result?.EnvioCorreoResult?.mensaje,
        raw: result
      };
    } catch (error) {
      logger.error('Error al enviar correo vía EBI:', error);
      throw error;
    }
  }

  // 6. DESCARGA PDF - Descargar documento PDF
  async descargaPDF(tokenEmpresa, tokenPassword, datosDocumento) {
    const client = await this.initializeClient();

    const args = {
      tokenEmpresa,
      tokenPassword,
      datosDocumento
    };

    try {
      logger.info('Descargando PDF de EBI...');
      const [result] = await client.DescargaPDFAsync(args);

      return {
        success: result?.DescargaPDFResult?.codigo === '200',
        codigo: result?.DescargaPDFResult?.codigo,
        resultado: result?.DescargaPDFResult?.resultado,
        mensaje: result?.DescargaPDFResult?.mensaje,
        documento: result?.DescargaPDFResult?.documento, // Base64
        raw: result
      };
    } catch (error) {
      logger.error('Error al descargar PDF de EBI:', error);
      throw error;
    }
  }

  // 7. CONSULTAR RUC DV - Consultar dígito verificador
  async consultarRucDV(tokenEmpresa, tokenPassword, tipoRuc, ruc) {
    const client = await this.initializeClient();

    const args = {
      consultarRucDVRequest: {
        tokenEmpresa,
        tokenPassword,
        tipoRuc,
        ruc
      }
    };

    try {
      logger.info('Consultando RUC DV en EBI...');
      const [result] = await client.ConsultarRucDVAsync(args);

      return {
        success: result?.ConsultarRucDVResult?.codigo === '200',
        codigo: result?.ConsultarRucDVResult?.codigo,
        tipoRuc: result?.ConsultarRucDVResult?.infoRuc?.tipoRuc,
        ruc: result?.ConsultarRucDVResult?.infoRuc?.ruc,
        dv: result?.ConsultarRucDVResult?.infoRuc?.dv,
        razonSocial: result?.ConsultarRucDVResult?.infoRuc?.razonSocial,
        afiliadoFE: result?.ConsultarRucDVResult?.infoRuc?.afiliadoFE,
        mensaje: result?.ConsultarRucDVResult?.mensaje,
        resultado: result?.ConsultarRucDVResult?.resultado,
        raw: result
      };
    } catch (error) {
      logger.error('Error al consultar RUC DV en EBI:', error);
      throw error;
    }
  }
}

export const ebiSoapService = new EBISoapService();
