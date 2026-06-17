import { useState } from 'react';
import { useFacturas, useEnviarEBI, useConsultarEstado, useAnularFactura, useEnviarCorreo, useEliminarFactura } from '../hooks/useFacturas.js';
import { Plus, Search, FileText, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import BadgeEstado from '../components/BadgeEstado.jsx';
import AccionEBIButton from '../components/AccionEBIButton.jsx';
import Modal from '../components/Modal.jsx';

export default function Facturas() {
  const { data: facturasData, isLoading } = useFacturas();
  const facturas = facturasData?.data || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactura, setSelectedFactura] = useState(null);

  const enviarEBI = useEnviarEBI();
  const consultarEstado = useConsultarEstado();
  const anularFactura = useAnularFactura();
  const enviarCorreo = useEnviarCorreo();
  const eliminarFactura = useEliminarFactura();

  const filteredFacturas = facturas.filter(f => 
    f.numero_documento_fiscal?.includes(searchTerm) ||
    f.cliente_razon_social?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (facturaId, tipo) => {
    try {
      const response = tipo === 'xml' 
        ? await fetch(`/api/facturas/${facturaId}/xml`)
        : await fetch(`/api/facturas/${facturaId}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_${facturaId}.${tipo}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por numero o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Link
          to="/facturas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Factura
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">N Documento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Fecha</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">Acciones EBI</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Cargando...</td></tr>
              ) : filteredFacturas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No se encontraron facturas</td></tr>
              ) : (
                filteredFacturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{factura.numero_documento_fiscal}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{factura.cliente_razon_social || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(factura.fecha_emision).toLocaleDateString('es-PA')}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-slate-700">${parseFloat(factura.total_factura).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center"><BadgeEstado estado={factura.estado} /></td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        <AccionEBIButton tipo="enviar" facturaId={factura.id} onExecute={() => enviarEBI.mutate(factura.id)} disabled={factura.enviada || factura.estado === 'ANULADA'} />
                        <AccionEBIButton tipo="estado" facturaId={factura.id} onExecute={() => consultarEstado.mutate(factura.id)} />
                        <AccionEBIButton tipo="anular" facturaId={factura.id} onExecute={(id, data) => anularFactura.mutate({ id, motivo: data.motivo })} disabled={!factura.enviada || factura.estado === 'ANULADA'} />
                        <AccionEBIButton tipo="xml" facturaId={factura.id} onExecute={() => handleDownload(factura.id, 'xml')} disabled={!factura.enviada} />
                        <AccionEBIButton tipo="correo" facturaId={factura.id} onExecute={(id, data) => enviarCorreo.mutate({ id, correo: data.correo })} disabled={!factura.enviada} />
                        <AccionEBIButton tipo="pdf" facturaId={factura.id} onExecute={() => handleDownload(factura.id, 'pdf')} disabled={!factura.enviada} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedFactura(factura)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalle"><Eye className="w-4 h-4" /></button>
                        {!factura.enviada && (
                          <button onClick={() => { if (confirm('Eliminar esta factura?')) eliminarFactura.mutate(factura.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
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

      <Modal isOpen={!!selectedFactura} onClose={() => setSelectedFactura(null)} title={`Factura ${selectedFactura?.numero_documento_fiscal}`} size="lg">
        {selectedFactura && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-500">Cliente</p><p className="text-sm font-medium">{selectedFactura.cliente_razon_social}</p></div>
              <div><p className="text-xs text-slate-500">RUC</p><p className="text-sm font-medium">{selectedFactura.cliente_numero_ruc}</p></div>
              <div><p className="text-xs text-slate-500">Fecha Emision</p><p className="text-sm font-medium">{selectedFactura.fecha_emision}</p></div>
              <div><p className="text-xs text-slate-500">Total</p><p className="text-sm font-medium">${parseFloat(selectedFactura.total_factura).toFixed(2)}</p></div>
            </div>
            {selectedFactura.cufe && (
              <div>
                <p className="text-xs text-slate-500">CUFE</p>
                <p className="text-sm font-mono bg-slate-100 p-2 rounded break-all">{selectedFactura.cufe}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
