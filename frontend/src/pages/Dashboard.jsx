import { useFacturas } from '../hooks/useFacturas.js';
import { FileText, Users, Package, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data: facturasData } = useFacturas();
  const facturas = facturasData?.data || [];

  const stats = {
    total: facturas.length,
    pendientes: facturas.filter(f => f.estado === 'PENDIENTE').length,
    enviadas: facturas.filter(f => f.estado === 'ENVIADA' || f.estado === 'AUTORIZADA').length,
    anuladas: facturas.filter(f => f.estado === 'ANULADA').length
  };

  const recentFacturas = facturas.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Facturas"
          value={stats.total}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          title="Pendientes"
          value={stats.pendientes}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="Enviadas"
          value={stats.enviadas}
          icon={CheckCircle}
          color="bg-emerald-500"
        />
        <StatCard
          title="Anuladas"
          value={stats.anuladas}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Facturas Recientes</h2>
        </div>
        <div className="p-6">
          {recentFacturas.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay facturas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">N° Documento</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Cliente</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Fecha</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Total</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFacturas.map((factura) => (
                    <tr key={factura.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">
                        {factura.numero_documento_fiscal}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {factura.cliente_razon_social || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {new Date(factura.fecha_emision).toLocaleDateString('es-PA')}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-slate-700">
                        ${parseFloat(factura.total_factura).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          factura.estado === 'AUTORIZADA' ? 'bg-emerald-100 text-emerald-700' :
                          factura.estado === 'ENVIADA' ? 'bg-blue-100 text-blue-700' :
                          factura.estado === 'ANULADA' ? 'bg-gray-100 text-gray-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {factura.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
