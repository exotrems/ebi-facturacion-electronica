import { useState } from 'react';
import { useProductos, useCrearProducto, useActualizarProducto, useEliminarProducto } from '../hooks/useProductos.js';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import Modal from '../components/Modal.jsx';

export default function Productos() {
  const { data: productosData, isLoading } = useProductos();
  const productos = productosData?.data || [];
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProducto, setEditingProducto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const crearProducto = useCrearProducto();
  const actualizarProducto = useActualizarProducto();
  const eliminarProducto = useEliminarProducto();

  const filtered = productos.filter(p =>
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo?.includes(searchTerm)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.precio_unitario = parseFloat(data.precio_unitario) || 0;

    if (editingProducto) {
      actualizarProducto.mutate({ id: editingProducto.id, data }, {
        onSuccess: () => {
          setShowModal(false);
          setEditingProducto(null);
        }
      });
    } else {
      crearProducto.mutate(data, { onSuccess: () => setShowModal(false) });
    }
  };

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    eliminarProducto.mutate(id, {
      onSuccess: () => setConfirmDelete(null)
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProducto(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <button onClick={() => { setEditingProducto(null); setShowModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Nuevo Producto</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Codigo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Descripcion</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Unidad</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Precio</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">ITBMS</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (<tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>) : filtered.length === 0 ? (<tr><td colSpan={6} className="text-center py-8 text-slate-400">No hay productos</td></tr>) : (filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-sm font-mono">{p.codigo}</td>
                <td className="py-3 px-4 text-sm font-medium">{p.descripcion}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{p.unidad_medida}</td>
                <td className="py-3 px-4 text-sm text-right">${parseFloat(p.precio_unitario).toFixed(2)}</td>
                <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{p.tasa_itbms}</span></td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Producto */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Codigo</label>
              <input name="codigo" defaultValue={editingProducto?.codigo || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidad Medida</label>
              <input name="unidad_medida" defaultValue={editingProducto?.unidad_medida || 'um'} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Descripcion *</label>
              <input name="descripcion" required defaultValue={editingProducto?.descripcion || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio Unitario</label>
              <input type="number" step="0.01" name="precio_unitario" defaultValue={editingProducto?.precio_unitario || '0'} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tasa ITBMS</label>
              <select name="tasa_itbms" defaultValue={editingProducto?.tasa_itbms || '01'} className="w-full px-3 py-2 border rounded-lg">
                <option value="00">00 - Exento</option>
                <option value="01">01 - 7%</option>
                <option value="02">02 - 10%</option>
                <option value="03">03 - 15%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Codigo CPBS</label>
              <input name="codigo_cpbs" defaultValue={editingProducto?.codigo_cpbs || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Codigo CPBS Abrev</label>
              <input name="codigo_cpbs_abrev" defaultValue={editingProducto?.codigo_cpbs_abrev || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidad Medida CPBS</label>
              <input name="unidad_medida_cpbs" defaultValue={editingProducto?.unidad_medida_cpbs || ''} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Codigo GTIN</label>
              <input name="codigo_gtin" defaultValue={editingProducto?.codigo_gtin || '0'} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Codigo GTIN Inv</label>
              <input name="codigo_gtin_inv" defaultValue={editingProducto?.codigo_gtin_inv || '0'} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingProducto ? 'Actualizar' : 'Guardar'}
            </button>
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
              Estas seguro de eliminar el producto <strong>{confirmDelete.descripcion}</strong>?
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
