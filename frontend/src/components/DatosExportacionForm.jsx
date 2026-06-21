import { useState, useEffect } from 'react';

const INCOTERMS = [
  { codigo: 'EXW', nombre: 'Ex Works (En fábrica)' },
  { codigo: 'FCA', nombre: 'Free Carrier (Libre transportista)' },
  { codigo: 'FAS', nombre: 'Free Alongside Ship (Libre al costado del buque)' },
  { codigo: 'FOB', nombre: 'Free On Board (Libre a bordo)' },
  { codigo: 'CFR', nombre: 'Cost and Freight (Costo y flete)' },
  { codigo: 'CIF', nombre: 'Cost, Insurance and Freight (Costo, seguro y flete)' },
  { codigo: 'CPT', nombre: 'Carriage Paid To (Transporte pagado hasta)' },
  { codigo: 'CIP', nombre: 'Carriage and Insurance Paid To (Transporte y seguro pagados hasta)' },
  { codigo: 'DAP', nombre: 'Delivered at Place (Entregada en lugar)' },
  { codigo: 'DPU', nombre: 'Delivered at Place Unloaded (Entregada en lugar descargada)' },
  { codigo: 'DDP', nombre: 'Delivered Duty Paid (Entregada con derechos pagados)' }
];

const MONEDAS = [
  { codigo: 'USD', nombre: 'USD - Dólar estadounidense' },
  { codigo: 'EUR', nombre: 'EUR - Euro' },
  { codigo: 'PAB', nombre: 'PAB - Balboa' },
  { codigo: 'COP', nombre: 'COP - Peso colombiano' },
  { codigo: 'MXN', nombre: 'MXN - Peso mexicano' },
  { codigo: 'BRL', nombre: 'BRL - Real brasileño' },
  { codigo: 'CAD', nombre: 'CAD - Dólar canadiense' },
  { codigo: 'GBP', nombre: 'GBP - Libra esterlina' },
  { codigo: 'JPY', nombre: 'JPY - Yen japonés' },
  { codigo: 'CNY', nombre: 'CNY - Yuan chino' },
  { codigo: 'ZZZ', nombre: 'ZZZ - Otra moneda no definida' }
];

/**
 * Formulario de datos de exportación (INCOTERMS, moneda, tipo de cambio)
 * Obligatorio cuando destinoOperacion = 2 (Extranjero)
 * Según: https://wiki.ebi-pac.com/enviar -> datosFacturaExportacion
 */
export default function DatosExportacionForm({ datos, onChange, totalFactura }) {
  const [data, setData] = useState({
    condiciones_entrega: 'FOB',
    moneda_oper_exportacion: 'USD',
    moneda_oper_exportacion_non_def: '',
    tipo_de_cambio: '',
    monto_moneda_extranjera: '',
    puerto_embarque: '',
    ...datos
  });

  useEffect(() => {
    if (datos) setData(prev => ({ ...prev, ...datos }));
  }, [datos]);

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };

    // Si moneda es USD, limpiar tipo de cambio y monto en moneda extranjera
    if (field === 'moneda_oper_exportacion' && value === 'USD') {
      newData.tipo_de_cambio = '';
      newData.monto_moneda_extranjera = '';
    }

    // Si moneda es ZZZ, requerir descripción
    if (field === 'moneda_oper_exportacion' && value !== 'ZZZ') {
      newData.moneda_oper_exportacion_non_def = '';
    }

    // Auto-calcular monto en moneda extranjera si hay tipo de cambio y total
    if (field === 'tipo_de_cambio' && value && totalFactura && data.moneda_oper_exportacion !== 'USD') {
      newData.monto_moneda_extranjera = (parseFloat(value) * parseFloat(totalFactura)).toFixed(4);
    }

    setData(newData);
    onChange && onChange(newData);
  };

  const esMonedaUSD = data.moneda_oper_exportacion === 'USD';
  const esMonedaZZZ = data.moneda_oper_exportacion === 'ZZZ';

  return (
    <div className="space-y-4 border border-amber-300 rounded-lg p-4 bg-amber-50">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-bold text-amber-800">Datos de Exportación (Obligatorio para destino Extranjero)</h3>
      </div>

      {/* Condiciones de Entrega (INCOTERMS) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Condiciones de Entrega (INCOTERMS) <span className="text-red-500">*</span>
        </label>
        <select
          value={data.condiciones_entrega}
          onChange={(e) => handleChange('condiciones_entrega', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
          required
        >
          {INCOTERMS.map(i => (
            <option key={i.codigo} value={i.codigo}>{i.codigo} - {i.nombre}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          De acuerdo con la Tabla 1 de INCOTERMS de la DGI
        </p>
      </div>

      {/* Moneda de Operación */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Moneda de Operación <span className="text-red-500">*</span>
        </label>
        <select
          value={data.moneda_oper_exportacion}
          onChange={(e) => handleChange('moneda_oper_exportacion', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
          required
        >
          {MONEDAS.map(m => (
            <option key={m.codigo} value={m.codigo}>{m.nombre}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Código de moneda según Norma ISO 4217
        </p>
      </div>

      {/* Moneda no definida (ZZZ) */}
      {esMonedaZZZ && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Descripción Moneda No Definida <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.moneda_oper_exportacion_non_def}
            onChange={(e) => handleChange('moneda_oper_exportacion_non_def', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Ej: Criptomoneda, Canje, etc."
            required
          />
        </div>
      )}

      {/* Tipo de Cambio y Monto - Solo si moneda ≠ USD */}
      {!esMonedaUSD && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de Cambio <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              value={data.tipo_de_cambio}
              onChange={(e) => handleChange('tipo_de_cambio', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="0.0000"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Obligatorio si moneda ≠ USD</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monto en Moneda Extranjera <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              value={data.monto_moneda_extranjera}
              onChange={(e) => handleChange('monto_moneda_extranjera', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="0.0000"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Debe ser: TipoCambio × TotalFactura
            </p>
          </div>
        </div>
      )}

      {/* Puerto de Embarque */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Puerto de Embarque <span className="text-slate-400">(opcional)</span>
        </label>
        <input
          type="text"
          value={data.puerto_embarque}
          onChange={(e) => handleChange('puerto_embarque', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Ej: Puerto de Balboa, Colón 2000..."
        />
      </div>

      {/* Info de validación */}
      <div className="bg-white border border-amber-200 rounded-lg p-3 text-xs">
        <p className="font-semibold text-amber-800">Validación EBI:</p>
        <ul className="mt-1 space-y-1 text-slate-600">
          <li>• condicionesEntrega: {data.condiciones_entrega || '—'}</li>
          <li>• monedaOperExportacion: {data.moneda_oper_exportacion || '—'}</li>
          {!esMonedaUSD && <li>• tipoDeCambio: {data.tipo_de_cambio || '—'}</li>}
          {!esMonedaUSD && <li>• montoMonedaExtranjera: {data.monto_moneda_extranjera || '—'}</li>}
          {esMonedaZZZ && <li>• monedaOperExportacionNonDef: {data.moneda_oper_exportacion_non_def || '—'}</li>}
        </ul>
      </div>
    </div>
  );
}
