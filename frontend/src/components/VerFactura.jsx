import React, { useState, useEffect } from 'react';
import {
  getNombrePais, getNombreMoneda, getNombreUnidadMedida,
  getNombreCPBS, esPanama
} from '../data/catalogosEBI';

export default function VerFactura({ factura, onVolver, onEditar, onPDF }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarItems();
  }, [factura.id]);

  const cargarItems = async () => {
    try {
      const res = await fetch(`/api/facturas/${factura.id}/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Error cargando items:', err);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      BORRADOR: { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
      PENDIENTE: { bg: '#fef3c7', color: '#d97706', border: '#f59e0b' },
      ENVIADA: { bg: '#dbeafe', color: '#2563eb', border: '#3b82f6' },
      ACEPTADA: { bg: '#d1fae5', color: '#059669', border: '#10b981' },
      RECHAZADA: { bg: '#fee2e2', color: '#dc2626', border: '#ef4444' },
      ANULADA: { bg: '#f3f4f6', color: '#9ca3af', border: '#d1d5db' },
    };
    const s = estilos[estado] || estilos.BORRADOR;
    return (
      <span style={{
        background: s.bg, color: s.color, border: `2px solid ${s.border}`,
        padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600,
        display: 'inline-block'
      }}>
        {estado}
      </span>
    );
  };

  const clienteEsPanama = esPanama(factura.cliente_pais || factura.cliente?.pais);

  return (
    <div className="ver-factura">
      <div className="ver-header">
        <button className="btn-back" onClick={onVolver}>← Volver al listado</button>
        <div className="ver-actions">
          {(factura.estado === 'BORRADOR' || factura.estado === 'PENDIENTE') && (
            <button className="btn-action btn-edit" onClick={() => onEditar(factura)}>
              ✏️ Editar
            </button>
          )}
          <button className="btn-action btn-pdf" onClick={() => onPDF(factura)}>
            📄 Descargar PDF
          </button>
        </div>
      </div>

      <div className="factura-documento">
        {/* ENCABEZADO */}
        <div className="doc-header">
          <div className="doc-empresa">
            <h1>FACTURA ELECTRÓNICA</h1>
            <p className="doc-subtitle">EBI PAC - DGI Panamá</p>
          </div>
          <div className="doc-estado">
            {getEstadoBadge(factura.estado)}
          </div>
        </div>

        <div className="doc-info-general">
          <div className="info-block">
            <h4>📄 Información de la Factura</h4>
            <p><strong>Número:</strong> {factura.numero}</p>
            <p><strong>Fecha:</strong> {new Date(factura.fecha).toLocaleDateString('es-PA', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}</p>
            <p><strong>Moneda:</strong> {getNombreMoneda(factura.moneda)} ({factura.moneda})</p>
            <p><strong>Tipo:</strong> {factura.tipoOperacion === 'EXPORTACION' ? 'Exportación' : 'Venta Local'}</p>
            {factura.incoterm && <p><strong>Incoterm:</strong> {factura.incoterm}</p>}
          </div>

          <div className="info-block">
            <h4>👤 Cliente</h4>
            <p><strong>Nombre:</strong> {factura.cliente_nombre || factura.cliente?.nombre}</p>
            <p><strong>RUC/ID:</strong> {factura.cliente_ruc || factura.cliente?.ruc}</p>
            <p><strong>País:</strong> {getNombrePais(factura.cliente_pais || factura.cliente?.pais)}</p>
            {clienteEsPanama && (
              <>
                <p><strong>Provincia:</strong> {factura.cliente_provincia || factura.cliente?.provincia}</p>
                <p><strong>Distrito:</strong> {factura.cliente_distrito || factura.cliente?.distrito}</p>
                {factura.cliente_corregimiento && <p><strong>Corregimiento:</strong> {factura.cliente_corregimiento}</p>}
              </>
            )}
            {(factura.cliente_direccion || factura.cliente?.direccion) && (
              <p><strong>Dirección:</strong> {factura.cliente_direccion || factura.cliente?.direccion}</p>
            )}
            {(factura.cliente_email || factura.cliente?.email) && (
              <p><strong>Email:</strong> {factura.cliente_email || factura.cliente?.email}</p>
            )}
          </div>
        </div>

        {/* TABLA DE ITEMS */}
        <div className="doc-items">
          <h4>🛍️ Detalle de Items</h4>
          {cargando ? (
            <p>Cargando items...</p>
          ) : (
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Descripción</th>
                  <th>Unidad</th>
                  <th>Cant.</th>
                  <th>Precio Unit.</th>
                  <th>Desc.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const totalLinea = item.cantidad * item.precio_unitario - (item.descuento || 0);
                  return (
                    <tr key={item.id || idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="item-desc">
                          <strong>{item.descripcion}</strong>
                          {item.cpbs_segmento && (
                            <small>CPBS: {getNombreCPBS(item.cpbs_segmento)}</small>
                          )}
                          {item.gtin && <small>GTIN: {item.gtin}</small>}
                        </div>
                      </td>
                      <td>{getNombreUnidadMedida(item.unidad_medida)}</td>
                      <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{parseFloat(item.precio_unitario).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{(item.descuento || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{totalLinea.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* TOTALES */}
        <div className="doc-totales">
          <div className="totales-block">
            <div className="total-line">
              <span>Subtotal:</span>
              <span>{parseFloat(factura.subtotal).toFixed(2)} {factura.moneda}</span>
            </div>
            <div className="total-line">
              <span>ITBMS (7%):</span>
              <span>{parseFloat(factura.itbms).toFixed(2)} {factura.moneda}</span>
            </div>
            <div className="total-line grand-total">
              <span>TOTAL:</span>
              <span>{parseFloat(factura.total).toFixed(2)} {factura.moneda}</span>
            </div>
          </div>
        </div>

        {/* OBSERVACIONES */}
        {factura.observaciones && (
          <div className="doc-observaciones">
            <h4>📝 Observaciones</h4>
            <p>{factura.observaciones}</p>
          </div>
        )}

        {/* PIE DE PÁGINA */}
        <div className="doc-footer">
          <p>Documento generado electrónicamente - EBI PAC Panamá</p>
          <p>ID Factura: {factura.id} | Fecha emisión: {new Date(factura.created_at).toLocaleString('es-PA')}</p>
        </div>
      </div>
    </div>
  );
}
