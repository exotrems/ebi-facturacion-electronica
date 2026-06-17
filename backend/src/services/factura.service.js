import { FacturaModel, FacturaItemModel, FacturaFormaPagoModel, FacturaPagoPlazoModel, FacturaDescuentoModel } from '../models/factura.model.js';
import { EBIConfigModel } from '../models/ebiConfig.model.js';
import { CalculoService } from './calculo.service.js';
import { ebiSoapService } from '../soap/ebiSoapService.js';
import { FacturaZonaFrancaXMLGenerator } from '../xml/facturaZonaFrancaGenerator.js';
import { logger } from '../utils/logger.js';

export class FacturaService {
  static async crearFactura(facturaData) {
    try {
      logger.info('Creando factura...', { data: JSON.stringify(facturaData).substring(0, 500) });

      // Validar datos mínimos
      if (!facturaData.cliente_razon_social || !facturaData.cliente_numero_ruc) {
        throw new Error('Datos del cliente son requeridos (razon_social y numero_ruc)');
      }

      if (!facturaData.items || facturaData.items.length === 0) {
        throw new Error('La factura debe tener al menos un item');
      }

      // Calcular totales
      const totales = CalculoService.calcularTotales(
        facturaData.items || [],
        facturaData.descuentos || [],
        facturaData.formas_pago || [],
        facturaData.pagos_plazo || []
      );

      // Generar número de documento si no se proporciona
      if (!facturaData.numero_documento_fiscal) {
        facturaData.numero_documento_fiscal = CalculoService.generarNumeroDocumentoFiscal(facturaData.punto_facturacion_fiscal);
      }

      // Combinar datos de la factura con totales
      const facturaCompleta = { ...facturaData, ...totales };

      // Crear factura (síncrono con better-sqlite3)
      const facturaId = FacturaModel.create(facturaCompleta);
      logger.info(`Factura creada con ID: ${facturaId}`);

      // Crear items (síncrono)
      if (facturaData.items && facturaData.items.length > 0) {
        for (const item of facturaData.items) {
          FacturaItemModel.create({ ...item, factura_id: facturaId });
        }
        logger.info(`Items creados: ${facturaData.items.length}`);
      }

      // Crear formas de pago (síncrono)
      if (facturaData.formas_pago && facturaData.formas_pago.length > 0) {
        for (const fp of facturaData.formas_pago) {
          FacturaFormaPagoModel.create({ ...fp, factura_id: facturaId });
        }
      }

      // Crear pagos a plazo (síncrono)
      if (facturaData.pagos_plazo && facturaData.pagos_plazo.length > 0) {
        for (const pp of facturaData.pagos_plazo) {
          FacturaPagoPlazoModel.create({ ...pp, factura_id: facturaId });
        }
      }

      // Crear descuentos (síncrono)
      if (facturaData.descuentos && facturaData.descuentos.length > 0) {
        for (const d of facturaData.descuentos) {
          FacturaDescuentoModel.create({ ...d, factura_id: facturaId });
        }
      }

      logger.info(`Factura ${facturaId} creada exitosamente con ${facturaData.items?.length || 0} items`);

      return { 
        id: facturaId, 
        ...facturaCompleta,
        items: facturaData.items,
        formas_pago: facturaData.formas_pago
      };
    } catch (error) {
      logger.error('Error al crear factura:', error);
      throw error;
    }
  }

  static async obtenerFacturaCompleta(id) {
    const factura = FacturaModel.findById(id);
    if (!factura) return null;

    const items = FacturaItemModel.findByFacturaId(id);
    const formasPago = FacturaFormaPagoModel.findByFacturaId(id);
    const pagosPlazo = FacturaPagoPlazoModel.findByFacturaId(id);
    const descuentos = FacturaDescuentoModel.findByFacturaId(id);

    return {
      ...factura,
      items,
      formas_pago: formasPago,
      pagos_plazo: pagosPlazo,
      descuentos
    };
  }

  static async enviarEBI(facturaId) {
    try {
      const factura = await this.obtenerFacturaCompleta(facturaId);
      if (!factura) throw new Error('Factura no encontrada');

      const config = EBIConfigModel.get();
      if (!config) throw new Error('Configuracion EBI no encontrada');

      // Generar documento electrónico
      const documento = FacturaZonaFrancaXMLGenerator.generarDocumentoElectronico(
        factura, factura.items, factura.formas_pago, factura.pagos_plazo, factura.descuentos
      );

      // Enviar a EBI
      const resultado = await ebiSoapService.enviar(
        config.token_empresa,
        config.token_password,
        documento
      );

      // Actualizar estado en base de datos
      FacturaModel.updateEBIStatus(facturaId, {
        estado: resultado.success ? 'ENVIADA' : 'ERROR',
        cufe: resultado.cufe,
        qr: resultado.qr,
        fechaRecepcionDGI: resultado.fechaRecepcionDGI,
        nroProtocoloAutorizacion: resultado.nroProtocoloAutorizacion,
        mensaje: resultado.mensaje,
        codigo: resultado.codigo,
        enviada: resultado.success ? 1 : 0
      });

      return resultado;
    } catch (error) {
      logger.error(`Error al enviar factura ${facturaId} a EBI:`, error);
      throw error;
    }
  }

  static async consultarEstadoEBI(facturaId) {
    try {
      const factura = FacturaModel.findById(facturaId);
      if (!factura) throw new Error('Factura no encontrada');

      const config = EBIConfigModel.get();
      if (!config) throw new Error('Configuracion EBI no encontrada');

      const datosDocumento = {
        codigoSucursalEmisor: factura.codigo_sucursal_emisor,
        numeroDocumentoFiscal: factura.numero_documento_fiscal,
        puntoFacturacionFiscal: factura.punto_facturacion_fiscal,
        tipoDocumento: factura.tipo_documento,
        tipoEmision: factura.tipo_emision
      };

      const resultado = await ebiSoapService.estadoDocumento(
        config.token_empresa,
        config.token_password,
        datosDocumento
      );

      return resultado;
    } catch (error) {
      logger.error(`Error al consultar estado de factura ${facturaId}:`, error);
      throw error;
    }
  }

  static async anularFactura(facturaId, motivoAnulacion) {
    try {
      const factura = FacturaModel.findById(facturaId);
      if (!factura) throw new Error('Factura no encontrada');
      if (factura.anulada) throw new Error('La factura ya esta anulada');

      const config = EBIConfigModel.get();
      if (!config) throw new Error('Configuracion EBI no encontrada');

      const datosDocumento = {
        codigoSucursalEmisor: factura.codigo_sucursal_emisor,
        numeroDocumentoFiscal: factura.numero_documento_fiscal,
        puntoFacturacionFiscal: factura.punto_facturacion_fiscal,
        tipoDocumento: factura.tipo_documento,
        tipoEmision: factura.tipo_emision
      };

      const resultado = await ebiSoapService.anulacion(
        config.token_empresa,
        config.token_password,
        motivoAnulacion,
        datosDocumento
      );

      if (resultado.success) {
        FacturaModel.anular(facturaId, motivoAnulacion);
      }

      return resultado;
    } catch (error) {
      logger.error(`Error al anular factura ${facturaId}:`, error);
      throw error;
    }
  }

  static async descargarXML(facturaId) {
    try {
      const factura = FacturaModel.findById(facturaId);
      if (!factura) throw new Error('Factura no encontrada');

      const config = EBIConfigModel.get();
      if (!config) throw new Error('Configuracion EBI no encontrada');

      const datosDocumento = {
        codigoSucursalEmisor: factura.codigo_sucursal_emisor,
        numeroDocumentoFiscal: factura.numero_documento_fiscal,
        puntoFacturacionFiscal: factura.punto_facturacion_fiscal,
        tipoDocumento: factura.tipo_documento,
        tipoEmision: factura.tipo_emision
      };

      const resultado = await ebiSoapService.descargaXML(
        config.token_empresa,
        config.token_password,
        datosDocumento
      );

      return resultado;
    } catch (error) {
      logger.error(`Error al descargar XML de factura ${facturaId}:`, error);
      throw error;
    }
  }

  static async descargarPDF(facturaId) {
    try {
      const factura = FacturaModel.findById(facturaId);
      if (!factura) throw new Error('Factura no encontrada');

      const config = EBIConfigModel.get();
      if (!config) throw new Error('Configuracion EBI no encontrada');

      const datosDocumento = {
        codigoSucursalEmisor: factura.codigo_sucursal_emisor,
        numeroDocumentoFiscal: factura.numero_documento_fiscal,
        puntoFacturacionFiscal: factura.punto_facturacion_fiscal,
        serialDispositivo: '000001',
        tipoDocumento: factura.tipo_documento,
        tipoEmision: factura.tipo_emision
      };

      const resultado = await ebiSoapService.descargaPDF(
        config.token_empresa,
        config.token_password,
        datosDocumento
      );

      return resultado;
    } catch (error) {
      logger.error(`Error al descargar PDF de factura ${facturaId}:`, error);
      throw error;
    }
  }

  static async enviarCorreo(facturaId, correo) {
    try {
      const factura = FacturaModel.findById(facturaId);
      if (!factura) throw new Error('Factura no encontrada');

      const config = EBIConfigModel.get();
      if (!config) throw new Error('Configuracion EBI no encontrada');

      const datosDocumento = {
        codigoSucursalEmisor: factura.codigo_sucursal_emisor,
        numeroDocumentoFiscal: factura.numero_documento_fiscal,
        puntoFacturacionFiscal: factura.punto_facturacion_fiscal,
        tipoDocumento: factura.tipo_documento,
        tipoEmision: factura.tipo_emision
      };

      const resultado = await ebiSoapService.envioCorreo(
        config.token_empresa,
        config.token_password,
        datosDocumento,
        correo
      );

      return resultado;
    } catch (error) {
      logger.error(`Error al enviar correo de factura ${facturaId}:`, error);
      throw error;
    }
  }
}
