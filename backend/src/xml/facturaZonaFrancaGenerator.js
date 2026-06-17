import { XMLBuilder } from 'fast-xml-parser';
import { logger } from '../utils/logger.js';

export class FacturaZonaFrancaXMLGenerator {

  static generarDocumentoElectronico(factura, items, formasPago, pagosPlazo, descuentos) {
    try {
      // Construir el documento según el esquema EBI
      const documento = {
        codigoSucursalEmisor: factura.codigo_sucursal_emisor || '0000',
        tipoSucursal: factura.tipo_sucursal || '1',
        datosTransaccion: {
          tipoEmision: factura.tipo_emision || '01',
          tipoDocumento: factura.tipo_documento || '08',
          numeroDocumentoFiscal: factura.numero_documento_fiscal,
          puntoFacturacionFiscal: factura.punto_facturacion_fiscal || '001',
          fechaEmision: factura.fecha_emision,
          fechaSalida: factura.fecha_salida || factura.fecha_emision,
          naturalezaOperacion: factura.naturaleza_operacion || '01',
          tipoOperacion: factura.tipo_operacion || '1',
          destinoOperacion: factura.destino_operacion || '1',
          formatoCAFE: factura.formato_cafe || '3',
          entregaCAFE: factura.entrega_cafe || '3',
          envioContenedor: factura.envio_contenedor || '1',
          procesoGeneracion: factura.proceso_generacion || '1',
          tipoVenta: factura.tipo_venta || '',
          informacionInteres: factura.informacion_interes || 'Factura Zona Franca',
          cliente: {
            tipoClienteFE: factura.cliente_tipo_cliente_fe || '01',
            tipoContribuyente: factura.cliente_tipo_contribuyente || '2',
            numeroRUC: factura.cliente_numero_ruc,
            digitoVerificadorRUC: factura.cliente_digito_verificador_ruc,
            razonSocial: factura.cliente_razon_social,
            direccion: factura.cliente_direccion,
            codigoUbicacion: factura.cliente_codigo_ubicacion,
            provincia: factura.cliente_provincia,
            distrito: factura.cliente_distrito,
            corregimiento: factura.cliente_corregimiento,
            tipoIdentificacion: '',
            nroIdentificacionExtranjero: '',
            paisExtranjero: '',
            telefono1: factura.cliente_telefono1 || '',
            telefono2: '',
            telefono3: '',
            correoElectronico1: factura.cliente_correo_electronico1 || '',
            correoElectronico2: '',
            correoElectronico3: '',
            pais: factura.cliente_pais || 'PA',
            paisOtro: ''
          }
        },
        listaItems: {
          item: items.map(item => ({
            descripcion: item.descripcion,
            codigo: item.codigo || '',
            unidadMedida: item.unidad_medida || 'um',
            cantidad: item.cantidad.toFixed(6),
            fechaFabricacion: item.fecha_fabricacion || '',
            fechaCaducidad: item.fecha_caducidad || '',
            codigoCPBSAbrev: item.codigo_cpbs_abrev || '',
            codigoCPBS: item.codigo_cpbs || '',
            unidadMedidaCPBS: item.unidad_medida_cpbs || '',
            infoItem: item.info_item || '',
            precioUnitario: item.precio_unitario.toFixed(6),
            precioUnitarioDescuento: item.precio_unitario_descuento ? item.precio_unitario_descuento.toFixed(6) : '',
            precioItem: item.precio_item.toFixed(6),
            precioAcarreo: item.precio_acarreo ? item.precio_acarreo.toFixed(2) : '',
            precioSeguro: item.precio_seguro ? item.precio_seguro.toFixed(2) : '',
            valorTotal: item.valor_total.toFixed(6),
            codigoGTIN: item.codigo_gtin || '0',
            cantGTINCom: item.cant_gtin_com ? item.cant_gtin_com.toFixed(2) : '0.00',
            codigoGTINInv: item.codigo_gtin_inv || '0',
            cantGTINComInv: item.cant_gtin_com_inv ? item.cant_gtin_com_inv.toFixed(2) : '0.00',
            tasaITBMS: item.tasa_itbms || '01',
            valorITBMS: item.valor_itbms.toFixed(4)
          }))
        },
        totalesSubTotales: {
          totalPrecioNeto: factura.total_precio_neto.toFixed(2),
          totalITBMS: factura.total_itbms.toFixed(2),
          totalISC: factura.total_isc ? factura.total_isc.toFixed(2) : '',
          totalMontoGravado: factura.total_monto_gravado.toFixed(2),
          totalDescuento: factura.total_descuento ? factura.total_descuento.toFixed(2) : '',
          totalAcarreoCobrado: factura.total_acarreo_cobrado ? factura.total_acarreo_cobrado.toFixed(2) : '',
          valorSeguroCobrado: factura.valor_seguro_cobrado ? factura.valor_seguro_cobrado.toFixed(2) : '',
          totalOtrosGastos: factura.total_otros_gastos ? factura.total_otros_gastos.toFixed(2) : '',
          totalFactura: factura.total_factura.toFixed(2),
          totalValorRecibido: factura.total_valor_recibido.toFixed(2),
          tiempoPago: factura.tiempo_pago || '1',
          nroItems: factura.nro_items.toString(),
          totalTodosItems: factura.total_todos_items.toFixed(2),
          listaFormaPago: {
            formaPago: formasPago.map(fp => ({
              formaPagoFact: fp.forma_pago_fact || '02',
              descFormaPago: fp.desc_forma_pago || '',
              valorCuotaPagada: fp.valor_cuota_pagada.toFixed(2)
            }))
          },
          ...(pagosPlazo && pagosPlazo.length > 0 ? {
            listaPagoPlazo: {
              pagoPlazo: pagosPlazo.map(pp => ({
                fechaVenceCuota: pp.fecha_vence_cuota,
                valorCuota: pp.valor_cuota.toFixed(2)
              }))
            }
          } : {})
        },
        usoPosterior: {
          cufe: factura.cufe || ''
        }
      };

      logger.info('Documento electrónico generado exitosamente');
      return documento;
    } catch (error) {
      logger.error('Error al generar documento electrónico:', error);
      throw error;
    }
  }

  static generarXMLSoap(tokenEmpresa, tokenPassword, documento) {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true
    });

    const soapEnvelope = {
      'soapenv:Envelope': {
        '@_xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        '@_xmlns:tem': 'http://tempuri.org/',
        '@_xmlns:ser': 'http://schemas.datacontract.org/2004/07/Services.Model',
        'soapenv:Header': {},
        'soapenv:Body': {
          'tem:Enviar': {
            'tem:tokenEmpresa': tokenEmpresa,
            'tem:tokenPassword': tokenPassword,
            'tem:documento': documento
          }
        }
      }
    };

    return builder.build(soapEnvelope);
  }

  static generarXMLEstadoDocumento(tokenEmpresa, tokenPassword, datosDocumento) {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true
    });

    const soapEnvelope = {
      'soapenv:Envelope': {
        '@_xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        '@_xmlns:tem': 'http://tempuri.org/',
        '@_xmlns:ser': 'http://schemas.datacontract.org/2004/07/Services.Model',
        'soapenv:Header': {},
        'soapenv:Body': {
          'tem:EstadoDocumento': {
            'tem:tokenEmpresa': tokenEmpresa,
            'tem:tokenPassword': tokenPassword,
            'tem:datosDocumento': {
              'ser:codigoSucursalEmisor': datosDocumento.codigoSucursalEmisor,
              'ser:numeroDocumentoFiscal': datosDocumento.numeroDocumentoFiscal,
              'ser:puntoFacturacionFiscal': datosDocumento.puntoFacturacionFiscal,
              'ser:tipoDocumento': datosDocumento.tipoDocumento,
              'ser:tipoEmision': datosDocumento.tipoEmision
            }
          }
        }
      }
    };

    return builder.build(soapEnvelope);
  }

  static generarXMLAnulacion(tokenEmpresa, tokenPassword, motivoAnulacion, datosDocumento) {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      suppressEmptyNode: true
    });

    const soapEnvelope = {
      'soapenv:Envelope': {
        '@_xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        '@_xmlns:tem': 'http://tempuri.org/',
        '@_xmlns:ser': 'http://schemas.datacontract.org/2004/07/Services.Model',
        'soapenv:Header': {},
        'soapenv:Body': {
          'tem:AnulacionDocumento': {
            'tem:tokenEmpresa': tokenEmpresa,
            'tem:tokenPassword': tokenPassword,
            'tem:motivoAnulacion': motivoAnulacion,
            'tem:datosDocumento': {
              'ser:codigoSucursalEmisor': datosDocumento.codigoSucursalEmisor,
              'ser:numeroDocumentoFiscal': datosDocumento.numeroDocumentoFiscal,
              'ser:puntoFacturacionFiscal': datosDocumento.puntoFacturacionFiscal,
              'ser:tipoDocumento': datosDocumento.tipoDocumento,
              'ser:tipoEmision': datosDocumento.tipoEmision
            }
          }
        }
      }
    };

    return builder.build(soapEnvelope);
  }
}
