import { useState } from 'react';
import { useClientes, useCrearCliente, useActualizarCliente, useEliminarCliente, useConsultarRucDV } from '../hooks/useClientes.js';
import { Plus, Search, Trash2, Pencil, CheckCircle, X } from 'lucide-react';
import Modal from '../components/Modal.jsx';

export default function Clientes() {
  const { data: clientesData, isLoading } = useClientes();
  const clientes = clientesData?.data || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRucModal, setShowRucModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const crearCliente = useCrearCliente();
  const actualizarCliente = useActualizarCliente();
  const eliminarCliente = useEliminarCliente();
  const consultarRucDV = useConsultarRucDV();

  const filtered = clientes.filter(c =>
    c.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numero_ruc?.includes(searchTerm)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (editingCliente) {
      actualizarCliente.mutate({ id: editingCliente.id, data }, {
        onSuccess: () => {
          setShowModal(false);
          setEditingCliente(null);
        }
      });
    } else {
      crearCliente.mutate(data, { onSuccess: () => setShowModal(false) });
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    eliminarCliente.mutate(id, {
      onSuccess: () => setConfirmDelete(null)
    });
  };

  const handleRucSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { tipoRuc, ruc } = Object.fromEntries(formData);
    consultarRucDV.mutate({ tipoRuc, ruc });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCliente(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRucModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"><CheckCircle className="w-4 h-4" />Consultar RUC DV</button>
          <button onClick={() => { setEditingCliente(null); setShowModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Nuevo Cliente</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">RUC</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Razon Social</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Direccion</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Telefono</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Correo</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (<tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>) : filtered.length === 0 ? (<tr><td colSpan={6} className="text-center py-8 text-slate-400">No hay clientes</td></tr>) : (filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-sm">{c.numero_ruc}-{c.digito_verificador_ruc}</td>
                <td className="py-3 px-4 text-sm font-medium">{c.razon_social}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{c.direccion}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{c.telefono1}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{c.correo_electronico1}</td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(c)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Cliente */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo Cliente FE</label>
              <select name="tipo_cliente_fe" defaultValue={editingCliente?.tipo_cliente_fe || '02'} className="w-full px-3 py-2 border rounded-lg">
                <option value="01">01 - Contribuyente</option>
                <option value="02">02 - Consumidor Final</option>
                <option value="03">03 - Gobierno</option>
                <option value="04">04 - Extranjero</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo Contribuyente</label>
              <select name="tipo_contribuyente" defaultValue={editingCliente?.tipo_contribuyente || ''} className="w-full px-3 py-2 border rounded-lg">
                <option value="">-- Seleccione --</option>
                <option value="1">1 - Natural</option>
                <option value="2">2 - Juridico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RUC *</label>
              <input name="numero_ruc" required defaultValue={editingCliente?.numero_ruc || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">DV *</label>
              <input name="digito_verificador_ruc" required defaultValue={editingCliente?.digito_verificador_ruc || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Razon Social *</label>
              <input name="razon_social" required defaultValue={editingCliente?.razon_social || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Direccion</label>
              <input name="direccion" defaultValue={editingCliente?.direccion || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Codigo Ubicacion</label>
              <input name="codigo_ubicacion" defaultValue={editingCliente?.codigo_ubicacion || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pais</label>
              <input name="pais" defaultValue={editingCliente?.pais || 'PA'} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provincia</label>
              <input name="provincia" defaultValue={editingCliente?.provincia || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Distrito</label>
              <input name="distrito" defaultValue={editingCliente?.distrito || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Corregimiento</label>
              <input name="corregimiento" defaultValue={editingCliente?.corregimiento || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefono</label>
              <input name="telefono1" defaultValue={editingCliente?.telefono1 || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Correo</label>
              <input type="email" name="correo_electronico1" defaultValue={editingCliente?.correo_electronico1 || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingCliente ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Consultar RUC DV */}
      <Modal isOpen={showRucModal} onClose={() => setShowRucModal(false)} title="Consultar RUC DV" size="sm">
        <form onSubmit={handleRucSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo RUC</label>
            <select name="tipoRuc" className="w-full px-3 py-2 border rounded-lg">
              <option value="1">1 - Natural</option>
              <option value="2">2 - Juridico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">RUC</label>
            <input name="ruc" required className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: 155596713-2-2015" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowRucModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Consultar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminacion */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Confirmar eliminacion</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Estas seguro de eliminar al cliente <strong>{confirmDelete.razon_social}</strong>?
              Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
