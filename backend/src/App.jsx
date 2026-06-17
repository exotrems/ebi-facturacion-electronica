import React, { useState } from 'react';
import ListaFacturas from './components/ListaFacturas';
import FacturaForm from './components/FacturaForm';
import VerFactura from './components/VerFactura';
import GeneradorPDF from './components/GeneradorPDF';

export default function App() {
  const [vista, setVista] = useState('lista');
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);

  const handleGuardar = async (factura) => {
    const url = factura.id
      ? `/api/facturas/${factura.id}`
      : '/api/facturas';
    const method = factura.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factura),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error guardando factura');
    }

    setVista('lista');
    setFacturaSeleccionada(null);
  };

  const handleVer = async (f) => {
    setFacturaSeleccionada(f);
    try {
      const res = await fetch(`/api/facturas/${f.id}/items`);
      const data = await res.json();
      setItemsSeleccionados(data);
    } catch (err) {
      setItemsSeleccionados([]);
    }
    setVista('ver');
  };

  const handlePDF = async (f) => {
    setFacturaSeleccionada(f);
    try {
      const res = await fetch(`/api/facturas/${f.id}/items`);
      const data = await res.json();
      setItemsSeleccionados(data);
    } catch (err) {
      setItemsSeleccionados([]);
    }
    setVista('pdf');
  };

  return (
    <div className="app">
      {vista === 'lista' && (
        <ListaFacturas
          onNueva={() => {
            setFacturaSeleccionada(null);
            setVista('nueva');
          }}
          onEditar={(f) => {
            setFacturaSeleccionada(f);
            setVista('editar');
          }}
          onVer={handleVer}
          onPDF={handlePDF}
        />
      )}

      {(vista === 'nueva' || vista === 'editar') && (
        <FacturaForm
          facturaEditar={vista === 'editar' ? facturaSeleccionada : null}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setVista('lista');
            setFacturaSeleccionada(null);
          }}
        />
      )}

      {vista === 'ver' && facturaSeleccionada && (
        <VerFactura
          factura={facturaSeleccionada}
          onVolver={() => {
            setVista('lista');
            setFacturaSeleccionada(null);
          }}
          onEditar={(f) => {
            setFacturaSeleccionada(f);
            setVista('editar');
          }}
          onPDF={(f) => handlePDF(f)}
        />
      )}

      {vista === 'pdf' && facturaSeleccionada && (
        <GeneradorPDF
          factura={facturaSeleccionada}
          items={itemsSeleccionados}
          onCerrar={() => {
            setVista('lista');
            setFacturaSeleccionada(null);
          }}
        />
      )}
    </div>
  );
}
