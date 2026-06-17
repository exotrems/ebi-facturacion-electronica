import React, { useState, useMemo, useEffect } from 'react';
import SelectEBI from './SelectEBI';
import { validarFactura } from '../utils/validacionesEBI';
import {
  MONEDAS, INCOTERMS, UNIDADES_MEDIDA, CPBS_SEGMENTOS, PAISES,
  PROVINCIAS_PANAMA, DISTRITOS_PANAMA, esPanama
} from '../data/catalogosEBI';

export default function FacturaForm({ facturaEditar = null, onGuardar, onCancelar }) {
  const [factura, setFactura] = useState({
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    moneda: 'USD',
    pais: 'PA',
    incoterm: '',
    tipoOperacion: 'EXPORTACION',
    cliente: {
      nombre: '',
      ruc: '',
      pais: 'US',
      provincia: '',
      distrito: '',
      corregimiento: '',
      direccion: '',
      email: '',
      telefono: '',
    },
    items: [
      {
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        unidadMedida: 'UN',
        cpbsSegmento: '55',
        gtin: '',
        descuento: 0,
      },
    ],
    observaciones: '',
    estado: 'BORRADOR',
  });

  const [errores, setErrores] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (facturaEditar) {
      setFactura({
        ...facturaEditar,
        fecha: facturaEditar.fecha?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    }
  }, [facturaEditar]);

  const clienteEsPanama = esPanama(factura.cliente.pais);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFactura((prev) => ({ ...prev, [name]: value }));
  };

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setFactura((prev) => {
      const nuevoCliente = { ...prev.cliente, [name]: value };
      // Si cambia de pais, limpiar provincia/distrito
      if (name === 'pais' && !esPanama(value)) {
        nuevoCliente.provincia = '';
        nuevoCliente.distrito = '';
        nuevoCliente.corregimiento = '';
      }
      return { ...prev, cliente: nuevoCliente };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFactura((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const agregarItem = () => {
    setFactura((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          descripcion: '',
          cantidad: 1,
          precioUnitario: 0,
          unidadMedida: 'UN',
          cpbsSegmento: '55',
          gtin: '',
          descuento: 0,
        },
      ],
    }));
  };

  const eliminarItem = (index) => {
    if (factura.items.length <= 1) return;
    setFactura((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calcularTotales = useMemo(() => {
    const subtotal = factura.items.reduce((sum, item) => {
      const totalLinea = item.cantidad * item.precioUnitario - (item.descuento || 0);
      return sum + totalLinea;
    }, 0);
    const itbms = subtotal * 0.07;
    const total = subtotal + itbms;
    return {
      subtotal: subtotal.toFixed(2),
      itbms: itbms.toFixed(2),
      total: total.toFixed(2),
    };
  }, [factura.items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);

    const validacion = validarFactura(factura);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(factura);
    } catch (err) {
      setErrores([err.message || 'Error al guardar la factura']);
    } finally {
      setGuardando(false);
    }
  };

  const distritosDisponibles = clienteEsPanama && factura.cliente.provincia
    ? DISTRITOS_PANAMA[factura.cliente.provincia] || []
    : [];

  return (
    <form onSubmit={handleSubmit} className="factura-form">
      <h2>{facturaEditar ? '✏️ Modificar Factura' : '📄 Nueva Factura'}</h2>

      {errores.length > 0 && (
        <div className="error-banner">
          <strong>⚠️ Errores encontrados:</strong>
          <ul>
            {errores.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* DATOS GENERALES */}
      <section className="form-section">
        <h3>📋 Datos Generales</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Número de Factura <span className="required">*</span></label>
            <input
              type="text"
              name="numero"
              value={factura.numero}
              onChange={handleChange}
              required
              placeholder="F-001-00000001"
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>Fecha <span className="required">*</span></label>
            <input
              type="date"
              name="fecha"
              value={factura.fecha}
              onChange={handleChange}
              required
            />
          </div>

          <SelectEBI
            label="Moneda"
            name="moneda"
            options={MONEDAS}
            value={factura.moneda}
            onChange={handleChange}
            required
          />

          <SelectEBI
            label="País de Emisión"
            name="pais"
            options={PAISES}
            value={factura.pais}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <SelectEBI
            label="Tipo de Operación"
            name="tipoOperacion"
            options={[
              { codigo: 'EXPORTACION', nombre: 'Exportación' },
              { codigo: 'LOCAL', nombre: 'Venta Local' },
            ]}
            value={factura.tipoOperacion}
            onChange={handleChange}
            required
          />

          <SelectEBI
            label="Incoterm (Opcional)"
            name="incoterm"
            options={INCOTERMS}
            value={factura.incoterm}
            onChange={handleChange}
            placeholder="Seleccione Incoterm..."
          />
        </div>
      </section>

      {/* DATOS DEL CLIENTE */}
      <section className="form-section">
        <h3>👤 Datos del Cliente</h3>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Nombre / Razón Social <span className="required">*</span></label>
            <input
              type="text"
              name="nombre"
              value={factura.cliente.nombre}
              onChange={handleClienteChange}
              required
              placeholder="Nombre completo o razón social"
            />
          </div>

          <div className="form-group">
            <label>RUC / ID <span className="required">*</span></label>
            <input
              type="text"
              name="ruc"
              value={factura.cliente.ruc}
              onChange={handleClienteChange}
              required
              placeholder={clienteEsPanama ? '8-123-456789' : 'Tax ID / EIN / VAT'}
            />
          </div>

          <SelectEBI
            label="País del Cliente"
            name="pais"
            options={PAISES}
            value={factura.cliente.pais}
            onChange={handleClienteChange}
            required
          />
        </div>

        {/* Campos geográficos: SOLO para Panamá */}
        {clienteEsPanama && (
          <div className="form-row geo-panama">
            <div className="geo-badge">🇵🇦 Ubicación Panamá</div>
            <SelectEBI
              label="Provincia"
              name="provincia"
              options={PROVINCIAS_PANAMA}
              value={factura.cliente.provincia}
              onChange={handleClienteChange}
              required={clienteEsPanama}
            />

            <SelectEBI
              label="Distrito"
              name="distrito"
              options={distritosDisponibles}
              value={factura.cliente.distrito}
              onChange={handleClienteChange}
              required={clienteEsPanama && distritosDisponibles.length > 0}
              disabled={!factura.cliente.provincia}
              placeholder={factura.cliente.provincia ? 'Seleccione distrito...' : 'Primero seleccione provincia'}
            />

            <div className="form-group">
              <label>Corregimiento</label>
              <input
                type="text"
                name="corregimiento"
                value={factura.cliente.corregimiento}
                onChange={handleClienteChange}
                placeholder="Corregimiento (opcional)"
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              value={factura.cliente.direccion}
              onChange={handleClienteChange}
              placeholder={clienteEsPanama ? 'Dirección en Panamá' : 'Dirección internacional'}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={factura.cliente.email}
              onChange={handleClienteChange}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={factura.cliente.telefono}
              onChange={handleClienteChange}
              placeholder="+1 555-123-4567"
            />
          </div>
        </div>
      </section>

      {/* LÍNEAS DE FACTURA */}
      <section className="form-section">
        <h3>🛍️ Líneas de Factura</h3>
        {factura.items.map((item, index) => (
          <div key={index} className="item-row">
            <div className="item-header">
              <span>Item #{index + 1}</span>
              {factura.items.length > 1 && (
                <button
                  type="button"
                  className="btn-action btn-delete"
                  onClick={() => eliminarItem(index)}
                  title="Eliminar línea"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
            <div className="form-row items-grid">
              <div className="form-group" style={{ flex: 3 }}>
                <label>Descripción <span className="required">*</span></label>
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                  required
                  placeholder="Descripción del producto (ropa/calzado)"
                />
              </div>

              <SelectEBI
                label="Unidad Medida"
                name={`unidadMedida-${index}`}
                options={UNIDADES_MEDIDA}
                value={item.unidadMedida}
                onChange={(e) => handleItemChange(index, 'unidadMedida', e.target.value)}
                required
                extraInfo="simbolo"
              />

              <div className="form-group">
                <label>Cantidad <span className="required">*</span></label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.cantidad}
                  onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Precio Unit. ({factura.moneda}) <span className="required">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUnitario}
                  onChange={(e) => handleItemChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <SelectEBI
                label="CPBS Segmento"
                name={`cpbs-${index}`}
                options={CPBS_SEGMENTOS}
                value={item.cpbsSegmento}
                onChange={(e) => handleItemChange(index, 'cpbsSegmento', e.target.value)}
                placeholder="Seleccione..."
              />

              <div className="form-group">
                <label>GTIN (Opcional)</label>
                <input
                  type="text"
                  value={item.gtin}
                  onChange={(e) => handleItemChange(index, 'gtin', e.target.value)}
                  placeholder="1234567890123"
                  maxLength={14}
                />
              </div>

              <div className="form-group">
                <label>Descuento</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.descuento}
                  onChange={(e) => handleItemChange(index, 'descuento', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="btn-action btn-add" onClick={agregarItem}>
          ➕ Agregar Línea
        </button>
      </section>

      {/* TOTALES */}
      <section className="form-section totales">
        <div className="totales-row">
          <span>Subtotal:</span>
          <strong>{calcularTotales.subtotal} {factura.moneda}</strong>
        </div>
        <div className="totales-row">
          <span>ITBMS (7%):</span>
          <strong>{calcularTotales.itbms} {factura.moneda}</strong>
        </div>
        <div className="totales-row total">
          <span>Total:</span>
          <strong>{calcularTotales.total} {factura.moneda}</strong>
        </div>
      </section>

      {/* OBSERVACIONES */}
      <section className="form-section">
        <h3>📝 Observaciones</h3>
        <textarea
          name="observaciones"
          value={factura.observaciones}
          onChange={handleChange}
          rows={3}
          placeholder="Observaciones adicionales..."
        />
      </section>

      {/* BOTONES */}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? '💾 Guardando...' : (facturaEditar ? '💾 Guardar Cambios' : '💾 Guardar Factura')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancelar} disabled={guardando}>
          ❌ Cancelar
        </button>
      </div>
    </form>
  );
}
