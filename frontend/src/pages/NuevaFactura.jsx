import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ClienteForm from '../components/ClienteForm.jsx';
import DatosExportacionForm from '../components/DatosExportacionForm.jsx';
import { api } from '../services/api.js';

const TIPOS_DOCUMENTO = [
  { value: '01', label: '01 - Factura de operación interna', destinoDefault: '1', requiereExportacion: false, requiereTipoVenta: true, ocultaTipoVenta: false },
  { value: '02', label: '02 - Factura de importación', destinoDefault: '2', requiereExportacion: true, requiereTipoVenta: true, ocultaTipoVenta: false },
  { value: '03', label: '03 - Factura de exportación', destinoDefault: '2', requiereExportacion: true, requiereTipoVenta: true, ocultaTipoVenta: false },
  { value: '04', label: '04 - Nota de Crédito referente a FE', destinoDefault: '1', requiereExportacion: false, requiereTipoVenta: false, ocultaTipoVenta: true },
  { value: '05', label: '05 - Nota de Débito referente a FE', destinoDefault: '1', requiereExportacion: false, requiereTipoVenta: false, ocultaTipoVenta: true },
  { value: '06', label: '06 - Nota de Crédito genérica', destinoDefault: '1', requiereExportacion: false, requiereTipoVenta: false, ocultaTipoVenta: true },
  { value: '07', label: '07 - Nota de Débito genérica', destinoDefault: '1', requiereExportacion: false, requiereTipoVenta: false, ocultaTipoVenta: true },
  { value: '08', label: '08 - Factura de Zona Franca', destinoDefault: '1', requiereExportacion: false, requiereTipoVenta: false, ocultaTipoVenta: true },
  { value: '09', label: '09 - Reembolso', destinoDefault: '1', requiereExportacion: false, requiereTipoVenta: false, ocultaTipoVenta: true },
  { value: '10', label: '10 - Factura de operación extranjera', destinoDefault: '2', requiereExportacion: true, requiereTipoVenta: true, ocultaTipoVenta: false }
];

const TIPOS_VENTA = [
  { value: '1', label: '1 - Venta de Giro del negocio' },
  { value: '2', label: '2 - Venta Activo Fijo' },
  { value: '3', label: '3 - Venta de Bienes Raíces' },
  { value: '4', label: '4 - Prestación de Servicio' }
];

const NATURALEZA_OPERACION = [
  { value: '01', label: '01 - Venta' },
  { value: '02', label: '02 - Exportación' },
  { value: '03', label: '03 - Re-exportación' },
  { value: '04', label: '04 - Venta de fuente extranjera' },
  { value: '10', label: '10 - Transferencia/Traspaso' },
  { value: '11', label: '11 - Devolución' },
  { value: '12', label: '12 - Consignación' },
  { value: '13', label: '13 - Remesa' },
  { value: '14', label: '14 - Entrega gratuita' },
  { value: '20', label: '20 - Compra' },
  { value: '21', label: '21 - Importación' }
];

const TASAS_ITBMS = [
  { value: '00', label: '00 - 0% (Exento)', tasa: 0 },
  { value: '01', label: '01 - 7%', tasa: 0.07 },
  { value: '02', label: '02 - 10%', tasa: 0.10 },
  { value: '03', label: '03 - 15%', tasa: 0.15 }
];

const FORMAS_PAGO = [
  { value: '01', label: '01 - Crédito' },
  { value: '02', label: '02 - Efectivo' },
  { value: '03', label: '03 - Tarjeta Crédito' },
  { value: '04', label: '04 - Tarjeta Débito' },
  { value: '05', label: '05 - Tarjeta Fidelización' },
  { value: '06', label: '06 - Vale' },
  { value: '07', label: '07 - Tarjeta de Regalo' },
  { value: '08', label: '08 - Transferencia/Depósito' },
  { value: '09', label: '09 - Cheque' },
  { value: '99', label: '99 - Otro' }
];

export default function NuevaFactura() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Estado principal de la factura
  const [factura, setFactura] = useState({
    tipo_documento: '08',
    numero_documento_fiscal: '',
    punto_facturacion_fiscal: '001',
    codigo_sucursal_emisor: '0000',
    tipo_emision: '01',
    fecha_emision: new Date().toISOString().slice(0, 16),
    fecha_salida: '',
    naturaleza_operacion: '01',
    tipo_operacion: '1',
    destino_operacion: '1',
    formato_cafe: '3',
    entrega_cafe: '3',
    envio_contenedor: '1',
    proceso_generacion: '1',
    tipo_venta: '',
    tipo_sucursal: '1',
    informacion_interes: '',
    tiempo_pago: '1',
    total_otros_gastos: 0
  });

  const [cliente, setCliente] = useState({ tipo_cliente_fe: '01' });
  const [items, setItems] = useState([{
    descripcion: '',
    codigo: '',
    unidad_medida: 'um',
    cantidad: 1,
    precio_unitario: 0,
    precio_unitario_descuento: 0,
    precio_item: 0,
    valor_total: 0,
    tasa_itbms: '00',
    valor_itbms: 0,
    codigo_gtin: '0',
    cant_gtin_com: 0,
    codigo_gtin_inv: '0',
    cant_gtin_com_inv: 0
  }]);
  const [formasPago, setFormasPago] = useState([{ forma_pago_fact: '02', desc_forma_pago: '', valor_cuota_pagada: 0 }]);
  const [pagosPlazo, setPagosPlazo] = useState([]);
  const [datosExportacion, setDatosExportacion] = useState(null);

  // Configuración según tipo de documento seleccionado
  const configDoc = useMemo(() => {
    return TIPOS_DOCUMENTO.find(t => t.value === factura.tipo_documento) || TIPOS_DOCUMENTO[0];
  }, [factura.tipo_documento]);

  // Calcular totales
  const totales = useMemo(() => {
    let totalPrecioNeto = 0;
    let totalITBMS = 0;
    let totalTodosItems = 0;

    items.forEach(item => {
      const precioItem = parseFloat(item.precio_item) || 0;
      const valorITBMS = parseFloat(item.valor_itbms) || 0;
      const valorTotal = parseFloat(item.valor_total) || 0;

      totalPrecioNeto += precioItem;
      totalITBMS += valorITBMS;
      totalTodosItems += valorTotal;
    });

    const totalDescuento = 0; // Simplificado
    const totalFactura = totalTodosItems - totalDescuento;

    return {
      total_precio_neto: totalPrecioNeto.toFixed(2),
      total_itbms: totalITBMS.toFixed(2),
      total_isc: '0.00',
      total_monto_gravado: totalITBMS.toFixed(2),
      total_descuento: totalDescuento.toFixed(2),
      total_todos_items: totalTodosItems.toFixed(2),
      total_factura: totalFactura.toFixed(2),
      total_valor_recibido: totalFactura.toFixed(2),
      nro_items: items.length
    };
  }, [items]);

  // Actualizar destinoOperacion cuando cambia tipo de documento
  useEffect(() => {
    if (configDoc.destinoDefault) {
      setFactura(prev => ({
        ...prev,
        destino_operacion: configDoc.destinoDefault,
        tipo_venta: configDoc.ocultaTipoVenta ? '' : prev.tipo_venta
      }));
    }
  }, [factura.tipo_documento, configDoc.destinoDefault, configDoc.ocultaTipoVenta]);

  // Actualizar destinoOperacion cuando cliente es extranjero
  useEffect(() => {
    if (cliente.tipo_cliente_fe === '04') {
      setFactura(prev => ({ ...prev, destino_operacion: '2' }));
    }
  }, [cliente.tipo_cliente_fe]);

  // Actualizar forma de pago cuando cambia total
  useEffect(() => {
    const total = parseFloat(totales.total_factura) || 0;
    setFormasPago(prev => prev.map((fp, i) => 
      i === 0 ? { ...fp, valor_cuota_pagada: total } : fp
    ));
  }, [totales.total_factura]);

  // Handlers
  const handleFacturaChange = (field, value) => {
    setFactura(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };

      // Auto-calcular precio_item
      if (field === 'precio_unitario' || field === 'cantidad' || field === 'precio_unitario_descuento') {
        const pu = parseFloat(item.precio_unitario) || 0;
        const cant = parseFloat(item.cantidad) || 1;
        const desc = parseFloat(item.precio_unitario_descuento) || 0;
        item.precio_item = (pu * cant - desc).toFixed(2);
      }

      // Auto-calcular ITBMS
      if (field === 'tasa_itbms' || field === 'precio_item') {
        const tasaConfig = TASAS_ITBMS.find(t => t.value === item.tasa_itbms);
        const tasa = tasaConfig ? tasaConfig.tasa : 0;
        const precioItem = parseFloat(item.precio_item) || 0;
        item.valor_itbms = (precioItem * tasa).toFixed(4);
      }

      // Auto-calcular valor_total
      const precioItem = parseFloat(item.precio_item) || 0;
      const valorITBMS = parseFloat(item.valor_itbms) || 0;
      item.valor_total = (precioItem + valorITBMS).toFixed(2);

      newItems[index] = item;
      return newItems;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      descripcion: '',
      codigo: '',
      unidad_medida: 'um',
      cantidad: 1,
      precio_unitario: 0,
      precio_unitario_descuento: 0,
      precio_item: 0,
      valor_total: 0,
      tasa_itbms: '00',
      valor_itbms: 0,
      codigo_gtin: '0',
      cant_gtin_com: 0,
      codigo_gtin_inv: '0',
      cant_gtin_com_inv: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        factura: { ...factura, ...totales },
        cliente,
        items,
        formas_pago: formasPago,
        pagos_plazo: pagosPlazo,
        datos_exportacion: configDoc.requiereExportacion ? datosExportacion : null
      };

      const response = await api.post('/api/facturas', payload);

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/facturas'), 1500);
      }
    } catch (err) {
      console.error('Error:', err);
      if (err.response?.data?.detalles) {
        setError(err.response.data.detalles.join('\n'));
      } else {
        setError(err.response?.data?.error || err.message || 'Error al crear factura');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Nueva Factura Electrónica</h1>
        <div className="text-sm text-slate-500">
          EBI PAC - Panamá
        </div>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">
          ✅ Factura creada exitosamente. Redirigiendo...
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 whitespace-pre-line">
          <strong>Error:</strong>\n{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === SECCIÓN 1: DATOS DE LA FACTURA === */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
            Datos del Documento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select
                value={factura.tipo_documento}
                onChange={(e) => handleFacturaChange('tipo_documento', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                required
              >
                {TIPOS_DOCUMENTO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {configDoc.requiereExportacion 
                  ? '⚠️ Requiere datos de exportación (destino extranjero)' 
                  : configDoc.ocultaTipoVenta 
                    ? 'ℹ️ No requiere tipo de venta' 
                    : 'Tipo de venta requerido'}
              </p>
            </div>

            {/* Número Documento Fiscal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                N° Documento Fiscal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={factura.numero_documento_fiscal}
                onChange={(e) => handleFacturaChange('numero_documento_fiscal', e.target.value.padStart(10, '0'))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="0000000001"
                maxLength={10}
                required
              />
            </div>

            {/* Punto de Facturación */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Punto Facturación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={factura.punto_facturacion_fiscal}
                onChange={(e) => handleFacturaChange('punto_facturacion_fiscal', e.target.value.padStart(3, '0'))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="001"
                maxLength={3}
                required
              />
            </div>

            {/* Fecha Emisión */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Emisión <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={factura.fecha_emision}
                onChange={(e) => handleFacturaChange('fecha_emision', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            {/* Fecha Salida */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Salida <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={factura.fecha_salida}
                onChange={(e) => handleFacturaChange('fecha_salida', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            {/* Naturaleza Operación */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Naturaleza Operación <span className="text-red-500">*</span>
              </label>
              <select
                value={factura.naturaleza_operacion}
                onChange={(e) => handleFacturaChange('naturaleza_operacion', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              >
                {NATURALEZA_OPERACION.map(n => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>

            {/* Destino Operación */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Destino Operación <span className="text-red-500">*</span>
              </label>
              <select
                value={factura.destino_operacion}
                onChange={(e) => handleFacturaChange('destino_operacion', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
                disabled={cliente.tipo_cliente_fe === '04'}
              >
                <option value="1">1 - Panamá</option>
                <option value="2">2 - Extranjero</option>
              </select>
              {cliente.tipo_cliente_fe === '04' && (
                <p className="text-xs text-amber-600 mt-1">Forzado a Extranjero por tipo de cliente</p>
              )}
            </div>

            {/* Tipo Venta - Condicional */}
            {!configDoc.ocultaTipoVenta && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo Venta <span className="text-red-500">*</span>
                </label>
                <select
                  value={factura.tipo_venta}
                  onChange={(e) => handleFacturaChange('tipo_venta', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required={configDoc.requiereTipoVenta}
                >
                  <option value="">Seleccione...</option>
                  {TIPOS_VENTA.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Formato CAFE */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Formato CAFE <span className="text-red-500">*</span>
              </label>
              <select
                value={factura.formato_cafe}
                onChange={(e) => handleFacturaChange('formato_cafe', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="1">1 - Sin generación de CAFE</option>
                <option value="2">2 - Cinta de papel</option>
                <option value="3">3 - Papel formato carta</option>
              </select>
            </div>

            {/* Entrega CAFE */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Entrega CAFE <span className="text-red-500">*</span>
              </label>
              <select
                value={factura.entrega_cafe}
                onChange={(e) => handleFacturaChange('entrega_cafe', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="1">1 - Sin generación de CAFE</option>
                <option value="2">2 - CAFE entregado en papel</option>
                <option value="3">3 - CAFE enviado en formato electrónico</option>
              </select>
            </div>

            {/* Tiempo de Pago */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tiempo Pago <span className="text-red-500">*</span>
              </label>
              <select
                value={factura.tiempo_pago}
                onChange={(e) => handleFacturaChange('tiempo_pago', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="1">1 - Inmediato</option>
                <option value="2">2 - Plazo</option>
                <option value="3">3 - Mixto</option>
              </select>
            </div>
          </div>

          {/* Información de Interés */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Información de Interés
            </label>
            <textarea
              value={factura.informacion_interes}
              onChange={(e) => handleFacturaChange('informacion_interes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
              placeholder="Información adicional sobre la factura..."
            />
          </div>
        </div>

        {/* === SECCIÓN 2: DATOS DE EXPORTACIÓN (Condicional) === */}
        {configDoc.requiereExportacion && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold">2</span>
              Datos de Exportación
            </h2>
            <DatosExportacionForm
              datos={datosExportacion}
              onChange={setDatosExportacion}
              totalFactura={totales.total_factura}
            />
          </div>
        )}

        {/* === SECCIÓN 3: CLIENTE === */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
            Datos del Cliente / Receptor
          </h2>
          <ClienteForm
            cliente={cliente}
            onChange={setCliente}
          />
        </div>

        {/* === SECCIÓN 4: ITEMS === */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</span>
            Items de la Factura
          </h2>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Item {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descripción *</label>
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Código</label>
                    <input
                      type="text"
                      value={item.codigo}
                      onChange={(e) => handleItemChange(index, 'codigo', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Unidad</label>
                    <input
                      type="text"
                      value={item.unidad_medida}
                      onChange={(e) => handleItemChange(index, 'unidad_medida', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">P. Unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precio_unitario}
                      onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descuento</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precio_unitario_descuento}
                      onChange={(e) => handleItemChange(index, 'precio_unitario_descuento', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tasa ITBMS</label>
                    <select
                      value={item.tasa_itbms}
                      onChange={(e) => handleItemChange(index, 'tasa_itbms', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      {TASAS_ITBMS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-end gap-4 text-sm text-slate-600">
                    <div>P. Item: <strong className="text-slate-800">${item.precio_item}</strong></div>
                    <div>ITBMS: <strong className="text-slate-800">${item.valor_itbms}</strong></div>
                    <div>Total: <strong className="text-slate-800">${item.valor_total}</strong></div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Agregar Item
            </button>
          </div>
        </div>

        {/* === SECCIÓN 5: FORMAS DE PAGO === */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">5</span>
            Formas de Pago
          </h2>

          {formasPago.map((fp, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Forma de Pago</label>
                <select
                  value={fp.forma_pago_fact}
                  onChange={(e) => {
                    const newFP = [...formasPago];
                    newFP[index] = { ...fp, forma_pago_fact: e.target.value };
                    setFormasPago(newFP);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {FORMAS_PAGO.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              {fp.forma_pago_fact === '99' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={fp.desc_forma_pago}
                    onChange={(e) => {
                      const newFP = [...formasPago];
                      newFP[index] = { ...fp, desc_forma_pago: e.target.value };
                      setFormasPago(newFP);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Descripción de la forma de pago"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={fp.valor_cuota_pagada}
                  onChange={(e) => {
                    const newFP = [...formasPago];
                    newFP[index] = { ...fp, valor_cuota_pagada: e.target.value };
                    setFormasPago(newFP);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* === SECCIÓN 6: TOTALES === */}
        <div className="bg-slate-800 rounded-xl shadow-sm p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Resumen de Totales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400">Precio Neto</div>
              <div className="text-xl font-bold">${totales.total_precio_neto}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400">ITBMS</div>
              <div className="text-xl font-bold">${totales.total_itbms}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400">Monto Gravado</div>
              <div className="text-xl font-bold">${totales.total_monto_gravado}</div>
            </div>
            <div className="bg-blue-600 rounded-lg p-3">
              <div className="text-xs text-blue-200">Total Factura</div>
              <div className="text-xl font-bold">${totales.total_factura}</div>
            </div>
          </div>
        </div>

        {/* === SECCIÓN 7: VALIDACIÓN PREVIA === */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-blue-800 mb-2">Validación Previa EBI</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
            <div>✓ Tipo Documento: {TIPOS_DOCUMENTO.find(t => t.value === factura.tipo_documento)?.label}</div>
            <div>✓ Destino: {factura.destino_operacion === '1' ? 'Panamá' : 'Extranjero'}</div>
            <div>✓ Cliente: {cliente.tipo_cliente_fe === '04' ? 'Extranjero' : 'Panameño'}</div>
            <div>✓ Items: {items.length}</div>
            <div>✓ Exportación: {configDoc.requiereExportacion ? (datosExportacion ? 'Configurada' : 'PENDIENTE ⚠️') : 'No aplica'}</div>
            <div>✓ Total: ${totales.total_factura}</div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : '💾 Guardar Factura'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/facturas')}
            className="px-6 py-3 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
