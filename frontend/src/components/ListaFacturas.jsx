import React, { useState, useEffect } from 'react';
import { getNombrePais, getNombreMoneda, esPanama } from '../data/catalogosEBI';

export default function ListaFacturas({ onNueva, onEditar, onVer, onPDF }) {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/facturas');

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      // Manejar diferentes formatos de respuesta
      let listaFacturas = [];
      if (Array.isArray(data)) {
        listaFacturas = data;
      } else if (data && Array.isArray(data.data)) {
        listaFacturas = data.data;
      } else if (data && Array.isArray(data.facturas)) {
        listaFacturas = data.facturas;
      } else if (data && typeof data === 'object') {
        // Si es un objeto con IDs como keys, convertir a array
        listaFacturas = Object.values(data).filter(v => v && typeof v === 'object');
      }

      setFacturas(listaFacturas);
    } catch (err) {
      console.error('Error cargando facturas:', err);
      setError(err.message);
      setFacturas([]);
    } finally {
      setCargando(false);
    }
  };

  const eliminarFactura = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta factura?')) return;
    try {
      const res = await fetch(`/api/facturas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      cargarFacturas();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      BORRADOR: { bg: '#f3f4f6', color: '#6b7280', text: '📝 Borrador' },
      PENDIENTE: { bg: '#fef3c7', color: '#d97706', text: '⏳ Pendiente' },
      ENVIADA: { bg: '#dbeafe', color: '#2563eb', text: '📤 Enviada DGI' },
      ACEPTADA: { bg: '#d1fae5', color: '#059669', text: '✅ Aceptada' },
      RECHAZADA: { bg: '#fee2e2', color: '#dc2626', text: '❌ Rechazada' },
      ANULADA: { bg: '#f3f4f6', color: '#9ca3af', text: '🚫 Anulada' },
    };
    const s = estilos[estado] || estilos.BORRADOR;
    return (
      <span style={{
        background: s.bg, color: s.color, padding: '4px 10px',
        borderRadius: '12px', fontSize: '12px', fontWeight: 500,
        display: 'inline-block'
      }}>
        {s.text}
      </span>
    );
  };

  const puedeModificar = (estado) => ['BORRADOR', 'PENDIENTE', 'RECHAZADA'].includes(estado);
  const puedeEliminar = (estado) => estado === 'BORRADOR';

  const facturasFiltradas = Array.isArray(facturas) 
    ? facturas.filter(f =>
        f && (
          (f.numero || '').toLowerCase().includes(filtro.toLowerCase()) ||
          (f.cliente_nombre || '').toLowerCase().includes(filtro.toLowerCase()) ||
          (f.cliente_ruc || '').toLowerCase().includes(filtro.toLowerCase())
        )
      )
    : [];

  if (cargando) return <div className="loading">Cargando facturas...</div>;

  if (error) {
    return (
      <div className="lista-facturas">
        <div className="header">
          <h2>📋 Facturas Electrónicas</h2>
          <button className="btn-primary" onClick={onNueva}>
            ➕ Nueva Factura
          </button>
        </div>
        <div className="error-banner">
          <strong>⚠️ Error cargando facturas:</strong>
          <p>{error}</p>
          <button className="btn-primary" onClick={cargarFacturas} style={{ marginTop: '12px' }}>
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-facturas">
      <div className="header">
        <h2>📋 Facturas Electrónicas</h2>
        <button className="btn-primary" onClick={onNueva}>
          ➕ Nueva Factura
        </button>
      </div>

      <div className="filtro-row">
        <input
          type="text"
          placeholder="🔍 Buscar por número, cliente o RUC..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-input"
        />
        <span className="contador">{facturasFiltradas.length} facturas</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>RUC/ID</th>
              <th>País</th>
              <th>Total</th>
              <th>Moneda</th>
              <th>Estado</th>
              <th style={{ minWidth: '280px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty">
                  {filtro ? 'No hay facturas que coincidan con el filtro' : 'No hay facturas registradas'}
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((f) => (
                <tr key={f.id || Math.random()}>
                  <td className="numero-cell">{f.numero || 'N/A'}</td>
                  <td>{f.fecha ? new Date(f.fecha).toLocaleDateString('es-PA') : '-'}</td>
                  <td>{f.cliente_nombre || f.cliente?.nombre || 'Sin nombre'}</td>
                  <td>{f.cliente_ruc || f.cliente?.ruc || '-'}</td>
                  <td>{getNombrePais(f.cliente_pais || f.cliente?.pais)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                    {f.total ? parseFloat(f.total).toFixed(2) : '0.00'}
                  </td>
                  <td>{f.moneda || '-'}</td>
                  <td>{getEstadoBadge(f.estado)}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-action btn-view" onClick={() => onVer(f)} title="Ver detalle">
                        👁️ Ver
                      </button>

                      {puedeModificar(f.estado) && (
                        <button
                          className="btn-action btn-edit"
                          onClick={() => onEditar(f)}
                          title="Modificar factura"
                        >
                          ✏️ Modificar
                        </button>
                      )}

                      <button className="btn-action btn-pdf" onClick={() => onPDF(f)} title="Exportar PDF">
                        📄 PDF
                      </button>

                      {(f.estado === 'BORRADOR' || f.estado === 'PENDIENTE') && (
                        <button
                          className="btn-action btn-enviar"
                          onClick={() => alert('Función enviar a DGI - implementar con API EBI')}
                          title="Enviar a DGI"
                        >
                          📤 Enviar
                        </button>
                      )}

                      {puedeEliminar(f.estado) && (
                        <button className="btn-action btn-delete" onClick={() => eliminarFactura(f.id)} title="Eliminar">
                          🗑️
                        </button>
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
  );
}
