import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class CalculoService {
  // Calcular ITBMS según tasa
  static calcularITBMS(precioItem, tasaITBMS) {
    const tasas = {
      '00': 0,      // Exento
      '01': 0.07,   // 7%
      '02': 0.10,   // 10%
      '03': 0.15    // 15%
    };

    const tasa = tasas[tasaITBMS] || 0;
    return parseFloat((precioItem * tasa).toFixed(4));
  }

  // Calcular totales de la factura
  static calcularTotales(items, descuentos = [], formasPago = [], pagosPlazo = []) {
    let totalPrecioNeto = 0;
    let totalITBMS = 0;
    let totalISC = 0;
    let totalMontoGravado = 0;
    let totalDescuento = 0;
    let totalTodosItems = 0;
    let totalOtrosGastos = 0;

    items.forEach(item => {
      const precioItem = parseFloat(item.precio_item) || 0;
      const valorITBMS = parseFloat(item.valor_itbms) || 0;
      const valorISC = parseFloat(item.valor_isc) || 0;
      const valorTotal = parseFloat(item.valor_total) || 0;
      const descuento = parseFloat(item.precio_unitario_descuento) || 0;

      totalPrecioNeto += precioItem;
      totalITBMS += valorITBMS;
      totalISC += valorISC;
      totalTodosItems += valorTotal;
      totalDescuento += descuento;
    });

    // Sumar descuentos globales
    descuentos.forEach(d => {
      totalDescuento += parseFloat(d.monto_descuento) || 0;
    });

    totalMontoGravado = totalITBMS + totalISC;

    const totalFactura = totalTodosItems;
    const totalValorRecibido = formasPago.reduce((sum, fp) => sum + (parseFloat(fp.valor_cuota_pagada) || 0), 0);
    const vuelto = totalValorRecibido > totalFactura ? parseFloat((totalValorRecibido - totalFactura).toFixed(2)) : null;

    return {
      total_precio_neto: parseFloat(totalPrecioNeto.toFixed(2)),
      total_itbms: parseFloat(totalITBMS.toFixed(2)),
      total_isc: parseFloat(totalISC.toFixed(2)),
      total_monto_gravado: parseFloat(totalMontoGravado.toFixed(2)),
      total_descuento: parseFloat(totalDescuento.toFixed(2)),
      total_acarreo_cobrado: 0,
      valor_seguro_cobrado: 0,
      total_factura: parseFloat(totalFactura.toFixed(2)),
      total_valor_recibido: parseFloat(totalValorRecibido.toFixed(2)),
      vuelto: vuelto,
      nro_items: items.length,
      total_todos_items: parseFloat(totalTodosItems.toFixed(2)),
      total_otros_gastos: parseFloat(totalOtrosGastos.toFixed(2))
    };
  }

  // Generar número de documento fiscal secuencial
  static generarNumeroDocumentoFiscal(puntoFacturacion = '001') {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT MAX(CAST(numero_documento_fiscal AS INTEGER)) as max_num 
      FROM facturas 
      WHERE punto_facturacion_fiscal = ?
    `).get(puntoFacturacion);

    const siguiente = (result?.max_num || 0) + 1;
    return siguiente.toString().padStart(10, '0');
  }
}
