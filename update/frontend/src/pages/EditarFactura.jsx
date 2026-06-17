import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { facturaService, clienteService, productoService } from '../service/api.service.js';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calculator,
  AlertTriangle
} from 'lucide-react';

const TASAS_ITBMS = [
  { value: '00', label: '00 - Exento' },
  { value: '01', label: '01 - 7%' },
  { value: '02', label: '02 - 10%' },
  { value: '03', label: '03 - 15%' },
];

const FORMAS_PAGO = [
  { value: '01', label: '01 - Efectivo' },
  { value: '02', label: '02 - Cheque' },
  { value: '03', label: '03 - Tarjeta Credito' },
  { value: '04', label: '04 - Tarjeta Debito' },
  { value: '05', label: '05 - Transferencia' },
  { value: '06', label: '06 - Deposito' },
  { value: '07', label: '07 - Yappy' },
  { value: '08', label: '08 - Nequi' },
  { value: '09', label: '09 - Otro' },
];

const safeValue = (val, defaultVal = '') => val ?? defaultVal;
const safeNumber = (val, defaultVal = 0) => {
  const n = parseFloat(val);
  return isNaN(n) ? defaultVal : n;
};

// Helper para formatear fecha ISO a yyyy-MM-dd para inputs date
const formatDateForInput = (isoDate) => {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

export default function EditarFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: facturaData, isLoading: loadingFactura } = useQuery({
    queryKey: ['factura', id],
    queryFn: () => facturaService.obtener(id).then(r => r.data),
    enabled: !!id,
  });

  const factura = facturaData?.data;

  const [formData, setFormData] = useState({
    numero_documento_fiscal: '',
    punto_facturacion_fiscal: '001',
    codigo_sucursal_emisor: '0000',
    tipo_emision: '01',
    tipo_documento: '08',
    fecha_emision: '',
    fecha_salida: '',
    naturaleza_operacion: '01',
    tipo_operacion: '1',
    destino_operacion: '1',
    formato_cafe: '1',
    entrega_cafe: '1',
    envio_contenedor: '1',
    proceso_generacion: '1',
    tipo_venta: '',
    tipo_sucursal: '',
    informacion_interes: '',
    cliente_id: '',
    cliente_tipo_cliente_fe: '02',
    cliente_tipo_contribuyente: '',
    cliente_numero_ruc: '',
    cliente_digito_verificador_ruc: '',
    cliente_razon_social: '',
    cliente_direccion: '',
    cliente_codigo_ubicacion: '',
    cliente_provincia: '',
    cliente_distrito: '',
    cliente_corregimiento: '',
    cliente_telefono1: '',
    cliente_correo_electronico1: '',
    cliente_pais: 'PA',
    total_precio_neto: 0,
    total_itbms: 0,
    total_isc: 0,
    total_monto_gravado: 0,
    total_descuento: 0,
    total_acarreo_cobrado: 0,
    valor_seguro_cobrado: 0,
    total_factura: 0,
    total_valor_recibido: 0,
    vuelto: 0,
    tiempo_pago: '1',
    nro_items: 0,
    total_todos_items: 0,
    total_otros_gastos: 0,
  });

  const [items, setItems] = useState([]);
  const [formasPago, setFormasPago] = useState([]);

  useEffect(() => {
    if (factura) {
      setFormData(prev => ({
        ...prev,
        numero_documento_fiscal: safeValue(factura.numero_documento_fiscal),
        punto_facturacion_fiscal: safeValue(factura.punto_facturacion_fiscal, '001'),
        codigo_sucursal_emisor: safeValue(factura.codigo_sucursal_emisor, '0000'),
        tipo_emision: safeValue(factura.tipo_emision, '01'),
        tipo_documento: safeValue(factura.tipo_documento, '08'),
        // CORREGIDO: Formatear fechas ISO a yyyy-MM-dd
        fecha_emision: formatDateForInput(factura.fecha_emision),
        fecha_salida: formatDateForInput(factura.fecha_salida),
        naturaleza_operacion: safeValue(factura.naturaleza_operacion, '01'),
        tipo_operacion: safeValue(factura.tipo_operacion, '1'),
        destino_operacion: safeValue(factura.destino_operacion, '1'),
        formato_cafe: safeValue(factura.formato_cafe, '1'),
        entrega_cafe: safeValue(factura.entrega_cafe, '1'),
        envio_contenedor: safeValue(factura.envio_contenedor, '1'),
        proceso_generacion: safeValue(factura.proceso_generacion, '1'),
        tipo_venta: safeValue(factura.tipo_venta),
        tipo_sucursal: safeValue(factura.tipo_sucursal),
        informacion_interes: safeValue(factura.informacion_interes),
        cliente_id: safeValue(factura.cliente_id),
        cliente_tipo_cliente_fe: safeValue(factura.cliente_tipo_cliente_fe, '02'),
        cliente_tipo_contribuyente: safeValue(factura.cliente_tipo_contribuyente),
        cliente_numero_ruc: safeValue(factura.cliente_numero_ruc),
        cliente_digito_verificador_ruc: safeValue(factura.cliente_digito_verificador_ruc),
        cliente_razon_social: safeValue(factura.cliente_razon_social),
        cliente_direccion: safeValue(factura.cliente_direccion),
        cliente_codigo_ubicacion: safeValue(factura.cliente_codigo_ubicacion),
        cliente_provincia: safeValue(factura.cliente_provincia),
        cliente_distrito: safeValue(factura.cliente_distrito),
        cliente_corregimiento: safeValue(factura.cliente_corregimiento),
        cliente_telefono1: safeValue(factura.cliente_telefono1),
        cliente_correo_electronico1: safeValue(factura.cliente_correo_electronico1),
        cliente_pais: safeValue(factura.cliente_pais, 'PA'),
        total_precio_neto: safeNumber(factura.total_precio_neto),
        total_itbms: safeNumber(factura.total_itbms),
        total_isc: safeNumber(factura.total_isc),
        total_monto_gravado: safeNumber(factura.total_monto_gravado),
        total_descuento: safeNumber(factura.total_descuento),
        total_acarreo_cobrado: safeNumber(factura.total_acarreo_cobrado),
        valor_seguro_cobrado: safeNumber(factura.valor_seguro_cobrado),
        total_factura: safeNumber(factura.total_factura),
        total_valor_recibido: safeNumber(factura.total_valor_recibido),
        vuelto: factura.vuelto === undefined || factura.vuelto === null ? factura.vuelto : safeNumber(factura.vuelto),
        tiempo_pago: safeValue(factura.tiempo_pago, '1'),
        nro_items: safeNumber(factura.nro_items, 0),
        total_todos_items: safeNumber(factura.total_todos_items),
        total_otros_gastos: safeNumber(factura.total_otros_gastos),
      }));

      if (factura.items && Array.isArray(factura.items)) {
        setItems(factura.items.map(item => ({
          id: item.id,
          producto_id: safeValue(item.producto_id),
          descripcion: safeValue(item.descripcion),
          codigo: safeValue(item.codigo),
          unidad_medida: safeValue(item.unidad_medida),
          cantidad: safeNumber(item.cantidad, 1),
          fecha_fabricacion: formatDateForInput(item.fecha_fabricacion),
          fecha_caducidad: formatDateForInput(item.fecha_caducidad),
          codigo_cpbs_abrev: safeValue(item.codigo_cpbs_abrev),
          codigo_cpbs: safeValue(item.codigo_cpbs),
          unidad_medida_cpbs: safeValue(item.unidad_medida_cpbs),
          info_item: safeValue(item.info_item),
          precio_unitario: safeNumber(item.precio_unitario),
          precio_unitario_descuento: safeNumber(item.precio_unitario_descuento),
          precio_item: safeNumber(item.precio_item),
          precio_acarreo: safeNumber(item.precio_acarreo),
          precio_seguro: safeNumber(item.precio_seguro),
          valor_total: safeNumber(item.valor_total),
          codigo_gtin: safeValue(item.codigo_gtin, '0'),
          cant_gtin_com: safeNumber(item.cant_gtin_com),
          codigo_gtin_inv: safeValue(item.codigo_gtin_inv, '0'),
          cant_gtin_com_inv: safeNumber(item.cant_gtin_com_inv),
          tasa_itbms: safeValue(item.tasa_itbms, '01'),
          valor_itbms: safeNumber(item.valor_itbms),
          tasa_isc: safeValue(item.tasa_isc),
          valor_isc: safeNumber(item.valor_isc),
          tasa_oti: safeValue(item.tasa_oti),
          valor_tasa: safeNumber(item.valor_tasa),
        })));
      }

      if (factura.formas_pago && Array.isArray(factura.formas_pago)) {
        setFormasPago(factura.formas_pago.map(fp => ({
          id: fp.id,
          forma_pago_fact: safeValue(fp.forma_pago_fact, '02'),
          desc_forma_pago: safeValue(fp.desc_forma_pago),
          valor_cuota_pagada: safeNumber(fp.valor_cuota_pagada),
        })));
      } else {
        setFormasPago([{ forma_pago_fact: '02', desc_forma_pago: '', valor_cuota_pagada: 0 }]);
      }
    }
  }, [factura]);

  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clienteService.listar().then(r => r.data),
  });

  const { data: productosData } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productoService.listar().then(r => r.data),
  });

  const clientes = clientesData?.data || [];
  const productos = productosData?.data || [];

  const actualizarFactura = useMutation({
    mutationFn: (data) => facturaService.actualizar(id, data),
    onSuccess: () => {
      toast.success('Factura actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      queryClient.invalidateQueries({ queryKey: ['factura', id] });
      navigate('/facturas');
    },
    onError: (err) => {
      toast.error(err.message || 'Error al actualizar factura');
      setIsSubmitting(false);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const cliente = clientes.find(c => c.id.toString() === clienteId);
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        cliente_id: cliente.id,
        cliente_tipo_cliente_fe: safeValue(cliente.tipo_cliente_fe, '02'),
        cliente_tipo_contribuyente: safeValue(cliente.tipo_contribuyente),
        cliente_numero_ruc: safeValue(cliente.numero_ruc),
        cliente_digito_verificador_ruc: safeValue(cliente.digito_verificador_ruc),
        cliente_razon_social: safeValue(cliente.razon_social),
        cliente_direccion: safeValue(cliente.direccion),
        cliente_codigo_ubicacion: safeValue(cliente.codigo_ubicacion),
        cliente_provincia: safeValue(cliente.provincia),
        cliente_distrito: safeValue(cliente.distrito),
        cliente_corregimiento: safeValue(cliente.corregimiento),
        cliente_telefono1: safeValue(cliente.telefono1),
        cliente_correo_electronico1: safeValue(cliente.correo_electronico1),
        cliente_pais: safeValue(cliente.pais, 'PA'),
      }));
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      precio_unitario_descuento: 0,
      precio_item: 0,
      precio_acarreo: 0,
      precio_seguro: 0,
      valor_total: 0,
      tasa_itbms: '01',
      valor_itbms: 0,
      codigo_gtin: '0',
      codigo_gtin_inv: '0',
      cant_gtin_com: 0,
      cant_gtin_com_inv: 0,
    }]);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };

      const item = newItems[index];
      const cantidad = safeNumber(item.cantidad, 1);
      const precioUnitario = safeNumber(item.precio_unitario);
      const descuento = safeNumber(item.precio_unitario_descuento);
      const precioItem = (precioUnitario - descuento) * cantidad;
      const acarreo = safeNumber(item.precio_acarreo);
      const seguro = safeNumber(item.precio_seguro);

      let tasaItbms = 0;
      switch (item.tasa_itbms) {
        case '01': tasaItbms = 0.07; break;
        case '02': tasaItbms = 0.10; break;
        case '03': tasaItbms = 0.15; break;
        default: tasaItbms = 0;
      }
      const valorItbms = precioItem * tasaItbms;

      const valorTotal = precioItem + acarreo + seguro + valorItbms;

      newItems[index] = {
        ...newItems[index],
        precio_item: precioItem,
        valor_itbms: valorItbms,
        valor_total: valorTotal,
      };

      return newItems;
    });
  };

  const handleProductoSelect = (index, productoId) => {
    const producto = productos.find(p => p.id.toString() === productoId);
    if (producto) {
      setItems(prev => {
        const newItems = [...prev];
        newItems[index] = {
          ...newItems[index],
          producto_id: producto.id,
          descripcion: safeValue(producto.descripcion),
          codigo: safeValue(producto.codigo),
          unidad_medida: safeValue(producto.unidad_medida),
          codigo_cpbs: safeValue(producto.codigo_cpbs),
          codigo_cpbs_abrev: safeValue(producto.codigo_cpbs_abrev),
          unidad_medida_cpbs: safeValue(producto.unidad_medida_cpbs),
          precio_unitario: safeNumber(producto.precio_unitario),
          tasa_itbms: safeValue(producto.tasa_itbms, '01'),
          codigo_gtin: safeValue(producto.codigo_gtin, '0'),
          codigo_gtin_inv: safeValue(producto.codigo_gtin_inv, '0'),
        };
        return newItems;
      });
      handleItemChange(index, 'precio_unitario', producto.precio_unitario);
    }
  };

  const addFormaPago = () => {
    setFormasPago(prev => [...prev, { forma_pago_fact: '02', desc_forma_pago: '', valor_cuota_pagada: 0 }]);
  };

  const removeFormaPago = (index) => {
    setFormasPago(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormaPagoChange = (index, field, value) => {
    setFormasPago(prev => {
      const newFormas = [...prev];
      newFormas[index] = { ...newFormas[index], [field]: value };
      return newFormas;
    });
  };

  const totales = useMemo(() => {
    const totalPrecioNeto = items.reduce((sum, item) => sum + safeNumber(item.precio_item), 0);
    const totalItbms = items.reduce((sum, item) => sum + safeNumber(item.valor_itbms), 0);
    const totalIsc = items.reduce((sum, item) => sum + safeNumber(item.valor_isc), 0);
    const totalAcarreo = items.reduce((sum, item) => sum + safeNumber(item.precio_acarreo), 0);
    const totalSeguro = items.reduce((sum, item) => sum + safeNumber(item.precio_seguro), 0);
    const totalDescuento = items.reduce((sum, item) => sum + safeNumber(item.precio_unitario_descuento) * safeNumber(item.cantidad, 1), 0);
    const totalTodosItems = items.reduce((sum, item) => sum + safeNumber(item.valor_total), 0);
    const totalFactura = totalTodosItems;

    return {
      total_precio_neto: totalPrecioNeto,
      total_itbms: totalItbms,
      total_isc: totalIsc,
      total_monto_gravado: totalPrecioNeto,
      total_descuento: totalDescuento,
      total_acarreo_cobrado: totalAcarreo,
      valor_seguro_cobrado: totalSeguro,
      total_factura: totalFactura,
      total_todos_items: totalTodosItems,
      nro_items: items.length,
    };
  }, [items]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...totales,
    }));
  }, [totales]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cliente_razon_social) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    if (items.length === 0) {
      toast.error('Debe agregar al menos un item');
      return;
    }

    if (items.some(item => !item.descripcion)) {
      toast.error('Todos los items deben tener descripcion');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      items: items.map(({ id, ...rest }) => rest),
      formas_pago: formasPago.map(({ id, ...rest }) => rest),
    };

    actualizarFactura.mutate(payload);
  };

  if (loadingFactura) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <p className="text-slate-600">Factura no encontrada</p>
          <Link to="/facturas" className="text-blue-600 hover:underline mt-2 inline-block">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  if (factura.enviada) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-slate-600 font-medium">No se puede editar una factura ya enviada a EBI</p>
          <Link to="/facturas" className="text-blue-600 hover:underline mt-2 inline-block">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/facturas"
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Factura</h1>
          <p className="text-sm text-slate-500">
            {formData.numero_documento_fiscal} - {formData.cliente_razon_social || 'Sin cliente'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Informacion General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">N Documento Fiscal *</label>
              <input
                type="text"
                name="numero_documento_fiscal"
                value={formData.numero_documento_fiscal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Punto Facturacion</label>
              <input
                type="text"
                name="punto_facturacion_fiscal"
                value={formData.punto_facturacion_fiscal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Codigo Sucursal</label>
              <input
                type="text"
                name="codigo_sucursal_emisor"
                value={formData.codigo_sucursal_emisor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Emision *</label>
              <input
                type="date"
                name="fecha_emision"
                value={formData.fecha_emision}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Salida</label>
              <input
                type="date"
                name="fecha_salida"
                value={formData.fecha_salida}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Naturaleza Operacion</label>
              <select
                name="naturaleza_operacion"
                value={formData.naturaleza_operacion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="01">01 - Venta</option>
                <option value="02">02 - Exportacion</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Datos del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Cliente</label>
              <select
                value={formData.cliente_id}
                onChange={handleClienteChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Seleccione un cliente --</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.razon_social} {cliente.numero_ruc ? `(RUC: ${cliente.numero_ruc})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razon Social *</label>
              <input
                type="text"
                name="cliente_razon_social"
                value={formData.cliente_razon_social}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RUC</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="cliente_numero_ruc"
                  value={formData.cliente_numero_ruc}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Numero RUC"
                />
                <input
                  type="text"
                  name="cliente_digito_verificador_ruc"
                  value={formData.cliente_digito_verificador_ruc}
                  onChange={handleChange}
                  className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="DV"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Direccion</label>
              <input
                type="text"
                name="cliente_direccion"
                value={formData.cliente_direccion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electronico</label>
              <input
                type="email"
                name="cliente_correo_electronico1"
                value={formData.cliente_correo_electronico1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
              <input
                type="text"
                name="cliente_telefono1"
                value={formData.cliente_telefono1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pais</label>
              <input
                type="text"
                name="cliente_pais"
                value={formData.cliente_pais}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Items de la Factura</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus size={16} />
              Agregar Item
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-slate-400 text-center py-8">No hay items. Haga clic en "Agregar Item" para comenzar.</p>
          )}

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Item {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Producto</label>
                    <select
                      value={item.producto_id || ''}
                      onChange={(e) => handleProductoSelect(index, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Seleccione producto --</option>
                      {productos.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.descripcion}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion *</label>
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precio_unitario}
                      onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descuento Unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precio_unitario_descuento}
                      onChange={(e) => handleItemChange(index, 'precio_unitario_descuento', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasa ITBMS</label>
                    <select
                      value={item.tasa_itbms}
                      onChange={(e) => handleItemChange(index, 'tasa_itbms', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {TASAS_ITBMS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Acarreo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precio_acarreo}
                      onChange={(e) => handleItemChange(index, 'precio_acarreo', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Seguro</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precio_seguro}
                      onChange={(e) => handleItemChange(index, 'precio_seguro', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                  <span>Precio Item: <strong>${item.precio_item.toFixed(2)}</strong></span>
                  <span>ITBMS: <strong>${item.valor_itbms.toFixed(4)}</strong></span>
                  <span>Total: <strong>${item.valor_total.toFixed(2)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Formas de Pago</h2>
            <button
              type="button"
              onClick={addFormaPago}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus size={16} />
              Agregar Forma de Pago
            </button>
          </div>

          <div className="space-y-3">
            {formasPago.map((fp, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border border-slate-200 rounded-lg p-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pago</label>
                  <select
                    value={fp.forma_pago_fact}
                    onChange={(e) => handleFormaPagoChange(index, 'forma_pago_fact', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {FORMAS_PAGO.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fp.valor_cuota_pagada}
                    onChange={(e) => handleFormaPagoChange(index, 'valor_cuota_pagada', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
                    <input
                      type="text"
                      value={fp.desc_forma_pago}
                      onChange={(e) => handleFormaPagoChange(index, 'desc_forma_pago', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {formasPago.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFormaPago(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Totales</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Precio Neto</p>
              <p className="text-lg font-semibold text-slate-900">${totales.total_precio_neto.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">ITBMS</p>
              <p className="text-lg font-semibold text-slate-900">${totales.total_itbms.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Descuento</p>
              <p className="text-lg font-semibold text-slate-900">${totales.total_descuento.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600">Total Factura</p>
              <p className="text-lg font-semibold text-blue-900">${totales.total_factura.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            to="/facturas"
            className="px-6 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <Save size={16} />
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
