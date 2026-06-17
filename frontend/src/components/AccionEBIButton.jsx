import { useState } from 'react';
import {
  Send, FileSearch, Ban, FileDown, Mail, Download, Search,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';

const accionesConfig = {
  enviar: { label: 'Enviar', icon: Send, color: 'bg-blue-600 hover:bg-blue-700', description: 'Enviar documento a EBI' },
  estado: { label: 'Estado', icon: FileSearch, color: 'bg-amber-600 hover:bg-amber-700', description: 'Consultar estado del documento' },
  anular: { label: 'Anular', icon: Ban, color: 'bg-red-600 hover:bg-red-700', description: 'Anular documento' },
  xml: { label: 'XML', icon: FileDown, color: 'bg-emerald-600 hover:bg-emerald-700', description: 'Descargar XML' },
  correo: { label: 'Correo', icon: Mail, color: 'bg-purple-600 hover:bg-purple-700', description: 'Enviar por correo' },
  pdf: { label: 'PDF', icon: Download, color: 'bg-orange-600 hover:bg-orange-700', description: 'Descargar PDF' },
  ruc: { label: 'RUC DV', icon: Search, color: 'bg-cyan-600 hover:bg-cyan-700', description: 'Consultar RUC DV' }
};

export default function AccionEBIButton({ tipo, onExecute, facturaId, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});

  const config = accionesConfig[tipo];
  const Icon = config.icon;

  const handleClick = async () => {
    if (tipo === 'anular' || tipo === 'correo') {
      setShowModal(true);
      return;
    }

    await executeAction();
  };

  const executeAction = async (extraData = {}) => {
    setLoading(true);
    try {
      await onExecute(facturaId, extraData);
    } catch (error) {
      toast.error(error.message || 'Error en la operación');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    executeAction(data);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all ${
          config.color
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={config.description}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Icon className="w-3.5 h-3.5" />
        )}
        <span>{config.label}</span>
      </button>

      {/* Modal para Anulación */}
      <Modal
        isOpen={showModal && tipo === 'anular'}
        onClose={() => setShowModal(false)}
        title="Anular Documento"
        size="sm"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Motivo de Anulación *
            </label>
            <textarea
              name="motivo"
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el motivo de la anulación..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Anular'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Envío de Correo */}
      <Modal
        isOpen={showModal && tipo === 'correo'}
        onClose={() => setShowModal(false)}
        title="Enviar por Correo"
        size="sm"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="correo"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
