import { useState } from 'react';
import { useProductos, useCrearProducto } from '../hooks/useProductos.js';
import { Plus, Search } from 'lucide-react';
import Modal from '../components/Modal.jsx';

export default function Productos() {
  const { data: productosData, isLoading } = useProductos();
  const productos = productosData?.data || [];
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const crearProducto = useCrearProducto();

  const filtered = productos.filter(p => 
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo?.includes(searchTerm)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.precio_unitario = parseFloat(data.precio_unitario);
    crearProducto.mutate(data, { onSuccess: () => setShowModal(false) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Nuevo Producto</button>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (<tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr>) : filtered.length === 0 ? (<tr><td colSpan={5} className="text-center py-8 text-slate-400">No hay productos</td></tr>) : (filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-sm font-mono">{p.codigo}</td>
                <td className="py-3 px-4 text-sm font-medium">{p.descripcion}</td>
                <td className="py-3 px-4 text-sm text-slate-500">{p.unidad_medida}</td>
                <td className="py-3 px-4 text-sm text-right">${parseFloat(p.precio_unitario).toFixed(2)}</td>
                <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{p.tasa_itbms}</span></td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Producto" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Codigo</label><input name="codigo" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Unidad Medida</label><input name="unidad_medida" defaultValue="um" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Descripcion *</label><input name="descripcion" required className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Precio Unitario</label><input type="number" step="0.01" name="precio_unitario" defaultValue="0" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Tasa ITBMS</label><select name="tasa_itbms" className="w-full px-3 py-2 border rounded-lg"><option value="00">00 - Exento</option><option value="01">01 - 7%</option><option value="02">02 - 10%</option><option value="03">03 - 15%</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Codigo CPBS</label><input name="codigo_cpbs" className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Codigo GTIN</label><input name="codigo_gtin" defaultValue="0" className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
