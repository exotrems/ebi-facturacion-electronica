import { logger } from '../utils/logger.js';

/**
 * Utilidad para escapar valores XML y evitar nodos vacíos inválidos
 */
const safeXML = (value) => {
  if (value === null || value === undefined || value === '') return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const safeNode = (tag, value) => {
  if (value === null || value === undefined || value === '') return '';
  return `<ser:${tag}>${safeXML(value)}</ser:${tag}>`;
};

/**
 * Genera el nodo Cliente según tipoClienteFE
 * REGLAS EBI:
 * - tipoClienteFE = 04 (Extranjero): NO enviar tipoContribuyente, numeroRUC, digitoVerificadorRUC, 
 *   codigoUbicacion, provincia, distrito, corregimiento. 
 *   OBLIGATORIO: tipoIdentificacion, nroIdentificacionExtranjero
 * - tipoClienteFE = 01/03 (Contribuyente/Gobierno): OBLIGATORIO RUC, DV, razón social, dirección, 
 *   ubicación, provincia, distrito, corregimiento
 * - tipoClienteFE = 02 (Consumidor final): RUC opcional, DV opcional
 */
const buildCliente = (cliente) => {
  const tipo = cliente.tipo_cliente_fe || '02';
  const nodes = [];

  // Siempre presente
  nodes.push(`<ser:tipoClienteFE>${tipo}</ser:tipoClienteFE>`);

  if (tipo === '04') {
    // ===== CLIENTE EXTRANJERO =====
    // NO enviar: tipoContribuyente, numeroRUC, digitoVerificadorRUC, codigoUbicacion, 
    // provincia, distrito, corregimiento

    nodes.push(safeNode('razonSocial', cliente.razon_social));

    // OBLIGATORIOS para extranjero
    nodes.push(`<ser:tipoIdentificacion>${cliente.tipo_identificacion || '01'}</ser:tipoIdentificacion>`);
    nodes.push(`<ser:nroIdentificacionExtranjero>${cliente.nro_identificacion_extranjero || ''}</ser:nroIdentificacionExtranjero>`);

    // paisExtranjero: Solo si tipoIdentificacion = 01 (Pasaporte)
    if (cliente.tipo_identificacion === '01' && cliente.pais_extranjero) {
      nodes.push(safeNode('paisExtranjero', cliente.pais_extranjero));
    }

  } else if (tipo === '01' || tipo === '03') {
    // ===== CONTRIBUYENTE (01) o GOBIERNO (03) =====
    // OBLIGATORIOS: tipoContribuyente, numeroRUC, digitoVerificadorRUC, razonSocial, 
    // direccion, codigoUbicacion, provincia, distrito, corregimiento

    nodes.push(`<ser:tipoContribuyente>${cliente.tipo_contribuyente || '2'}</ser:tipoContribuyente>`);
    nodes.push(`<ser:numeroRUC>${cliente.numero_ruc || ''}</ser:numeroRUC>`);
    nodes.push(`<ser:digitoVerificadorRUC>${cliente.digito_verificador_ruc || ''}</ser:digitoVerificadorRUC>`);
    nodes.push(safeNode('razonSocial', cliente.razon_social));
    nodes.push(safeNode('direccion', cliente.direccion));
    nodes.push(`<ser:codigoUbicacion>${cliente.codigo_ubicacion || ''}</ser:codigoUbicacion>`);
    nodes.push(safeNode('provincia', cliente.provincia));
    nodes.push(safeNode('distrito', cliente.distrito));
    nodes.push(safeNode('corregimiento', cliente.corregimiento));

  } else {
    // ===== CONSUMIDOR FINAL (02) =====
    // RUC y DV opcionales
    nodes.push(`<ser:tipoContribuyente>${cliente.tipo_contribuyente || '1'}</ser:tipoContribuyente>`);

    if (cliente.numero_ruc) {
      nodes.push(`<ser:numeroRUC>${cliente.numero_ruc}</ser:numeroRUC>`);
      if (cliente.digito_verificador_ruc) {
        nodes.push(`<ser:digitoVerificadorRUC>${cliente.digito_verificador_ruc}</ser:digitoVerificadorRUC>`);
      }
    }

    nodes.push(safeNode('razonSocial', cliente.razon_social));
  }

  // Campos comunes opcionales (para todos los tipos)
  nodes.push(safeNode('telefono1', cliente.telefono1));
  nodes.push(safeNode('telefono2', cliente.telefono2));
  nodes.push(safeNode('telefono3', cliente.telefono3));
  nodes.push(safeNode('correoElectronico1', cliente.correo_electronico1));
  nodes.push(safeNode('correoElectronico2', cliente.correo_electronico2));
  nodes.push(safeNode('correoElectronico3', cliente.correo_electronico3));

  // País
  const pais = cliente.pais || 'PA';
  nodes.push(`<ser:pais>${pais}</ser:pais>`);

  if (pais === 'ZZ' && cliente.pais_otro) {
    nodes.push(safeNode('paisOtro', cliente.pais_otro));
  }

  return `<ser:cliente>\n${nodes.filter(n => n).join('\n')}\n</ser:cliente>`;
};

/**
 * Genera datos de exportación si destinoOperacion = 2
 */
const buildDatosExportacion = (datosExp) => {
  if (!datosExp) return '';

  const nodes = [];
  nodes.push(`<ser:condicionesEntrega>${datosExp.condiciones_entrega || 'FOB'}</ser:condicionesEntrega>`);
  nodes.push(`<ser:monedaOperExportacion>${datosExp.moneda_oper_exportacion || 'USD'}</ser:monedaOperExportacion>`);

  if (datosExp.moneda_oper_exportacion === 'ZZZ' && datosExp.moneda_oper_exportacion_non_def) {
    nodes.push(safeNode('monedaOperExportacionNonDef', datosExp.moneda_oper_exportacion_non_def));
  }

  if (datosExp.moneda_oper_exportacion && datosExp.moneda_oper_exportacion !== 'USD') {
    if (datosExp.tipo_de_cambio) {
      nodes.push(`<ser:tipoDeCambio>${datosExp.tipo_de_cambio}</ser:tipoDeCambio>`);
    }
    if (datosExp.monto_moneda_extranjera) {
      nodes.push(`<ser:montoMonedaExtranjera>${datosExp.monto_moneda_extranjera}</ser:montoMonedaExtranjera>`);
    }
  }

  nodes.push(safeNode('puertoEmbarque', datosExp.puerto_embarque));

  return `<ser:datosFacturaExportacion>\n${nodes.filter(n => n).join('\n')}\n</ser:datosFacturaExportacion>`;
};

/**
 * Genera lista de items
 */
const buildItems = (items) => {
  if (!items || items.length === 0) return '';

  const itemNodes = items.map(item => {
    const nodes = [];
    nodes.push(safeNode('descripcion', item.descripcion));
    nodes.push(safeNode('codigo', item.codigo));
    nodes.push(safeNode('unidadMedida', item.unidad_medida));
    nodes.push(`<ser:cantidad>${item.cantidad || '1.00'}</ser:cantidad>`);
    nodes.push(safeNode('fechaFabricacion', item.fecha_fabricacion));
    nodes.push(safeNode('fechaCaducidad', item.fecha_caducidad));
    nodes.push(safeNode('codigoCPBSAbrev', item.codigo_cpbs_abrev));
    nodes.push(safeNode('codigoCPBS', item.codigo_cpbs));
    nodes.push(safeNode('unidadMedidaCPBS', item.unidad_medida_cpbs));
    nodes.push(safeNode('infoItem', item.info_item));
    nodes.push(`<ser:precioUnitario>${item.precio_unitario || '0.00'}</ser:precioUnitario>`);
    nodes.push(safeNode('precioUnitarioDescuento', item.precio_unitario_descuento));
    nodes.push(`<ser:precioItem>${item.precio_item || '0.00'}</ser:precioItem>`);
    nodes.push(safeNode('precioAcarreo', item.precio_acarreo));
    nodes.push(safeNode('precioSeguro', item.precio_seguro));
    nodes.push(`<ser:valorTotal>${item.valor_total || '0.00'}</ser:valorTotal>`);
    nodes.push(`<ser:codigoGTIN>${item.codigo_gtin || '0'}</ser:codigoGTIN>`);
    nodes.push(`<ser:cantGTINCom>${item.cant_gtin_com || '0.00'}</ser:cantGTINCom>`);
    nodes.push(`<ser:codigoGTINInv>${item.codigo_gtin_inv || '0'}</ser:codigoGTINInv>`);
    nodes.push(`<ser:cantGTINComInv>${item.cant_gtin_com_inv || '0.00'}</ser:cantGTINComInv>`);
    nodes.push(`<ser:tasaITBMS>${item.tasa_itbms || '00'}</ser:tasaITBMS>`);
    nodes.push(`<ser:valorITBMS>${item.valor_itbms || '0.00'}</ser:valorITBMS>`);

    // OTI opcional
    if (item.tasa_isc || item.valor_isc) {
      nodes.push(`<ser:tasaISC>${item.tasa_isc || '0.00'}</ser:tasaISC>`);
      nodes.push(`<ser:valorISC>${item.valor_isc || '0.00'}</ser:valorISC>`);
    }

    return `<ser:item>\n${nodes.filter(n => n).join('\n')}\n</ser:item>`;
  });

  return `<ser:listaItems>\n${itemNodes.join('\n')}\n</ser:listaItems>`;
};

/**
 * Genera totales y formas de pago
 */
const buildTotales = (factura, formasPago, pagosPlazo) => {
  const nodes = [];
  nodes.push(`<ser:totalPrecioNeto>${factura.total_precio_neto || '0.00'}</ser:totalPrecioNeto>`);
  nodes.push(`<ser:totalITBMS>${factura.total_itbms || '0.00'}</ser:totalITBMS>`);
  nodes.push(`<ser:totalISC>${factura.total_isc || '0.00'}</ser:totalISC>`);
  nodes.push(`<ser:totalMontoGravado>${factura.total_monto_gravado || '0.00'}</ser:totalMontoGravado>`);
  nodes.push(safeNode('totalDescuento', factura.total_descuento));
  nodes.push(safeNode('totalAcarreoCobrado', factura.total_acarreo_cobrado));
  nodes.push(safeNode('valorSeguroCobrado', factura.valor_seguro_cobrado));
  nodes.push(`<ser:totalFactura>${factura.total_factura || '0.00'}</ser:totalFactura>`);
  nodes.push(`<ser:totalValorRecibido>${factura.total_valor_recibido || '0.00'}</ser:totalValorRecibido>`);

  if (factura.vuelto) {
    nodes.push(`<ser:vuelto>${factura.vuelto}</ser:vuelto>`);
  }

  nodes.push(`<ser:tiempoPago>${factura.tiempo_pago || '1'}</ser:tiempoPago>`);
  nodes.push(`<ser:nroItems>${factura.nro_items || '0'}</ser:nroItems>`);
  nodes.push(`<ser:totalTodosItems>${factura.total_todos_items || '0.00'}</ser:totalTodosItems>`);
  nodes.push(safeNode('totalOtrosGastos', factura.total_otros_gastos));

  // Formas de pago
  if (formasPago && formasPago.length > 0) {
    const fpNodes = formasPago.map(fp => {
      const fpInner = [];
      fpInner.push(`<ser:formaPagoFact>${fp.forma_pago_fact || '02'}</ser:formaPagoFact>`);
      fpInner.push(safeNode('descFormaPago', fp.desc_forma_pago));
      fpInner.push(`<ser:valorCuotaPagada>${fp.valor_cuota_pagada || '0.00'}</ser:valorCuotaPagada>`);
      return `<ser:formaPago>\n${fpInner.filter(n => n).join('\n')}\n</ser:formaPago>`;
    });
    nodes.push(`<ser:listaFormaPago>\n${fpNodes.join('\n')}\n</ser:listaFormaPago>`);
  }

  // Pagos a plazo (obligatorio si tiempoPago = 2 o 3)
  if ((factura.tiempo_pago === '2' || factura.tiempo_pago === '3') && pagosPlazo && pagosPlazo.length > 0) {
    const ppNodes = pagosPlazo.map(pp => {
      const ppInner = [];
      ppInner.push(`<ser:fechaVenceCuota>${pp.fecha_vence_cuota}</ser:fechaVenceCuota>`);
      ppInner.push(`<ser:valorCuota>${pp.valor_cuota || '0.00'}</ser:valorCuota>`);
      ppInner.push(safeNode('infoPagoCuota', pp.info_pago_cuota));
      return `<ser:pagoPlazo>\n${ppInner.filter(n => n).join('\n')}\n</ser:pagoPlazo>`;
    });
    nodes.push(`<ser:listaPagoPlazo>\n${ppNodes.join('\n')}\n</ser:listaPagoPlazo>`);
  }

  return `<ser:totalesSubTotales>\n${nodes.filter(n => n).join('\n')}\n</ser:totalesSubTotales>`;
};

/**
 * Genera el XML completo para enviar a EBI
 */
export const generateEBIXML = (factura, cliente, items, formasPago, pagosPlazo, datosExportacion) => {
  try {
    const tipoDoc = factura.tipo_documento || '08';
    const destino = factura.destino_operacion || '1';

    // Validación cruzada: tipoClienteFE vs destinoOperacion
    if (cliente.tipo_cliente_fe === '04' && destino !== '2') {
      logger.warn('Cliente extranjero requiere destinoOperacion=2. Forzando...');
      factura.destino_operacion = '2';
    }

    // Zona Franca: tipoVenta debe ser vacío
    let tipoVenta = factura.tipo_venta || '';
    if (tipoDoc === '08') {
      tipoVenta = '';
    }

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ser="http://schemas.datacontract.org/2004/07/Services">
  <soapenv:Body>
    <tem:Enviar>
      <tem:tokenEmpresa>{{TOKEN_EMPRESA}}</tem:tokenEmpresa>
      <tem:tokenPassword>{{TOKEN_PASSWORD}}</tem:tokenPassword>
      <tem:documento>
        <ser:codigoSucursalEmisor>${factura.codigo_sucursal_emisor || '0000'}</ser:codigoSucursalEmisor>
        <ser:tipoSucursal>${factura.tipo_sucursal || '1'}</ser:tipoSucursal>
        <ser:datosTransaccion>
          <ser:tipoEmision>${factura.tipo_emision || '01'}</ser:tipoEmision>
          <ser:tipoDocumento>${tipoDoc}</ser:tipoDocumento>
          <ser:numeroDocumentoFiscal>${factura.numero_documento_fiscal || '0000000001'}</ser:numeroDocumentoFiscal>
          <ser:puntoFacturacionFiscal>${factura.punto_facturacion_fiscal || '001'}</ser:puntoFacturacionFiscal>
          <ser:fechaEmision>${factura.fecha_emision}</ser:fechaEmision>
          ${safeNode('fechaSalida', factura.fecha_salida)}
          <ser:naturalezaOperacion>${factura.naturaleza_operacion || '01'}</ser:naturalezaOperacion>
          <ser:tipoOperacion>${factura.tipo_operacion || '1'}</ser:tipoOperacion>
          <ser:destinoOperacion>${factura.destino_operacion || '1'}</ser:destinoOperacion>
          <ser:formatoCAFE>${factura.formato_cafe || '1'}</ser:formatoCAFE>
          <ser:entregaCAFE>${factura.entrega_cafe || '1'}</ser:entregaCAFE>
          <ser:envioContenedor>${factura.envio_contenedor || '1'}</ser:envioContenedor>
          <ser:procesoGeneracion>${factura.proceso_generacion || '1'}</ser:procesoGeneracion>
          ${tipoVenta ? `<ser:tipoVenta>${tipoVenta}</ser:tipoVenta>` : ''}
          ${safeNode('informacionInteres', factura.informacion_interes)}
          ${buildCliente(cliente)}
        </ser:datosTransaccion>
        ${destino === '2' ? buildDatosExportacion(datosExportacion) : ''}
        ${buildItems(items)}
        ${buildTotales(factura, formasPago, pagosPlazo)}
        <ser:usoPosterior>
          <ser:cufe></ser:cufe>
        </ser:usoPosterior>
      </tem:documento>
    </tem:Enviar>
  </soapenv:Body>
</soapenv:Envelope>`;

    logger.info(`XML generado para factura ${factura.numero_documento_fiscal}, tipoDoc=${tipoDoc}, clienteFE=${cliente.tipo_cliente_fe}`);
    return xml;

  } catch (error) {
    logger.error('Error generando XML EBI:', error);
    throw new Error(`Error generando XML: ${error.message}`);
  }
};

export default { generateEBIXML };
