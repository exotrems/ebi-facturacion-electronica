import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.service.js';
import { toast } from 'react-hot-toast';
import {
  Eye,
  Trash2,
  Send,
  Search,
  Download,
  Mail,
  Ban,
  FileText,
  Pencil,
  Calendar,
  X
} from 'lucide-react';

// Helper: formatear fecha ISO a DD/MM/YYYY SIN offset de zona horaria
function formatDateDisplay(isoDate) {
  if (!isoDate) return 'N/A';
  if (typeof isoDate === 'string') {
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }
  return isoDate;
}

export default function Facturas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // === ESTADOS DE FILTROS ===
  const [filtroTexto, setFiltroTexto] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [mostrarFiltrosFecha, setMostrarFiltrosFecha] = useState(false);

  // === MODALES ===
  const [modalAnular, setModalAnular] = useState({ open: false, factura: null });
  const [modalCorreo, setModalCorreo] = useState({ open: false, factura: null });
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [correoDestino, setCorreoDestino] = useState('');

  // === QUERY CON FILTROS DE FECHA ===
  // Construir params para enviar al backend
  const queryParams = {};
  if (fechaDesde) queryParams.fecha_desde = fechaDesde;
  if (fechaHasta) queryParams.fecha_hasta = fechaHasta;

  const { data: facturasResponse, isLoading } = useQuery({
    queryKey: ['facturas', queryParams],
    queryFn: () => api.get('/facturas', { params: queryParams }).then(r => r.data),
  });

  const facturas = facturasResponse?.data || [];

  // === MUTACIONES ===
  const enviarEBI = useMutation({
    mutationFn: (id) => api.post(`/facturas/${id}/enviar`),
    onSuccess: () => {
      toast.success('Factura enviada a EBI exitosamente');
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
    onError: (err) => toast.error(err.message || 'Error al enviar a EBI'),
  });

  const consultarEstado = useMutation({
    mutationFn: (id) => api.get(`/facturas/${id}/estado`),
    onSuccess: (res) => {
      toast.success(`Estado: ${res.data.data?.estado || 'Consultado'}`);
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
    onError: (err) => toast.error(err.message || 'Error al consultar estado'),
  });

  const anularFactura = useMutation({
    mutationFn: ({ id, motivo }) => api.post(`/facturas/${id}/anular`, { motivo }),
    onSuccess: () => {
      toast.success('Factura anulada correctamente');
      setModalAnular({ open: false, factura: null });
      setMotivoAnulacion('');
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
    onError: (err) => toast.error(err.message || 'Error al anular factura'),
  });

  const enviarCorreo = useMutation({
    mutationFn: ({ id, correo }) => api.post(`/facturas/${id}/correo`, { correo }),
    onSuccess: () => {
      toast.success('Correo enviado correctamente');
      setModalCorreo({ open: false, factura: null });
      setCorreoDestino('');
    },
    onError: (err) => toast.error(err.message || 'Error al enviar correo'),
  });

  const eliminarFactura = useMutation({
    mutationFn: (id) => api.delete(`/facturas/${id}`),
    onSuccess: () => {
      toast.success('Factura eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
    onError: (err) => toast.error(err.message || 'Error al eliminar factura'),
  });

  const handleDownload = async (id, tipo) => {
    try {
      const response = await api.get(`/facturas/${id}/${tipo}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${id}.${tipo}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Descarga de ${tipo.toUpperCase()} iniciada`);
    } catch (err) {
      toast.error(`Error al descargar ${tipo.toUpperCase()}`);
    }
  };

  // === FILTRADO LOCAL POR TEXTO ===
  const facturasFiltradas = facturas.filter(f => {
    if (!filtroTexto) return true;
    const texto = filtroTexto.toLowerCase();
    return (
      f.numero_documento_fiscal?.toLowerCase().includes(texto) ||
      f.cliente_razon_social?.toLowerCase().includes(texto)
    );
  });

  const getEstadoBadge = (estado, enviada) => {
    if (estado === 'ANULADA') return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">ANULADA</span>;
    if (enviada) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">ENVIADA</span>;
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">PENDIENTE</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="text-sm text-slate-500 mt-1">Gestione sus facturas electronicas EBI</p>
        </div>
        <Link
          to="/facturas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <FileText size={16} />
          Nueva Factura
        </Link>
      </div>

      {/* === PANEL DE FILTROS === */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        {/* Fila 1: Busqueda por texto + toggle filtros fecha */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por numero o cliente..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {filtroTexto && (
              <button
                onClick={() => setFiltroTexto('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setMostrarFiltrosFecha(!mostrarFiltrosFecha)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mostrarFiltrosFecha || fechaDesde || fechaHasta
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar size={16} />
            {mostrarFiltrosFecha || fechaDesde || fechaHasta ? 'Ocultar filtros' : 'Filtros fecha'}
            {(fechaDesde || fechaHasta) && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">!</span>
            )}
          </button>
        </div>

        {/* Fila 2: Inputs de fecha (colapsables) */}
        {mostrarFiltrosFecha && (
          <div className="flex flex-col sm:flex-row gap-3 items-end pt-2 border-t border-slate-100">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Fecha desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Fecha hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <X size={14} />
              Limpiar fechas
            </button>
          </div>
        )}

        {/* Badge de filtros activos (cuando esta colapsado) */}
        {!mostrarFiltrosFecha && (fechaDesde || fechaHasta) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Filtros activos:</span>
            {fechaDesde && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                Desde: {fechaDesde}
              </span>
            )}
            {fechaHasta && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                Hasta: {fechaHasta}
              </span>
            )}
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="text-xs text-red-500 hover:text-red-700 underline ml-2"
            >
              Quitar filtros fecha
            </button>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-slate-500">
        Mostrando <strong>{facturasFiltradas.length}</strong> factura{facturasFiltradas.length !== 1 ? 's' : ''}
        {filtroTexto && <span className="ml-1">(filtrado por texto)</span>}
        {(fechaDesde || fechaHasta) && <span className="ml-1">(filtrado por fecha)</span>}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">N Documento</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Acciones EBI</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facturasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron facturas
                  </td>
                </tr>
              ) : (
                facturasFiltradas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {factura.numero_documento_fiscal}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {factura.cliente_razon_social || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateDisplay(factura.fecha_emision)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ${parseFloat(factura.total_factura).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getEstadoBadge(factura.estado, factura.enviada)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button title="Enviar a EBI" onClick={() => enviarEBI.mutate(factura.id)} disabled={factura.enviada || factura.estado === 'ANULADA'} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"><Send size={16} /></button>
                        <button title="Consultar Estado" onClick={() => consultarEstado.mutate(factura.id)} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"><Search size={16} /></button>
                        <button title="Anular" onClick={() => setModalAnular({ open: true, factura })} disabled={!factura.enviada || factura.estado === 'ANULADA'} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"><Ban size={16} /></button>
                        <button title="Descargar XML" onClick={() => handleDownload(factura.id, 'xml')} disabled={!factura.enviada} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"><Download size={16} /></button>
                        <button title="Enviar por Correo" onClick={() => setModalCorreo({ open: true, factura })} disabled={!factura.enviada} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"><Mail size={16} /></button>
                        <button title="Descargar PDF" onClick={() => handleDownload(factura.id, 'pdf')} disabled={!factura.enviada} className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"><FileText size={16} /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/facturas/${factura.id}`} title="Ver Detalle" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"><Eye size={16} /></Link>
                        {!factura.enviada && factura.estado !== 'ANULADA' && (
                          <button title="Editar Factura" onClick={() => navigate(`/facturas/editar/${factura.id}`)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"><Pencil size={16} /></button>
                        )}
                        {!factura.enviada && (
                          <button title="Eliminar" onClick={() => { if (window.confirm('Esta seguro de eliminar esta factura?')) { eliminarFactura.mutate(factura.id); } }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Anular */}
      {modalAnular.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Anular Factura</h3>
            <p className="text-sm text-slate-500 mb-4">Factura: {modalAnular.factura?.numero_documento_fiscal}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de Anulacion *</label>
                <textarea value={motivoAnulacion} onChange={(e) => setMotivoAnulacion(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Ingrese el motivo de anulacion..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setModalAnular({ open: false, factura: null }); setMotivoAnulacion(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button onClick={() => { if (!motivoAnulacion.trim()) { toast.error('El motivo de anulacion es requerido'); return; } anularFactura.mutate({ id: modalAnular.factura.id, motivo: motivoAnulacion }); }} disabled={anularFactura.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">{anularFactura.isPending ? 'Anulando...' : 'Anular'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Correo */}
      {modalCorreo.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Enviar por Correo</h3>
            <p className="text-sm text-slate-500 mb-4">Factura: {modalCorreo.factura?.numero_documento_fiscal}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electronico *</label>
                <input type="email" value={correoDestino} onChange={(e) => setCorreoDestino(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="cliente@ejemplo.com" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setModalCorreo({ open: false, factura: null }); setCorreoDestino(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button onClick={() => { if (!correoDestino.trim()) { toast.error('El correo es requerido'); return; } enviarCorreo.mutate({ id: modalCorreo.factura.id, correo: correoDestino }); }} disabled={enviarCorreo.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{enviarCorreo.isPending ? 'Enviando...' : 'Enviar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
