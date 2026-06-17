import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCrearFactura } from '../hooks/useFacturas.js';
import { useClientes } from '../hooks/useClientes.js';
import { useProductos } from '../hooks/useProductos.js';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NuevaFactura() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm();
  const crearFactura = useCrearFactura();
  const { data: clientesData } = useClientes();
  const { data: productosData } = useProductos();
  const clientes = clientesData?.data || [];
  const productos = productosData?.data || [];

  const [items, setItems] = useState([{
    descripcion: '',
    codigo: '',
    unidad_medida: 'um',
    cantidad: 1,
    precio_unitario: 0,
    precio_unitario_descuento: 0,
    precio_item: 0,
    valor_total: 0,
    tasa_itbms: '01',
    valor_itbms: 0,
    codigo_gtin: '0',
    cant_gtin_com: 0,
    codigo_gtin_inv: '0',
    cant_gtin_com_inv: 0
  }]);

  const [formaPago, setFormaPago] = useState('02');

  const totales = useMemo(() => {
    let totalPrecioNeto = 0;
    let totalITBMS = 0;
    let totalTodosItems = 0;

    items.forEach(item => {
      totalPrecioNeto += parseFloat(item.precio_item) || 0;
      totalITBMS += parseFloat(item.valor_itbms) || 0;
      totalTodosItems += parseFloat(item.valor_total) || 0;
    });

    const totalFactura = totalTodosItems;

    return {
      total_precio_neto: parseFloat(totalPrecioNeto.toFixed(2)),
      total_itbms: parseFloat(totalITBMS.toFixed(2)),
      total_monto_gravado: parseFloat(totalITBMS.toFixed(2)),
      total_factura: parseFloat(totalFactura.toFixed(2)),
      total_valor_recibido: parseFloat(totalFactura.toFixed(2)),
      nro_items: items.length,
      total_todos_items: parseFloat(totalTodosItems.toFixed(2))
    };
  }, [items]);

  const handleClienteChange = (e) => {
    const cliente = clientes.find(c => c.id === parseInt(e.target.value));
    if (cliente) {
      setValue('cliente_tipo_cliente_fe', cliente.tipo_cliente_fe || '02');
      setValue('cliente_tipo_contribuyente', cliente.tipo_contribuyente || '2');
      setValue('cliente_numero_ruc', cliente.numero_ruc || '');
      setValue('cliente_digito_verificador_ruc', cliente.digito_verificador_ruc || '');
      setValue('cliente_razon_social', cliente.razon_social || '');
      setValue('cliente_direccion', cliente.direccion || '');
      setValue('cliente_codigo_ubicacion', cliente.codigo_ubicacion || '');
      setValue('cliente_provincia', cliente.provincia || '');
      setValue('cliente_distrito', cliente.distrito || '');
      setValue('cliente_corregimiento', cliente.corregimiento || '');
      setValue('cliente_telefono1', cliente.telefono1 || '');
      setValue('cliente_correo_electronico1', cliente.correo_electronico1 || '');
      setValue('cliente_pais', cliente.pais || 'PA');
    }
  };

  const handleProductoSelect = (index, productoId) => {
    const producto = productos.find(p => p.id === parseInt(productoId));
    if (producto) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        descripcion: producto.descripcion || '',
        codigo: producto.codigo || '',
        unidad_medida: producto.unidad_medida || 'um',
        precio_unitario: parseFloat(producto.precio_unitario) || 0,
        tasa_itbms: producto.tasa_itbms || '01',
        codigo_gtin: producto.codigo_gtin || '0',
        codigo_gtin_inv: producto.codigo_gtin_inv || '0'
      };
      calcularItem(newItems, index);
      setItems(newItems);
    }
  };

  const calcularItem = (itemsList, index) => {
    const item = itemsList[index];
    const cantidad = parseFloat(item.cantidad) || 0;
    const precioUnitario = parseFloat(item.precio_unitario) || 0;
    const descuento = parseFloat(item.precio_unitario_descuento) || 0;

    const precioItem = cantidad * (precioUnitario - descuento);
    const tasasITBMS = { '00': 0, '01': 0.07, '02': 0.10, '03': 0.15 };
    const tasa = tasasITBMS[item.tasa_itbms] || 0;
    const valorITBMS = precioItem * tasa;
    const valorTotal = precioItem + valorITBMS;

    itemsList[index] = {
      ...itemsList[index],
      precio_item: parseFloat(precioItem.toFixed(6)),
      valor_itbms: parseFloat(valorITBMS.toFixed(4)),
      valor_total: parseFloat(valorTotal.toFixed(6))
    };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    calcularItem(newItems, index);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      descripcion: '',
      codigo: '',
      unidad_medida: 'um',
      cantidad: 1,
      precio_unitario: 0,
      precio_unitario_descuento: 0,
      precio_item: 0,
      valor_total: 0,
      tasa_itbms: '01',
      valor_itbms: 0,
      codigo_gtin: '0',
      cant_gtin_com: 0,
      codigo_gtin_inv: '0',
      cant_gtin_com_inv: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const onSubmit = (data) => {
    const facturaData = {
      ...data,
      ...totales,
      items: items,
      formas_pago: [{
        forma_pago_fact: formaPago,
        desc_forma_pago: '',
        valor_cuota_pagada: totales.total_factura
      }],
      tipo_documento: '08',
      fecha_emision: new Date().toISOString()
    };

    crearFactura.mutate(facturaData, {
      onSuccess: () => navigate('/facturas')
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/facturas" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Nueva Factura - Zona Franca</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Datos de la Transaccion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Emision</label>
              <select {...register('tipo_emision')} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="01">01 - Normal</option>
                <option value="02">02 - Contingencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Naturaleza Operacion</label>
              <select {...register('naturaleza_operacion')} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="01">01 - Venta</option>
                <option value="10">10 - Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
              <select {...register('destino_operacion')} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="1">1 - Panama</option>
                <option value="2">2 - Extranjero</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cliente</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Cliente</label>
            <select onChange={handleClienteChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
              <option value="">-- Nuevo Cliente --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social} - {c.numero_ruc}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razon Social *</label>
              <input {...register('cliente_razon_social', { required: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RUC *</label>
              <input {...register('cliente_numero_ruc', { required: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DV *</label>
              <input {...register('cliente_digito_verificador_ruc', { required: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Direccion</label>
              <input {...register('cliente_direccion')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Provincia</label>
              <input {...register('cliente_provincia')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Distrito</label>
              <input {...register('cliente_distrito')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Corregimiento</label>
              <input {...register('cliente_corregimiento')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
              <input type="email" {...register('cliente_correo_electronico1')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Items</h2>
            <button type="button" onClick={addItem} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
              <Plus className="w-4 h-4" />Agregar Item
            </button>
          </div>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Item {index + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Producto</label>
                    <select onChange={(e) => handleProductoSelect(index, e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value="">-- Seleccionar --</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.descripcion}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descripcion *</label>
                    <input value={item.descripcion} onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
                    <input type="number" step="0.000001" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Precio Unitario</label>
                    <input type="number" step="0.000001" value={item.precio_unitario} onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descuento</label>
                    <input type="number" step="0.000001" value={item.precio_unitario_descuento} onChange={(e) => handleItemChange(index, 'precio_unitario_descuento', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tasa ITBMS</label>
                    <select value={item.tasa_itbms} onChange={(e) => handleItemChange(index, 'tasa_itbms', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                      <option value="00">00 - Exento</option>
                      <option value="01">01 - 7%</option>
                      <option value="02">02 - 10%</option>
                      <option value="03">03 - 15%</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div><span className="text-xs text-slate-500">Precio Item:</span><span className="ml-2 text-sm font-medium">${item.precio_item.toFixed(2)}</span></div>
                  <div><span className="text-xs text-slate-500">ITBMS:</span><span className="ml-2 text-sm font-medium">${item.valor_itbms.toFixed(4)}</span></div>
                  <div><span className="text-xs text-slate-500">Total:</span><span className="ml-2 text-sm font-bold text-blue-600">${item.valor_total.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Totales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Precio Neto</p>
              <p className="text-lg font-semibold">${totales.total_precio_neto.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">ITBMS</p>
              <p className="text-lg font-semibold">${totales.total_itbms.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">Items</p>
              <p className="text-lg font-semibold">{totales.nro_items}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600">Total Factura</p>
              <p className="text-xl font-bold text-blue-700">${totales.total_factura.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Forma de Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pago</label>
              <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="01">01 - Credito</option>
                <option value="02">02 - Efectivo</option>
                <option value="03">03 - Tarjeta Credito</option>
                <option value="04">04 - Tarjeta Debito</option>
                <option value="08">08 - Transferencia</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/facturas" className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={crearFactura.isPending} className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {crearFactura.isPending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
            ) : (
              <><Save className="w-4 h-4" />Guardar Factura</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
