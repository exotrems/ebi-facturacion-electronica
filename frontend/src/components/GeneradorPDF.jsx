import React, { useState } from 'react';
import {
  getNombrePais, getNombreMoneda, getNombreUnidadMedida,
  getNombreCPBS, esPanama
} from '../data/catalogosEBI';

export default function GeneradorPDF({ factura, items, onCerrar }) {
  const [generando, setGenerando] = useState(false);

  const generarPDF = async () => {
    setGenerando(true);
    try {
      const res = await fetch(`/api/facturas/${factura.id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Error generando PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${factura.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onCerrar();
    } catch (err) {
      alert('Error al generar PDF: ' + err.message);
    } finally {
      setGenerando(false);
    }
  };

  const imprimirDirecto = () => {
    window.print();
  };

  const clienteEsPanama = esPanama(factura.cliente_pais || factura.cliente?.pais);

  return (
    <div className="modal-overlay">
      <div className="modal-content pdf-modal">
        <div className="modal-header">
          <h3>📄 Exportar Factura a PDF</h3>
          <button className="btn-close" onClick={onCerrar}>×</button>
        </div>

        <div className="pdf-preview">
          <div className="pdf-page">
            <div className="pdf-header">
              <div className="pdf-empresa">
                <h2>FACTURA ELECTRÓNICA</h2>
                <p>EBI PAC - DGI Panamá</p>
              </div>
              <div className="pdf-numero">
                <p className="numero-factura">{factura.numero}</p>
                <p className="estado-factura">{factura.estado}</p>
              </div>
            </div>

            <div className="pdf-info">
              <div className="info-col">
                <h4>Emisor</h4>
                <p><strong>Fecha:</strong> {new Date(factura.fecha).toLocaleDateString('es-PA')}</p>
                <p><strong>Moneda:</strong> {getNombreMoneda(factura.moneda)}</p>
                <p><strong>Tipo:</strong> {factura.tipoOperacion === 'EXPORTACION' ? 'Exportación' : 'Venta Local'}</p>
              </div>
              <div className="info-col">
                <h4>Cliente</h4>
                <p><strong>{factura.cliente_nombre || factura.cliente?.nombre}</strong></p>
                <p>RUC/ID: {factura.cliente_ruc || factura.cliente?.ruc}</p>
                <p>País: {getNombrePais(factura.cliente_pais || factura.cliente?.pais)}</p>
                {clienteEsPanama && (
                  <>
                    <p>Provincia: {factura.cliente_provincia || factura.cliente?.provincia}</p>
                    <p>Distrito: {factura.cliente_distrito || factura.cliente?.distrito}</p>
                  </>
                )}
              </div>
            </div>

            <table className="pdf-items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Descripción</th>
                  <th>UM</th>
                  <th>Cant.</th>
                  <th>P.Unit</th>
                  <th>Desc.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const totalLinea = item.cantidad * item.precio_unitario - (item.descuento || 0);
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        {item.descripcion}
                        {item.cpbs_segmento && <small> ({getNombreCPBS(item.cpbs_segmento)})</small>}
                      </td>
                      <td>{getNombreUnidadMedida(item.unidad_medida)}</td>
                      <td>{item.cantidad}</td>
                      <td>{parseFloat(item.precio_unitario).toFixed(2)}</td>
                      <td>{(item.descuento || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>{totalLinea.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pdf-totales">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{parseFloat(factura.subtotal).toFixed(2)} {factura.moneda}</span>
              </div>
              <div className="total-row">
                <span>ITBMS (7%):</span>
                <span>{parseFloat(factura.itbms).toFixed(2)} {factura.moneda}</span>
              </div>
              <div className="total-row grand">
                <span>TOTAL:</span>
                <span>{parseFloat(factura.total).toFixed(2)} {factura.moneda}</span>
              </div>
            </div>

            {factura.observaciones && (
              <div className="pdf-obs">
                <strong>Observaciones:</strong> {factura.observaciones}
              </div>
            )}

            <div className="pdf-footer">
              <p>Documento generado electrónicamente conforme a la normativa EBI PAC</p>
              <p>ID: {factura.id}</p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={generarPDF} disabled={generando}>
            {generando ? '⏳ Generando...' : '📥 Descargar PDF'}
          </button>
          <button className="btn-secondary" onClick={imprimirDirecto}>
            🖨️ Imprimir
          </button>
          <button className="btn-secondary" onClick={onCerrar}>
            ❌ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
